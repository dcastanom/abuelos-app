from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client
    # serverSelectionTimeoutMS keeps the health check from hanging when MongoDB is unavailable
    _client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_db() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("Database client is not initialized")
    return _client[settings.MONGODB_DB]
