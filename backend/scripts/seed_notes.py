"""
Seed script — creates dummy residents and nursing notes for Phase 3 testing.

Usage (from backend/ directory):
    uv run python scripts/seed_notes.py

If no active company exists it will create one (slug: "demo").
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.db.session import close_db, connect_db, get_session_factory  # noqa: E402
from app.models.company import Company  # noqa: E402
from app.models.nursing_note import NursingNote  # noqa: E402
from app.models.resident import Resident  # noqa: E402
from app.models.user import User  # noqa: E402

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
    await connect_db()
    session_factory = get_session_factory()

    async with session_factory() as db:
        # --- Company ---
        company = (
            await db.execute(select(Company).where(Company.is_active.is_(True)))
        ).scalars().first()
        if not company:
            company = Company(
                name="Centro Geriátrico Demo",
                legal_id="900000001-1",
                slug="demo",
                admin_email="admin@demo.com",
                is_active=True,
                confirmation_token=None,
                created_at=datetime.now(BOGOTA),
            )
            db.add(company)
            await db.flush()
            print(f"  Empresa creada: {company.name} (slug: {company.slug})")
        else:
            print(f"  Empresa existente: {company.name} (slug: {company.slug})")

        company_id = company.id

        # --- Nurse user ---
        nurse = (
            await db.execute(
                select(User).where(User.company_id == company_id, User.role == "nurse")
            )
        ).scalars().first()
        if not nurse:
            nurse = User(
                company_id=company_id,
                email="enfermera@demo.com",
                password_hash="$2b$12$placeholder",
                full_name="María Enfermera Pérez",
                role="nurse",
                is_active=True,
                created_at=datetime.now(BOGOTA),
                last_login=None,
            )
            db.add(nurse)
            await db.flush()
            print(f"  Enfermera creada: {nurse.full_name}")
        else:
            print(f"  Enfermera existente: {nurse.full_name}")

        nurse_id_str = nurse.id
        nurse_name: str = nurse.full_name

        # --- Residents ---
        resident_ids: list[str] = []
        for name in RESIDENT_NAMES:
            existing = (
                await db.execute(
                    select(Resident).where(
                        Resident.company_id == company_id, Resident.full_name == name
                    )
                )
            ).scalars().first()
            if existing:
                resident_ids.append(existing.id)
                print(f"  Residente existente: {name}")
            else:
                resident = Resident(
                    company_id=company_id,
                    full_name=name,
                    photo_url=None,
                    created_at=datetime.now(BOGOTA),
                )
                db.add(resident)
                await db.flush()
                resident_ids.append(resident.id)
                print(f"  Residente creado: {name}")

        # --- Nursing notes ---
        notes_created = 0
        base = datetime.now(BOGOTA)
        for i in range(30):
            dt = base - timedelta(days=i, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            resident_id = random.choice(resident_ids)
            note_text = random.choice(NOTE_TEMPLATES)

            existing = (
                await db.execute(
                    select(NursingNote).where(
                        NursingNote.resident_id == resident_id, NursingNote.date == dt
                    )
                )
            ).scalars().first()
            if existing:
                continue

            db.add(
                NursingNote(
                    resident_id=resident_id,
                    company_id=company_id,
                    date=dt,
                    shift=shift_for(dt),
                    notes=note_text,
                    nurse_id=nurse_id_str,
                    nurse_name=nurse_name,
                    created_at=dt,
                )
            )
            notes_created += 1

        await db.commit()
        print(f"  {notes_created} evoluciones de enfermería creadas.")

    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
