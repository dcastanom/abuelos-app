"""
Seed script — drops all collections and inserts fresh demo data.

Run inside the running container:
  docker compose exec backend uv run python seed.py
"""

import asyncio
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.security import hash_password
from app.core.utils import slugify

NOW = datetime.now(timezone.utc)
_BOGOTA = ZoneInfo("America/Bogota")


def d(year: int, month: int, day: int) -> datetime:
    return datetime(year, month, day, tzinfo=timezone.utc)


def note_dt(year: int, month: int, day: int, hour: int) -> datetime:
    return datetime(year, month, day, hour, 0, 0, tzinfo=_BOGOTA)


def shift(hour: int) -> str:
    if 6 <= hour < 14:
        return "mañana"
    if 14 <= hour < 22:
        return "tarde"
    return "noche"


async def seed() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]

    # ── Wipe ──────────────────────────────────────────────────────────────────
    for col in ("companies", "users", "residents", "nursing_notes"):
        await db[col].drop()
    print("Collections dropped.")

    # ── Company ───────────────────────────────────────────────────────────────
    company_name = "Centro Gerontológico San José"
    company_slug = slugify(company_name)
    company_id = ObjectId()

    await db["companies"].insert_one({
        "_id": company_id,
        "name": company_name,
        "legal_id": "900123456-7",
        "slug": company_slug,
        "admin_email": "admin@sanjose.com",
        "is_active": True,
        "confirmation_token": None,
        "created_at": NOW,
    })
    print(f"Company  : {company_name}  (slug: {company_slug})")

    # ── Users ─────────────────────────────────────────────────────────────────
    admin_id = ObjectId()
    nurse_id = ObjectId()
    doctor_id = ObjectId()

    await db["users"].insert_many([
        {
            "_id": admin_id,
            "company_id": company_id,
            "email": "admin@sanjose.com",
            "password_hash": hash_password("Admin123!"),
            "full_name": "Administrador Principal",
            "role": "admin",
            "is_active": True,
            "created_at": NOW,
            "last_login": None,
        },
        {
            "_id": nurse_id,
            "company_id": company_id,
            "email": "enfermera@sanjose.com",
            "password_hash": hash_password("Nurse123!"),
            "full_name": "Carmen Lucía Pérez",
            "role": "nurse",
            "is_active": True,
            "created_at": NOW,
            "last_login": None,
        },
        {
            "_id": doctor_id,
            "company_id": company_id,
            "email": "doctor@sanjose.com",
            "password_hash": hash_password("Doctor123!"),
            "full_name": "Dr. Jorge Enrique Sánchez",
            "role": "doctor",
            "is_active": True,
            "created_at": NOW,
            "last_login": None,
        },
    ])
    print("Users    : admin, nurse, doctor")

    # ── Residents ─────────────────────────────────────────────────────────────
    r1_id = ObjectId()
    r2_id = ObjectId()
    r3_id = ObjectId()

    residents = [
        {
            "_id": r1_id,
            "company_id": company_id,
            "registration_date": d(2024, 3, 15),
            "admission_reason": "Dependencia funcional por enfermedad de Parkinson avanzada",
            "room_number": "101",
            "full_name": "María Rosa Gómez López",
            "id_type": "CC",
            "id_number": "35.612.984",
            "birth_date": d(1942, 7, 8),
            "birth_country": "Colombia",
            "birth_place": "Medellín",
            "gender": "Femenino",
            "civil_status": "Viudo/a",
            "address": "Calle 45 # 22-10, Medellín",
            "phone": "3042215678",
            "education_level": "Primaria completa",
            "religion": "Católica",
            "occupation": "Ama de casa",
            "social_security_system": "Subsidiado",
            "social_security_company": "Sura EPS",
            "social_security_company_phone": "01800112020",
            "has_funeral_service": "no",
            "funeral_service_name": None,
            "funeral_service_phone": None,
            "guardians": [
                {"name": "Luis Gómez Ríos", "relationship": "Hijo/a", "phone": "3116789012"},
                {"name": "Ana Beatriz Gómez", "relationship": "Hijo/a", "phone": "3009871234"},
            ],
            "children_number": 3,
            "male_children_number": 1,
            "female_children_number": 2,
            "children_address": "Calle 50 # 30-15, Medellín",
            "children_phone": "3116789012",
            "is_good_family_environment": "Buenas",
            "family_environment_description": "Familia unida, visitan semanalmente",
            "can_live_in_community": "no",
            "why_can_live_in_community": None,
            "has_participated_in_community_groups": "si",
            "why_has_participated_in_community_groups": "Grupo de tejido parroquial",
            "spare_time_activities": ["MÚSICA", "T.V", "MANUALIDADES"],
            "spare_time_activities_other": None,
            "economic_aspect": "PENSIONADO",
            "medical_background": {
                "basic_measures": {"blood_pressure": "130/80", "pulse": "72 bpm", "weight": "58 kg", "height": "1.55 m"},
                "diagnoses": [
                    {"condition": "HTA", "has_it": True, "years": 15, "notes": "Controlada con medicación"},
                    {"condition": "DIABETES", "has_it": False, "years": None, "notes": None},
                    {"condition": "EPOC", "has_it": False, "years": None, "notes": None},
                    {"condition": "OSTEOPOROSIS", "has_it": True, "years": 8, "notes": "Tratamiento con calcio"},
                    {"condition": "ARTRITIS", "has_it": True, "years": 10, "notes": "Artritis reumatoide"},
                    {"condition": "PARKINSON", "has_it": True, "years": 5, "notes": "Estadío avanzado, temblor constante"},
                ],
                "current_medications": [
                    {"name": "Levodopa/Carbidopa", "dose": "250/25 mg", "frequency": "Cada 6 horas", "is_prescribed": True},
                    {"name": "Losartán", "dose": "50 mg", "frequency": "Una vez al día", "is_prescribed": True},
                    {"name": "Calcio + Vitamina D", "dose": "600 mg", "frequency": "Una vez al día", "is_prescribed": True},
                ],
                "pathologies": ["NERVIOSA", "CIRCULATORIA", "MOTRIZ"],
                "pathologies_other": None,
                "medicament_allergies": "Penicilina",
                "surgical_history": "Colecistectomía 1998",
                "habits": [],
                "habits_other": None,
                "physical_activity": "No",
                "special_diet": "Dieta blanda",
                "medical_attention_6_months": "Sí — Neurología y cardiología",
                "laboratory_tests": [
                    {"test": "HEMOLUCOGRAMA", "result": "Normal"},
                    {"test": "GLICEMIA", "result": "95 mg/dL"},
                ],
                "gerontological_observations": "Paciente con alto nivel de dependencia funcional. Requiere asistencia total para ABVD.",
                "gerontologist_name": "Dra. Patricia Morales",
            },
            "functional_assessment": {
                "mobility": "Dependiente",
                "feeding": "Con ayuda parcial",
                "hygiene": "Dependiente",
                "continence": "Con ayuda parcial",
                "cognitive_state": "Con ayuda parcial",
            },
            "photo_url": None,
            "created_by": admin_id,
            "created_at": NOW,
            "updated_by": None,
            "updated_at": None,
        },
        {
            "_id": r2_id,
            "company_id": company_id,
            "registration_date": d(2023, 11, 1),
            "admission_reason": "Demencia senil con tendencia a la deambulación nocturna",
            "room_number": "205",
            "full_name": "Carlos Alberto Rodríguez Vargas",
            "id_type": "CC",
            "id_number": "12.345.678",
            "birth_date": d(1938, 12, 3),
            "birth_country": "Colombia",
            "birth_place": "Bogotá",
            "gender": "Masculino",
            "civil_status": "Viudo/a",
            "address": "Carrera 13 # 67-45, Bogotá",
            "phone": "3201234567",
            "education_level": "Secundaria completa",
            "religion": "Protestante",
            "occupation": "Ingeniero civil jubilado",
            "social_security_system": "Contributivo",
            "social_security_company": "Nueva EPS",
            "social_security_company_phone": "018000941234",
            "has_funeral_service": "si",
            "funeral_service_name": "Funerales Los Olivos",
            "funeral_service_phone": "6012345678",
            "guardians": [
                {"name": "Sofía Rodríguez Castro", "relationship": "Hijo/a", "phone": "3154567890"},
            ],
            "children_number": 2,
            "male_children_number": 0,
            "female_children_number": 2,
            "children_address": "Cra 7 # 45-23, Bogotá",
            "children_phone": "3154567890",
            "is_good_family_environment": "Aceptables",
            "family_environment_description": "Hijas viven en el exterior, visitan dos veces al año",
            "can_live_in_community": "no",
            "why_can_live_in_community": None,
            "has_participated_in_community_groups": "si",
            "why_has_participated_in_community_groups": "Club de ajedrez y asociación de ingenieros",
            "spare_time_activities": ["RADIO", "LECTURA", "PASEAR"],
            "spare_time_activities_other": None,
            "economic_aspect": "JUBILADO",
            "medical_background": {
                "basic_measures": {"blood_pressure": "145/90", "pulse": "68 bpm", "weight": "72 kg", "height": "1.70 m"},
                "diagnoses": [
                    {"condition": "HTA", "has_it": True, "years": 20, "notes": "Hipertensión de difícil control"},
                    {"condition": "DIABETES", "has_it": True, "years": 12, "notes": "Tipo 2, insulinodependiente"},
                    {"condition": "EPOC", "has_it": False, "years": None, "notes": None},
                    {"condition": "OSTEOPOROSIS", "has_it": False, "years": None, "notes": None},
                    {"condition": "ARTRITIS", "has_it": False, "years": None, "notes": None},
                    {"condition": "DEMENCIA SENIL", "has_it": True, "years": 3, "notes": "Estadío moderado"},
                ],
                "current_medications": [
                    {"name": "Insulina Glargina", "dose": "20 UI", "frequency": "Una vez al día nocturna", "is_prescribed": True},
                    {"name": "Metformina", "dose": "850 mg", "frequency": "Dos veces al día", "is_prescribed": True},
                    {"name": "Amlodipino", "dose": "10 mg", "frequency": "Una vez al día", "is_prescribed": True},
                    {"name": "Donepezilo", "dose": "10 mg", "frequency": "Una vez al día nocturna", "is_prescribed": True},
                ],
                "pathologies": ["CIRCULATORIA", "NERVIOSA"],
                "pathologies_other": None,
                "medicament_allergies": "No",
                "surgical_history": "Bypass coronario 2010",
                "habits": ["CAFEÍNA"],
                "habits_other": None,
                "physical_activity": "No",
                "special_diet": "Dieta diabética hipocalórica",
                "medical_attention_6_months": "Sí — Endocrinología y neurología",
                "laboratory_tests": [
                    {"test": "HEMOLUCOGRAMA", "result": "Anemia leve"},
                    {"test": "GLICEMIA", "result": "142 mg/dL"},
                    {"test": "HIV", "result": "Negativo"},
                ],
                "gerontological_observations": "Paciente requiere supervisión constante por deambulación nocturna. Usar protectores de cadera.",
                "gerontologist_name": "Dr. Hernando Ríos",
            },
            "functional_assessment": {
                "mobility": "Con ayuda parcial",
                "feeding": "Independiente",
                "hygiene": "Con ayuda parcial",
                "continence": "Con ayuda parcial",
                "cognitive_state": "Dependiente",
            },
            "photo_url": None,
            "created_by": admin_id,
            "created_at": NOW,
            "updated_by": None,
            "updated_at": None,
        },
        {
            "_id": r3_id,
            "company_id": company_id,
            "registration_date": d(2025, 1, 20),
            "admission_reason": "Fractura de cadera post-quirúrgica, requiere rehabilitación y cuidados especializados",
            "room_number": "103",
            "full_name": "Ana Lucía Martínez de Ríos",
            "id_type": "CC",
            "id_number": "41.789.023",
            "birth_date": d(1947, 4, 22),
            "birth_country": "Colombia",
            "birth_place": "Cali",
            "gender": "Femenino",
            "civil_status": "Casado/a",
            "address": "Av. 6N # 23-45, Cali",
            "phone": "3168904321",
            "education_level": "Universidad completa",
            "religion": "Católica",
            "occupation": "Profesora universitaria jubilada",
            "social_security_system": "Contributivo",
            "social_security_company": "Sanitas EPS",
            "social_security_company_phone": "018000976543",
            "has_funeral_service": "no",
            "funeral_service_name": None,
            "funeral_service_phone": None,
            "guardians": [
                {"name": "Roberto Carlos Ríos", "relationship": "Conyugue", "phone": "3207654321"},
                {"name": "Marcela Ríos Martínez", "relationship": "Hijo/a", "phone": "3112345678"},
            ],
            "children_number": 2,
            "male_children_number": 1,
            "female_children_number": 1,
            "children_address": "Av. 9N # 14-20, Cali",
            "children_phone": "3112345678",
            "is_good_family_environment": "Buenas",
            "family_environment_description": "Esposo visita todos los días, hijos fines de semana",
            "can_live_in_community": "si",
            "why_can_live_in_community": "Proceso de recuperación temporal",
            "has_participated_in_community_groups": "si",
            "why_has_participated_in_community_groups": "Club de lectura y grupo de yoga para adulto mayor",
            "spare_time_activities": ["LECTURA", "ESCRITURA", "MÚSICA", "REUN. AMIGOS"],
            "spare_time_activities_other": None,
            "economic_aspect": "PENSIONADO",
            "medical_background": {
                "basic_measures": {"blood_pressure": "120/75", "pulse": "74 bpm", "weight": "62 kg", "height": "1.60 m"},
                "diagnoses": [
                    {"condition": "HTA", "has_it": False, "years": None, "notes": None},
                    {"condition": "DIABETES", "has_it": False, "years": None, "notes": None},
                    {"condition": "EPOC", "has_it": False, "years": None, "notes": None},
                    {"condition": "OSTEOPOROSIS", "has_it": True, "years": 5, "notes": "Causa de la fractura de cadera"},
                    {"condition": "ARTRITIS", "has_it": True, "years": 7, "notes": "Artrosis de rodillas bilateral"},
                ],
                "current_medications": [
                    {"name": "Ácido Zoledrónico", "dose": "5 mg IV", "frequency": "Anual", "is_prescribed": True},
                    {"name": "Calcio + Vitamina D", "dose": "1200 mg", "frequency": "Una vez al día", "is_prescribed": True},
                    {"name": "Tramadol", "dose": "50 mg", "frequency": "Cada 8 horas (dolor)", "is_prescribed": True},
                ],
                "pathologies": ["MOTRIZ", "URINARIA"],
                "pathologies_other": None,
                "medicament_allergies": "No",
                "surgical_history": "Artroplastia total de cadera derecha — enero 2025",
                "habits": [],
                "habits_other": None,
                "physical_activity": "Sí — Fisioterapia diaria supervisada",
                "special_diet": "No",
                "medical_attention_6_months": "Sí — Traumatología y fisioterapia",
                "laboratory_tests": [
                    {"test": "HEMOLUCOGRAMA", "result": "Normal"},
                    {"test": "CITOQUÍMICO ORINA", "result": "Normal"},
                ],
                "gerontological_observations": "Paciente en buen estado cognitivo. Alta motivación para la recuperación. Pronóstico favorable.",
                "gerontologist_name": "Dra. Patricia Morales",
            },
            "functional_assessment": {
                "mobility": "Con ayuda parcial",
                "feeding": "Independiente",
                "hygiene": "Con ayuda parcial",
                "continence": "Independiente",
                "cognitive_state": "Independiente",
            },
            "photo_url": None,
            "created_by": admin_id,
            "created_at": NOW,
            "updated_by": None,
            "updated_at": None,
        },
    ]

    await db["residents"].insert_many(residents)
    names = [r["full_name"] for r in residents]
    print(f"Residents: {', '.join(names)}")

    # ── Nursing Notes ─────────────────────────────────────────────────────────
    notes = [
        # María Rosa Gómez
        {
            "resident_id": r1_id, "company_id": company_id,
            "date": note_dt(2025, 6, 18, 8), "shift": shift(8),
            "notes": "Paciente se levantó con rigidez marcada en extremidades superiores. Se administró levodopa a las 7:00 a.m. Tolera bien el desayuno con ayuda. Se realizó cambio de posición cada 2 horas para prevenir úlceras. Sin episodios de caída.",
            "nurse_id": str(nurse_id), "nurse_name": "Carmen Lucía Pérez",
            "created_at": note_dt(2025, 6, 18, 8),
        },
        {
            "resident_id": r1_id, "company_id": company_id,
            "date": note_dt(2025, 6, 18, 15), "shift": shift(15),
            "notes": "Tarde tranquila. Participó en sesión de musicoterapia con respuesta emocional positiva. Tensión arterial 128/78 mmHg. Ingesta de líquidos adecuada. Se notifica a familia el buen estado general.",
            "nurse_id": str(nurse_id), "nurse_name": "Carmen Lucía Pérez",
            "created_at": note_dt(2025, 6, 18, 15),
        },
        {
            "resident_id": r1_id, "company_id": company_id,
            "date": note_dt(2025, 6, 19, 9), "shift": shift(9),
            "notes": "Noche sin novedades. Paciente durmió 6 horas continuas. Higiene completa realizada. Temblor moderado en mano derecha. Se ajusta postura en silla de ruedas. Apetito conservado.",
            "nurse_id": str(nurse_id), "nurse_name": "Carmen Lucía Pérez",
            "created_at": note_dt(2025, 6, 19, 9),
        },
        # Carlos Alberto Rodríguez
        {
            "resident_id": r2_id, "company_id": company_id,
            "date": note_dt(2025, 6, 17, 22), "shift": shift(22),
            "notes": "Episodio de deambulación nocturna a las 11:30 pm. Paciente estaba confundido, buscaba 'ir a trabajar'. Se reorientó con calma, se acompañó a la habitación y se administró dosis nocturna de donepezilo. Glicemia nocturna: 138 mg/dL. Se administra insulina según esquema.",
            "nurse_id": str(nurse_id), "nurse_name": "Carmen Lucía Pérez",
            "created_at": note_dt(2025, 6, 17, 22),
        },
        {
            "resident_id": r2_id, "company_id": company_id,
            "date": note_dt(2025, 6, 18, 7), "shift": shift(7),
            "notes": "Paciente descansó tras episodio nocturno. Glicemia en ayunas: 142 mg/dL. Tensión arterial 148/92 mmHg — se notifica a médico tratante. Desayuno completo. Reconoce a enfermera pero no recuerda el año actual. Estado de ánimo estable.",
            "nurse_id": str(nurse_id), "nurse_name": "Carmen Lucía Pérez",
            "created_at": note_dt(2025, 6, 18, 7),
        },
        {
            "resident_id": r2_id, "company_id": company_id,
            "date": note_dt(2025, 6, 19, 14), "shift": shift(14),
            "notes": "Visita de hija Sofía Rodríguez. Paciente muy animado durante la visita. Realizó caminata corta en jardín con supervisión. Glicemia postprandial: 165 mg/dL. Sin caídas. Se informa a hija sobre ajuste de medicación prescrito por médico.",
            "nurse_id": str(nurse_id), "nurse_name": "Carmen Lucía Pérez",
            "created_at": note_dt(2025, 6, 19, 14),
        },
        # Ana Lucía Martínez
        {
            "resident_id": r3_id, "company_id": company_id,
            "date": note_dt(2025, 6, 18, 9), "shift": shift(9),
            "notes": "Sesión de fisioterapia completada satisfactoriamente. Paciente logró dar 15 pasos con andador sin apoyo lateral. Dolor EVA 3/10 post-ejercicio. Se administra tramadol según prescripción. Muy buena actitud y motivación. Visita de esposo en tarde.",
            "nurse_id": str(nurse_id), "nurse_name": "Carmen Lucía Pérez",
            "created_at": note_dt(2025, 6, 18, 9),
        },
        {
            "resident_id": r3_id, "company_id": company_id,
            "date": note_dt(2025, 6, 19, 10), "shift": shift(10),
            "notes": "Paciente independiente en alimentación e higiene personal en cama. Herida quirúrgica en excelente estado, sin signos de infección. Tensión arterial 118/72 mmHg. Realizó ejercicios de movilidad activa de miembro inferior derecho según indicación de fisioterapeuta.",
            "nurse_id": str(nurse_id), "nurse_name": "Carmen Lucía Pérez",
            "created_at": note_dt(2025, 6, 19, 10),
        },
    ]

    await db["nursing_notes"].insert_many(notes)
    print(f"Notes    : {len(notes)} nursing notes across {len(residents)} residents")

    client.close()

    print("\nSeed complete.")
    print(f"  URL          : http://localhost:3000/{company_slug}")
    print(f"  Admin        : admin@sanjose.com  /  Admin123!")
    print(f"  Enfermera    : enfermera@sanjose.com  /  Nurse123!")
    print(f"  Doctor       : doctor@sanjose.com  /  Doctor123!")


if __name__ == "__main__":
    asyncio.run(seed())
