from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from itertools import islice
from pathlib import PurePosixPath

from celery.utils.log import get_task_logger

from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.repository import (
    AIRepositoryReport,
    CodeIssue,
    RepositoryConnection,
    RepositoryScan,
    RepositoryScore,
)
from app.services.github_repo_service import GitHubRepoService
from app.services.llm_service import LLMService
from app.utils.crypto import decrypt_token

logger = get_task_logger(__name__)

SCAN_LANGUAGE_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".go", ".rs", ".java", ".kt",
    ".swift", ".c", ".cpp", ".h", ".hpp", ".cs", ".rb", ".php", ".scala",
    ".clj", ".cljs", ".ex", ".exs", ".erl", ".hrl", ".hs", ".ml", ".mli",
    ".sql", ".sh", ".bash", ".zsh", ".ps1", ".psm1",
}
MAX_FILES_FOR_LLM = 30
MAX_FILE_CONTENT_CHARS = 2000


def _extension(path: str) -> str:
    return PurePosixPath(path).suffix.lower()


@celery_app.task(bind=True, max_retries=2, default_retry_delay=60)
def scan_repository_task(
    self,
    connection_id: str,
    scan_id: str,
    workspace_id: str,
) -> dict:
    return _run_async(
        _scan_repository(
            connection_id=uuid.UUID(connection_id),
            scan_id=uuid.UUID(scan_id),
            workspace_id=uuid.UUID(workspace_id),
        )
    )


def _run_async(coro):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


