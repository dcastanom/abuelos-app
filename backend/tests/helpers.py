from datetime import datetime, timezone

from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import get_db
from app.main import app
from app.models.company import Company
from app.models.user import User

REGISTER_PAYLOAD = {
    "company_name": "Centro de Prueba",
    "legal_id": "900999888-1",
    "admin_name": "Admin Prueba",
    "admin_email": "admin@prueba.com",
    "password": "Password123!",
}


async def register_and_confirm(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/auth/register-company", json=REGISTER_PAYLOAD)
    assert resp.status_code == 201

    override = app.dependency_overrides[get_db]
    async for session in override():
        company = (
            await session.execute(
                select(Company).where(Company.legal_id == REGISTER_PAYLOAD["legal_id"])
            )
        ).scalar_one()
        token = company.confirmation_token

    confirm_resp = await client.get(f"/api/v1/auth/confirm/{token}")
    assert confirm_resp.status_code == 200


async def get_access_token(client: AsyncClient) -> str:
    await register_and_confirm(client)
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": REGISTER_PAYLOAD["admin_email"], "password": REGISTER_PAYLOAD["password"]},
    )
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]


async def create_user_and_login(
    client: AsyncClient, role: str, email: str, full_name: str, password: str = "Password123!"
) -> str:
    """Creates a user in the already-registered test company and logs in as them."""
    override = app.dependency_overrides[get_db]
    async for session in override():
        company = (
            await session.execute(
                select(Company).where(Company.legal_id == REGISTER_PAYLOAD["legal_id"])
            )
        ).scalar_one()
        session.add(
            User(
                company_id=company.id,
                email=email,
                password_hash=hash_password(password),
                full_name=full_name,
                role=role,
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
        )
        await session.commit()

    login_resp = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"]
