from httpx import AsyncClient

from tests.helpers import REGISTER_PAYLOAD, register_and_confirm


async def test_register_confirm_login(client: AsyncClient):
    await register_and_confirm(client)

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": REGISTER_PAYLOAD["admin_email"], "password": REGISTER_PAYLOAD["password"]},
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert data["email"] == REGISTER_PAYLOAD["admin_email"]
    assert data["role"] == "admin"
    assert "access_token" in data


async def test_login_wrong_password(client: AsyncClient):
    await register_and_confirm(client)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": REGISTER_PAYLOAD["admin_email"], "password": "wrong-password"},
    )
    assert resp.status_code == 401


async def test_login_before_confirmation(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register-company", json=REGISTER_PAYLOAD)
    assert resp.status_code == 201

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": REGISTER_PAYLOAD["admin_email"], "password": REGISTER_PAYLOAD["password"]},
    )
    assert login_resp.status_code == 401


async def test_duplicate_email_registration_rejected(client: AsyncClient):
    await register_and_confirm(client)

    resp = await client.post("/api/v1/auth/register-company", json=REGISTER_PAYLOAD)
    assert resp.status_code == 400
