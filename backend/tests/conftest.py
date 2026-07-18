from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest_asyncio
from app.core.database import get_db
from app.main import app
from app.models import Base
from app.models.workspace import Workspace
from app.repositories.user_repository import UserRepository
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

_testing_session: async_sessionmaker[AsyncSession] | None = None
_engine = None


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """HTTP client backed by an isolated in-memory SQLite database."""
    global _testing_session, _engine
    _engine = create_async_engine(
        "sqlite+aiosqlite://",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    _testing_session = async_sessionmaker(
        _engine, expire_on_commit=False, class_=AsyncSession
    )

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with _testing_session() as session:  # type: ignore[arg-type]
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as http_client:
        yield http_client

    app.dependency_overrides.clear()
    await _engine.dispose()
    _engine = None
    _testing_session = None


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session directly."""
    async with _testing_session() as session:  # type: ignore[arg-type]
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    """Client pre-authenticated as a freshly registered user."""
    from app.core.security import create_access_token as _create_token

    async with _testing_session() as session:  # type: ignore[arg-type]
        user = await UserRepository(session).create(
            name="Grace Hopper",
            email="grace@example.com",
            hashed_password="supersecret123",
        )
        w = Workspace(name="Default", slug="default", owner_id=user.id)
        session.add(w)
        await session.commit()
        token = _create_token(str(user.id))

    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest_asyncio.fixture
async def create_user(client: AsyncClient) -> str:
    """Return a helper that creates a user in the test DB and returns a Bearer token."""
    from app.core.security import create_access_token as _create_token

    async def _make(name: str, email: str) -> str:
        async with _testing_session() as session:
            user = await UserRepository(session).create(
                name=name,
                email=email,
                hashed_password="password123",
            )
            slug = email.split("@")[0]
            w = Workspace(
                name=f"{name}'s Workspace", slug=slug, owner_id=user.id
            )
            session.add(w)
            await session.commit()
            return _create_token(str(user.id))

    return _make
