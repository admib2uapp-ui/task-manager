from __future__ import annotations

import secrets
import uuid

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, ConflictError, UnauthorizedError
from app.core.security import (
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.workspace_service import WorkspaceService


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.workspaces = WorkspaceService(session)

    async def get_user_from_access_token(self, token: str) -> User:
        try:
            payload = decode_token(token)
        except jwt.PyJWTError as exc:
            raise UnauthorizedError("Invalid or expired token") from exc

        if payload.get("type") != "access":
            raise UnauthorizedError("Invalid token type")

        return await self._load_user(payload.get("sub"))

    async def get_or_create_supabase_user(
        self,
        *,
        supabase_id: str,
        email: str,
        name: str,
    ) -> User:
        email = email.lower()

        user = await self.users.get_by_supabase_id(supabase_id)
        if user is not None:
            return user

        user = await self.users.get_by_email(email)
        if user is not None:
            user.supabase_id = supabase_id
            await self.session.flush()
            return user

        user = await self.users.create(
            name=name,
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            supabase_id=supabase_id,
        )
        await self.workspaces.create_for_user(user)
        return user

    async def login(self, *, email: str, password: str) -> User:
        email_lower = email.lower()
        user = await self.users.get_by_email(email_lower)
        if user is None:
            raise UnauthorizedError("Invalid login credentials")
        if user.supabase_id is not None:
            raise BadRequestError(
                "This account was created via Supabase. "
                "Please sign in with Google or GitHub."
            )
        if not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid login credentials")
        if not user.is_active:
            raise UnauthorizedError("User account is disabled")
        return user

    async def register(
        self,
        *,
        name: str,
        email: str,
        password: str,
    ) -> User:
        email_lower = email.lower()
        if await self.users.email_exists(email_lower):
            raise ConflictError("A user with this email already exists")

        user = await self.users.create(
            name=name,
            email=email_lower,
            hashed_password=hash_password(password),
        )
        await self.workspaces.create_for_user(user)
        return user

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
