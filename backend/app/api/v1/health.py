from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_db

router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check(db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "ok", "db": db_status}
