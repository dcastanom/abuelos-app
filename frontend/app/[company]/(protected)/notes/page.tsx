"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Resident {
  id: string;
  full_name: string;
  photo_url?: string | null;
}

interface Note {
  id: string;
  resident_id: string;
  resident_name?: string | null;
  company_id: string;
  company_name?: string | null;
  date: string;
  shift: string;
  notes: string;
  nurse_id: string;
  nurse_name: string;
  created_at: string;
}

interface NotesPage {
  items: Note[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_BG = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
];

function avatarColor(name: string) {
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_BG[n % AVATAR_BG.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const SHIFT_LABEL: Record<string, string> = {
  "mañana": "Mañana",
  "tarde": "Tarde",
  "noche": "Noche",
};

const SHIFT_CLASS: Record<string, string> = {
  "mañana": "bg-yellow-100 text-yellow-800",
  "tarde":  "bg-orange-100 text-orange-800",
  "noche":  "bg-blue-100  text-blue-800",
};

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ resident, size = "md" }: { resident: Resident; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-16 h-16 text-xl" : size === "md" ? "w-14 h-14 text-base" : "w-8 h-8 text-xs";
  if (resident.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={resident.photo_url} alt={resident.full_name} className={`${dim} rounded-full object-cover`} />
    );
  }
  return (
    <div className={`${dim} ${avatarColor(resident.full_name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials(resident.full_name)}
    </div>
  );
}

// ─── Note Detail Modal ────────────────────────────────────────────────────────

function NoteModal({ note, onClose }: { note: Note; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-slate-800 text-base">Evolución de Enfermería</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Residente" value={note.resident_name ?? note.resident_id} />
          <Field label="Centro" value={note.company_name ?? "—"} />
          <Field label="Fecha" value={fmtDate(note.date)} />
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Turno</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SHIFT_CLASS[note.shift] ?? "bg-slate-100 text-slate-700"}`}>
              {SHIFT_LABEL[note.shift] ?? note.shift}
            </span>
          </div>
          <Field label="Enfermero/a" value={note.nurse_name} />
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Nota de evolución</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 rounded-lg p-3 border">
              {note.notes}
            </p>
          </div>
          <Field label="Registrado el" value={fmtDate(note.created_at)} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const { company } = useParams<{ company: string }>();

  // Residents
  const [residents, setResidents] = useState<Resident[]>([]);
  const [resSearch, setResSearch] = useState("");
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  // Notes
  const [notesData, setNotesData] = useState<NotesPage | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notePage, setNotePage] = useState(1);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", shift: "", keyword: "" });

  // New note
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Modal
  const [modalNote, setModalNote] = useState<Note | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load residents
  useEffect(() => {
    const doSearch = async () => {
      if (resSearch.length > 0 && resSearch.length < 3) return;
      try {
        const { data } = await api.get<{ items: Resident[]; total: number }>("/api/v1/residents", {
          params: { search: resSearch, page_size: 50 },
        });
        setResidents(data.items);
      } catch {
        setResidents([]);
      }
    };

    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(doSearch, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [resSearch]);

  // Load notes
  const loadNotes = useCallback(
    async (page: number) => {
      if (!selectedResident) return;
      setNotesLoading(true);
      try {
        const params: Record<string, string | number> = { page, page_size: 20 };
        if (filters.dateFrom) params.date_from = filters.dateFrom;
        if (filters.dateTo) params.date_to = filters.dateTo;
        if (filters.shift) params.shift = filters.shift;
        if (filters.keyword) params.keyword = filters.keyword;
        const { data } = await api.get<NotesPage>(
          `/api/v1/residents/${selectedResident.id}/notes`,
          { params }
        );
        setNotesData(data);
      } catch {
        setNotesData(null);
      } finally {
        setNotesLoading(false);
      }
    },
    [selectedResident, filters]
  );

  useEffect(() => {
    setNotePage(1);
    setNotesData(null);
    loadNotes(1);
  }, [selectedResident, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadNotes(notePage);
  }, [notePage]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectResident = (r: Resident) => {
    setSelectedResident(r);
    setNotePage(1);
    setNewNote("");
    setSavedMsg(false);
    setFilters({ dateFrom: "", dateTo: "", shift: "", keyword: "" });
  };

  const handleSave = async () => {
    if (!newNote.trim() || !selectedResident) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/residents/${selectedResident.id}/notes`, { notes: newNote.trim() });
      setNewNote("");
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
      setNotePage(1);
      await loadNotes(1);
    } catch {
      // error silently — could add toast later
    } finally {
      setSaving(false);
    }
  };

  const totalPages = notesData ? Math.ceil(notesData.total / notesData.page_size) : 0;

  return (
    <div className="flex h-full gap-4">
      {/* ── Left panel: Resident selector ── */}
      <aside className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-700 mb-3">Residentes</p>
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre…"
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {resSearch.length > 0 && resSearch.length < 3 && (
            <p className="text-xs text-slate-400 mt-1">Escribe al menos 3 letras</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start">
          {residents.length === 0 && (
            <p className="col-span-2 text-xs text-slate-400 text-center mt-4">
              {resSearch.length >= 3 ? "Sin resultados" : "Cargando…"}
            </p>
          )}
          {residents.map((r) => (
            <button
              key={r.id}
              onClick={() => selectResident(r)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all text-center ${
                selectedResident?.id === r.id
                  ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                  : "border-transparent hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Avatar resident={r} size="md" />
              <span className="text-xs text-slate-700 leading-tight line-clamp-2">{r.full_name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Right panel: Notes ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedResident ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <ClipboardList size={48} className="text-slate-200" />
            <p className="text-sm">Selecciona un residente para ver sus evoluciones</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar resident={selectedResident} size="sm" />
              <div>
                <h1 className="text-base font-semibold text-slate-800">{selectedResident.full_name}</h1>
                <p className="text-xs text-slate-500">Evoluciones de enfermería</p>
              </div>
            </div>

            {/* New note */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Nueva evolución</p>
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escriba la nota de evolución…"
                className="w-full resize-none text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs transition-opacity ${savedMsg ? "text-green-600 opacity-100" : "opacity-0"}`}>
                  Guardado correctamente
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving || !newNote.trim()}
                  className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-primary-700 transition-colors"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap gap-2 items-center">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-slate-400 text-sm">—</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={filters.shift}
                onChange={(e) => setFilters((f) => ({ ...f, shift: e.target.value }))}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los turnos</option>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
              <div className="relative flex-1 min-w-[160px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en notas…"
                  value={filters.keyword}
                  onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                  className="w-full pl-7 pr-3 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {(filters.dateFrom || filters.dateTo || filters.shift || filters.keyword) && (
                <button
                  onClick={() => setFilters({ dateFrom: "", dateTo: "", shift: "", keyword: "" })}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <X size={12} /> Limpiar
                </button>
              )}
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {notesLoading && (
                <p className="text-sm text-slate-400 text-center py-8">Cargando…</p>
              )}
              {!notesLoading && notesData?.items.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Sin evoluciones registradas</p>
              )}
              {!notesLoading && notesData?.items.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setModalNote(note)}
                  className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <span className="text-xs text-slate-500">{fmtDate(note.date)}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${SHIFT_CLASS[note.shift] ?? "bg-slate-100 text-slate-700"}`}>
                      {SHIFT_LABEL[note.shift] ?? note.shift}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 line-clamp-2">{note.notes}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{note.nurse_name}</p>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  {notesData?.total} evolución{notesData?.total !== 1 ? "es" : ""}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={notePage === 1}
                    onClick={() => setNotePage((p) => p - 1)}
                    className="p-1 rounded disabled:opacity-30 hover:bg-slate-100"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs text-slate-600">
                    {notePage} / {totalPages}
                  </span>
                  <button
                    disabled={notePage === totalPages}
                    onClick={() => setNotePage((p) => p + 1)}
                    className="p-1 rounded disabled:opacity-30 hover:bg-slate-100"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Note detail modal ── */}
      {modalNote && <NoteModal note={modalNote} onClose={() => setModalNote(null)} />}
    </div>
  );
}
