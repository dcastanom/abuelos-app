"""
Seed script — creates dummy residents and nursing notes for Phase 3 testing.

Usage (from backend/ directory):
    uv run python scripts/seed_notes.py

If no active company exists it will create one (slug: "demo").
"""

import asyncio
import os
import random
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGODB_DB", "abuelos")
BOGOTA = ZoneInfo("America/Bogota")

RESIDENT_NAMES = [
    "Juan García López",
    "María Rodríguez Pérez",
    "Carlos Martínez Silva",
    "Ana Gómez Torres",
    "Roberto Sánchez Ruiz",
    "Carmen López Díaz",
]

NOTE_TEMPLATES = [
    "Paciente estable, sin cambios relevantes. Constantes vitales dentro de parámetros normales.",
    "Se observa leve fiebre (37.8°C). Se administra acetaminofén según indicación médica. Paciente refiere malestar general.",
    "Paciente agitado durante la noche, se le proporcionó acompañamiento y se notificó al médico de turno.",
    "Caída leve al levantarse de la cama. Sin lesiones aparentes. Se refuerza educación sobre uso del llamador.",
    "Buen apetito en el desayuno y almuerzo. Hidratación adecuada. Estado de ánimo positivo.",
    "Dolor en rodilla derecha reportado. Se aplica crioterapia y se eleva extremidad. Médico evaluó y ordenó radiografía.",
    "Control de glucometría: 145 mg/dL preprandial. Se ajusta dieta según indicación.",
    "Paciente recibió visita familiar. Estado emocional mejorado tras la visita.",
    "Se detecta enrojecimiento en zona sacra. Se inicia protocolo de prevención de úlceras por presión.",
    "Dificultad para conciliar el sueño. Paciente refiere pensamientos repetitivos. Se notifica a psicología.",
    "Paciente colaborador durante la higiene matutina. Sin quejas de dolor.",
    "Presión arterial elevada: 150/95 mmHg. Se informa al médico. Se administra medicamento antihipertensivo.",
    "Deposición normal. Ingesta de líquidos adecuada. Paciente sin molestias gastrointestinales.",
    "Fisioterapia realizada sin incidentes. Paciente tolera bien los ejercicios de movilización.",
    "Paciente dormía profundamente en ronda nocturna. Sin novedades.",
]


def shift_for(dt: datetime) -> str:
    hour = dt.astimezone(BOGOTA).hour
    if 6 <= hour < 14:
        return "mañana"
    if 14 <= hour < 22:
        return "tarde"
    return "noche"


async def main() -> None:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[MONGO_DB]

    # --- Company ---
    company = await db["companies"].find_one({"is_active": True})
    if not company:
        company_id = ObjectId()
        now = datetime.now(BOGOTA)
        await db["companies"].insert_one(
            {
                "_id": company_id,
                "name": "Centro Geriátrico Demo",
                "legal_id": "900000001-1",
                "slug": "demo",
                "admin_email": "admin@demo.com",
                "is_active": True,
                "confirmation_token": None,
                "created_at": now,
            }
        )
        company = await db["companies"].find_one({"_id": company_id})
        print(f"  Empresa creada: {company['name']} (slug: {company['slug']})")
    else:
        print(f"  Empresa existente: {company['name']} (slug: {company['slug']})")

    company_id: ObjectId = company["_id"]

    # --- Nurse user ---
    nurse = await db["users"].find_one({"company_id": company_id, "role": "nurse"})
    if not nurse:
        nurse_id = ObjectId()
        await db["users"].insert_one(
            {
                "_id": nurse_id,
                "company_id": company_id,
                "email": "enfermera@demo.com",
                "password_hash": "$2b$12$placeholder",
                "full_name": "María Enfermera Pérez",
                "role": "nurse",
                "is_active": True,
                "created_at": datetime.now(BOGOTA),
                "last_login": None,
            }
        )
        nurse = await db["users"].find_one({"_id": nurse_id})
        print(f"  Enfermera creada: {nurse['full_name']}")
    else:
        print(f"  Enfermera existente: {nurse['full_name']}")

    nurse_id_str = str(nurse["_id"])
    nurse_name: str = nurse["full_name"]

    # --- Residents ---
    resident_ids: list[ObjectId] = []
    for name in RESIDENT_NAMES:
        existing = await db["residents"].find_one(
            {"company_id": company_id, "full_name": name}
        )
        if existing:
            resident_ids.append(existing["_id"])
            print(f"  Residente existente: {name}")
        else:
            rid = ObjectId()
            await db["residents"].insert_one(
                {
                    "_id": rid,
                    "company_id": company_id,
                    "full_name": name,
                    "photo_url": None,
                    "created_at": datetime.now(BOGOTA),
                }
            )
            resident_ids.append(rid)
            print(f"  Residente creado: {name}")

    # --- Nursing notes ---
    notes_created = 0
    base = datetime.now(BOGOTA)
    for i in range(30):
        dt = base - timedelta(days=i, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        resident_id = random.choice(resident_ids)
        note_text = random.choice(NOTE_TEMPLATES)

        existing = await db["nursing_notes"].find_one(
            {"resident_id": resident_id, "date": dt}
        )
        if existing:
            continue

        await db["nursing_notes"].insert_one(
            {
                "_id": ObjectId(),
                "resident_id": resident_id,
                "company_id": company_id,
                "date": dt,
                "shift": shift_for(dt),
                "notes": note_text,
                "nurse_id": nurse_id_str,
                "nurse_name": nurse_name,
                "created_at": dt,
            }
        )
        notes_created += 1

    print(f"  {notes_created} evoluciones de enfermería creadas.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
