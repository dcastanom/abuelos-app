from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_current_user
from app.db.mongodb import get_db
from app.schemas.nursing_note import NoteCreate, NoteListResponse, NoteResponse
from app.services import nursing_note_service

router = APIRouter(prefix="/residents/{resident_id}/notes", tags=["nursing-notes"])


@router.get("", response_model=NoteListResponse)
async def list_notes(
    resident_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    shift: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await nursing_note_service.list_notes(
        db,
        resident_id,
        current_user["company_id"],
        page,
        page_size,
        date_from,
        date_to,
        shift,
        keyword,
    )


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    resident_id: str,
    data: NoteCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await nursing_note_service.create_note(
        db,
        resident_id,
        current_user["company_id"],
        data,
        current_user["_id"],
        current_user["full_name"],
    )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    resident_id: str,
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    note = await nursing_note_service.get_note(
        db, resident_id, note_id, current_user["company_id"]
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota no encontrada")
    return note
