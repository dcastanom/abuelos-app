from typing import TypedDict


class NursingNote(TypedDict, total=False):
    resident_id: object  # ObjectId
    company_id: object  # ObjectId
    date: object        # datetime (America/Bogota)
    shift: str          # "mañana" | "tarde" | "noche"
    notes: str
    nurse_id: str
    nurse_name: str
    created_at: object  # datetime
