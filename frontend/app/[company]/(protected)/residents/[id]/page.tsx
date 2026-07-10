"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileDown, Pencil, Trash2, Upload, X, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { COLOMBIA_CITIES } from "@/lib/colombia-cities";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Guardian { name: string; relationship: string; phone: string; }
interface Diagnosis { condition: string; has_it: boolean; years?: number | null; notes?: string | null; }
interface Medication { name: string; dose: string; frequency: string; is_prescribed: boolean; }
interface LaboratoryTest { test: string; result?: string | null; }
interface MedicalBackground {
  basic_measures?: { blood_pressure?: string; pulse?: string; weight?: string; height?: string } | null;
  diagnoses?: Diagnosis[];
  current_medications?: Medication[];
  pathologies?: string[];
  pathologies_other?: string | null;
  medicament_allergies?: string | null;
  surgical_history?: string | null;
  habits?: string[];
  habits_other?: string | null;
  physical_activity?: string | null;
  special_diet?: string | null;
  medical_attention_6_months?: string | null;
  laboratory_tests?: LaboratoryTest[];
  gerontological_observations?: string | null;
  gerontologist_name?: string | null;
}
interface FunctionalAssessment { mobility?: string; feeding?: string; hygiene?: string; continence?: string; cognitive_state?: string; }

