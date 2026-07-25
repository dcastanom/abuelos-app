from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils import escape_like
from app.models.company import Company
from app.models.nursing_note import NursingNote
from app.models.resident import Resident
from app.schemas.nursing_note import NoteCreate

_BOGOTA = ZoneInfo("America/Bogota")


def _shift_for(dt: datetime) -> str:
    hour = dt.astimezone(_BOGOTA).hour
    if 6 <= hour < 14:
        return "mañana"
    if 14 <= hour < 22:
        return "tarde"
    return "noche"


def _fmt(note: NursingNote, resident_name: Optional[str], company_name: Optional[str]) -> dict:
    return {
        "id": note.id,
        "resident_id": note.resident_id,
        "resident_name": resident_name,
        "company_id": note.company_id,
        "company_name": company_name,
        "date": note.date,
        "shift": note.shift,
        "notes": note.notes,
        "nurse_id": note.nurse_id,
        "nurse_name": note.nurse_name,
        "created_at": note.created_at,
    }


def _visible_to(requester_role: str) -> list:
    """Admin-authored notes are only visible to admin users."""
    if requester_role == "admin":
        return []
    return [NursingNote.author_role != "admin"]


async def _fetch_names(
    db: AsyncSession, resident_id: str, company_id: str
) -> tuple[Optional[str], Optional[str]]:
    resident = (
        await db.execute(select(Resident).where(Resident.id == resident_id))
    ).scalar_one_or_none()
    company = (
        await db.execute(select(Company).where(Company.id == company_id))
    ).scalar_one_or_none()
    return (
        resident.full_name if resident else None,
        company.name if company else None,
    )


async def create_note(
    db: AsyncSession,
    resident_id: str,
    company_id: str,
    data: NoteCreate,
    nurse_id: str,
    nurse_name: str,
    author_role: str,
) -> dict:
    now = datetime.now(tz=_BOGOTA)
    note = NursingNote(
        resident_id=resident_id,
        company_id=company_id,
        date=now,
        shift=_shift_for(now),
        notes=data.notes.strip(),
        nurse_id=nurse_id,
        nurse_name=nurse_name,
        author_role=author_role,
        created_at=now,
    )
    db.add(note)
    await db.commit()
    resident_name, company_name = await _fetch_names(db, resident_id, company_id)
    return _fmt(note, resident_name, company_name)


async def list_notes(
    db: AsyncSession,
    resident_id: str,
    company_id: str,
    requester_role: str,
    page: int = 1,
    page_size: int = 20,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    shift: Optional[str] = None,
    keyword: Optional[str] = None,
) -> dict:
    filters = [
        NursingNote.resident_id == resident_id,
        NursingNote.company_id == company_id,
        *_visible_to(requester_role),
    ]
    if date_from:
        filters.append(NursingNote.date >= date_from)
    if date_to:
        filters.append(NursingNote.date <= date_to)
    if shift:
        filters.append(NursingNote.shift == shift)
    if keyword:
        pattern = f"%{escape_like(keyword.lower())}%"
        filters.append(func.py_lower(NursingNote.notes).like(pattern, escape="\\"))

    total = (
        await db.execute(select(func.count()).select_from(NursingNote).where(*filters))
    ).scalar_one()

    result = await db.execute(
        select(NursingNote)
        .where(*filters)
        .order_by(NursingNote.date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    notes = result.scalars().all()

    resident_name, company_name = await _fetch_names(db, resident_id, company_id)

    return {
        "items": [_fmt(n, resident_name, company_name) for n in notes],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def get_note(
    db: AsyncSession,
    resident_id: str,
    note_id: str,
    company_id: str,
    requester_role: str,
) -> Optional[dict]:
    result = await db.execute(
        select(NursingNote).where(
            NursingNote.id == note_id,
            NursingNote.resident_id == resident_id,
            NursingNote.company_id == company_id,
            *_visible_to(requester_role),
        )
    )
    note = result.scalar_one_or_none()
    if not note:
        return None
    resident_name, company_name = await _fetch_names(db, resident_id, company_id)
    return _fmt(note, resident_name, company_name)
