from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.db.mongodb import get_db
from app.schemas.auth import LoginRequest, RegisterCompanyRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register-company", status_code=status.HTTP_201_CREATED)
async def register_company(
    data: RegisterCompanyRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        return await auth_service.register_company(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/confirm/{token}")
async def confirm_email(token: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        return await auth_service.confirm_company(db, token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        result = await auth_service.login(db, data.email, data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        httponly=True,
        samesite="strict",
        secure=False,  # set True behind HTTPS in production
    )

    return TokenResponse(**{k: v for k, v in result.items() if k != "refresh_token"})


@router.post("/refresh")
async def refresh(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sin refresh token")
    try:
        return await auth_service.refresh_access_token(db, token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token", samesite="strict")
    return {"message": "Sesión cerrada"}
