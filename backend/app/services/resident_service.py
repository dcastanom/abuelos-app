import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import cast

from jinja2 import Environment, FileSystemLoader
from sqlalchemy import CursorResult, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils import escape_like
from app.models.resident import Resident
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
    db: AsyncSession,
    company_id: str,
    search: str = "",
    page: int = 1,
    page_size: int = 20,
) -> dict:
    filters = [Resident.company_id == company_id]
    if search:
        pattern = f"%{escape_like(search.lower())}%"
        filters.append(func.py_lower(Resident.full_name).like(pattern, escape="\\"))

    total = (
        await db.execute(select(func.count()).select_from(Resident).where(*filters))
    ).scalar_one()

    result = await db.execute(
        select(Resident)
        .where(*filters)
        .order_by(Resident.full_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    residents = result.scalars().all()

    return {
        "items": [
            {
                "id": r.id,
                "full_name": r.full_name,
                "photo_url": r.photo_url,
                "id_number": r.id_number,
                "registration_date": r.registration_date,
                "room_number": r.room_number,
            }
            for r in residents
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def create_resident(
    db: AsyncSession,
    company_id: str,
    data: ResidentCreate,
    created_by: str,
) -> str:
    resident = Resident(
        **data.model_dump(),
        company_id=company_id,
        photo_url=None,
        created_by=created_by,
        created_at=datetime.now(timezone.utc),
        updated_by=None,
        updated_at=None,
    )
    db.add(resident)
    await db.commit()
    return resident.id


async def get_resident(
    db: AsyncSession,
    company_id: str,
    resident_id: str,
) -> dict | None:
    result = await db.execute(
        select(Resident).where(Resident.id == resident_id, Resident.company_id == company_id)
    )
    resident = result.scalar_one_or_none()
    if resident is None:
        return None

    doc = {c.name: getattr(resident, c.name) for c in Resident.__table__.columns}
    doc["registration_id"] = resident.id
    return doc


async def update_resident(
    db: AsyncSession,
    company_id: str,
    resident_id: str,
    data: ResidentUpdate,
    updated_by: str,
) -> bool:
    result = await db.execute(
        select(Resident).where(Resident.id == resident_id, Resident.company_id == company_id)
    )
    resident = result.scalar_one_or_none()
    if resident is None:
        return False

    updates = data.model_dump(exclude_none=True, exclude_unset=True)
    for key, value in updates.items():
        setattr(resident, key, value)
    resident.updated_by = updated_by
    resident.updated_at = datetime.now(timezone.utc)

    await db.commit()
    return True


async def delete_resident(
    db: AsyncSession,
    company_id: str,
    resident_id: str,
) -> bool:
    result = cast(
        CursorResult,
        await db.execute(
            delete(Resident).where(Resident.id == resident_id, Resident.company_id == company_id)
        ),
    )
    await db.commit()
    return result.rowcount > 0


async def save_photo(
    db: AsyncSession,
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
    await db.execute(
        update(Resident)
        .where(Resident.id == resident_id, Resident.company_id == company_id)
        .values(photo_url=photo_url)
    )
    await db.commit()
    return photo_url


async def generate_resident_pdf(
    db: AsyncSession,
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
