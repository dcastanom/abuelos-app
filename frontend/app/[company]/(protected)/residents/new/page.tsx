"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { COLOMBIA_CITIES } from "@/lib/colombia-cities";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Guardian {
  name: string;
  relationship: string;
  phone: string;
}

interface Diagnosis {
  condition: string;
  has_it: boolean;
  years: string;
  notes: string;
}

interface Medication {
  name: string;
  dose: string;
  frequency: string;
  is_prescribed: boolean;
}

interface LaboratoryTest {
  test: string;
  checked: boolean;
  result: string;
}

interface FormData {
  // Step 1
  registration_date: string;
  admission_reason: string;
  room_number: string;
  // Step 2
  full_name: string;
  id_type: string;
  id_number: string;
  birth_date: string;
  birth_country: string;
  birth_place: string;
  gender: string;
  civil_status: string;
  address: string;
  phone: string;
  education_level: string;
  religion: string;
  occupation: string;
  social_security_system: string;
  social_security_company: string;
  social_security_company_phone: string;
  has_funeral_service: string;
  funeral_service_name: string;
  funeral_service_phone: string;
  guardians: Guardian[];
  // Step 3
  children_number: string;
  male_children_number: string;
  female_children_number: string;
  children_address: string;
  children_phone: string;
  is_good_family_environment: string;
  family_environment_description: string;
  // Step 4
  can_live_in_community: string;
  why_can_live_in_community: string;
  has_participated_in_community_groups: string;
  why_has_participated_in_community_groups: string;
  spare_time_activities: string[];
  spare_time_activities_other: string;
  economic_aspect: string;
  // Step 5
  blood_pressure: string;
  pulse: string;
  weight: string;
  height: string;
  diagnoses: Diagnosis[];
  medications: Medication[];
  pathologies: string[];
  pathologies_other: string;
  medicament_allergies: string;
  medicament_allergies_detail: string;
  surgical_history: string;
  surgical_history_detail: string;
  habits: string[];
  habits_other: string;
  physical_activity: string;
  physical_activity_detail: string;
  special_diet: string;
  special_diet_detail: string;
  medical_attention_6_months: string;
  medical_attention_6_months_detail: string;
  laboratory_tests: LaboratoryTest[];
  gerontological_observations: string;
  gerontologist_name: string;
  // Step 6
  mobility: string;
  feeding: string;
  hygiene: string;
  continence: string;
  cognitive_state: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAGNOSIS_CONDITIONS = ["HTA", "DIABETES", "EPOC", "OSTEOPOROSIS", "ARTRITIS"];
const PATHOLOGY_OPTIONS = ["DIGESTIVA", "NERVIOSA", "CIRCULATORIA", "VISUAL", "AUDITIVA", "URINARIA", "MOTRIZ"];
const HABIT_OPTIONS = ["ALCOHOL", "CAFEÍNA", "TABAQUISMO", "SEDANTES"];
const SPARE_TIME_OPTIONS = ["RADIO", "JUEGOS", "T.V", "MÚSICA", "MANUALIDADES", "LECTURA", "ESCRITURA", "JARDINERÍA", "LAB. HOGAR", "PINTURA", "REUN. AMIGOS", "PASEAR", "SISTER ESPEC."];
const LAB_TEST_OPTIONS = ["HEMOLUCOGRAMA", "CITOQUÍMICO ORINA", "GLICEMIA", "RX-TÓRAX", "HIV"];

const FUNCTIONAL_OPTIONS = ["Independiente", "Con ayuda parcial", "Dependiente", "No evaluado"];

const STEP_TITLES = [
  "Registro e Ingreso",
  "Datos Personales",
  "Datos Familiares",
  "Vida Comunitaria y Tiempo Libre",
  "Antecedentes Médicos",
  "Valoración Funcional",
];

// ─── Default form data ────────────────────────────────────────────────────────

function defaultFormData(): FormData {
  return {
    registration_date: "", admission_reason: "", room_number: "",
    full_name: "", id_type: "CC", id_number: "", birth_date: "", birth_country: "Colombia",
    birth_place: "", gender: "", civil_status: "", address: "", phone: "",
    education_level: "", religion: "", occupation: "", social_security_system: "",
    social_security_company: "", social_security_company_phone: "",
    has_funeral_service: "", funeral_service_name: "", funeral_service_phone: "",
    guardians: [],
    children_number: "", male_children_number: "", female_children_number: "",
    children_address: "", children_phone: "", is_good_family_environment: "",
    family_environment_description: "",
    can_live_in_community: "", why_can_live_in_community: "",
    has_participated_in_community_groups: "", why_has_participated_in_community_groups: "",
    spare_time_activities: [], spare_time_activities_other: "", economic_aspect: "",
    blood_pressure: "", pulse: "", weight: "", height: "",
    diagnoses: DIAGNOSIS_CONDITIONS.map((c) => ({ condition: c, has_it: false, years: "", notes: "" })),
    medications: [],
    pathologies: [], pathologies_other: "",
    medicament_allergies: "", medicament_allergies_detail: "",
    surgical_history: "", surgical_history_detail: "",
    habits: [], habits_other: "",
    physical_activity: "", physical_activity_detail: "",
    special_diet: "", special_diet_detail: "",
    medical_attention_6_months: "", medical_attention_6_months_detail: "",
    laboratory_tests: LAB_TEST_OPTIONS.map((t) => ({ test: t, checked: false, result: "" })),
    gerontological_observations: "", gerontologist_name: "",
    mobility: "", feeding: "", hygiene: "", continence: "", cognitive_state: "",
  };
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1">{children}</label>;
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 placeholder:text-slate-400 ${className}`}
      {...props}
    />
  );
}

function Select({ children, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 resize-none placeholder:text-slate-400 ${className}`}
      {...props}
    />
  );
}

