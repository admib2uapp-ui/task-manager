from __future__ import annotations

import asyncio
import uuid
from typing import Any

from fastapi import APIRouter, Query, status

from app.core.config import settings
from app.core.deps import CurrentUser, CurrentWorkspace, DbSession
from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models.repository import (
    RepositoryConnection,
    RepositoryScan,
)
from app.repositories.repository_repository import (
    AIRepositoryReportRepository,
    CodeIssueRepository,
    RepositoryConnectionRepository,
    RepositoryScanRepository,
    RepositoryScoreRepository,
)
from app.schemas.common import MessageResponse
from app.schemas.repository import (
    AIRepositoryReportRead,
    CodeIssueRead,
    GitHubBranch,
    GitHubContributor,
    GitHubLanguages,
    GitHubRepoInfo,
    ReportGenerateRequest,
    RepositoryConnectionRead,
    RepositoryConnectionUpdate,
    RepositoryConnectRequest,
    RepositoryScanRead,
    RepositoryScoreRead,
    ScanTriggerRequest,
)
from app.services.github_repo_service import GitHubRepoService
from app.services.llm_service import LLMService
from app.tasks.repo_tasks import scan_repository_task
from app.utils.crypto import decrypt_token, encrypt_token

router = APIRouter(prefix="/repositories", tags=["repositories"])

SCAN_LIMIT = 10


# ── Helpers ────────────────────────────────────────────────────────────

def _current_service(conn: RepositoryConnection) -> GitHubRepoService:
    return GitHubRepoService(decrypt_token(conn.encrypted_token))


