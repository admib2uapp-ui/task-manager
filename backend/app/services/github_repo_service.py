from __future__ import annotations

from itertools import islice
from typing import Any

import httpx

GITHUB_API = "https://api.github.com"


class GitHubRepoService:
    def __init__(self, access_token: str) -> None:
        self._token = access_token
        self._headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "Orbit/1.0",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def _get(self, path: str, params: dict | None = None) -> dict | list:
        async with httpx.AsyncClient(timeout=30, headers=self._headers) as client:
            resp = await client.get(f"{GITHUB_API}{path}", params=params)
            resp.raise_for_status()
            return resp.json()

    async def _get_paginated(self, path: str, params: dict | None = None, limit: int = 100) -> list[dict]:
        all_items: list[dict] = []
        page = 1
        while len(all_items) < limit:
            p = (params or {}) | {"page": page, "per_page": min(limit - len(all_items), 100)}
            async with httpx.AsyncClient(timeout=30, headers=self._headers) as client:
                resp = await client.get(f"{GITHUB_API}{path}", params=p)
                resp.raise_for_status()
                items = resp.json()
                if not items:
                    break
                all_items.extend(items)
                page += 1
                if len(items) < 100:
                    break
        return all_items

    async def validate_token(self, owner: str | None = None, repo: str | None = None) -> bool:
        try:
            await self._get("/user")
            return True
        except httpx.HTTPStatusError:
            pass

        if owner and repo:
            try:
                await self._get(f"/repos/{owner}/{repo}")
                return True
            except httpx.HTTPStatusError:
                pass

        return False

    # ── Repository ──────────────────────────────────────────────

    async def get_repo(self, owner: str, repo: str) -> dict[str, Any]:
        return await self._get(f"/repos/{owner}/{repo}")  # type: ignore[return-value]

    async def get_default_branch(self, owner: str, repo: str) -> str:
        repo_info = await self.get_repo(owner, repo)
        return str(repo_info.get("default_branch", "main"))

    async def get_languages(self, owner: str, repo: str) -> dict[str, int]:
        return await self._get(f"/repos/{owner}/{repo}/languages")  # type: ignore[return-value]

    async def get_readme(self, owner: str, repo: str) -> str | None:
        try:
            data = await self._get(f"/repos/{owner}/{repo}/readme")
            import base64
            return base64.b64decode(data["content"]).decode("utf-8")  # type: ignore[arg-type]
        except httpx.HTTPStatusError:
            return None

    # ── Branches ─────────────────────────────────────────────────

    async def list_branches(self, owner: str, repo: str) -> list[dict]:
        return await self._get_paginated(f"/repos/{owner}/{repo}/branches")

    async def get_branch(self, owner: str, repo: str, branch: str) -> dict[str, Any]:
        return await self._get(f"/repos/{owner}/{repo}/branches/{branch}")  # type: ignore[return-value]

    # ── Commits ──────────────────────────────────────────────────

    async def list_commits(self, owner: str, repo: str, *, sha: str | None = None, since: str | None = None) -> list[dict]:
        params: dict[str, str] = {}
        if sha:
            params["sha"] = sha
        if since:
            params["since"] = since
        return await self._get_paginated(f"/repos/{owner}/{repo}/commits", params)

    async def get_commit(self, owner: str, repo: str, sha: str) -> dict[str, Any]:
        return await self._get(f"/repos/{owner}/{repo}/commits/{sha}")  # type: ignore[return-value]

    # ── Issues ───────────────────────────────────────────────────

    async def list_issues(self, owner: str, repo: str, *, state: str = "all") -> list[dict]:
        return await self._get_paginated(f"/repos/{owner}/{repo}/issues", {"state": state, "filter": "all"})

    # ── Pull Requests ────────────────────────────────────────────

    async def list_pull_requests(self, owner: str, repo: str, *, state: str = "all") -> list[dict]:
        return await self._get_paginated(f"/repos/{owner}/{repo}/pulls", {"state": state})

    # ── Contributors ─────────────────────────────────────────────

    async def list_contributors(self, owner: str, repo: str) -> list[dict]:
        return await self._get_paginated(f"/repos/{owner}/{repo}/contributors")

    # ── Tags & Releases ──────────────────────────────────────────

    async def list_tags(self, owner: str, repo: str) -> list[dict]:
        return await self._get_paginated(f"/repos/{owner}/{repo}/tags")

    async def list_releases(self, owner: str, repo: str) -> list[dict]:
        return await self._get_paginated(f"/repos/{owner}/{repo}/releases")

    # ── File Tree ────────────────────────────────────────────────

    async def get_file_tree(self, owner: str, repo: str, branch: str = "main") -> list[dict]:
        data = await self._get(
            f"/repos/{owner}/{repo}/git/trees/{branch}",
            {"recursive": "1"},
        )
        return data.get("tree", [])  # type: ignore[return-value]

    async def get_file_content(self, owner: str, repo: str, path: str, ref: str | None = None) -> str | None:
        try:
            params: dict[str, str] = {}
            if ref:
                params["ref"] = ref
            data = await self._get(f"/repos/{owner}/{repo}/contents/{path}", params)
            import base64
            return base64.b64decode(data["content"]).decode("utf-8")  # type: ignore[arg-type]
        except httpx.HTTPStatusError:
            return None

    async def get_directory_contents(self, owner: str, repo: str, path: str = "") -> list[dict]:
        try:
            return await self._get(f"/repos/{owner}/{repo}/contents/{path}")  # type: ignore[return-value]
        except httpx.HTTPStatusError:
            return []

    # ── Package Files ────────────────────────────────────────────

    async def get_package_json(self, owner: str, repo: str) -> dict | None:
        content = await self.get_file_content(owner, repo, "package.json")
        if content is None:
            return None
        import json
        return json.loads(content)

    async def get_requirements_txt(self, owner: str, repo: str) -> list[str] | None:
        content = await self.get_file_content(owner, repo, "requirements.txt")
        if content is None:
            return None
        return [line.strip() for line in content.splitlines() if line.strip() and not line.startswith("#")]

    async def get_env_example(self, owner: str, repo: str) -> str | None:
        for candidate in (".env.example", ".env.sample", ".env.template"):
            content = await self.get_file_content(owner, repo, candidate)
            if content is not None:
                return content
        return None
