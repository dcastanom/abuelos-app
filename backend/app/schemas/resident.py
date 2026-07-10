from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class Guardian(BaseModel):
    name: str
    relationship: str
    phone: str


class Diagnosis(BaseModel):
    condition: str
    has_it: bool = False
    years: Optional[int] = None
    notes: Optional[str] = None


class Medication(BaseModel):
    name: str
    dose: str
    frequency: str
    is_prescribed: bool = True


class BasicMeasures(BaseModel):
    blood_pressure: Optional[str] = None
    pulse: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None


class LaboratoryTest(BaseModel):
    test: str
    result: Optional[str] = None


class MedicalBackground(BaseModel):
    basic_measures: Optional[BasicMeasures] = None
    diagnoses: list[Diagnosis] = []
    current_medications: list[Medication] = []
    pathologies: list[str] = []
    pathologies_other: Optional[str] = None
    medicament_allergies: Optional[str] = None
    surgical_history: Optional[str] = None
    habits: list[str] = []
    habits_other: Optional[str] = None
    physical_activity: Optional[str] = None
    special_diet: Optional[str] = None
    medical_attention_6_months: Optional[str] = None
    laboratory_tests: list[LaboratoryTest] = []
    gerontological_observations: Optional[str] = None
    gerontologist_name: Optional[str] = None


class FunctionalAssessment(BaseModel):
    mobility: Optional[str] = None
    feeding: Optional[str] = None
    hygiene: Optional[str] = None
    continence: Optional[str] = None
    cognitive_state: Optional[str] = None


class ResidentCreate(BaseModel):
    registration_date: Optional[date] = None
    admission_reason: Optional[str] = None
    room_number: Optional[str] = None
    full_name: str
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    birth_date: Optional[date] = None
    birth_country: str = "Colombia"
    birth_place: Optional[str] = None
    gender: Optional[str] = None
    civil_status: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    education_level: Optional[str] = None
    religion: Optional[str] = None
    occupation: Optional[str] = None
    social_security_system: Optional[str] = None
    social_security_company: Optional[str] = None
    social_security_company_phone: Optional[str] = None
    has_funeral_service: Optional[str] = None
    funeral_service_name: Optional[str] = None
    funeral_service_phone: Optional[str] = None
    guardians: list[Guardian] = []
    children_number: Optional[int] = None
    male_children_number: Optional[int] = None
    female_children_number: Optional[int] = None
    children_address: Optional[str] = None
    children_phone: Optional[str] = None
    is_good_family_environment: Optional[str] = None
    family_environment_description: Optional[str] = None
    can_live_in_community: Optional[str] = None
    why_can_live_in_community: Optional[str] = None
    has_participated_in_community_groups: Optional[str] = None
    why_has_participated_in_community_groups: Optional[str] = None
    spare_time_activities: list[str] = []
    spare_time_activities_other: Optional[str] = None
    economic_aspect: Optional[str] = None
    medical_background: Optional[MedicalBackground] = None
    functional_assessment: Optional[FunctionalAssessment] = None


class ResidentUpdate(BaseModel):
    registration_date: Optional[date] = None
    admission_reason: Optional[str] = None
    room_number: Optional[str] = None
    full_name: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    birth_date: Optional[date] = None
    birth_country: Optional[str] = None
    birth_place: Optional[str] = None
    gender: Optional[str] = None
    civil_status: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    education_level: Optional[str] = None
    religion: Optional[str] = None
    occupation: Optional[str] = None
    social_security_system: Optional[str] = None
    social_security_company: Optional[str] = None
    social_security_company_phone: Optional[str] = None
    has_funeral_service: Optional[str] = None
    funeral_service_name: Optional[str] = None
    funeral_service_phone: Optional[str] = None
    guardians: Optional[list[Guardian]] = None
    children_number: Optional[int] = None
    male_children_number: Optional[int] = None
    female_children_number: Optional[int] = None
    children_address: Optional[str] = None
    children_phone: Optional[str] = None
    is_good_family_environment: Optional[str] = None
    family_environment_description: Optional[str] = None
    can_live_in_community: Optional[str] = None
    why_can_live_in_community: Optional[str] = None
    has_participated_in_community_groups: Optional[str] = None
    why_has_participated_in_community_groups: Optional[str] = None
    spare_time_activities: Optional[list[str]] = None
    spare_time_activities_other: Optional[str] = None
    economic_aspect: Optional[str] = None
    medical_background: Optional[MedicalBackground] = None
    functional_assessment: Optional[FunctionalAssessment] = None


class ResidentResponse(ResidentCreate):
    id: str
    registration_id: str
    photo_url: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ResidentListItem(BaseModel):
    id: str
    full_name: str
    photo_url: Optional[str] = None
    id_number: Optional[str] = None
    registration_date: Optional[date] = None
    room_number: Optional[str] = None


class ResidentListResponse(BaseModel):
    items: list[ResidentListItem]
    total: int
    page: int = 1
    page_size: int = 20
