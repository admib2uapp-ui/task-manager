from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update

from app.models.repository import (
    AIRepositoryReport,
    CodeIssue,
    RepositoryChat,
    RepositoryConnection,
    RepositoryMetric,
    RepositoryScan,
    RepositoryScore,
)
from app.repositories.base import BaseRepository


class RepositoryConnectionRepository(BaseRepository[RepositoryConnection]):
    model = RepositoryConnection

    async def list_for_workspace(self, workspace_id: uuid.UUID) -> list[RepositoryConnection]:
        stmt = (
            select(RepositoryConnection)
            .where(RepositoryConnection.workspace_id == workspace_id)
            .order_by(RepositoryConnection.created_at.desc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_in_workspace(
        self, connection_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> RepositoryConnection | None:
        stmt = select(RepositoryConnection).where(
            RepositoryConnection.id == connection_id,
            RepositoryConnection.workspace_id == workspace_id,
        )
        return await self.session.scalar(stmt)

    async def get_by_repo(
        self, workspace_id: uuid.UUID, owner: str, repo: str
    ) -> RepositoryConnection | None:
        stmt = select(RepositoryConnection).where(
            RepositoryConnection.workspace_id == workspace_id,
            RepositoryConnection.github_owner == owner,
            RepositoryConnection.github_repo == repo,
        )
        return await self.session.scalar(stmt)

    async def touch_sync(self, connection_id: uuid.UUID) -> None:
        stmt = (
            update(RepositoryConnection)
            .where(RepositoryConnection.id == connection_id)
            .values(last_synced_at=datetime.now(UTC))
        )
        await self.session.execute(stmt)
        await self.session.flush()


class RepositoryScanRepository(BaseRepository[RepositoryScan]):
    model = RepositoryScan

    async def list_for_connection(self, connection_id: uuid.UUID) -> list[RepositoryScan]:
        stmt = (
            select(RepositoryScan)
            .where(RepositoryScan.connection_id == connection_id)
            .order_by(RepositoryScan.created_at.desc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_latest(self, connection_id: uuid.UUID) -> RepositoryScan | None:
        stmt = (
            select(RepositoryScan)
            .where(RepositoryScan.connection_id == connection_id)
            .order_by(RepositoryScan.created_at.desc())
            .limit(1)
        )
        return await self.session.scalar(stmt)

    async def get_with_relations(self, scan_id: uuid.UUID) -> RepositoryScan | None:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(RepositoryScan)
            .where(RepositoryScan.id == scan_id)
            .options(
                selectinload(RepositoryScan.issues),
                selectinload(RepositoryScan.metrics),
                selectinload(RepositoryScan.score),
                selectinload(RepositoryScan.reports),
            )
        )
        return await self.session.scalar(stmt)


class CodeIssueRepository(BaseRepository[CodeIssue]):
    model = CodeIssue

    async def list_for_scan(
        self,
        scan_id: uuid.UUID,
        *,
        severity: str | None = None,
        category: str | None = None,
        file_path: str | None = None,
        resolved: bool | None = None,
    ) -> list[CodeIssue]:
        stmt = select(CodeIssue).where(CodeIssue.scan_id == scan_id)
        if severity is not None:
            stmt = stmt.where(CodeIssue.severity == severity)
        if category is not None:
            stmt = stmt.where(CodeIssue.category == category)
        if file_path is not None:
            stmt = stmt.where(CodeIssue.file_path == file_path)
        if resolved is not None:
            stmt = stmt.where(CodeIssue.is_resolved == resolved)
        stmt = stmt.order_by(
            CodeIssue.severity.asc(), CodeIssue.file_path, CodeIssue.line_start
        )
        result = await self.session.scalars(stmt)
        return list(result.all())


class RepositoryMetricRepository(BaseRepository[RepositoryMetric]):
    model = RepositoryMetric

    async def get_for_scan(self, scan_id: uuid.UUID) -> list[RepositoryMetric]:
        stmt = (
            select(RepositoryMetric)
            .where(RepositoryMetric.scan_id == scan_id)
            .order_by(RepositoryMetric.category, RepositoryMetric.metric_name)
        )
        result = await self.session.scalars(stmt)
        return list(result.all())


class RepositoryScoreRepository(BaseRepository[RepositoryScore]):
    model = RepositoryScore

    async def get_for_scan(self, scan_id: uuid.UUID) -> RepositoryScore | None:
        stmt = select(RepositoryScore).where(RepositoryScore.scan_id == scan_id)
        return await self.session.scalar(stmt)


class AIRepositoryReportRepository(BaseRepository[AIRepositoryReport]):
    model = AIRepositoryReport

    async def list_for_scan(self, scan_id: uuid.UUID) -> list[AIRepositoryReport]:
        stmt = (
            select(AIRepositoryReport)
            .where(AIRepositoryReport.scan_id == scan_id)
            .order_by(AIRepositoryReport.created_at.desc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())


class RepositoryChatRepository(BaseRepository[RepositoryChat]):
    model = RepositoryChat

    async def list_for_connection(
        self, connection_id: uuid.UUID, limit: int = 50
    ) -> list[RepositoryChat]:
        stmt = (
            select(RepositoryChat)
            .where(RepositoryChat.connection_id == connection_id)
            .order_by(RepositoryChat.created_at.asc())
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.all())
