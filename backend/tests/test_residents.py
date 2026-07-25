from httpx import AsyncClient


async def test_create_and_get_resident(client: AsyncClient, auth_headers: dict):
    payload = {
        "full_name": "María Rosa Gómez López",
        "id_number": "35.612.984",
        "guardians": [{"name": "Luis Gómez", "relationship": "Hijo/a", "phone": "3116789012"}],
        "medical_background": {"diagnoses": [{"condition": "HTA", "has_it": True}]},
        "functional_assessment": {"mobility": "Dependiente"},
    }
    create_resp = await client.post("/api/v1/residents", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201
    resident = create_resp.json()
    assert resident["full_name"] == payload["full_name"]
    assert resident["registration_id"] == resident["id"]
    assert resident["guardians"] == payload["guardians"]
    assert resident["medical_background"]["diagnoses"][0]["condition"] == "HTA"

    get_resp = await client.get(f"/api/v1/residents/{resident['id']}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["full_name"] == payload["full_name"]


async def test_update_and_delete_resident(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post(
        "/api/v1/residents", json={"full_name": "Carlos Pérez"}, headers=auth_headers
    )
    resident_id = create_resp.json()["id"]

    update_resp = await client.put(
        f"/api/v1/residents/{resident_id}", json={"room_number": "202"}, headers=auth_headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["room_number"] == "202"
    assert update_resp.json()["updated_by"] is not None

    delete_resp = await client.delete(f"/api/v1/residents/{resident_id}", headers=auth_headers)
    assert delete_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/residents/{resident_id}", headers=auth_headers)
    assert get_resp.status_code == 404


async def test_search_is_accent_and_case_insensitive(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/residents", json={"full_name": "María Gómez"}, headers=auth_headers)
    await client.post("/api/v1/residents", json={"full_name": "Ana Gómez"}, headers=auth_headers)
    await client.post("/api/v1/residents", json={"full_name": "Pedro Ruiz"}, headers=auth_headers)

    resp = await client.get("/api/v1/residents?search=GÓMEZ", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    names = {item["full_name"] for item in data["items"]}
    assert names == {"María Gómez", "Ana Gómez"}


async def test_duplicate_id_number_conflicts_but_null_ids_dont(
    client: AsyncClient, auth_headers: dict
):
    first = await client.post(
        "/api/v1/residents", json={"full_name": "Persona Uno", "id_number": "111"}, headers=auth_headers
    )
    assert first.status_code == 201

    # Mirrors the previous Mongo behavior: a duplicate id_number under the
    # same company violates the partial unique index and is never caught by
    # the route, so it surfaces as a 500 rather than a handled 4xx.
    duplicate = await client.post(
        "/api/v1/residents", json={"full_name": "Persona Dos", "id_number": "111"}, headers=auth_headers
    )
    assert duplicate.status_code == 500

    no_id_1 = await client.post(
        "/api/v1/residents", json={"full_name": "Sin Cedula Uno"}, headers=auth_headers
    )
    no_id_2 = await client.post(
        "/api/v1/residents", json={"full_name": "Sin Cedula Dos"}, headers=auth_headers
    )
    assert no_id_1.status_code == 201
    assert no_id_2.status_code == 201