interface Resident {
  id: string;
  registration_id: string;
  registration_date?: string | null;
  admission_reason?: string | null;
  room_number?: string | null;
  full_name: string;
  id_type?: string | null;
  id_number?: string | null;
  birth_date?: string | null;
  birth_country?: string;
  birth_place?: string | null;
  photo_url?: string | null;
  gender?: string | null;
  civil_status?: string | null;
  address?: string | null;
  phone?: string | null;
  education_level?: string | null;
  religion?: string | null;
  occupation?: string | null;
  social_security_system?: string | null;
  social_security_company?: string | null;
  social_security_company_phone?: string | null;
  has_funeral_service?: string | null;
  funeral_service_name?: string | null;
  funeral_service_phone?: string | null;
  guardians?: Guardian[];
  children_number?: number | null;
  male_children_number?: number | null;
  female_children_number?: number | null;
  children_address?: string | null;
  children_phone?: string | null;
  is_good_family_environment?: string | null;
  family_environment_description?: string | null;
  can_live_in_community?: string | null;
  why_can_live_in_community?: string | null;
  has_participated_in_community_groups?: string | null;
  why_has_participated_in_community_groups?: string | null;
  spare_time_activities?: string[];
  spare_time_activities_other?: string | null;
  economic_aspect?: string | null;
  medical_background?: MedicalBackground | null;
  functional_assessment?: FunctionalAssessment | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

const AVATAR_BG = ["bg-teal-500", "bg-blue-500", "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-indigo-500"];
function avatarColor(name: string) {
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_BG[n % AVATAR_BG.length];
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}
const val = (v: unknown) => (v != null && v !== "" ? String(v) : "—");

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1">{children}</label>;
}
function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 placeholder:text-slate-400 ${className}`} {...props} />;
}
function Select({ children, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 bg-white ${className}`} {...props}>{children}</select>;
}
function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 resize-none placeholder:text-slate-400 ${className}`} {...props} />;
}
function RadioGroup({ name, value, options, onChange }: { name: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="accent-teal-600" />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onCancel, loading }: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">Eliminar ficha</h2>
        <p className="text-sm text-slate-600 mb-5">¿Eliminar la ficha de <strong>{name}</strong>? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors">{loading ? "Eliminando…" : "Eliminar"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit form state helpers ──────────────────────────────────────────────────

const DIAGNOSIS_CONDITIONS = ["HTA", "DIABETES", "EPOC", "OSTEOPOROSIS", "ARTRITIS"];
const PATHOLOGY_OPTIONS = ["DIGESTIVA", "NERVIOSA", "CIRCULATORIA", "VISUAL", "AUDITIVA", "URINARIA", "MOTRIZ"];
const HABIT_OPTIONS = ["ALCOHOL", "CAFEÍNA", "TABAQUISMO", "SEDANTES"];
const SPARE_TIME_OPTIONS = ["RADIO", "JUEGOS", "T.V", "MÚSICA", "MANUALIDADES", "LECTURA", "ESCRITURA", "JARDINERÍA", "LAB. HOGAR", "PINTURA", "REUN. AMIGOS", "PASEAR", "SISTER ESPEC."];
const LAB_TEST_OPTIONS = ["HEMOLUCOGRAMA", "CITOQUÍMICO ORINA", "GLICEMIA", "RX-TÓRAX", "HIV"];
const FUNCTIONAL_OPTIONS = ["Independiente", "Con ayuda parcial", "Dependiente", "No evaluado"];

interface EditState {
  registration_date: string; admission_reason: string; room_number: string;
  full_name: string; id_type: string; id_number: string; birth_date: string;
  birth_country: string; birth_place: string; gender: string; civil_status: string;
  address: string; phone: string; education_level: string; religion: string;
  occupation: string; social_security_system: string; social_security_company: string;
  social_security_company_phone: string; has_funeral_service: string;
  funeral_service_name: string; funeral_service_phone: string;
  guardians: Guardian[];
  children_number: string; male_children_number: string; female_children_number: string;
  children_address: string; children_phone: string; is_good_family_environment: string;
  family_environment_description: string;
  can_live_in_community: string; why_can_live_in_community: string;
  has_participated_in_community_groups: string; why_has_participated_in_community_groups: string;
  spare_time_activities: string[]; spare_time_activities_other: string; economic_aspect: string;
  blood_pressure: string; pulse: string; weight: string; height: string;
  diagnoses: { condition: string; has_it: boolean; years: string; notes: string }[];
  medications: { name: string; dose: string; frequency: string; is_prescribed: boolean }[];
  pathologies: string[]; pathologies_other: string;
  medicament_allergies: string; medicament_allergies_detail: string;
  surgical_history: string; surgical_history_detail: string;
  habits: string[]; habits_other: string;
  physical_activity: string; physical_activity_detail: string;
  special_diet: string; special_diet_detail: string;
  medical_attention_6_months: string; medical_attention_6_months_detail: string;
  laboratory_tests: { test: string; checked: boolean; result: string }[];
  gerontological_observations: string; gerontologist_name: string;
  mobility: string; feeding: string; hygiene: string; continence: string; cognitive_state: string;
}

function residentToEditState(r: Resident): EditState {
  const mb = r.medical_background ?? {};
  const fa = r.functional_assessment ?? {};

  const existingDiagnoses = mb.diagnoses ?? [];
  const diagnoses = DIAGNOSIS_CONDITIONS.map((c) => {
    const found = existingDiagnoses.find((d) => d.condition === c);
    return { condition: c, has_it: found?.has_it ?? false, years: found?.years ? String(found.years) : "", notes: found?.notes ?? "" };
  });
  const otherDx = existingDiagnoses.find((d) => !DIAGNOSIS_CONDITIONS.includes(d.condition));
  if (otherDx) diagnoses.push({ condition: otherDx.condition, has_it: true, years: otherDx.years ? String(otherDx.years) : "", notes: otherDx.notes ?? "" });

  const labTests = LAB_TEST_OPTIONS.map((t) => {
    const found = (mb.laboratory_tests ?? []).find((lt) => lt.test === t);
    return { test: t, checked: !!found, result: found?.result ?? "" };
  });

  // Reverse-engineer yes/no fields from stored string
  const yesNo = (s: string | null | undefined): string => {
    if (!s) return "";
    return s === "No" ? "no" : "si";
  };
  const yesNoDetail = (s: string | null | undefined): string => {
    if (!s || s === "No" || s === "Sí") return "";
    return s;
  };

  return {
    registration_date: r.registration_date ? r.registration_date.split("T")[0] : "",
    admission_reason: r.admission_reason ?? "",
    room_number: r.room_number ?? "",
    full_name: r.full_name,
    id_type: r.id_type ?? "CC",
    id_number: r.id_number ?? "",
    birth_date: r.birth_date ? r.birth_date.split("T")[0] : "",
    birth_country: r.birth_country ?? "Colombia",
    birth_place: r.birth_place ?? "",
    gender: r.gender ?? "",
    civil_status: r.civil_status ?? "",
    address: r.address ?? "",
    phone: r.phone ?? "",
    education_level: r.education_level ?? "",
    religion: r.religion ?? "",
    occupation: r.occupation ?? "",
    social_security_system: r.social_security_system ?? "",
    social_security_company: r.social_security_company ?? "",
    social_security_company_phone: r.social_security_company_phone ?? "",
    has_funeral_service: r.has_funeral_service ?? "",
    funeral_service_name: r.funeral_service_name ?? "",
    funeral_service_phone: r.funeral_service_phone ?? "",
    guardians: r.guardians ?? [],
    children_number: r.children_number != null ? String(r.children_number) : "",
    male_children_number: r.male_children_number != null ? String(r.male_children_number) : "",
    female_children_number: r.female_children_number != null ? String(r.female_children_number) : "",
    children_address: r.children_address ?? "",
    children_phone: r.children_phone ?? "",
    is_good_family_environment: r.is_good_family_environment ?? "",
    family_environment_description: r.family_environment_description ?? "",
    can_live_in_community: r.can_live_in_community ?? "",
    why_can_live_in_community: r.why_can_live_in_community ?? "",
    has_participated_in_community_groups: r.has_participated_in_community_groups ?? "",
    why_has_participated_in_community_groups: r.why_has_participated_in_community_groups ?? "",
    spare_time_activities: r.spare_time_activities ?? [],
    spare_time_activities_other: r.spare_time_activities_other ?? "",
    economic_aspect: r.economic_aspect ?? "",
    blood_pressure: mb.basic_measures?.blood_pressure ?? "",
    pulse: mb.basic_measures?.pulse ?? "",
    weight: mb.basic_measures?.weight ?? "",
    height: mb.basic_measures?.height ?? "",
    diagnoses,
    medications: (mb.current_medications ?? []).map((m) => ({ name: m.name, dose: m.dose, frequency: m.frequency, is_prescribed: m.is_prescribed })),
    pathologies: mb.pathologies ?? [],
    pathologies_other: mb.pathologies_other ?? "",
    medicament_allergies: yesNo(mb.medicament_allergies),
    medicament_allergies_detail: yesNoDetail(mb.medicament_allergies),
    surgical_history: yesNo(mb.surgical_history),
    surgical_history_detail: yesNoDetail(mb.surgical_history),
    habits: mb.habits ?? [],
    habits_other: mb.habits_other ?? "",
    physical_activity: yesNo(mb.physical_activity),
    physical_activity_detail: yesNoDetail(mb.physical_activity),
    special_diet: yesNo(mb.special_diet),
    special_diet_detail: yesNoDetail(mb.special_diet),
    medical_attention_6_months: yesNo(mb.medical_attention_6_months),
    medical_attention_6_months_detail: yesNoDetail(mb.medical_attention_6_months),
    laboratory_tests: labTests,
    gerontological_observations: mb.gerontological_observations ?? "",
    gerontologist_name: mb.gerontologist_name ?? "",
    mobility: fa.mobility ?? "",
    feeding: fa.feeding ?? "",
    hygiene: fa.hygiene ?? "",
    continence: fa.continence ?? "",
    cognitive_state: fa.cognitive_state ?? "",
  };
}

function buildUpdatePayload(e: EditState) {
  return {
    registration_date: e.registration_date || null,
    admission_reason: e.admission_reason || null,
    room_number: e.room_number || null,
    full_name: e.full_name,
    id_type: e.id_type || null,
    id_number: e.id_number || null,
    birth_date: e.birth_date || null,
    birth_country: e.birth_country || "Colombia",
    birth_place: e.birth_place || null,
    gender: e.gender || null,
    civil_status: e.civil_status || null,
    address: e.address || null,
    phone: e.phone || null,
    education_level: e.education_level || null,
    religion: e.religion || null,
    occupation: e.occupation || null,
    social_security_system: e.social_security_system || null,
    social_security_company: e.social_security_company || null,
    social_security_company_phone: e.social_security_company_phone || null,
    has_funeral_service: e.has_funeral_service || null,
    funeral_service_name: e.funeral_service_name || null,
    funeral_service_phone: e.funeral_service_phone || null,
    guardians: e.guardians,
    children_number: e.children_number ? parseInt(e.children_number) : null,
    male_children_number: e.male_children_number ? parseInt(e.male_children_number) : null,
    female_children_number: e.female_children_number ? parseInt(e.female_children_number) : null,
    children_address: e.children_address || null,
    children_phone: e.children_phone || null,
    is_good_family_environment: e.is_good_family_environment || null,
    family_environment_description: e.family_environment_description || null,
    can_live_in_community: e.can_live_in_community || null,
    why_can_live_in_community: e.why_can_live_in_community || null,
    has_participated_in_community_groups: e.has_participated_in_community_groups || null,
    why_has_participated_in_community_groups: e.why_has_participated_in_community_groups || null,
    spare_time_activities: e.spare_time_activities,
    spare_time_activities_other: e.spare_time_activities_other || null,
    economic_aspect: e.economic_aspect || null,
    medical_background: {
      basic_measures: { blood_pressure: e.blood_pressure || null, pulse: e.pulse || null, weight: e.weight || null, height: e.height || null },
      diagnoses: e.diagnoses.map((d) => ({ condition: d.condition, has_it: d.has_it, years: d.years ? parseInt(d.years) : null, notes: d.notes || null })),
      current_medications: e.medications,
      pathologies: e.pathologies,
      pathologies_other: e.pathologies_other || null,
      medicament_allergies: e.medicament_allergies === "si" ? e.medicament_allergies_detail || "Sí" : e.medicament_allergies === "no" ? "No" : null,
      surgical_history: e.surgical_history === "si" ? e.surgical_history_detail || "Sí" : e.surgical_history === "no" ? "No" : null,
      habits: e.habits,
      habits_other: e.habits_other || null,
      physical_activity: e.physical_activity === "si" ? e.physical_activity_detail || "Sí" : e.physical_activity === "no" ? "No" : null,
      special_diet: e.special_diet === "si" ? e.special_diet_detail || "Sí" : e.special_diet === "no" ? "No" : null,
      medical_attention_6_months: e.medical_attention_6_months === "si" ? e.medical_attention_6_months_detail || "Sí" : e.medical_attention_6_months === "no" ? "No" : null,
      laboratory_tests: e.laboratory_tests.filter((t) => t.checked).map((t) => ({ test: t.test, result: t.result || null })),
      gerontological_observations: e.gerontological_observations || null,
      gerontologist_name: e.gerontologist_name || null,
    },
    functional_assessment: { mobility: e.mobility || null, feeding: e.feeding || null, hygiene: e.hygiene || null, continence: e.continence || null, cognitive_state: e.cognitive_state || null },
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResidentDetailPage() {
  const { company, id } = useParams<{ company: string; id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const canWrite = user?.role === "admin" || user?.role === "doctor" || user?.role === "nurse";
  const canDelete = user?.role === "admin";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Resident>(`/api/v1/residents/${id}`);
        setResident(data);
      } catch {
        // 404 — show nothing
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const startEdit = () => {
    if (resident) { setEditState(residentToEditState(resident)); setIsEditing(true); }
  };

  const cancelEdit = () => { setIsEditing(false); setEditState(null); setPhotoFile(null); setPhotoPreview(null); setServerError(""); };

  const handleExportPdf = async () => {
    if (!resident) return;
    setPdfLoading(true);
    try {
      const { data } = await api.get(`/api/v1/residents/${id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `ficha-${resident.full_name.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore — user will notice nothing downloaded
    } finally {
      setPdfLoading(false);
    }
  };

  const setE = (field: keyof EditState, value: unknown) => {
    setEditState((s) => s ? { ...s, [field]: value } : s);
  };

  const handleSave = async () => {
    if (!editState) return;
    if (!editState.full_name.trim()) { setServerError("El nombre es obligatorio"); return; }
    setSaving(true);
    setServerError("");
    try {
      await api.put(`/api/v1/residents/${id}`, buildUpdatePayload(editState));
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        await api.post(`/api/v1/residents/${id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      const { data } = await api.get<Resident>(`/api/v1/residents/${id}`);
      setResident(data);
      setIsEditing(false);
      setEditState(null);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Error al guardar";
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/v1/residents/${id}`);
      router.push(`/${company}/residents`);
    } catch {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">Cargando…</p></div>;
  }
  if (!resident) {
    return <div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">Residente no encontrado.</p></div>;
  }

  // ─── View mode ─────────────────────────────────────────────────────────────

  if (!isEditing) {
    const mb = resident.medical_background ?? {};
    const fa = resident.functional_assessment ?? {};
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {mediaUrl(resident.photo_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(resident.photo_url)!} alt={resident.full_name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0 ${avatarColor(resident.full_name)}`}>
                {initials(resident.full_name)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{resident.full_name}</h1>
              <p className="text-sm text-slate-500">{resident.id_type && resident.id_number ? `${resident.id_type} ${resident.id_number}` : "Sin identificación"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/${company}/residents`)} className="px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">← Volver</button>
            <button onClick={handleExportPdf} disabled={pdfLoading} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <FileDown size={15} /> {pdfLoading ? "Generando…" : "Exportar PDF"}
            </button>
            {canWrite && (
              <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors">
                <Pencil size={15} /> Editar
              </button>
            )}
            {canDelete && (
              <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-md transition-colors">
                <Trash2 size={15} /> Eliminar
              </button>
            )}
          </div>
        </div>

        <SectionCard title="Registro e Ingreso">
          <Field label="Fecha de ingreso" value={resident.registration_date ? fmtDate(resident.registration_date) : "—"} />
          <Field label="Habitación" value={val(resident.room_number)} />
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Motivo de ingreso" value={val(resident.admission_reason)} /></div>
        </SectionCard>

        <SectionCard title="Datos Personales">
          <Field label="Género" value={val(resident.gender)} />
          <Field label="Estado civil" value={val(resident.civil_status)} />
          <Field label="Fecha de nacimiento" value={resident.birth_date ? fmtDate(resident.birth_date) : "—"} />
          <Field label="País de nacimiento" value={val(resident.birth_country)} />
          <Field label="Ciudad de nacimiento" value={val(resident.birth_place)} />
          <Field label="Religión" value={val(resident.religion)} />
          <Field label="Dirección" value={val(resident.address)} />
          <Field label="Teléfono" value={val(resident.phone)} />
          <Field label="Nivel educativo" value={val(resident.education_level)} />
          <Field label="Ocupación" value={val(resident.occupation)} />
          <Field label="Seguridad social" value={val(resident.social_security_system)} />
          <Field label="Entidad SS" value={val(resident.social_security_company)} />
          <Field label="Servicio funerario" value={val(resident.has_funeral_service)} />
          {resident.has_funeral_service === "si" && <>
            <Field label="Nombre funeraria" value={val(resident.funeral_service_name)} />
            <Field label="Tel. funeraria" value={val(resident.funeral_service_phone)} />
          </>}
        </SectionCard>

        {(resident.guardians ?? []).length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Acudientes</h3>
            <div className="space-y-3">
              {resident.guardians!.map((g, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 text-sm">
                  <div><p className="text-xs text-slate-500">Nombre</p><p className="text-slate-800">{g.name}</p></div>
                  <div><p className="text-xs text-slate-500">Parentesco</p><p className="text-slate-800">{g.relationship}</p></div>
                  <div><p className="text-xs text-slate-500">Teléfono</p><p className="text-slate-800">{g.phone}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <SectionCard title="Datos Familiares">
          <Field label="Número de hijos" value={val(resident.children_number)} />
          <Field label="Hijos varones" value={val(resident.male_children_number)} />
          <Field label="Hijas mujeres" value={val(resident.female_children_number)} />
          <Field label="Dirección hijos" value={val(resident.children_address)} />
          <Field label="Teléfono hijos" value={val(resident.children_phone)} />
          <Field label="Relaciones en el Ambiente familiar" value={val(resident.is_good_family_environment)} />
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Descripción" value={val(resident.family_environment_description)} /></div>
        </SectionCard>

        <SectionCard title="Vida Comunitaria y Tiempo Libre">
          <Field label="¿Vive en comunidad?" value={val(resident.can_live_in_community)} />
          <Field label="¿Por qué?" value={val(resident.why_can_live_in_community)} />
          <Field label="¿Grupos comunitarios?" value={val(resident.has_participated_in_community_groups)} />
          <Field label="¿Cuáles?" value={val(resident.why_has_participated_in_community_groups)} />
          <Field label="Aspecto económico" value={val(resident.economic_aspect)} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Actividades de tiempo libre" value={(resident.spare_time_activities ?? []).join(", ") || "—"} />
          </div>
        </SectionCard>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Antecedentes Médicos</h3>
          {mb.basic_measures && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <Field label="Presión" value={val(mb.basic_measures.blood_pressure)} />
              <Field label="Pulso" value={val(mb.basic_measures.pulse)} />
              <Field label="Peso" value={val(mb.basic_measures.weight)} />
              <Field label="Talla" value={val(mb.basic_measures.height)} />
            </div>
          )}
          {(mb.diagnoses ?? []).filter((d) => d.has_it).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Diagnósticos</p>
              <div className="flex flex-wrap gap-2">
                {mb.diagnoses!.filter((d) => d.has_it).map((d, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-800 text-xs rounded-full border border-amber-200">{d.condition}{d.years ? ` (${d.years} años)` : ""}</span>
                ))}
              </div>
            </div>
          )}
          {(mb.pathologies ?? []).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Patologías</p>
              <div className="flex flex-wrap gap-2">
                {mb.pathologies!.map((p, i) => <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">{p}</span>)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Alergias medicamentos" value={val(mb.medicament_allergies)} />
            <Field label="Antecedentes quirúrgicos" value={val(mb.surgical_history)} />
            <Field label="Actividad física" value={val(mb.physical_activity)} />
            <Field label="Dieta especial" value={val(mb.special_diet)} />
            <Field label="Atención médica (6 meses)" value={val(mb.medical_attention_6_months)} />
            <Field label="Gerontólogo/a" value={val(mb.gerontologist_name)} />
            <div className="sm:col-span-2"><Field label="Observaciones gerontológicas" value={val(mb.gerontological_observations)} /></div>
          </div>
        </div>

        <SectionCard title="Valoración Funcional">
          <Field label="Movilidad" value={val(fa.mobility)} />
          <Field label="Alimentación" value={val(fa.feeding)} />
          <Field label="Higiene" value={val(fa.hygiene)} />
          <Field label="Continencia" value={val(fa.continence)} />
          <Field label="Estado cognitivo" value={val(fa.cognitive_state)} />
        </SectionCard>

        {showDelete && <DeleteModal name={resident.full_name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />}
      </div>
    );
  }

  // ─── Edit mode ─────────────────────────────────────────────────────────────

  if (!editState) return null;

  const e = editState;

  const toggleArr = (field: keyof EditState, val: string) => {
    const arr = e[field] as string[];
    setE(field, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const updateDx = (i: number, field: string, value: unknown) => {
    const ds = [...e.diagnoses];
    ds[i] = { ...ds[i], [field]: value };
    setE("diagnoses", ds);
  };

  const updateMed = (i: number, field: string, value: unknown) => {
    const ms = [...e.medications];
    ms[i] = { ...ms[i], [field]: value };
    setE("medications", ms);
  };

  const updateLab = (i: number, field: string, value: unknown) => {
    const ts = [...e.laboratory_tests];
    ts[i] = { ...ts[i], [field]: value };
    setE("laboratory_tests", ts);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Editar ficha — {resident.full_name}</h1>
        <div className="flex gap-2">
          <button onClick={cancelEdit} className="px-4 py-2 text-sm text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 transition-colors">{saving ? "Guardando…" : "Guardar cambios"}</button>
        </div>
      </div>

      {serverError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{serverError}</p>}

      {/* Photo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Foto</p>
        <div className="flex items-center gap-4">
          {(photoPreview ?? mediaUrl(resident.photo_url)) ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview ?? mediaUrl(resident.photo_url)!} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
              {photoPreview && (
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X size={12} />
                </button>
              )}
            </div>
          ) : (
            <div className={`w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-semibold ${avatarColor(resident.full_name)}`}>
              {initials(resident.full_name)}
            </div>
          )}
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
            <Upload size={15} /> Cambiar foto
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              if (f.size > 2 * 1024 * 1024) { setServerError("La imagen no puede superar 2 MB"); return; }
              setPhotoFile(f);
              setPhotoPreview(URL.createObjectURL(f));
            }} />
          </label>
        </div>
      </div>

      {/* Registro */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-200">Registro e Ingreso</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Fecha de ingreso</Label><Input type="date" value={e.registration_date} onChange={(ev) => setE("registration_date", ev.target.value)} /></div>
          <div><Label>Habitación</Label><Input value={e.room_number} onChange={(ev) => setE("room_number", ev.target.value)} /></div>
        </div>
        <div><Label>Motivo de ingreso</Label><Textarea value={e.admission_reason} onChange={(ev) => setE("admission_reason", ev.target.value)} /></div>
      </div>

      {/* Personal */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-200">Datos Personales</h3>
        <div><Label>Nombre completo *</Label><Input value={e.full_name} onChange={(ev) => setE("full_name", ev.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Tipo ID</Label>
            <Select value={e.id_type} onChange={(ev) => setE("id_type", ev.target.value)}>
              <option value="">—</option>
              {["CC", "CE", "Pasaporte"].map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
          <div><Label>Número ID</Label><Input value={e.id_number} onChange={(ev) => setE("id_number", ev.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Fecha de nacimiento</Label><Input type="date" value={e.birth_date} onChange={(ev) => setE("birth_date", ev.target.value)} /></div>
          <div><Label>País de nacimiento</Label><Input value={e.birth_country} onChange={(ev) => setE("birth_country", ev.target.value)} /></div>
        </div>
        <div><Label>Ciudad de nacimiento</Label>
          <Select value={e.birth_place} onChange={(ev) => setE("birth_place", ev.target.value)}>
            <option value="">Seleccionar…</option>
            {COLOMBIA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div><Label>Género</Label><RadioGroup name="edit_gender" value={e.gender} options={[{ label: "Masculino", value: "Masculino" }, { label: "Femenino", value: "Femenino" }, { label: "Sin definición", value: "Sin definición" }]} onChange={(v) => setE("gender", v)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Estado civil</Label>
            <Select value={e.civil_status} onChange={(ev) => setE("civil_status", ev.target.value)}>
              <option value="">—</option>
              {["Soltero/a", "Casado/a", "Viudo/a", "Unión Libre"].map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
          <div><Label>Religión</Label>
            <Select value={e.religion} onChange={(ev) => setE("religion", ev.target.value)}>
              <option value="">—</option>
              {["Católica", "Protestante", "Evangélica", "Sin definición"].map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Dirección</Label><Input value={e.address} onChange={(ev) => setE("address", ev.target.value)} /></div>
          <div><Label>Teléfono</Label><Input value={e.phone} onChange={(ev) => setE("phone", ev.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Nivel educativo</Label>
            <Select value={e.education_level} onChange={(ev) => setE("education_level", ev.target.value)}>
              <option value="">—</option>
              {["Primaria incompleta", "Primaria completa", "Secundaria incompleta", "Secundaria completa", "Universidad incompleta", "Universidad completa"].map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
          <div><Label>Ocupación</Label><Input value={e.occupation} onChange={(ev) => setE("occupation", ev.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Sistema SS</Label>
            <Select value={e.social_security_system} onChange={(ev) => setE("social_security_system", ev.target.value)}>
              <option value="">—</option>
              {["Contributivo", "Subsidiado", "Vinculado", "Especiales", "Ninguno", "Otro"].map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
          <div><Label>Entidad SS</Label><Input value={e.social_security_company} onChange={(ev) => setE("social_security_company", ev.target.value)} /></div>
        </div>
        <div><Label>¿Servicio funerario?</Label><RadioGroup name="edit_funeral" value={e.has_funeral_service} options={[{ label: "Sí", value: "si" }, { label: "No", value: "no" }]} onChange={(v) => setE("has_funeral_service", v)} /></div>
        {e.has_funeral_service === "si" && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nombre funeraria</Label><Input value={e.funeral_service_name} onChange={(ev) => setE("funeral_service_name", ev.target.value)} /></div>
            <div><Label>Tel. funeraria</Label><Input value={e.funeral_service_phone} onChange={(ev) => setE("funeral_service_phone", ev.target.value)} /></div>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-2"><Label>Acudientes</Label>
            <button type="button" onClick={() => setE("guardians", [...e.guardians, { name: "", relationship: "", phone: "" }])} className="flex items-center gap-1 text-xs text-primary-600"><Plus size={13} /> Agregar</button>
          </div>
          <div className="space-y-2">
            {e.guardians.map((g, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input placeholder="Nombre" value={g.name} onChange={(ev) => { const gs = [...e.guardians]; gs[i] = { ...gs[i], name: ev.target.value }; setE("guardians", gs); }} />
                <Select value={g.relationship} onChange={(ev) => { const gs = [...e.guardians]; gs[i] = { ...gs[i], relationship: ev.target.value }; setE("guardians", gs); }}>
                  <option value="">Parentesco…</option>
                  {["Hijo/a", "Padre/Madre", "Hermano/a", "Primo/a", "Conyugue", "Amigo/a", "Cuñado/a", "Suegro/a"].map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
                <div className="flex gap-1">
                  <Input placeholder="Teléfono" value={g.phone} onChange={(ev) => { const gs = [...e.guardians]; gs[i] = { ...gs[i], phone: ev.target.value }; setE("guardians", gs); }} />
                  <button type="button" onClick={() => setE("guardians", e.guardians.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Familiar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-200">Datos Familiares</h3>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>Hijos</Label><Input type="number" min="0" value={e.children_number} onChange={(ev) => setE("children_number", ev.target.value)} /></div>
          <div><Label>Varones</Label><Input type="number" min="0" value={e.male_children_number} onChange={(ev) => setE("male_children_number", ev.target.value)} /></div>
          <div><Label>Mujeres</Label><Input type="number" min="0" value={e.female_children_number} onChange={(ev) => setE("female_children_number", ev.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Dirección hijos</Label><Input value={e.children_address} onChange={(ev) => setE("children_address", ev.target.value)} /></div>
          <div><Label>Teléfono hijos</Label><Input value={e.children_phone} onChange={(ev) => setE("children_phone", ev.target.value)} /></div>
        </div>
        <div><Label>Relaciones en el Ambiente familiar</Label><RadioGroup name="edit_fam_env" value={e.is_good_family_environment} options={["Buenas", "Aceptables", "Mala", "No se da"].map((o) => ({ label: o, value: o }))} onChange={(v) => setE("is_good_family_environment", v)} /></div>
        <div><Label>Descripción ambiente familiar</Label><Textarea value={e.family_environment_description} onChange={(ev) => setE("family_environment_description", ev.target.value)} /></div>
      </div>

      {/* Comunitaria */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-200">Vida Comunitaria y Tiempo Libre</h3>
        <div><Label>¿Puede vivir en comunidad?</Label><RadioGroup name="edit_comm" value={e.can_live_in_community} options={[{ label: "Sí", value: "si" }, { label: "No", value: "no" }]} onChange={(v) => setE("can_live_in_community", v)} /></div>
        {e.can_live_in_community === "si" && <div><Label>¿Por qué?</Label><Input value={e.why_can_live_in_community} onChange={(ev) => setE("why_can_live_in_community", ev.target.value)} /></div>}
        <div><Label>¿Grupos comunitarios?</Label><RadioGroup name="edit_groups" value={e.has_participated_in_community_groups} options={[{ label: "Sí", value: "si" }, { label: "No", value: "no" }]} onChange={(v) => setE("has_participated_in_community_groups", v)} /></div>
        {e.has_participated_in_community_groups === "si" && <div><Label>¿Cuáles?</Label><Input value={e.why_has_participated_in_community_groups} onChange={(ev) => setE("why_has_participated_in_community_groups", ev.target.value)} /></div>}
        <div>
          <Label>Actividades tiempo libre</Label>
          <div className="flex flex-wrap gap-3 mt-1">
            {[...SPARE_TIME_OPTIONS, "OTRAS"].map((act) => (
              <label key={act} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={e.spare_time_activities.includes(act)} onChange={() => toggleArr("spare_time_activities", act)} className="accent-teal-600" />
                {act}
              </label>
            ))}
          </div>
          {e.spare_time_activities.includes("OTRAS") && <Input className="mt-2 max-w-sm" value={e.spare_time_activities_other} onChange={(ev) => setE("spare_time_activities_other", ev.target.value)} />}
        </div>
        <div>
          <Label>Aspecto económico</Label>
          <div className="flex flex-wrap gap-4 mt-1">
            {["PENSIONADO", "JUBILADO", "RENTA PROPIA", "AYUDA FAMILIAR", "TOTALMENTE INDEPENDIENTE"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input type="radio" name="edit_economic" value={opt} checked={e.economic_aspect === opt} onChange={() => setE("economic_aspect", opt)} className="accent-teal-600" />
                {opt}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Médicos */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
        <h3 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-200">Antecedentes Médicos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([["Presión", "blood_pressure"], ["Pulso", "pulse"], ["Peso", "weight"], ["Talla", "height"]] as const).map(([label, field]) => (
            <div key={field}><Label>{label}</Label><Input value={e[field]} onChange={(ev) => setE(field, ev.target.value)} /></div>
          ))}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Diagnósticos</p>
          <div className="space-y-2">
            {e.diagnoses.map((d, i) => (
              <div key={d.condition} className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <label className="flex items-center gap-2 min-w-[130px] cursor-pointer text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={d.has_it} onChange={(ev) => updateDx(i, "has_it", ev.target.checked)} className="accent-teal-600" />
                  {d.condition}
                </label>
                {d.has_it && (
                  <>
                    <div className="flex items-center gap-1"><span className="text-xs text-slate-500">Años:</span><Input className="w-20" type="number" min="0" value={d.years} onChange={(ev) => updateDx(i, "years", ev.target.value)} /></div>
                    <Input className="flex-1 min-w-[100px]" placeholder="Observaciones" value={d.notes} onChange={(ev) => updateDx(i, "notes", ev.target.value)} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-slate-700">Medicamentos</p>
            <button type="button" onClick={() => setE("medications", [...e.medications, { name: "", dose: "", frequency: "", is_prescribed: true }])} className="flex items-center gap-1 text-xs text-primary-600"><Plus size={13} /> Agregar</button>
          </div>
          <div className="space-y-2">
            {e.medications.map((m, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg">
                <Input placeholder="Medicamento" value={m.name} onChange={(ev) => updateMed(i, "name", ev.target.value)} />
                <Input placeholder="Dosis" value={m.dose} onChange={(ev) => updateMed(i, "dose", ev.target.value)} />
                <Input placeholder="Frecuencia" value={m.frequency} onChange={(ev) => updateMed(i, "frequency", ev.target.value)} />
                <div className="flex gap-1">
                  <Select value={m.is_prescribed ? "recetado" : "automedicado"} onChange={(ev) => updateMed(i, "is_prescribed", ev.target.value === "recetado")}>
                    <option value="recetado">Recetado</option>
                    <option value="automedicado">Automedicado</option>
                  </Select>
                  <button type="button" onClick={() => setE("medications", e.medications.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label>Patologías</Label>
          <div className="flex flex-wrap gap-3 mt-1">
            {[...PATHOLOGY_OPTIONS, "OTRA"].map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer text-slate-700">
                <input type="checkbox" checked={e.pathologies.includes(p)} onChange={() => toggleArr("pathologies", p)} className="accent-teal-600" />
                {p}
              </label>
            ))}
          </div>
          {e.pathologies.includes("OTRA") && <Input className="mt-2 max-w-xs" value={e.pathologies_other} onChange={(ev) => setE("pathologies_other", ev.target.value)} />}
        </div>
        {([
          { label: "Alergias medicamentos", f: "medicament_allergies", df: "medicament_allergies_detail" },
          { label: "Antecedentes quirúrgicos", f: "surgical_history", df: "surgical_history_detail" },
          { label: "Actividad física", f: "physical_activity", df: "physical_activity_detail" },
          { label: "Dieta especial", f: "special_diet", df: "special_diet_detail" },
          { label: "Atención médica (6m)", f: "medical_attention_6_months", df: "medical_attention_6_months_detail" },
        ] as const).map(({ label, f, df }) => (
          <div key={f}>
            <Label>{label}</Label>
            <RadioGroup name={`edit_${f}`} value={e[f]} options={[{ label: "Sí", value: "si" }, { label: "No", value: "no" }]} onChange={(v) => setE(f, v)} />
            {e[f] === "si" && <Input className="mt-2" value={e[df]} onChange={(ev) => setE(df, ev.target.value)} />}
          </div>
        ))}
        <div>
          <Label>Hábitos</Label>
          <div className="flex flex-wrap gap-3 mt-1">
            {[...HABIT_OPTIONS, "OTRAS"].map((h) => (
              <label key={h} className="flex items-center gap-1.5 text-sm cursor-pointer text-slate-700">
                <input type="checkbox" checked={e.habits.includes(h)} onChange={() => toggleArr("habits", h)} className="accent-teal-600" />
                {h}
              </label>
            ))}
          </div>
          {e.habits.includes("OTRAS") && <Input className="mt-2 max-w-xs" value={e.habits_other} onChange={(ev) => setE("habits_other", ev.target.value)} />}
        </div>
        <div>
          <Label>Exámenes de laboratorio</Label>
          <div className="space-y-2 mt-1">
            {e.laboratory_tests.map((t, i) => (
              <div key={t.test} className="flex items-center gap-3">
                <label className="flex items-center gap-2 min-w-[200px] cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={t.checked} onChange={(ev) => updateLab(i, "checked", ev.target.checked)} className="accent-teal-600" />
                  {t.test}
                </label>
                {t.checked && <Input className="max-w-xs" placeholder="Resultado" value={t.result} onChange={(ev) => updateLab(i, "result", ev.target.value)} />}
              </div>
            ))}
          </div>
        </div>
        <div><Label>Observaciones gerontológicas</Label><Textarea rows={4} value={e.gerontological_observations} onChange={(ev) => setE("gerontological_observations", ev.target.value)} /></div>
        <div><Label>Gerontólogo/a</Label><Input className="max-w-sm" value={e.gerontologist_name} onChange={(ev) => setE("gerontologist_name", ev.target.value)} /></div>
      </div>

      {/* Funcional */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-200">Valoración Funcional</h3>
        <div className="grid grid-cols-2 gap-4">
          {([["Movilidad", "mobility"], ["Alimentación", "feeding"], ["Higiene", "hygiene"], ["Continencia", "continence"], ["Estado cognitivo", "cognitive_state"]] as const).map(([label, field]) => (
            <div key={field}>
              <Label>{label}</Label>
              <Select value={e[field]} onChange={(ev) => setE(field, ev.target.value)}>
                <option value="">—</option>
                {FUNCTIONAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <button onClick={cancelEdit} className="px-4 py-2 text-sm text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 transition-colors">{saving ? "Guardando…" : "Guardar cambios"}</button>
      </div>
    </div>
  );
}
