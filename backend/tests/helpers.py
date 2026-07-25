from httpx import AsyncClient
from sqlalchemy import select

from app.db.session import get_db
from app.main import app
from app.models.company import Company

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
