from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_current_user, require_role
from app.db.mongodb import get_db
from app.schemas.resident import (
    ResidentCreate,
    ResidentListResponse,
    ResidentResponse,
    ResidentUpdate,
)
from app.services import resident_service

router = APIRouter(prefix="/residents", tags=["residents"])

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_PHOTO_BYTES = 2 * 1024 * 1024  # 2 MB


@router.get("", response_model=ResidentListResponse)
async def list_residents(
    search: str = Query("", description="Filtrar por nombre"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await resident_service.list_residents(
        db, current_user["company_id"], search, page, page_size
    )


@router.post("", response_model=ResidentResponse, status_code=status.HTTP_201_CREATED)
async def create_resident(
    data: ResidentCreate,
    current_user: dict = Depends(require_role("admin", "doctor", "nurse")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    resident_id = await resident_service.create_resident(
        db, current_user["company_id"], data, current_user["_id"]
    )
    doc = await resident_service.get_resident(db, current_user["company_id"], resident_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return doc


@router.get("/{resident_id}", response_model=ResidentResponse)
async def get_resident(
    resident_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await resident_service.get_resident(db, current_user["company_id"], resident_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Residente no encontrado")
    return doc


@router.put("/{resident_id}", response_model=ResidentResponse)
async def update_resident(
    resident_id: str,
    data: ResidentUpdate,
    current_user: dict = Depends(require_role("admin", "doctor", "nurse")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    found = await resident_service.update_resident(
        db, current_user["company_id"], resident_id, data, current_user["_id"]
    )
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Residente no encontrado")
    doc = await resident_service.get_resident(db, current_user["company_id"], resident_id)
    return doc


@router.delete("/{resident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resident(
    resident_id: str,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    deleted = await resident_service.delete_resident(db, current_user["company_id"], resident_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Residente no encontrado")


@router.get("/{resident_id}/pdf")
async def export_resident_pdf(
    resident_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    pdf = await resident_service.generate_resident_pdf(db, current_user["company_id"], resident_id)
    if pdf is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Residente no encontrado")
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="ficha-{resident_id}.pdf"'},
    )


@router.post("/{resident_id}/photo")
async def upload_photo(
    resident_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("admin", "doctor", "nurse")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato no permitido. Use JPEG, PNG o WebP.",
        )

    contents = await file.read()
    if len(contents) > _MAX_PHOTO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen no puede superar 2 MB.",
        )

    photo_url = await resident_service.save_photo(
        db,
        current_user["company_id"],
        resident_id,
        file.filename or "photo.jpg",
        contents,
    )
    return {"photo_url": photo_url}
