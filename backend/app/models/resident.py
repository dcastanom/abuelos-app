import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base import Base


class Resident(Base):
    __tablename__ = "residents"
    __table_args__ = (
        Index("ix_residents_company_id_full_name", "company_id", "full_name"),
        Index(
            "ux_residents_company_id_id_number",
            "company_id",
            "id_number",
            unique=True,
            sqlite_where=text("id_number IS NOT NULL"),
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id"), nullable=False
    )

    registration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    admission_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    room_number: Mapped[str | None] = mapped_column(String, nullable=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    id_type: Mapped[str | None] = mapped_column(String, nullable=True)
    id_number: Mapped[str | None] = mapped_column(String, nullable=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    birth_country: Mapped[str] = mapped_column(String, nullable=False, default="Colombia")
    birth_place: Mapped[str | None] = mapped_column(String, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    gender: Mapped[str | None] = mapped_column(String, nullable=True)
    civil_status: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    education_level: Mapped[str | None] = mapped_column(String, nullable=True)
    religion: Mapped[str | None] = mapped_column(String, nullable=True)
    occupation: Mapped[str | None] = mapped_column(String, nullable=True)
    social_security_system: Mapped[str | None] = mapped_column(String, nullable=True)
    social_security_company: Mapped[str | None] = mapped_column(String, nullable=True)
    social_security_company_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    has_funeral_service: Mapped[str | None] = mapped_column(String, nullable=True)
    funeral_service_name: Mapped[str | None] = mapped_column(String, nullable=True)
    funeral_service_phone: Mapped[str | None] = mapped_column(String, nullable=True)

    guardians: Mapped[list] = mapped_column(
        MutableList.as_mutable(JSON), nullable=False, default=list
    )

    children_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    male_children_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    female_children_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    children_address: Mapped[str | None] = mapped_column(String, nullable=True)
    children_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    is_good_family_environment: Mapped[str | None] = mapped_column(String, nullable=True)
    family_environment_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    can_live_in_community: Mapped[str | None] = mapped_column(String, nullable=True)
    why_can_live_in_community: Mapped[str | None] = mapped_column(Text, nullable=True)
    has_participated_in_community_groups: Mapped[str | None] = mapped_column(String, nullable=True)
    why_has_participated_in_community_groups: Mapped[str | None] = mapped_column(Text, nullable=True)

    spare_time_activities: Mapped[list] = mapped_column(
        MutableList.as_mutable(JSON), nullable=False, default=list
    )
    spare_time_activities_other: Mapped[str | None] = mapped_column(String, nullable=True)
    economic_aspect: Mapped[str | None] = mapped_column(String, nullable=True)

    medical_background: Mapped[dict | None] = mapped_column(
        MutableDict.as_mutable(JSON), nullable=True
    )
    functional_assessment: Mapped[dict | None] = mapped_column(
        MutableDict.as_mutable(JSON), nullable=True
    )

    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
