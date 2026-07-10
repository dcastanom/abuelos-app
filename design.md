# Design Document — abuelos-app

## 1. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Internet                        │
└────────────────────────┬────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Next.js Frontend  │  (Vercel / Nginx)
              │   App Router + i18n │
              └──────────┬──────────┘
                         │ HTTPS / REST
              ┌──────────▼──────────┐
              │  FastAPI Backend    │  (Docker / Uvicorn)
              │  JWT Auth + RBAC    │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │     MongoDB         │  (Atlas or self-hosted)
              └─────────────────────┘
```

- Frontend and backend are separate deployable units communicating via REST.
- All backend responses are JSON; PDFs are served as binary streams from FastAPI endpoints.
- Email is sent from the backend via SMTP (configurable provider).
- Docker Compose bundles backend + MongoDB for local development and portable deployment.

---

## 2. Multi-tenancy

Every document in every MongoDB collection carries a `company_id` field. The backend enforces this at the service layer — every query is scoped to the authenticated user's company. There is no shared data between companies.

URL structure: `/{company_slug}/...` — the company slug is resolved at login and stored in the JWT payload alongside the user's role.

---

## 3. Authentication & Authorization

### Flow

1. **Company signup**: Admin fills name, legal ID (NIT/CC), email, password → backend stores company + admin user → sends confirmation email with a signed token link.
2. **Email confirmation**: Clicking the link activates the company account.
3. **Login**: POST `/auth/login` → returns a short-lived **access token** (15 min) + **refresh token** (7 days, stored in `httpOnly` cookie).
4. **Session inactivity**: Frontend tracks the last user interaction timestamp. After 3 minutes of inactivity it calls `/auth/logout` and redirects to login. The backend does not enforce the 3-minute rule itself; the access token's short lifespan limits exposure after logout.
5. **Token refresh**: Next.js middleware silently refreshes the access token on each navigation while the user is active.

### JWT Payload

```json
{
  "sub": "<user_id>",
  "company_id": "<company_id>",
  "company_slug": "<slug>",
  "role": "admin | doctor | nurse | receptionist",
  "exp": "<timestamp>"
}
```

### Role Permission Matrix

| Action | Admin | Doctor | Nurse | Receptionist |
|--------|-------|--------|-------|--------------|
| Manage users (company) | ✅ | ❌ | ❌ | ❌ |
| Create/update gerontological file | ✅ | ✅ | ❌ | ❌ |
| View gerontological file | ✅ | ✅ | ✅ | ✅ |
| Delete gerontological file | ✅ | ❌ | ❌ | ❌ |
| Create nursing note | ✅ | ✅ | ✅ | ❌ |
| View/search nursing notes | ✅ | ✅ | ✅ | ✅ |
| Create/update contract | ✅ | ❌ | ❌ | ✅ |
| Print contract PDF | ✅ | ❌ | ❌ | ✅ |

---

## 4. Database Design (MongoDB)

### Collection: `companies`
```
{
  _id: ObjectId,
  name: string,
  legal_id: string,          // NIT or CC (Colombia)
  slug: string,              // URL-safe unique identifier
  admin_email: string,
  is_active: bool,           // false until email confirmed
  confirmation_token: string,
  created_at: datetime
}
```

### Collection: `users`
```
{
  _id: ObjectId,
  company_id: ObjectId,
  email: string,
  password_hash: string,
  full_name: string,
  role: enum(admin, doctor, nurse, receptionist),
  is_active: bool,
  created_at: datetime,
  last_login: datetime
}
```

### Collection: `residents`

```
{
  _id: ObjectId,
  company_id: ObjectId,

  registration_id: integer,//let it be the same _id for now.
  registration_date: date,
  
    // Admission
  admission_reason: string,
  room_number: string,
  
  // Personal data
  full_name: string,
  id_type: string,           // CC, CE, Pasaporte
  id_number: string,
  birth_date: date,
  birth_country: string //Colombia by default
  birth_place: string, //Cities List filtered by countries in Colombia by default but can be extended
  photo: string, //the path of the image in the photo's repository
  gender: string, //male , female, no definition
  civil_status: string, //SOLTERO,CASADO,VIUDO,UNION LIBRE, 
  address: string,
  phone: string,
  education_level: string, //Primaria incompleta, Primaria completa,secundaria completa,Secundaria incompleta,universitarios incompletos,universidad completa
  religion: string, //Catolica, Protestante, Evangelica, no definition
  occupation: string,
  social_security_system: string // Contributivo, subsidiado, vinculado, Especiales,ningún,otro
  social_security_company: string,
  social_security_company_phone: string,
  has_funeral_service: string, //yes or no
  funeral_service_name: string, 
  funeral_service_phone: string, //
  guardians_names: [string], // can be several accompanied by their relationship and phone number

  //Family data
  children_number: integer,
  male_children_number: integer,
  female_children_number: integer,
  children_address: string,
  children_phone: string,
  is_good_family_environment: string, // Buenas, Acceptables, Mala, No se da
  family_environment_description: string ,
  
  //Can live in community?
  can_live_in_community: string, //yes or no
  why_can_live_in_community: string,
  has_participated_in_community_groups: string, //yes or no
  why_has_participated_in_community_groups: string, 
  
  //spare time
  spare_time_Activity: string, //it can be one or more of: RADIO,JUEGOS,T.V,MUSICA,MANUALIDADES,LECTURA,ESCRITURA,JARDINERIA,LAB. HOGAR,PINTURA,REUN. AMIGOS,PASEAR,SISTER ESPEC. If none on the list, they can choose OTRAS and specify which ones.
 
  //Economic aspect
  economic_aspect: string, //PENSIONADO,JUBILADO,RENTA PROPIA,AYUDA FAMILIAR,TOTALMENTE INDEPENDIENTE

  // Medical background (to be expanded from the source document)
  medical_background: {
    basic_measures: [string], //each is a decimal number: Presión sanguinea, Pulso, Peso, Altura
    diagnoses: [string], //each is a yes or no answer along with the numbers of years having it. HTP,DIABETES,EPOC,OSTEOPOROSIS,ARTRITIS. If none of the list, specify which one and the number of years.

    current_medications: [{ name, dose, frequency }], //specify whether it's by doctor prescription or auto medication,
	  pathologies: [string], // yes or no for each one of these: DIGESTIVA,NERVIOSA,CIRCULATORIA,VISUAL,AUDITIVA,URINARIA,MOTRIZ. If none on the list, they choose OTRA and specify which one
	  medicament_allergies: string, //yes or no and which ones
	  surgical_history: string, //yes or no and which ones
	  habits: [string], //yes or no for each of these: ALCOHOL,CAFEINA,TABAQUISMO,
SEDANTES. If none on the list, they choose OTRAS and specify which ones
	  phisical_activity: [string], //yes or no and which one
	  special_diet: [string], //yes or no and which one
	  medical_attention_6_months: [string], //yes or no and why
	  laboratory_tests: [string], //Can be one or more of these and their result: HEMOLUCROGRAMA,CITOQUIMOCO ORINA,GLICEMIA,RX-TORAX,H
	  gerontological_observations: string, // a textarea
	  gerontologist_name: string,
  },

  // Functional assessment
  functional_assessment: {
    mobility: string,
    feeding: string,
    hygiene: string,
    continence: string,
    cognitive_state: string
  },

  created_by: ObjectId,      // user who created the record
  updated_by: ObjectId,
  created_at: datetime,
  updated_at: datetime
}
```

### Collection: `nursing_notes`
Represents Evolución en Enfermería. Fields follow `docs/FORMATO EVOLUCION EN ENFERMERIA.docx`.

```
{
  _id: ObjectId,
  company_id: ObjectId,
  resident_id: ObjectId,

  date: datetime,
  shift: enum(morning, afternoon, night),
  notes: string,

  nurse_id: ObjectId,
  nurse_name: string,        // Denormalized for display/print
  created_at: datetime
}
```

> **Note:** Nursing notes are append-only — no updates or deletes to preserve clinical record integrity.

### Collection: `contracts`
Represents the service agreement. Fields follow `docs/PLANTILLA DE CONTRATO DE PRESTACION DE SERVICIOS.docx`.

```
{
  _id: ObjectId,
  company_id: ObjectId,
  resident_id: ObjectId,

  contract_number: string,
  start_date: date,
  monthly_fee: number,
  payment_day: number,

  // Legal representative / caregiver signing the contract
  representative_name: string,
  representative_id: string,
  representative_relationship: string,
  representative_phone: string,
  representative_address: string,

  // Terms accepted / special clauses (to be confirmed from source doc)
  special_conditions: string,

  signed_date: date,
  is_active: bool,

  created_by: ObjectId,
  updated_by: ObjectId,
  created_at: datetime,
  updated_at: datetime
}
```

### Indexes

- `residents`: `{ company_id, full_name }`, `{ company_id, id_number }` (unique per company)
- `nursing_notes`: `{ company_id, resident_id, date }`
- `contracts`: `{ company_id, resident_id }`, `{ company_id, contract_number }`
- `users`: `{ email }` (globally unique), `{ company_id }`

---

## 5. API Design

Base URL: `/api/v1`

### Auth
```
POST   /auth/register-company     # Company + admin signup
GET    /auth/confirm/:token        # Email confirmation
POST   /auth/login                 # Returns access + refresh tokens
POST   /auth/refresh               # Refresh access token
POST   /auth/logout
```

### Users (Admin only)
```
GET    /users                      # List company users
POST   /users                      # Invite/create user
PUT    /users/:id
DELETE /users/:id
```

### Residents (Gerontological Files)
```
GET    /residents                  # List + search
POST   /residents
GET    /residents/:id
PUT    /residents/:id
DELETE /residents/:id              # Admin only
```

### Nursing Notes
```
GET    /residents/:id/notes        # List + filter by date/shift
POST   /residents/:id/notes
GET    /residents/:id/notes/:note_id
```

### Contracts
```
GET    /residents/:id/contract
POST   /residents/:id/contract
PUT    /residents/:id/contract/:contract_id
GET    /residents/:id/contract/:contract_id/pdf   # Returns PDF binary
```

---

## 6. PDF Generation

Contracts are generated server-side using **WeasyPrint** (Python library). The backend:
1. Renders an HTML/Jinja2 template with the contract data.
2. WeasyPrint converts it to PDF.
3. FastAPI streams the PDF with `Content-Type: application/pdf`.

The HTML template lives in `backend/templates/contract.html` and mirrors the layout of the Word document.

---

## 7. Frontend Structure (Next.js App Router)

```
app/
  (public)/
    login/                    # Login page
    register/                 # Company registration
    confirm/[token]/          # Email confirmation landing
  [company]/
    (protected)/
      layout.tsx              # Auth guard + inactivity timer
      dashboard/
      residents/
        page.tsx              # List + search
        new/
        [id]/
          page.tsx            # View/edit gerontological file
          notes/              # Nursing notes
          contract/           # Contract view + PDF download
      users/                  # Admin only
      settings/
```

- `layout.tsx` in `(protected)` mounts an inactivity timer (3-minute idle → logout).
- Language switching is handled via `next-intl`; locale is stored in a cookie.
- Forms use `react-hook-form` + `zod` for validation.

---

## 8. Internationalization

- Default locale: `es` (Spanish)
- Secondary locale: `en` (English)
- Translation files: `messages/es.json`, `messages/en.json`
- Locale switch is a UI control available on every page; preference stored in a cookie.
- All document labels, field names, and error messages go through the i18n layer.