function RadioGroup({
  name, value, options, onChange,
}: {
  name: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-teal-600"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">{children}</h3>;
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  const cls = cols === 3 ? "grid grid-cols-1 sm:grid-cols-3 gap-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4";
  return <div className={cls}>{children}</div>;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                active
                  ? "bg-primary-600 text-white"
                  : done
                  ? "bg-primary-100 text-primary-700"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step}
            </div>
            {step < total && (
              <div className={`w-6 h-0.5 ${done ? "bg-primary-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-xs text-slate-500 font-medium">{STEP_TITLES[current - 1]}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewResidentPage() {
  const { company } = useParams<{ company: string }>();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultFormData());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormData, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  // ── Validation per step ──────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 2 && !form.full_name.trim()) {
      errs.full_name = "El nombre es obligatorio";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  // ── Photo handling ───────────────────────────────────────────────────────

  const handlePhotoSelect = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setErrors((e) => ({ ...e, photo: "La imagen no puede superar 2 MB" }));
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((e) => { const n = { ...e }; delete n.photo; return n; });
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    setServerError("");
    try {
      const payload = buildPayload(form);
      const { data } = await api.post<{ id: string }>("/api/v1/residents", payload);
      const residentId = data.id;

      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        await api.post(`/api/v1/residents/${residentId}/photo`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      router.push(`/${company}/residents/${residentId}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Error al guardar la ficha";
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render steps ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/${company}/residents`)}
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Fichas
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-semibold text-slate-900">Nueva ficha gerontológica</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <StepIndicator current={step} total={6} />

        {step === 1 && <Step1 form={form} set={set} />}
        {step === 2 && (
          <Step2
            form={form}
            set={set}
            errors={errors}
            photoPreview={photoPreview}
            fileInputRef={fileInputRef}
            onPhotoSelect={handlePhotoSelect}
            onRemovePhoto={() => { setPhotoFile(null); setPhotoPreview(null); }}
          />
        )}
        {step === 3 && <Step3 form={form} set={set} />}
        {step === 4 && <Step4 form={form} set={set} />}
        {step === 5 && <Step5 form={form} set={set} />}
        {step === 6 && <Step6 form={form} set={set} />}

        {serverError && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{serverError}</p>
        )}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
          <button
            onClick={back}
            disabled={step === 1}
            className="px-4 py-2 text-sm text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-30 transition-colors"
          >
            Anterior
          </button>
          {step < 6 ? (
            <button
              onClick={next}
              className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={saving}
              className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando…" : "Guardar ficha"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Build API payload ────────────────────────────────────────────────────────

function buildPayload(form: FormData) {
  return {
    registration_date: form.registration_date || null,
    admission_reason: form.admission_reason || null,
    room_number: form.room_number || null,
    full_name: form.full_name,
    id_type: form.id_type || null,
    id_number: form.id_number || null,
    birth_date: form.birth_date || null,
    birth_country: form.birth_country || "Colombia",
    birth_place: form.birth_place || null,
    gender: form.gender || null,
    civil_status: form.civil_status || null,
    address: form.address || null,
    phone: form.phone || null,
    education_level: form.education_level || null,
    religion: form.religion || null,
    occupation: form.occupation || null,
    social_security_system: form.social_security_system || null,
    social_security_company: form.social_security_company || null,
    social_security_company_phone: form.social_security_company_phone || null,
    has_funeral_service: form.has_funeral_service || null,
    funeral_service_name: form.funeral_service_name || null,
    funeral_service_phone: form.funeral_service_phone || null,
    guardians: form.guardians,
    children_number: form.children_number ? parseInt(form.children_number) : null,
    male_children_number: form.male_children_number ? parseInt(form.male_children_number) : null,
    female_children_number: form.female_children_number ? parseInt(form.female_children_number) : null,
    children_address: form.children_address || null,
    children_phone: form.children_phone || null,
    is_good_family_environment: form.is_good_family_environment || null,
    family_environment_description: form.family_environment_description || null,
    can_live_in_community: form.can_live_in_community || null,
    why_can_live_in_community: form.why_can_live_in_community || null,
    has_participated_in_community_groups: form.has_participated_in_community_groups || null,
    why_has_participated_in_community_groups: form.why_has_participated_in_community_groups || null,
    spare_time_activities: form.spare_time_activities,
    spare_time_activities_other: form.spare_time_activities_other || null,
    economic_aspect: form.economic_aspect || null,
    medical_background: {
      basic_measures: {
        blood_pressure: form.blood_pressure || null,
        pulse: form.pulse || null,
        weight: form.weight || null,
        height: form.height || null,
      },
      diagnoses: form.diagnoses.map((d) => ({
        condition: d.condition,
        has_it: d.has_it,
        years: d.years ? parseInt(d.years) : null,
        notes: d.notes || null,
      })),
      current_medications: form.medications.map((m) => ({
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        is_prescribed: m.is_prescribed,
      })),
      pathologies: form.pathologies,
      pathologies_other: form.pathologies_other || null,
      medicament_allergies: form.medicament_allergies === "si"
        ? form.medicament_allergies_detail || "Sí"
        : form.medicament_allergies === "no" ? "No" : null,
      surgical_history: form.surgical_history === "si"
        ? form.surgical_history_detail || "Sí"
        : form.surgical_history === "no" ? "No" : null,
      habits: form.habits,
      habits_other: form.habits_other || null,
      physical_activity: form.physical_activity === "si"
        ? form.physical_activity_detail || "Sí"
        : form.physical_activity === "no" ? "No" : null,
      special_diet: form.special_diet === "si"
        ? form.special_diet_detail || "Sí"
        : form.special_diet === "no" ? "No" : null,
      medical_attention_6_months: form.medical_attention_6_months === "si"
        ? form.medical_attention_6_months_detail || "Sí"
        : form.medical_attention_6_months === "no" ? "No" : null,
      laboratory_tests: form.laboratory_tests
        .filter((t) => t.checked)
        .map((t) => ({ test: t.test, result: t.result || null })),
      gerontological_observations: form.gerontological_observations || null,
      gerontologist_name: form.gerontologist_name || null,
    },
    functional_assessment: {
      mobility: form.mobility || null,
      feeding: form.feeding || null,
      hygiene: form.hygiene || null,
      continence: form.continence || null,
      cognitive_state: form.cognitive_state || null,
    },
  };
}

// ─── Step 1: Registro e Ingreso ───────────────────────────────────────────────

function Step1({ form, set }: { form: FormData; set: (f: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <SectionTitle>Registro e Ingreso</SectionTitle>
      <FieldRow cols={2}>
        <div>
          <Label>Fecha de ingreso</Label>
          <Input type="date" value={form.registration_date} onChange={(e) => set("registration_date", e.target.value)} />
        </div>
        <div>
          <Label>Número de habitación</Label>
          <Input placeholder="Ej. 101" value={form.room_number} onChange={(e) => set("room_number", e.target.value)} />
        </div>
      </FieldRow>
      <div>
        <Label>Motivo de ingreso</Label>
        <Textarea placeholder="Describa el motivo de ingreso…" value={form.admission_reason} onChange={(e) => set("admission_reason", e.target.value)} />
      </div>
    </div>
  );
}

// ─── Step 2: Datos Personales ─────────────────────────────────────────────────

function Step2({
  form, set, errors, photoPreview, fileInputRef, onPhotoSelect, onRemovePhoto,
}: {
  form: FormData;
  set: (f: keyof FormData, v: unknown) => void;
  errors: Record<string, string>;
  photoPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoSelect: (f: File) => void;
  onRemovePhoto: () => void;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle>Datos Personales</SectionTitle>

      {/* Photo */}
      <div>
        <Label>Foto del residente</Label>
        <div className="flex items-start gap-4">
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
              <button
                onClick={onRemovePhoto}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
            >
              <Upload size={20} />
              <span className="text-[11px]">Subir foto</span>
            </button>
          )}
          <div className="text-xs text-slate-400 mt-1">
            <p>Formatos: JPEG, PNG, WebP</p>
            <p>Máximo 2 MB</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhotoSelect(f); }}
        />
        {errors.photo && <p className="mt-1 text-xs text-red-600">{errors.photo}</p>}
      </div>

      <div>
        <Label>Nombre completo *</Label>
        <Input
          placeholder="Nombres y apellidos"
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          className={errors.full_name ? "border-red-500" : ""}
        />
        {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
      </div>

      <FieldRow cols={2}>
        <div>
          <Label>Tipo de identificación</Label>
          <Select value={form.id_type} onChange={(e) => set("id_type", e.target.value)}>
            <option value="">Seleccionar…</option>
            <option value="CC">Cédula de Ciudadanía (CC)</option>
            <option value="CE">Cédula de Extranjería (CE)</option>
            <option value="Pasaporte">Pasaporte</option>
          </Select>
        </div>
        <div>
          <Label>Número de identificación</Label>
          <Input placeholder="Número" value={form.id_number} onChange={(e) => set("id_number", e.target.value)} />
        </div>
      </FieldRow>

      <FieldRow cols={2}>
        <div>
          <Label>Fecha de nacimiento</Label>
          <Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
        </div>
        <div>
          <Label>País de nacimiento</Label>
          <Input value={form.birth_country} onChange={(e) => set("birth_country", e.target.value)} />
        </div>
      </FieldRow>

      <div>
        <Label>Ciudad de nacimiento</Label>
        <Select value={form.birth_place} onChange={(e) => set("birth_place", e.target.value)}>
          <option value="">Seleccionar ciudad…</option>
          {COLOMBIA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      <div>
        <Label>Género</Label>
        <RadioGroup
          name="gender"
          value={form.gender}
          options={[
            { label: "Masculino", value: "Masculino" },
            { label: "Femenino", value: "Femenino" },
            { label: "Sin definición", value: "Sin definición" },
          ]}
          onChange={(v) => set("gender", v)}
        />
      </div>

      <FieldRow cols={2}>
        <div>
          <Label>Estado civil</Label>
          <Select value={form.civil_status} onChange={(e) => set("civil_status", e.target.value)}>
            <option value="">Seleccionar…</option>
            {["Soltero/a", "Casado/a", "Viudo/a", "Unión Libre"].map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <Label>Religión</Label>
          <Select value={form.religion} onChange={(e) => set("religion", e.target.value)}>
            <option value="">Seleccionar…</option>
            {["Católica", "Protestante", "Evangélica", "Sin definición"].map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
      </FieldRow>

      <FieldRow cols={2}>
        <div>
          <Label>Dirección</Label>
          <Input placeholder="Dirección de residencia" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input placeholder="Número de contacto" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </FieldRow>

      <FieldRow cols={2}>
        <div>
          <Label>Nivel educativo</Label>
          <Select value={form.education_level} onChange={(e) => set("education_level", e.target.value)}>
            <option value="">Seleccionar…</option>
            {["Primaria incompleta", "Primaria completa", "Secundaria incompleta", "Secundaria completa", "Universidad incompleta", "Universidad completa"].map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <Label>Ocupación</Label>
          <Input placeholder="Ocupación u oficio" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
        </div>
      </FieldRow>

      <FieldRow cols={2}>
        <div>
          <Label>Sistema de seguridad social</Label>
          <Select value={form.social_security_system} onChange={(e) => set("social_security_system", e.target.value)}>
            <option value="">Seleccionar…</option>
            {["Contributivo", "Subsidiado", "Vinculado", "Especiales", "Ninguno", "Otro"].map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <Label>Entidad de seguridad social</Label>
          <Input placeholder="Nombre de la entidad" value={form.social_security_company} onChange={(e) => set("social_security_company", e.target.value)} />
        </div>
      </FieldRow>

      <div>
        <Label>Teléfono de la entidad</Label>
        <Input className="max-w-xs" placeholder="Teléfono" value={form.social_security_company_phone} onChange={(e) => set("social_security_company_phone", e.target.value)} />
      </div>

      <div>
        <Label>¿Cuenta con servicio funerario?</Label>
        <RadioGroup
          name="funeral"
          value={form.has_funeral_service}
          options={[{ label: "Sí", value: "si" }, { label: "No", value: "no" }]}
          onChange={(v) => set("has_funeral_service", v)}
        />
      </div>
      {form.has_funeral_service === "si" && (
        <FieldRow cols={2}>
          <div>
            <Label>Nombre del servicio funerario</Label>
            <Input value={form.funeral_service_name} onChange={(e) => set("funeral_service_name", e.target.value)} />
          </div>
          <div>
            <Label>Teléfono del servicio funerario</Label>
            <Input value={form.funeral_service_phone} onChange={(e) => set("funeral_service_phone", e.target.value)} />
          </div>
        </FieldRow>
      )}

      {/* Guardians */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Acudientes / Responsables</Label>
          <button
            type="button"
            onClick={() => set("guardians", [...form.guardians, { name: "", relationship: "", phone: "" }])}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
        {form.guardians.length === 0 && (
          <p className="text-xs text-slate-400">Ningún acudiente registrado.</p>
        )}
        <div className="space-y-3">
          {form.guardians.map((g, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-start">
              <Input
                placeholder="Nombre"
                value={g.name}
                onChange={(e) => {
                  const gs = [...form.guardians];
                  gs[i] = { ...gs[i], name: e.target.value };
                  set("guardians", gs);
                }}
              />
              <Select
                value={g.relationship}
                onChange={(e) => {
                  const gs = [...form.guardians];
                  gs[i] = { ...gs[i], relationship: e.target.value };
                  set("guardians", gs);
                }}
              >
                <option value="">Parentesco…</option>
                {["Hijo/a", "Padre/Madre", "Hermano/a", "Primo/a", "Conyugue", "Amigo/a", "Cuñado/a", "Suegro/a"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
              <div className="flex gap-1">
                <Input
                  placeholder="Teléfono"
                  value={g.phone}
                  onChange={(e) => {
                    const gs = [...form.guardians];
                    gs[i] = { ...gs[i], phone: e.target.value };
                    set("guardians", gs);
                  }}
                />
                <button
                  type="button"
                  onClick={() => set("guardians", form.guardians.filter((_, j) => j !== i))}
                  className="p-2 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Datos Familiares ─────────────────────────────────────────────────

function Step3({ form, set }: { form: FormData; set: (f: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle>Datos Familiares</SectionTitle>
      <FieldRow cols={3}>
        <div>
          <Label>Número de hijos</Label>
          <Input type="number" min="0" value={form.children_number} onChange={(e) => set("children_number", e.target.value)} />
        </div>
        <div>
          <Label>Hijos varones</Label>
          <Input type="number" min="0" value={form.male_children_number} onChange={(e) => set("male_children_number", e.target.value)} />
        </div>
        <div>
          <Label>Hijas mujeres</Label>
          <Input type="number" min="0" value={form.female_children_number} onChange={(e) => set("female_children_number", e.target.value)} />
        </div>
      </FieldRow>
      <FieldRow cols={2}>
        <div>
          <Label>Dirección de los hijos</Label>
          <Input value={form.children_address} onChange={(e) => set("children_address", e.target.value)} />
        </div>
        <div>
          <Label>Teléfono de los hijos</Label>
          <Input value={form.children_phone} onChange={(e) => set("children_phone", e.target.value)} />
        </div>
      </FieldRow>
      <div>
        <Label>Relaciones en el Ambiente familiar</Label>
        <RadioGroup
          name="family_env"
          value={form.is_good_family_environment}
          options={[
            { label: "Buenas", value: "Buenas" },
            { label: "Aceptables", value: "Aceptables" },
            { label: "Mala", value: "Mala" },
            { label: "No se da", value: "No se da" },
          ]}
          onChange={(v) => set("is_good_family_environment", v)}
        />
      </div>
      <div>
        <Label>Descripción del ambiente familiar</Label>
        <Textarea value={form.family_environment_description} onChange={(e) => set("family_environment_description", e.target.value)} />
      </div>
    </div>
  );
}

// ─── Step 4: Vida Comunitaria y Tiempo Libre ──────────────────────────────────

function Step4({ form, set }: { form: FormData; set: (f: keyof FormData, v: unknown) => void }) {
  const toggleActivity = (act: string) => {
    const curr = form.spare_time_activities;
    set("spare_time_activities", curr.includes(act) ? curr.filter((a) => a !== act) : [...curr, act]);
  };

  return (
    <div className="space-y-5">
      <SectionTitle>Vida Comunitaria y Tiempo Libre</SectionTitle>

      <div>
        <Label>¿Puede vivir en comunidad?</Label>
        <RadioGroup
          name="community"
          value={form.can_live_in_community}
          options={[{ label: "Sí", value: "si" }, { label: "No", value: "no" }]}
          onChange={(v) => set("can_live_in_community", v)}
        />
      </div>
      {form.can_live_in_community === "si" && (
        <div>
          <Label>¿Por qué?</Label>
          <Input value={form.why_can_live_in_community} onChange={(e) => set("why_can_live_in_community", e.target.value)} />
        </div>
      )}

      <div>
        <Label>¿Ha participado en grupos comunitarios?</Label>
        <RadioGroup
          name="community_groups"
          value={form.has_participated_in_community_groups}
          options={[{ label: "Sí", value: "si" }, { label: "No", value: "no" }]}
          onChange={(v) => set("has_participated_in_community_groups", v)}
        />
      </div>
      {form.has_participated_in_community_groups === "si" && (
        <div>
          <Label>¿Por qué / cuáles?</Label>
          <Input value={form.why_has_participated_in_community_groups} onChange={(e) => set("why_has_participated_in_community_groups", e.target.value)} />
        </div>
      )}

      <div>
        <Label>Actividades en tiempo libre</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {SPARE_TIME_OPTIONS.map((act) => (
            <label key={act} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.spare_time_activities.includes(act)}
                onChange={() => toggleActivity(act)}
                className="accent-teal-600"
              />
              {act}
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.spare_time_activities.includes("OTRAS")}
              onChange={() => toggleActivity("OTRAS")}
              className="accent-teal-600"
            />
            OTRAS
          </label>
        </div>
        {form.spare_time_activities.includes("OTRAS") && (
          <div className="mt-2">
            <Input placeholder="Especifique cuáles…" value={form.spare_time_activities_other} onChange={(e) => set("spare_time_activities_other", e.target.value)} />
          </div>
        )}
      </div>

      <div>
        <Label>Aspecto económico</Label>
        <div className="flex flex-wrap gap-4 mt-1">
          {["PENSIONADO", "JUBILADO", "RENTA PROPIA", "AYUDA FAMILIAR", "TOTALMENTE INDEPENDIENTE"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input
                type="radio"
                name="economic"
                value={opt}
                checked={form.economic_aspect === opt}
                onChange={() => set("economic_aspect", opt)}
                className="accent-teal-600"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Antecedentes Médicos ─────────────────────────────────────────────

function Step5({ form, set }: { form: FormData; set: (f: keyof FormData, v: unknown) => void }) {
  const togglePathology = (p: string) => {
    const curr = form.pathologies;
    set("pathologies", curr.includes(p) ? curr.filter((x) => x !== p) : [...curr, p]);
  };

  const toggleHabit = (h: string) => {
    const curr = form.habits;
    set("habits", curr.includes(h) ? curr.filter((x) => x !== h) : [...curr, h]);
  };

  const updateDiagnosis = (i: number, field: keyof Diagnosis, value: unknown) => {
    const ds = [...form.diagnoses];
    ds[i] = { ...ds[i], [field]: value };
    set("diagnoses", ds);
  };

  const updateMed = (i: number, field: keyof Medication, value: unknown) => {
    const ms = [...form.medications];
    ms[i] = { ...ms[i], [field]: value };
    set("medications", ms);
  };

  const updateLabTest = (i: number, field: keyof LaboratoryTest, value: unknown) => {
    const ts = [...form.laboratory_tests];
    ts[i] = { ...ts[i], [field]: value };
    set("laboratory_tests", ts);
  };

  return (
    <div className="space-y-6">
      <SectionTitle>Antecedentes Médicos</SectionTitle>

      {/* Basic measures */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Medidas básicas</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Presión sanguínea", field: "blood_pressure" as const, placeholder: "120/80 mmHg" },
            { label: "Pulso", field: "pulse" as const, placeholder: "72 bpm" },
            { label: "Peso", field: "weight" as const, placeholder: "65 kg" },
            { label: "Talla", field: "height" as const, placeholder: "1.65 m" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <Label>{label}</Label>
              <Input placeholder={placeholder} value={form[field]} onChange={(e) => set(field, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Diagnoses */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Diagnósticos</p>
        <div className="space-y-2">
          {form.diagnoses.map((d, i) => (
            <div key={d.condition} className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <label className="flex items-center gap-2 min-w-[140px] cursor-pointer text-sm text-slate-700 font-medium">
                <input type="checkbox" checked={d.has_it} onChange={(e) => updateDiagnosis(i, "has_it", e.target.checked)} className="accent-teal-600" />
                {d.condition}
              </label>
              {d.has_it && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">Años:</span>
                    <Input className="w-20" type="number" min="0" value={d.years} onChange={(e) => updateDiagnosis(i, "years", e.target.value)} />
                  </div>
                  <Input className="flex-1 min-w-[120px]" placeholder="Observaciones" value={d.notes} onChange={(e) => updateDiagnosis(i, "notes", e.target.value)} />
                </>
              )}
            </div>
          ))}
          {/* Other diagnosis */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <label className="flex items-center gap-2 min-w-[140px] cursor-pointer text-sm text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={form.diagnoses.some((d) => d.condition === "Otra")}
                onChange={(e) => {
                  if (e.target.checked) {
                    set("diagnoses", [...form.diagnoses, { condition: "Otra", has_it: true, years: "", notes: "" }]);
                  } else {
                    set("diagnoses", form.diagnoses.filter((d) => d.condition !== "Otra"));
                  }
                }}
                className="accent-teal-600"
              />
              Otra
            </label>
            {form.diagnoses.some((d) => d.condition === "Otra") && (
              <Input
                className="flex-1"
                placeholder="Especifique el diagnóstico y años"
                value={form.diagnoses.find((d) => d.condition === "Otra")?.notes ?? ""}
                onChange={(e) => {
                  const idx = form.diagnoses.findIndex((d) => d.condition === "Otra");
                  updateDiagnosis(idx, "notes", e.target.value);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Medicamentos actuales</p>
          <button
            type="button"
            onClick={() => set("medications", [...form.medications, { name: "", dose: "", frequency: "", is_prescribed: true }])}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
        {form.medications.length === 0 && <p className="text-xs text-slate-400">Ningún medicamento registrado.</p>}
        <div className="space-y-3">
          {form.medications.map((m, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-start p-3 bg-slate-50 rounded-lg">
              <Input placeholder="Medicamento" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
              <Input placeholder="Dosis" value={m.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} />
              <Input placeholder="Frecuencia" value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} />
              <div className="flex items-center gap-2">
                <Select value={m.is_prescribed ? "recetado" : "automedicado"} onChange={(e) => updateMed(i, "is_prescribed", e.target.value === "recetado")}>
                  <option value="recetado">Recetado</option>
                  <option value="automedicado">Automedicado</option>
                </Select>
                <button type="button" onClick={() => set("medications", form.medications.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pathologies */}
      <div>
        <Label>Patologías</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {PATHOLOGY_OPTIONS.map((p) => (
            <label key={p} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.pathologies.includes(p)} onChange={() => togglePathology(p)} className="accent-teal-600" />
              {p}
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.pathologies.includes("OTRA")} onChange={() => togglePathology("OTRA")} className="accent-teal-600" />
            OTRA
          </label>
        </div>
        {form.pathologies.includes("OTRA") && (
          <Input className="mt-2 max-w-sm" placeholder="Especifique…" value={form.pathologies_other} onChange={(e) => set("pathologies_other", e.target.value)} />
        )}
      </div>

      {/* Yes/No fields */}
      {([
        { label: "Alergias a medicamentos", field: "medicament_allergies" as const, detailField: "medicament_allergies_detail" as const, placeholder: "¿Cuáles?" },
        { label: "Antecedentes quirúrgicos", field: "surgical_history" as const, detailField: "surgical_history_detail" as const, placeholder: "¿Cuáles?" },
        { label: "Actividad física", field: "physical_activity" as const, detailField: "physical_activity_detail" as const, placeholder: "¿Cuál?" },
        { label: "Dieta especial", field: "special_diet" as const, detailField: "special_diet_detail" as const, placeholder: "¿Cuál?" },
        { label: "Atención médica últimos 6 meses", field: "medical_attention_6_months" as const, detailField: "medical_attention_6_months_detail" as const, placeholder: "¿Por qué?" },
      ] as const).map(({ label, field, detailField, placeholder }) => (
        <div key={field}>
          <Label>{label}</Label>
          <RadioGroup
            name={field}
            value={form[field]}
            options={[{ label: "Sí", value: "si" }, { label: "No", value: "no" }]}
            onChange={(v) => set(field, v)}
          />
          {form[field] === "si" && (
            <Input className="mt-2" placeholder={placeholder} value={form[detailField]} onChange={(e) => set(detailField, e.target.value)} />
          )}
        </div>
      ))}

      {/* Habits */}
      <div>
        <Label>Hábitos</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {HABIT_OPTIONS.map((h) => (
            <label key={h} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.habits.includes(h)} onChange={() => toggleHabit(h)} className="accent-teal-600" />
              {h}
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.habits.includes("OTRAS")} onChange={() => toggleHabit("OTRAS")} className="accent-teal-600" />
            OTRAS
          </label>
        </div>
        {form.habits.includes("OTRAS") && (
          <Input className="mt-2 max-w-sm" placeholder="Especifique…" value={form.habits_other} onChange={(e) => set("habits_other", e.target.value)} />
        )}
      </div>

      {/* Lab tests */}
      <div>
        <Label>Exámenes de laboratorio</Label>
        <div className="space-y-2 mt-1">
          {form.laboratory_tests.map((t, i) => (
            <div key={t.test} className="flex items-center gap-3">
              <label className="flex items-center gap-2 min-w-[200px] cursor-pointer text-sm text-slate-700">
                <input type="checkbox" checked={t.checked} onChange={(e) => updateLabTest(i, "checked", e.target.checked)} className="accent-teal-600" />
                {t.test}
              </label>
              {t.checked && (
                <Input className="flex-1 max-w-xs" placeholder="Resultado" value={t.result} onChange={(e) => updateLabTest(i, "result", e.target.value)} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Observaciones gerontológicas</Label>
        <Textarea rows={4} value={form.gerontological_observations} onChange={(e) => set("gerontological_observations", e.target.value)} />
      </div>
      <div>
        <Label>Nombre del gerontólogo/a</Label>
        <Input className="max-w-sm" value={form.gerontologist_name} onChange={(e) => set("gerontologist_name", e.target.value)} />
      </div>
    </div>
  );
}

// ─── Step 6: Valoración Funcional ─────────────────────────────────────────────

function Step6({ form, set }: { form: FormData; set: (f: keyof FormData, v: unknown) => void }) {
  const fields: { label: string; field: keyof FormData }[] = [
    { label: "Movilidad", field: "mobility" },
    { label: "Alimentación", field: "feeding" },
    { label: "Higiene", field: "hygiene" },
    { label: "Continencia", field: "continence" },
    { label: "Estado cognitivo", field: "cognitive_state" },
  ];
  return (
    <div className="space-y-5">
      <SectionTitle>Valoración Funcional</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ label, field }) => (
          <div key={field}>
            <Label>{label}</Label>
            <Select value={form[field] as string} onChange={(e) => set(field, e.target.value)}>
              <option value="">Seleccionar…</option>
              {FUNCTIONAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
