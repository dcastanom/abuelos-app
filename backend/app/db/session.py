from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

_SQLITE_FILE_PREFIX = "sqlite+aiosqlite:///"

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _py_lower(value: str | None) -> str | None:
    return value.lower() if value is not None else None


def ensure_db_dir_exists(url: str) -> None:
    if not url.startswith(_SQLITE_FILE_PREFIX):
        return
    db_path = url[len(_SQLITE_FILE_PREFIX) :]
    if db_path == ":memory:":
        return
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)


async def connect_db() -> None:
    global _engine, _session_factory

    ensure_db_dir_exists(settings.DATABASE_URL)
    _engine = create_async_engine(settings.DATABASE_URL)

    @event.listens_for(_engine.sync_engine, "connect")
    def _configure_connection(dbapi_connection: object, connection_record: object) -> None:
        dbapi_connection.create_function("py_lower", 1, _py_lower)  # type: ignore[attr-defined]
        cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def close_db() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if _session_factory is None:
        raise RuntimeError("Database is not initialized")
    async with _session_factory() as session:
        yield session


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """For standalone scripts (seed.py, scripts/seed_notes.py) that aren't FastAPI requests."""
    if _session_factory is None:
        raise RuntimeError("Database is not initialized")
    return _session_factory