async def _get_connection(
    db: DbSession,
    connection_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> RepositoryConnection:
    repo = RepositoryConnectionRepository(db)
    conn = await repo.get_in_workspace(connection_id, workspace_id)
    if conn is None:
        raise NotFoundError("Repository connection not found")
    return conn


# ── Connections ────────────────────────────────────────────────────────

@router.get("", response_model=list[RepositoryConnectionRead])
async def list_connections(
    workspace: CurrentWorkspace,
    db: DbSession,
) -> list[RepositoryConnectionRead]:
    repo = RepositoryConnectionRepository(db)
    connections = await repo.list_for_workspace(workspace.id)
    return [
        RepositoryConnectionRead.model_validate(c) for c in connections
    ]


@router.post(
    "/connect",
    response_model=RepositoryConnectionRead,
    status_code=status.HTTP_201_CREATED,
)
async def connect_repository(
    payload: RepositoryConnectRequest,
    workspace: CurrentWorkspace,
    current_user: CurrentUser,
    db: DbSession,
) -> RepositoryConnectionRead:
    repo = RepositoryConnectionRepository(db)
    existing = await repo.get_by_repo(
        workspace.id, payload.github_owner, payload.github_repo
    )
    if existing is not None:
        raise ConflictError(
            f"Repository {payload.github_owner}/{payload.github_repo} is already connected"
        )

    access_token = payload.access_token
    if not access_token:
        raise BadRequestError("Access token is required")

    gh = GitHubRepoService(access_token)
    if not await gh.validate_token(payload.github_owner, payload.github_repo):
        raise BadRequestError("Invalid GitHub access token")

    repo_info = await gh.get_repo(payload.github_owner, payload.github_repo)

    conn = RepositoryConnection(
        workspace_id=workspace.id,
        project_id=payload.project_id,
        user_id=current_user.id,
        github_owner=payload.github_owner,
        github_repo=payload.github_repo,
        provider="github",
        token_type=payload.token_type,
        encrypted_token=encrypt_token(access_token),
        repo_info={
            "full_name": repo_info.get("full_name", ""),
            "description": repo_info.get("description"),
            "stars": repo_info.get("stargazers_count", 0),
            "forks": repo_info.get("forks_count", 0),
            "open_issues": repo_info.get("open_issues_count", 0),
            "default_branch": repo_info.get("default_branch", "main"),
            "language": repo_info.get("language"),
            "topics": repo_info.get("topics", []),
            "is_private": repo_info.get("private", False),
            "created_at": repo_info.get("created_at"),
            "updated_at": repo_info.get("updated_at"),
            "pushed_at": repo_info.get("pushed_at"),
            "size_kb": repo_info.get("size", 0),
        },
    )
    db.add(conn)
    await db.flush()
    await db.refresh(conn)
    return RepositoryConnectionRead.model_validate(conn)


@router.post(
    "/quick-connect",
    response_model=RepositoryConnectionRead,
    status_code=status.HTTP_201_CREATED,
)
async def quick_connect_repository(
    payload: RepositoryConnectRequest,
    workspace: CurrentWorkspace,
    current_user: CurrentUser,
    db: DbSession,
) -> RepositoryConnectionRead:
    if not current_user.github_token:
        raise BadRequestError(
            "GitHub account not connected. Go to /github to connect first."
        )

    repo = RepositoryConnectionRepository(db)
    existing = await repo.get_by_repo(
        workspace.id, payload.github_owner, payload.github_repo
    )
    if existing is not None:
        raise ConflictError(
            f"Repository {payload.github_owner}/{payload.github_repo} is already connected"
        )

    access_token = decrypt_token(current_user.github_token)
    gh = GitHubRepoService(access_token)
    if not await gh.validate_token(payload.github_owner, payload.github_repo):
        raise BadRequestError("GitHub token does not have access to this repository")

    repo_info = await gh.get_repo(payload.github_owner, payload.github_repo)

    conn = RepositoryConnection(
        workspace_id=workspace.id,
        project_id=payload.project_id,
        user_id=current_user.id,
        github_owner=payload.github_owner,
        github_repo=payload.github_repo,
        provider="github",
        token_type="oauth",
        encrypted_token=current_user.github_token,
        repo_info={
            "full_name": repo_info.get("full_name", ""),
            "description": repo_info.get("description"),
            "stars": repo_info.get("stargazers_count", 0),
            "forks": repo_info.get("forks_count", 0),
            "open_issues": repo_info.get("open_issues_count", 0),
            "default_branch": repo_info.get("default_branch", "main"),
            "language": repo_info.get("language"),
            "topics": repo_info.get("topics", []),
            "is_private": repo_info.get("private", False),
            "created_at": repo_info.get("created_at"),
            "updated_at": repo_info.get("updated_at"),
            "pushed_at": repo_info.get("pushed_at"),
            "size_kb": repo_info.get("size", 0),
        },
    )
    db.add(conn)
    await db.flush()
    await db.refresh(conn)
    return RepositoryConnectionRead.model_validate(conn)


@router.get("/{connection_id}", response_model=RepositoryConnectionRead)
async def get_connection(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> RepositoryConnectionRead:
    conn = await _get_connection(db, connection_id, workspace.id)
    return RepositoryConnectionRead.model_validate(conn)


@router.patch("/{connection_id}", response_model=RepositoryConnectionRead)
async def update_connection(
    connection_id: uuid.UUID,
    payload: RepositoryConnectionUpdate,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> RepositoryConnectionRead:
    conn = await _get_connection(db, connection_id, workspace.id)
    repo = RepositoryConnectionRepository(db)

    if payload.project_id is not None:
        conn.project_id = payload.project_id
    if payload.access_token is not None:
        gh = GitHubRepoService(payload.access_token)
        if not await gh.validate_token():
            raise BadRequestError("Invalid GitHub access token")
        conn.encrypted_token = encrypt_token(payload.access_token)
    if payload.is_active is not None:
        conn.is_active = payload.is_active

    await db.flush()
    return RepositoryConnectionRead.model_validate(conn)


@router.delete("/{connection_id}", response_model=MessageResponse)
async def delete_connection(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> MessageResponse:
    conn = await _get_connection(db, connection_id, workspace.id)
    await db.delete(conn)
    await db.flush()
    return MessageResponse(message="Repository disconnected")


@router.post("/{connection_id}/validate", response_model=dict)
async def validate_connection(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> dict[str, bool]:
    conn = await _get_connection(db, connection_id, workspace.id)
    gh = _current_service(conn)
    valid = await gh.validate_token()
    return {"valid": valid}


# ── GitHub Metadata (live fetch) ──────────────────────────────────────

@router.get("/{connection_id}/repo-info", response_model=GitHubRepoInfo)
async def get_repo_info(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> GitHubRepoInfo:
    conn = await _get_connection(db, connection_id, workspace.id)
    gh = _current_service(conn)
    info = await gh.get_repo(conn.github_owner, conn.github_repo)
    return GitHubRepoInfo(
        full_name=info.get("full_name", ""),
        description=info.get("description"),
        stars=info.get("stargazers_count", 0),
        forks=info.get("forks_count", 0),
        open_issues=info.get("open_issues_count", 0),
        default_branch=info.get("default_branch", "main"),
        language=info.get("language"),
        topics=info.get("topics", []),
        is_private=info.get("private", False),
        created_at=info.get("created_at"),
        updated_at=info.get("updated_at"),
        pushed_at=info.get("pushed_at"),
        size_kb=info.get("size", 0),
    )


@router.get("/{connection_id}/branches", response_model=list[GitHubBranch])
async def list_branches(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> list[GitHubBranch]:
    conn = await _get_connection(db, connection_id, workspace.id)
    gh = _current_service(conn)
    branches = await gh.list_branches(conn.github_owner, conn.github_repo)
    return [
        GitHubBranch(name=b["name"], sha=b["commit"]["sha"])
        for b in branches[:30]
    ]


@router.get("/{connection_id}/contributors", response_model=list[GitHubContributor])
async def list_contributors(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> list[GitHubContributor]:
    conn = await _get_connection(db, connection_id, workspace.id)
    gh = _current_service(conn)
    contributors = await gh.list_contributors(conn.github_owner, conn.github_repo)
    return [
        GitHubContributor(
            login=c.get("login", ""),
            avatar_url=c.get("avatar_url", ""),
            contributions=c.get("contributions", 0),
        )
        for c in contributors[:20]
    ]


@router.get("/{connection_id}/languages", response_model=GitHubLanguages)
async def get_languages(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> GitHubLanguages:
    conn = await _get_connection(db, connection_id, workspace.id)
    gh = _current_service(conn)
    langs = await gh.get_languages(conn.github_owner, conn.github_repo)
    return GitHubLanguages(
        languages=langs,
        total_bytes=sum(langs.values()),
    )


# ── Scans ─────────────────────────────────────────────────────────────

@router.get("/{connection_id}/scans", response_model=list[RepositoryScanRead])
async def list_scans(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> list[RepositoryScanRead]:
    conn = await _get_connection(db, connection_id, workspace.id)
    scans_repo = RepositoryScanRepository(db)
    scans = await scans_repo.list_for_connection(conn.id)
    return [RepositoryScanRead.model_validate(s) for s in scans[:SCAN_LIMIT]]


@router.post("/{connection_id}/scan", response_model=RepositoryScanRead)
async def trigger_scan(
    connection_id: uuid.UUID,
    payload: ScanTriggerRequest,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> RepositoryScanRead:
    conn = await _get_connection(db, connection_id, workspace.id)

    scans_repo = RepositoryScanRepository(db)
    running = await scans_repo.list_for_connection(conn.id)
    if any(s.status in ("pending", "running") for s in running):
        raise BadRequestError("A scan is already in progress for this repository")

    scan = RepositoryScan(
        connection_id=conn.id,
        scan_type=payload.scan_type,
        status="pending",
    )
    db.add(scan)
    await db.flush()
    await db.refresh(scan)

    await db.commit()

    try:
        scan_repository_task.delay(
            connection_id=str(conn.id),
            scan_id=str(scan.id),
            workspace_id=str(workspace.id),
        )
    except Exception:
        from app.tasks.repo_tasks import _scan_repository
        asyncio.create_task(_scan_repository(
            connection_id=conn.id,
            scan_id=scan.id,
            workspace_id=workspace.id,
        ))

    return RepositoryScanRead.model_validate(scan)


@router.get(
    "/{connection_id}/scans/{scan_id}",
    response_model=RepositoryScanRead,
)
async def get_scan(
    connection_id: uuid.UUID,
    scan_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> RepositoryScanRead:
    conn = await _get_connection(db, connection_id, workspace.id)
    scans_repo = RepositoryScanRepository(db)
    scan = await scans_repo.get_with_relations(scan_id)
    if scan is None or scan.connection_id != conn.id:
        raise NotFoundError("Scan not found")
    return RepositoryScanRead.model_validate(scan)


# ── File Tree ──────────────────────────────────────────────────────────

@router.get("/{connection_id}/file-tree")
async def get_file_tree(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    branch: str | None = Query(None),
) -> list[dict[str, Any]]:
    conn = await _get_connection(db, connection_id, workspace.id)
    gh = _current_service(conn)
    branch_name = branch or await gh.get_default_branch(conn.github_owner, conn.github_repo)
    entries = await gh.get_file_tree(conn.github_owner, conn.github_repo, branch_name)
    return [
        {
            "path": e.get("path", ""),
            "type": e.get("type", "blob"),
            "size": e.get("size", 0),
            "url": e.get("url"),
        }
        for e in entries[:settings.MAX_SCAN_FILES]
    ]


# ── AI Analysis ────────────────────────────────────────────────────────

@router.post("/{connection_id}/analyze")
async def analyze_repository(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    payload: ReportGenerateRequest | None = None,
) -> dict[str, Any]:
    conn = await _get_connection(db, connection_id, workspace.id)
    gh = _current_service(conn)

    llm = LLMService()
    if not llm.is_configured:
        raise BadRequestError("LLM is not configured. Set LLM_API_KEY in the backend environment.")

    owner = conn.github_owner
    repo = conn.github_repo
    repo_name = f"{owner}/{repo}"

    file_tree_entries = await gh.get_file_tree(owner, repo)
    tree_lines = [e.get("path", "") for e in file_tree_entries[:settings.MAX_SCAN_FILES]]
    file_tree_text = "\n".join(tree_lines)

    readme = await gh.get_readme(owner, repo)
    languages = await gh.get_languages(owner, repo)

    report_type = payload.report_type if payload else "executive"

    if report_type in ("executive", "code_review"):
        package_json = await gh.get_package_json(owner, repo)
        requirements = await gh.get_requirements_txt(owner, repo)
        env_example = await gh.get_env_example(owner, repo)

        package_files: dict = {}
        if package_json:
            package_files["package.json"] = {
                "name": package_json.get("name"),
                "dependencies": list((package_json.get("dependencies") or {}).keys())[:30],
                "devDependencies": list((package_json.get("devDependencies") or {}).keys())[:20],
            }
        if requirements:
            package_files["requirements.txt"] = requirements[:50]
        if env_example:
            package_files[".env.example"] = "[present]"

        result = await llm.generate_project_description(
            repo_name=repo_name,
            readme=readme,
            package_files=package_files,
            file_tree=file_tree_text,
            languages=languages,
        )
        return {
            "reportType": report_type,
            "title": f"Project Overview: {repo_name}",
            "content": result,
        }
    elif report_type == "architecture":
        result = await llm.analyze_architecture(
            repo_name=repo_name,
            file_tree=file_tree_text,
            readme=readme,
        )
        return {
            "reportType": report_type,
            "title": result.get("title", f"Architecture: {repo_name}"),
            "content": result,
        }
    else:
        raise BadRequestError(f"Unsupported report type: {report_type}")


# ── Code Issues ────────────────────────────────────────────────────────

@router.get("/{connection_id}/issues", response_model=list[CodeIssueRead])
async def list_code_issues(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    severity: str | None = Query(None),
    category: str | None = Query(None),
) -> list[CodeIssueRead]:
    conn = await _get_connection(db, connection_id, workspace.id)
    scans_repo = RepositoryScanRepository(db)
    latest_scan = await scans_repo.get_latest(conn.id)
    if latest_scan is None:
        return []

    issues_repo = CodeIssueRepository(db)
    issues = await issues_repo.list_for_scan(
        latest_scan.id,
        severity=severity,
        category=category,
    )
    return [CodeIssueRead.model_validate(i) for i in issues]


# ── AI Reports ─────────────────────────────────────────────────────────

@router.get("/{connection_id}/reports", response_model=list[AIRepositoryReportRead])
async def list_ai_reports(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> list[AIRepositoryReportRead]:
    conn = await _get_connection(db, connection_id, workspace.id)
    scans_repo = RepositoryScanRepository(db)
    latest_scan = await scans_repo.get_latest(conn.id)
    if latest_scan is None:
        return []

    reports_repo = AIRepositoryReportRepository(db)
    reports = await reports_repo.list_for_scan(latest_scan.id)
    return [AIRepositoryReportRead.model_validate(r) for r in reports]


# ── Repository Scores ──────────────────────────────────────────────────

@router.get("/{connection_id}/score", response_model=RepositoryScoreRead | None)
async def get_repository_score(
    connection_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> RepositoryScoreRead | None:
    conn = await _get_connection(db, connection_id, workspace.id)
    scans_repo = RepositoryScanRepository(db)
    latest_scan = await scans_repo.get_latest(conn.id)
    if latest_scan is None:
        return None

    scores_repo = RepositoryScoreRepository(db)
    score = await scores_repo.get_for_scan(latest_scan.id)
    if score is None:
        return None
    return RepositoryScoreRead.model_validate(score)
