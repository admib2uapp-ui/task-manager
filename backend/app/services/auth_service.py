from __future__ import annotations

import uuid

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.auth import AuthResponse, TokenPair, UserRead
from app.utils.slug import unique_slug


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.workspaces = WorkspaceRepository(session)

    # --------------------------- helpers -------------------------------
    def _issue_tokens(self, user: User) -> TokenPair:
        subject = str(user.id)
        return TokenPair(
            access_token=create_access_token(subject),
            refresh_token=create_refresh_token(subject),
        )

    def _auth_response(self, user: User) -> AuthResponse:
        tokens = self._issue_tokens(user)
        return AuthResponse(
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token,
            user=UserRead.model_validate(user),
        )

    # --------------------------- use cases -----------------------------
    async def register(self, *, name: str, email: str, password: str) -> AuthResponse:
        email = email.lower()
        if await self.users.email_exists(email):
            raise ConflictError("An account with this email already exists")

        user = await self.users.create(
            name=name,
            email=email,
            hashed_password=hash_password(password),
        )

        # Auto-provision a default workspace so the user can start immediately.
        workspace = await self.workspaces.create(
            name=f"{name}'s Workspace",
            slug=unique_slug(name),
            owner_id=user.id,
        )
        await self.workspaces.add_member(
            workspace_id=workspace.id, user_id=user.id, role="owner"
        )

        return self._auth_response(user)

    async def authenticate(self, *, email: str, password: str) -> AuthResponse:
        user = await self.users.get_by_email(email.lower())
        if user is None or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("Account is disabled")
        return self._auth_response(user)

    async def refresh(self, refresh_token: str) -> AuthResponse:
        try:
            payload = decode_token(refresh_token)
        except jwt.PyJWTError as exc:
            raise UnauthorizedError("Invalid refresh token") from exc

        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type")

        user = await self._load_user(payload.get("sub"))
        return self._auth_response(user)

    async def get_user_from_access_token(self, token: str) -> User:
        try:
            payload = decode_token(token)
        except jwt.PyJWTError as exc:
            raise UnauthorizedError("Invalid or expired token") from exc

        if payload.get("type") != "access":
            raise UnauthorizedError("Invalid token type")

        return await self._load_user(payload.get("sub"))

    async def _load_user(self, subject: str | None) -> User:
        if not subject:
            raise UnauthorizedError("Invalid token subject")
        try:
            user_id = uuid.UUID(subject)
        except (ValueError, TypeError) as exc:
            raise UnauthorizedError("Invalid token subject") from exc

        user = await self.users.get(user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("User not found or disabled")
        return user