async def _scan_repository(
    connection_id: uuid.UUID,
    scan_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> dict:
    async with SessionLocal() as db:
        conn = await db.get(RepositoryConnection, connection_id)
        if conn is None:
            logger.error("Connection %s not found", connection_id)
            return {"status": "failed", "error": "Connection not found"}

        scan = await db.get(RepositoryScan, scan_id)
        if scan is None:
            logger.error("Scan %s not found", scan_id)
            return {"status": "failed", "error": "Scan not found"}

        scan.status = "running"
        scan.started_at = datetime.now(UTC)
        await db.flush()

        try:
            token = decrypt_token(conn.encrypted_token)
            gh = GitHubRepoService(token)
            llm = LLMService()

            owner = conn.github_owner
            repo = conn.github_repo
            repo_name = f"{owner}/{repo}"

            # ── 1. Fetch repo metadata ──────────────────────────
            readme = await gh.get_readme(owner, repo)
            languages = await gh.get_languages(owner, repo)
            file_tree_entries = await gh.get_file_tree(owner, repo)
            branches = await gh.list_branches(owner, repo)

            default_branch = "main"
            if branches:
                default_branch = branches[0].get("name", "main")

            # ── 2. Build file tree text ─────────────────────────
            tree_lines: list[str] = []
            for entry in file_tree_entries[:settings.MAX_SCAN_FILES]:
                path = entry.get("path", "")
                tree_lines.append(path)

            file_tree_text = "\n".join(tree_lines)
            total_files = min(len(file_tree_entries), settings.MAX_SCAN_FILES)
            total_lines_estimate = 0

            # ── 3. Fetch source files for analysis ──────────────
            source_files: list[dict] = []
            for entry in islice(file_tree_entries, settings.MAX_SCAN_FILES):
                path = entry.get("path", "")
                ext = _extension(path)
                if ext not in SCAN_LANGUAGE_EXTENSIONS:
                    continue
                if entry.get("size", 0) > settings.MAX_FILE_SIZE_BYTES:
                    continue
                if len(source_files) >= MAX_FILES_FOR_LLM:
                    break

                content = await gh.get_file_content(owner, repo, path, ref=default_branch)
                if content is not None:
                    content = content[:MAX_FILE_CONTENT_CHARS]
                    total_lines_estimate += content.count("\n") + 1
                    source_files.append({
                        "path": path,
                        "language": _language_from_ext(ext),
                        "content": content,
                    })

            # ── 4. Package files ─────────────────────────────────
            package_json = await gh.get_package_json(owner, repo)
            requirements = await gh.get_requirements_txt(owner, repo)
            env_example = await gh.get_env_example(owner, repo)

            package_files: dict = {}
            if package_json:
                package_files["package.json"] = {
                    "name": package_json.get("name"),
                    "dependencies": list(
                        (package_json.get("dependencies") or {}).keys()
                    )[:30],
                    "devDependencies": list(
                        (package_json.get("devDependencies") or {}).keys()
                    )[:20],
                }
            if requirements:
                package_files["requirements.txt"] = requirements[:50]
            if env_example:
                package_files[".env.example"] = "[present]"

            # ── 5. LLM: Project Description ─────────────────────
            lang_map: dict[str, int] = {}
            for lang, bytes_count in languages.items():
                if lang not in lang_map:
                    lang_map[lang] = 0
                lang_map[lang] += bytes_count

            if llm.is_configured:
                logger.info("Generating AI project description for %s", repo_name)
                try:
                    desc_result = await llm.generate_project_description(
                        repo_name=repo_name,
                        readme=readme,
                        package_files=package_files,
                        file_tree=file_tree_text,
                        languages=lang_map,
                    )
                except Exception as e:
                    print(f"[LLM] generate_project_description FAILED: {e}")
                    raise
                desc_title = f"Project Overview: {repo_name}"
                db.add(
                    AIRepositoryReport(
                        scan_id=scan.id,
                        workspace_id=workspace_id,
                        report_type="executive",
                        title=desc_title,
                        summary=desc_result.get("description", ""),
                        full_content=json.dumps(desc_result, indent=2),
                        scores=desc_result,
                        generated_by=f"{settings.LLM_PROVIDER}/{settings.LLM_MODEL}",
                    )
                )

                # ── 6. LLM: Code Issues ─────────────────────────
                logger.info("Detecting code issues for %s", repo_name)
                try:
                    issues = await llm.detect_code_issues(
                        repo_name=repo_name,
                        files=source_files,
                    )
                except Exception as e:
                    print(f"[LLM] detect_code_issues FAILED: {e}")
                    raise
                for issue in issues[:100]:
                    db.add(
                        CodeIssue(
                            scan_id=scan.id,
                            file_path=issue.get("file_path", "unknown"),
                            line_start=issue.get("line_start"),
                            line_end=issue.get("line_end"),
                            issue_type=issue.get("issue_type", "code_smell"),
                            severity=issue.get("severity", "low"),
                            category=issue.get("category", "general"),
                            title=issue.get("title", "Untitled issue"),
                            message=issue.get("message"),
                            suggestion=issue.get("suggestion"),
                            language=issue.get("language"),
                        )
                    )

                # ── 7. LLM: Scores ──────────────────────────────
                try:
                    scores = await llm.score_repository(
                        repo_name=repo_name,
                        file_tree=file_tree_text,
                        issues_count=len(issues),
                        languages=lang_map,
                    )
                except Exception as e:
                    print(f"[LLM] score_repository FAILED: {e}")
                    raise
                db.add(
                    RepositoryScore(
                        scan_id=scan.id,
                        workspace_id=workspace_id,
                        overall=scores.get("overall", 50),
                        architecture=scores.get("architecture", 50),
                        code_quality=scores.get("code_quality", 50),
                        security=scores.get("security", 50),
                        performance=scores.get("performance", 50),
                        testing=scores.get("testing", 50),
                        documentation=scores.get("documentation", 50),
                        maintainability=scores.get("maintainability", 50),
                        technical_debt=scores.get("technical_debt", 50),
                        complexity=scores.get("complexity", 50),
                        dx_score=scores.get("dx_score", 50),
                    )
                )

                # ── 8. LLM: Architecture Analysis ───────────────
                try:
                    arch = await llm.analyze_architecture(
                        repo_name=repo_name,
                        file_tree=file_tree_text,
                        readme=readme,
                    )
                except Exception as e:
                    print(f"[LLM] analyze_architecture FAILED: {e}")
                    raise
                db.add(
                    AIRepositoryReport(
                        scan_id=scan.id,
                        workspace_id=workspace_id,
                        report_type="architecture",
                        title=arch.get("title", f"Architecture: {repo_name}"),
                        summary=arch.get("summary", ""),
                        full_content=arch.get("full_content", ""),
                        generated_by=f"{settings.LLM_PROVIDER}/{settings.LLM_MODEL}",
                    )
                )
            else:
                logger.warning(
                    "LLM not configured (LLM_API_KEY is empty). Skipping AI analysis."
                )

            # ── 9. Update scan with stats ───────────────────────
            scan.status = "completed"
            scan.completed_at = datetime.now(UTC)
            scan.file_count = total_files
            scan.total_lines = total_lines_estimate
            scan.total_size_bytes = sum(
                e.get("size", 0) for e in file_tree_entries[:settings.MAX_SCAN_FILES]
            )
            scan.language_breakdown = lang_map

            # Update connection sync timestamp
            conn.last_synced_at = datetime.now(UTC)

            await db.commit()
            logger.info("Scan %s completed for %s", scan_id, repo_name)

            return {
                "status": "completed",
                "files": total_files,
                "issues": len(scan.issues) if llm.is_configured else 0,
            }

        except Exception as exc:
            print(f"[SCAN ERROR] scan_id={scan_id} connection={connection_id}: {exc}")
            logger.exception("Scan %s failed: %s", scan_id, exc)
            scan.status = "failed"
            scan.completed_at = datetime.now(UTC)
            scan.error_message = str(exc)
            await db.commit()
            return {"status": "failed", "error": str(exc)}


def _language_from_ext(ext: str) -> str:
    mapping = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".jsx": "javascript",
        ".go": "go",
        ".rs": "rust",
        ".java": "java",
        ".kt": "kotlin",
        ".swift": "swift",
        ".c": "c",
        ".cpp": "cpp",
        ".h": "c",
        ".hpp": "cpp",
        ".cs": "csharp",
        ".rb": "ruby",
        ".php": "php",
        ".scala": "scala",
        ".clj": "clojure",
        ".cljs": "clojure",
        ".ex": "elixir",
        ".exs": "elixir",
        ".erl": "erlang",
        ".hrl": "erlang",
        ".hs": "haskell",
        ".ml": "ocaml",
        ".mli": "ocaml",
        ".sql": "sql",
        ".sh": "shell",
        ".bash": "shell",
        ".zsh": "shell",
        ".ps1": "powershell",
        ".psm1": "powershell",
    }
    return mapping.get(ext, ext.lstrip("."))
