from __future__ import annotations

import json
import textwrap
from typing import Any

import httpx

from app.core.config import settings

SYSTEM_PROMPT = textwrap.dedent("""\
You are an expert software engineer and code reviewer. You analyze codebases
and produce structured, actionable output. Always respond with valid JSON
matching the requested schema. Do not include markdown fences around the JSON
unless explicitly asked. Be thorough, honest, and specific.
""")


class LLMService:
    def __init__(self) -> None:
        self._base_url = (
            settings.LLM_BASE_URL.rstrip("/")
            if settings.LLM_BASE_URL
            else "https://api.openai.com/v1"
        )
        self._api_key = settings.LLM_API_KEY
        self._model = settings.LLM_MODEL
        self._max_tokens = settings.LLM_MAX_TOKENS
        self._temperature = settings.LLM_TEMPERATURE

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    async def _chat(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int | None = None,
        temperature: float | None = None,
        response_format: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "max_tokens": max_tokens or self._max_tokens,
            "temperature": temperature if temperature is not None else self._temperature,
        }
        if response_format:
            payload["response_format"] = response_format

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self._base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    async def _complete_json(
        self,
        user_prompt: str,
        *,
        max_tokens: int | None = None,
        temperature: float = 0.2,
    ) -> Any:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]
        result = await self._chat(
            messages,
            max_tokens=max_tokens,
            temperature=temperature,
            response_format={"type": "json_object"},
        )
        content = result["choices"][0]["message"]["content"]
        return json.loads(content)

    async def _complete_text(
        self,
        user_prompt: str,
        *,
        max_tokens: int | None = None,
        temperature: float = 0.3,
    ) -> str:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]
        result = await self._chat(messages, max_tokens=max_tokens, temperature=temperature)
        return result["choices"][0]["message"]["content"]

    # ── Project Description ──────────────────────────────────────

    async def generate_project_description(
        self,
        repo_name: str,
        readme: str | None,
        package_files: dict[str, Any],
        file_tree: str,
        languages: dict[str, int],
    ) -> dict[str, Any]:
        readme_text = readme if readme else "No README found."
        pkg_text = json.dumps(package_files, indent=2)
        prompt = textwrap.dedent(f"""\
        Analyze the following codebase and produce a JSON object with the
        keys below.

        Repository name: {repo_name}

        Languages: {json.dumps(languages)}

        README (truncated):
        {readme_text[:3000]}

        Package / config files:
        {pkg_text[:3000]}

        File tree (first 200 entries):
        {file_tree[:4000]}

        Return JSON with these exact keys:
        - description: a 2-3 paragraph professional project description covering
          what it does, its architecture, and its key features.
        - tech_stack: array of strings listing detected technologies, frameworks,
          and libraries.
        - architecture_pattern: a short string describing the high-level
          architecture (e.g. "Layered monolith", "Microservices", "Feature-based
          React app with FastAPI backend").
        - key_modules: array of objects with "name" and "purpose" strings for the
          5-10 most important directories/packages.
        - strengths: array of 3-5 strings highlighting good design decisions.
        - weaknesses: array of 3-5 strings pointing out potential concerns.
        """)
        return await self._complete_json(prompt, max_tokens=3000)

    # ── Code Issue Detection ─────────────────────────────────────

    async def detect_code_issues(
        self,
        repo_name: str,
        files: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        files_text = ""
        for f in files[:30]:
            code = str(f.get("content", ""))[:1500]
            files_text += (
                f"--- FILE: {f.get('path', '')} "
                f"(language: {f.get('language', 'unknown')}) ---\n"
                f"{code}\n\n"
            )

        prompt = textwrap.dedent(f"""\
        Analyze the following source files from the repository "{repo_name}" and
        identify specific bugs, errors, security vulnerabilities, and code smells.

        Return a JSON object with a single key "issues" which is an array of
        objects. Each object must have these keys:

        - file_path: string (relative path to the file)
        - line_start: number or null (approximate line number where the issue is)
        - line_end: number or null
        - issue_type: one of "bug", "security", "performance", "code_smell",
          "style", "typo"
        - severity: one of "critical", "high", "medium", "low", "info"
        - category: short category like "null-pointer", "xss", "sql-injection",
          "dead-code", "naming", etc.
        - title: short title for the issue (max 120 chars)
        - message: detailed explanation of the problem
        - suggestion: concrete fix or improvement suggestion
        - language: programming language of the file

        Be specific and cite actual code. Only report real issues — do NOT
        fabricate problems. If there are very few issues, that is fine.

        Source files:
        {files_text[:12000]}
        """)
        result = await self._complete_json(prompt, max_tokens=4000)
        return result.get("issues", [])

    # ── Code Quality Scores ──────────────────────────────────────

    async def score_repository(
        self,
        repo_name: str,
        file_tree: str,
        issues_count: int,
        languages: dict[str, int],
    ) -> dict[str, float]:
        prompt = textwrap.dedent(f"""\
        Based on the repository information below, assign scores from 0-100
        (where 100 is excellent) for each dimension. Be honest and critical.

        Repository: {repo_name}
        Languages: {json.dumps(languages)}
        Issues found: {issues_count}

        File tree (summary):
        {file_tree[:3000]}

        Return a JSON object with these numeric keys (all 0-100):
        overall, architecture, code_quality, security, performance, testing,
        documentation, maintainability, technical_debt, complexity, dx_score

        For "technical_debt" and "complexity", higher = worse (more debt,
        more complexity). All others: higher = better.
        """)
        result = await self._complete_json(prompt, max_tokens=1000)
        return {
            "overall": float(result.get("overall", 50)),
            "architecture": float(result.get("architecture", 50)),
            "code_quality": float(result.get("code_quality", 50)),
            "security": float(result.get("security", 50)),
            "performance": float(result.get("performance", 50)),
            "testing": float(result.get("testing", 50)),
            "documentation": float(result.get("documentation", 50)),
            "maintainability": float(result.get("maintainability", 50)),
            "technical_debt": float(result.get("technical_debt", 50)),
            "complexity": float(result.get("complexity", 50)),
            "dx_score": float(result.get("dx_score", 50)),
        }

    # ── Architecture Analysis ────────────────────────────────────

    async def analyze_architecture(
        self,
        repo_name: str,
        file_tree: str,
        readme: str | None,
    ) -> dict[str, Any]:
        readme_text = readme[:3000] if readme else "No README."
        prompt = textwrap.dedent(f"""\
        Perform a deep architecture analysis of the repository "{repo_name}".

        README:
        {readme_text}

        Full file tree:
        {file_tree[:6000]}

        Return JSON with:
        - title: "Architecture Analysis for {repo_name}"
        - summary: 1-paragraph overview of the architecture
        - full_content: detailed markdown analysis (3-6 sections) covering:
          entry points, data flow, dependency graph, separation of concerns,
          potential scalability issues, and recommendations.
        - scores: null
        """)
        return await self._complete_json(prompt, max_tokens=4000)

    # ── Folder Structure Summary ─────────────────────────────────

    async def summarize_folder_structure(
        self,
        repo_name: str,
        file_tree: str,
    ) -> str:
        prompt = textwrap.dedent(f"""\
        Given the file tree of "{repo_name}" below, write a concise
        markdown explanation of the folder structure. For each top-level
        directory explain its purpose in 1-2 sentences. Group related
        directories together. Keep it under 500 words.

        File tree:
        {file_tree[:5000]}
        """)
        return await self._complete_text(prompt, max_tokens=1500)
