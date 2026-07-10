from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.nursing_note import NoteCreate

_BOGOTA = ZoneInfo("America/Bogota")


def _shift_for(dt: datetime) -> str:
    hour = dt.astimezone(_BOGOTA).hour
    if 6 <= hour < 14:
        return "mañana"
    if 14 <= hour < 22:
        return "tarde"
    return "noche"


def _fmt(note: dict, resident_name: Optional[str], company_name: Optional[str]) -> dict:
    return {
        "id": str(note["_id"]),
        "resident_id": str(note["resident_id"]),
        "resident_name": resident_name,
        "company_id": str(note["company_id"]),
        "company_name": company_name,
        "date": note["date"],
        "shift": note["shift"],
        "notes": note["notes"],
        "nurse_id": note["nurse_id"],
        "nurse_name": note["nurse_name"],
        "created_at": note["created_at"],
    }


async def _fetch_names(
    db: AsyncIOMotorDatabase, resident_id: str, company_id: str
) -> tuple[Optional[str], Optional[str]]:
    resident = await db["residents"].find_one({"_id": ObjectId(resident_id)})
    company = await db["companies"].find_one({"_id": ObjectId(company_id)})
    return (
        resident["full_name"] if resident else None,
        company["name"] if company else None,
    )


async def create_note(
    db: AsyncIOMotorDatabase,
    resident_id: str,
    company_id: str,
    data: NoteCreate,
    nurse_id: str,
    nurse_name: str,
) -> dict:
    now = datetime.now(tz=_BOGOTA)
    doc = {
        "resident_id": ObjectId(resident_id),
        "company_id": ObjectId(company_id),
        "date": now,
        "shift": _shift_for(now),
        "notes": data.notes.strip(),
        "nurse_id": nurse_id,
        "nurse_name": nurse_name,
        "created_at": now,
    }
    result = await db["nursing_notes"].insert_one(doc)
    doc["_id"] = result.inserted_id
    resident_name, company_name = await _fetch_names(db, resident_id, company_id)
    return _fmt(doc, resident_name, company_name)


async def list_notes(
    db: AsyncIOMotorDatabase,
    resident_id: str,
    company_id: str,
    page: int = 1,
    page_size: int = 20,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    shift: Optional[str] = None,
    keyword: Optional[str] = None,
) -> dict:
    query: dict = {
        "resident_id": ObjectId(resident_id),
        "company_id": ObjectId(company_id),
    }
    if date_from or date_to:
        date_filter: dict = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        query["date"] = date_filter
    if shift:
        query["shift"] = shift
    if keyword:
        query["notes"] = {"$regex": keyword, "$options": "i"}

    total = await db["nursing_notes"].count_documents(query)
    cursor = (
        db["nursing_notes"]
        .find(query)
        .sort("date", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    notes = await cursor.to_list(page_size)

    resident_name, company_name = await _fetch_names(db, resident_id, company_id)

    return {
        "items": [_fmt(n, resident_name, company_name) for n in notes],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def get_note(
    db: AsyncIOMotorDatabase,
    resident_id: str,
    note_id: str,
    company_id: str,
) -> Optional[dict]:
    note = await db["nursing_notes"].find_one(
        {
            "_id": ObjectId(note_id),
            "resident_id": ObjectId(resident_id),
            "company_id": ObjectId(company_id),
        }
    )
    if not note:
        return None
    resident_name, company_name = await _fetch_names(db, resident_id, company_id)
    return _fmt(note, resident_name, company_name)
