import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from jinja2 import Environment, FileSystemLoader
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.utils import dates_to_datetimes
from app.schemas.resident import ResidentCreate, ResidentUpdate

_TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def _fmtdate(dt: object) -> str:
    if dt is None:
        return "—"
    if hasattr(dt, "strftime"):
        return dt.strftime("%d/%m/%Y")  # type: ignore[union-attr]
    s = str(dt)
    return s[:10] if len(s) >= 10 else s


async def list_residents(
    db: AsyncIOMotorDatabase,
    company_id: str,
    search: str = "",
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query: dict = {"company_id": ObjectId(company_id)}
    if search:
        query["full_name"] = {"$regex": search, "$options": "i"}

    total = await db["residents"].count_documents(query)
    cursor = (
        db["residents"]
        .find(query, {"full_name": 1, "photo_url": 1, "id_number": 1, "registration_date": 1, "room_number": 1})
        .sort("full_name", 1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    docs = await cursor.to_list(page_size)

    return {
        "items": [
            {
                "id": str(r["_id"]),
                "full_name": r["full_name"],
                "photo_url": r.get("photo_url"),
                "id_number": r.get("id_number"),
                "registration_date": r.get("registration_date"),
                "room_number": r.get("room_number"),
            }
            for r in docs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def create_resident(
    db: AsyncIOMotorDatabase,
    company_id: str,
    data: ResidentCreate,
    created_by: str,
) -> str:
    doc = dates_to_datetimes(data.model_dump())
    doc["company_id"] = ObjectId(company_id)
    doc["photo_url"] = None
    doc["created_by"] = ObjectId(created_by)
    doc["created_at"] = datetime.now(timezone.utc)
    doc["updated_by"] = None
    doc["updated_at"] = None
    result = await db["residents"].insert_one(doc)
    return str(result.inserted_id)


async def get_resident(
    db: AsyncIOMotorDatabase,
    company_id: str,
    resident_id: str,
) -> dict | None:
    try:
        oid = ObjectId(resident_id)
    except Exception:
        return None

    doc = await db["residents"].find_one(
        {"_id": oid, "company_id": ObjectId(company_id)}
    )
    if doc is None:
        return None

    doc["id"] = str(doc["_id"])
    doc["registration_id"] = str(doc["_id"])
    doc["company_id"] = str(doc["company_id"])
    doc["created_by"] = str(doc["created_by"]) if doc.get("created_by") else None
    doc["updated_by"] = str(doc["updated_by"]) if doc.get("updated_by") else None
    return doc


async def update_resident(
    db: AsyncIOMotorDatabase,
    company_id: str,
    resident_id: str,
    data: ResidentUpdate,
    updated_by: str,
) -> bool:
    try:
        oid = ObjectId(resident_id)
    except Exception:
        return False

    updates = dates_to_datetimes(data.model_dump(exclude_none=True, exclude_unset=True))
    updates["updated_by"] = ObjectId(updated_by)
    updates["updated_at"] = datetime.now(timezone.utc)

    result = await db["residents"].update_one(
        {"_id": oid, "company_id": ObjectId(company_id)},
        {"$set": updates},
    )
    return result.matched_count > 0


async def delete_resident(
    db: AsyncIOMotorDatabase,
    company_id: str,
    resident_id: str,
) -> bool:
    try:
        oid = ObjectId(resident_id)
    except Exception:
        return False

    result = await db["residents"].delete_one(
        {"_id": oid, "company_id": ObjectId(company_id)}
    )
    return result.deleted_count > 0


async def save_photo(
    db: AsyncIOMotorDatabase,
    company_id: str,
    resident_id: str,
    original_filename: str,
    contents: bytes,
) -> str:
    suffix = Path(original_filename).suffix.lower()
    safe_name = f"{uuid.uuid4().hex}{suffix}"
    upload_dir = Path("uploads") / company_id / "residents" / resident_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    (upload_dir / safe_name).write_bytes(contents)

    photo_url = f"/uploads/{company_id}/residents/{resident_id}/{safe_name}"
    await db["residents"].update_one(
        {"_id": ObjectId(resident_id), "company_id": ObjectId(company_id)},
        {"$set": {"photo_url": photo_url}},
    )
    return photo_url


async def generate_resident_pdf(
    db: AsyncIOMotorDatabase,
    company_id: str,
    resident_id: str,
) -> bytes | None:
    doc = await get_resident(db, company_id, resident_id)
    if doc is None:
        return None

    env = Environment(loader=FileSystemLoader(str(_TEMPLATES_DIR)), autoescape=False)
    env.filters["fmtdate"] = _fmtdate
    tmpl = env.get_template("resident_pdf.html")
    now = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
    html_str = tmpl.render(r=doc, now=now)

    import weasyprint  # lazy import — only needed for this function

    return await asyncio.to_thread(
        lambda: weasyprint.HTML(string=html_str, base_url=".").write_pdf()
    )


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db["residents"].create_index([("company_id", 1), ("full_name", 1)])
    # Unique only when id_number is actually set — partialFilterExpression
    # excludes null/missing values that sparse would still index in a compound key
    await db["residents"].create_index(
        [("company_id", 1), ("id_number", 1)],
        unique=True,
        partialFilterExpression={"id_number": {"$type": "string"}},
    )
