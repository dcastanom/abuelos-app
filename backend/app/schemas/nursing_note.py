from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NoteCreate(BaseModel):
    notes: str


class NoteResponse(BaseModel):
    id: str
    resident_id: str
    resident_name: Optional[str] = None
    company_id: str
    company_name: Optional[str] = None
    date: datetime
    shift: str
    notes: str
    nurse_id: str
    nurse_name: str
    created_at: datetime


class NoteListResponse(BaseModel):
    items: list[NoteResponse]
    total: int
    page: int
    page_size: int
