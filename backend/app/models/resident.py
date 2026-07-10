from typing import Optional
from typing import TypedDict


class Guardian(TypedDict, total=False):
    name: str
    relationship: str
    phone: str


class Diagnosis(TypedDict, total=False):
    condition: str
    has_it: bool
    years: Optional[int]
    notes: Optional[str]


class Medication(TypedDict, total=False):
    name: str
    dose: str
    frequency: str
    is_prescribed: bool


class BasicMeasures(TypedDict, total=False):
    blood_pressure: Optional[str]
    pulse: Optional[str]
    weight: Optional[str]
    height: Optional[str]


class LaboratoryTest(TypedDict, total=False):
    test: str
    result: Optional[str]


class MedicalBackground(TypedDict, total=False):
    basic_measures: Optional[BasicMeasures]
    diagnoses: list
    current_medications: list
    pathologies: list
    pathologies_other: Optional[str]
    medicament_allergies: Optional[str]
    surgical_history: Optional[str]
    habits: list
    habits_other: Optional[str]
    physical_activity: Optional[str]
    special_diet: Optional[str]
    medical_attention_6_months: Optional[str]
    laboratory_tests: list
    gerontological_observations: Optional[str]
    gerontologist_name: Optional[str]


class FunctionalAssessment(TypedDict, total=False):
    mobility: Optional[str]
    feeding: Optional[str]
    hygiene: Optional[str]
    continence: Optional[str]
    cognitive_state: Optional[str]


class Resident(TypedDict, total=False):
    company_id: object  # ObjectId
    registration_date: object  # date
    admission_reason: Optional[str]
    room_number: Optional[str]
    full_name: str
    id_type: Optional[str]
    id_number: Optional[str]
    birth_date: object  # date
    birth_country: str
    birth_place: Optional[str]
    photo_url: Optional[str]
    gender: Optional[str]
    civil_status: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    education_level: Optional[str]
    religion: Optional[str]
    occupation: Optional[str]
    social_security_system: Optional[str]
    social_security_company: Optional[str]
    social_security_company_phone: Optional[str]
    has_funeral_service: Optional[str]
    funeral_service_name: Optional[str]
    funeral_service_phone: Optional[str]
    guardians: list  # list[Guardian]
    children_number: Optional[int]
    male_children_number: Optional[int]
    female_children_number: Optional[int]
    children_address: Optional[str]
    children_phone: Optional[str]
    is_good_family_environment: Optional[str]
    family_environment_description: Optional[str]
    can_live_in_community: Optional[str]
    why_can_live_in_community: Optional[str]
    has_participated_in_community_groups: Optional[str]
    why_has_participated_in_community_groups: Optional[str]
    spare_time_activities: list
    spare_time_activities_other: Optional[str]
    economic_aspect: Optional[str]
    medical_background: Optional[MedicalBackground]
    functional_assessment: Optional[FunctionalAssessment]
    created_by: object  # ObjectId
    updated_by: object  # ObjectId
    created_at: object  # datetime
    updated_at: object  # datetime
