from pydantic import BaseModel, EmailStr, field_validator


class RegisterCompanyRequest(BaseModel):
    company_name: str
    legal_id: str
    admin_name: str
    admin_email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v

    @field_validator("company_name", "legal_id", "admin_name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Este campo es requerido")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    company_slug: str
    role: str
    user_id: str
    email: str
    full_name: str
