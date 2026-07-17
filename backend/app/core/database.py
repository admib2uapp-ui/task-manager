from __future__ import annotations

import ssl
from collections.abc import AsyncGenerator

from sqlalchemy.engine import make_url
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# asyncpg does not understand libpq-style query params (sslmode / channel_binding).
# Neon connection strings include them, so we strip and translate to connect_args.
_SSL_REQUIRING_MODES = {"require", "verify-ca", "verify-full"}


def _normalise_database_url(raw_url: str) -> tuple[URL, dict[str, object]]:
    """Return an async-capable SQLAlchemy URL and matching connect_args."""
    url = make_url(raw_url)
    connect_args: dict[str, object] = {}

    # Force the async driver for Postgres.
    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+asyncpg")

    if url.get_backend_name() == "postgresql":
        query = dict(url.query)
        sslmode = query.pop("sslmode", None)
        query.pop("channel_binding", None)  # unsupported by asyncpg
        url = url.set(query=query)

        if sslmode in _SSL_REQUIRING_MODES:
            ctx = ssl.create_default_context()
            if sslmode == "require":
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
            elif sslmode == "verify-ca":
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_REQUIRED
            connect_args["ssl"] = ctx

    return url, connect_args


_url, _connect_args = _normalise_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    _url,
    echo=settings.DEBUG and not settings.is_production,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a scoped async session."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
