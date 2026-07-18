from __future__ import annotations

from typing import Annotated

import jwt as pyjwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError, UnauthorizedError
from app.core.security import verify_supabase_token
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.services.auth_service import AuthService
from app.services.workspace_service import WorkspaceService

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ] = None,
) -> User:
    if credentials is None or not credentials.credentials:
        raise UnauthorizedError("Not authenticated")

    service = AuthService(db)

    # Try Supabase JWT first
    try:
        payload = verify_supabase_token(credentials.credentials)
    except pyjwt.PyJWTError:
        # Fall back to custom JWT (for backward compatibility)
        return await service.get_user_from_access_token(credentials.credentials)

    supabase_id: str = payload["sub"]
    email: str = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {})
    name: str = user_metadata.get("name") or email.split("@")[0]

    return await service.get_or_create_supabase_user(
        supabase_id=supabase_id,
        email=email,
        name=name,
    )


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_workspace(db: DbSession, current_user: CurrentUser) -> Workspace:
    service = WorkspaceService(db)
    return await service.get_default(current_user)


CurrentWorkspace = Annotated[Workspace, Depends(get_current_workspace)]


async def get_current_workspace_member(
    db: DbSession,
    current_user: CurrentUser,
    workspace: CurrentWorkspace,
) -> WorkspaceMember:
    from sqlalchemy import select
    stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.user_id == current_user.id,
    )
    member = await db.scalar(stmt)
    if member is None:
        raise NotFoundError("You are not a member of this workspace")
    return member


CurrentUserRole = Annotated[WorkspaceMember, Depends(get_current_workspace_member)]
