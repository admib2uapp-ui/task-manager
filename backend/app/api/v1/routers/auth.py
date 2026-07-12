from __future__ import annotations

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    UpdateProfileRequest,
    UserRead,
)
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(payload: RegisterRequest, db: DbSession) -> AuthResponse:
    service = AuthService(db)
    return await service.register(
        name=payload.name, email=payload.email, password=payload.password
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: DbSession) -> AuthResponse:
    service = AuthService(db)
    return await service.authenticate(email=payload.email, password=payload.password)


@router.post("/refresh", response_model=AuthResponse)
async def refresh(payload: RefreshRequest, db: DbSession) -> AuthResponse:
    service = AuthService(db)
    return await service.refresh(payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(_current_user: CurrentUser) -> MessageResponse:
    # Stateless JWT: the client discards its tokens. Endpoint exists for
    # symmetry and future token-revocation/blacklist support.
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UpdateProfileRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> UserRead:
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if updates:
        for field, value in updates.items():
            setattr(current_user, field, value)
        db.add(current_user)
        await db.flush()
        await db.refresh(current_user)
    return UserRead.model_validate(current_user)
