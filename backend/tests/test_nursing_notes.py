from httpx import AsyncClient


async def _create_resident(client: AsyncClient, auth_headers: dict, full_name: str = "Residente Prueba") -> str:
    resp = await client.post("/api/v1/residents", json={"full_name": full_name}, headers=auth_headers)
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_create_and_list_notes(client: AsyncClient, auth_headers: dict):
    resident_id = await _create_resident(client, auth_headers)

    create_resp = await client.post(
        f"/api/v1/residents/{resident_id}/notes",
        json={"notes": "Paciente estable, sin novedades."},
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    note = create_resp.json()
    assert note["resident_id"] == resident_id
    assert note["resident_name"] == "Residente Prueba"
    assert note["notes"] == "Paciente estable, sin novedades."

    list_resp = await client.get(f"/api/v1/residents/{resident_id}/notes", headers=auth_headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == note["id"]

    get_resp = await client.get(
        f"/api/v1/residents/{resident_id}/notes/{note['id']}", headers=auth_headers
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["notes"] == "Paciente estable, sin novedades."


async def test_keyword_search_is_accent_and_case_insensitive(client: AsyncClient, auth_headers: dict):
    resident_id = await _create_resident(client, auth_headers)

    await client.post(
        f"/api/v1/residents/{resident_id}/notes",
        json={"notes": "Se detecta enrojecimiento en zona sacra, riesgo de ÚLCERAS."},
        headers=auth_headers,
    )
    await client.post(
        f"/api/v1/residents/{resident_id}/notes",
        json={"notes": "Buen apetito, sin novedades."},
        headers=auth_headers,
    )

    resp = await client.get(
        f"/api/v1/residents/{resident_id}/notes?keyword=úlceras", headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert "ÚLCERAS" in data["items"][0]["notes"]


async def test_notes_are_scoped_to_resident(client: AsyncClient, auth_headers: dict):
    resident_a = await _create_resident(client, auth_headers, "Residente A")
    resident_b = await _create_resident(client, auth_headers, "Residente B")

    await client.post(
        f"/api/v1/residents/{resident_a}/notes", json={"notes": "Nota A"}, headers=auth_headers
    )
    await client.post(
        f"/api/v1/residents/{resident_b}/notes", json={"notes": "Nota B"}, headers=auth_headers
    )

    resp = await client.get(f"/api/v1/residents/{resident_a}/notes", headers=auth_headers)
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["notes"] == "Nota A"
