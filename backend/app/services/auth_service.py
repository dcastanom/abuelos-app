import secrets
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.utils import slugify
from app.schemas.auth import RegisterCompanyRequest
from app.services.email_service import send_confirmation_email


async def register_company(db: AsyncIOMotorDatabase, data: RegisterCompanyRequest) -> dict:
    if await db["users"].find_one({"email": data.admin_email}):
        raise ValueError("El correo ya está registrado")

    if await db["companies"].find_one({"legal_id": data.legal_id}):
        raise ValueError("El NIT/CC ya está registrado")

    slug = slugify(data.company_name)
    base_slug = slug
    i = 1
    while await db["companies"].find_one({"slug": slug}):
        slug = f"{base_slug}-{i}"
        i += 1

    company_id = ObjectId()
    confirmation_token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)

    await db["companies"].insert_one(
        {
            "_id": company_id,
            "name": data.company_name,
            "legal_id": data.legal_id,
            "slug": slug,
            "admin_email": data.admin_email,
            "is_active": False,
            "confirmation_token": confirmation_token,
            "created_at": now,
        }
    )

    await db["users"].insert_one(
        {
            "_id": ObjectId(),
            "company_id": company_id,
            "email": data.admin_email,
            "password_hash": hash_password(data.password),
            "full_name": data.admin_name,
            "role": "admin",
            "is_active": True,
            "created_at": now,
            "last_login": None,
        }
    )

    await send_confirmation_email(
        to_email=data.admin_email,
        company_name=data.company_name,
        token=confirmation_token,
    )

    return {"message": "Registro exitoso. Revise su correo para confirmar la cuenta."}


async def confirm_company(db: AsyncIOMotorDatabase, token: str) -> dict:
    company = await db["companies"].find_one({"confirmation_token": token})
    if not company:
        raise ValueError("Token inválido o expirado")

    await db["companies"].update_one(
        {"_id": company["_id"]},
        {"$set": {"is_active": True, "confirmation_token": None}},
    )
    return {"message": "Cuenta confirmada exitosamente. Ya puede iniciar sesión."}


async def login(db: AsyncIOMotorDatabase, email: str, password: str) -> dict:
    user = await db["users"].find_one({"email": email, "is_active": True})
    if not user or not verify_password(password, user["password_hash"]):
        raise ValueError("Credenciales inválidas")

    company = await db["companies"].find_one({"_id": user["company_id"], "is_active": True})
    if not company:
        raise ValueError("La empresa no está activa. Confirme su correo electrónico.")

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}},
    )

    payload = {
        "sub": str(user["_id"]),
        "company_id": str(company["_id"]),
        "company_slug": company["slug"],
        "role": user["role"],
        "email": user["email"],
        "full_name": user["full_name"],
    }

    return {
        "access_token": create_access_token(payload),
        "refresh_token": create_refresh_token(payload),
        "company_slug": company["slug"],
        "role": user["role"],
        "user_id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
    }


async def refresh_access_token(db: AsyncIOMotorDatabase, refresh_token: str) -> dict:
    try:
        payload = decode_token(refresh_token, "refresh")
    except Exception:
        raise ValueError("Refresh token inválido o expirado")

    user = await db["users"].find_one({"_id": ObjectId(payload["sub"]), "is_active": True})
    company = await db["companies"].find_one(
        {"_id": ObjectId(payload["company_id"]), "is_active": True}
    )
    if not user or not company:
        raise ValueError("Usuario o empresa no encontrados")

    new_payload = {
        "sub": str(user["_id"]),
        "company_id": str(company["_id"]),
        "company_slug": company["slug"],
        "role": user["role"],
        "email": user["email"],
        "full_name": user["full_name"],
    }
    return {"access_token": create_access_token(new_payload)}
