import secrets
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.utils import slugify
from app.models.company import Company
from app.models.user import User
from app.schemas.auth import RegisterCompanyRequest
from app.services.email_service import send_confirmation_email


async def register_company(db: AsyncSession, data: RegisterCompanyRequest) -> dict:
    existing_user = await db.execute(select(User).where(User.email == data.admin_email))
    if existing_user.scalar_one_or_none():
        raise ValueError("El correo ya está registrado")

    existing_company = await db.execute(select(Company).where(Company.legal_id == data.legal_id))
    if existing_company.scalar_one_or_none():
        raise ValueError("El NIT/CC ya está registrado")

    slug = slugify(data.company_name)
    base_slug = slug
    i = 1
    while (await db.execute(select(Company).where(Company.slug == slug))).scalar_one_or_none():
        slug = f"{base_slug}-{i}"
        i += 1

    confirmation_token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)

    company = Company(
        name=data.company_name,
        legal_id=data.legal_id,
        slug=slug,
        admin_email=data.admin_email,
        is_active=False,
        confirmation_token=confirmation_token,
        created_at=now,
    )
    db.add(company)
    await db.flush()

    db.add(
        User(
            company_id=company.id,
            email=data.admin_email,
            password_hash=hash_password(data.password),
            full_name=data.admin_name,
            role="admin",
            is_active=True,
            created_at=now,
            last_login=None,
        )
    )
    await db.commit()

    await send_confirmation_email(
        to_email=data.admin_email,
        company_name=data.company_name,
        token=confirmation_token,
    )

    return {"message": "Registro exitoso. Revise su correo para confirmar la cuenta."}


async def confirm_company(db: AsyncSession, token: str) -> dict:
    result = await db.execute(select(Company).where(Company.confirmation_token == token))
    company = result.scalar_one_or_none()
    if not company:
        raise ValueError("Token inválido o expirado")

    company.is_active = True
    company.confirmation_token = None
    await db.commit()
    return {"message": "Cuenta confirmada exitosamente. Ya puede iniciar sesión."}


async def login(db: AsyncSession, email: str, password: str) -> dict:
    result = await db.execute(
        select(User).where(User.email == email, User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Credenciales inválidas")

    company_result = await db.execute(
        select(Company).where(Company.id == user.company_id, Company.is_active.is_(True))
    )
    company = company_result.scalar_one_or_none()
    if not company:
        raise ValueError("La empresa no está activa. Confirme su correo electrónico.")

    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    payload = {
        "sub": user.id,
        "company_id": company.id,
        "company_slug": company.slug,
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name,
    }

    return {
        "access_token": create_access_token(payload),
        "refresh_token": create_refresh_token(payload),
        "company_slug": company.slug,
        "role": user.role,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
    }


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict:
    try:
        payload = decode_token(refresh_token, "refresh")
    except Exception:
        raise ValueError("Refresh token inválido o expirado")

    user_result = await db.execute(
        select(User).where(User.id == payload["sub"], User.is_active.is_(True))
    )
    user = user_result.scalar_one_or_none()

    company_result = await db.execute(
        select(Company).where(
            Company.id == payload["company_id"], Company.is_active.is_(True)
        )
    )
    company = company_result.scalar_one_or_none()

    if not user or not company:
        raise ValueError("Usuario o empresa no encontrados")

    new_payload = {
        "sub": user.id,
        "company_id": company.id,
        "company_slug": company.slug,
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name,
    }
    return {"access_token": create_access_token(new_payload)}
