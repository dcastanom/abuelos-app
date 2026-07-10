"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResidentListItem {
  id: string;
  full_name: string;
  photo_url?: string | null;
  id_number?: string | null;
  registration_date?: string | null;
  room_number?: string | null;
}

interface ResidentsPage {
  items: ResidentListItem[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

const AVATAR_BG = [
  "bg-teal-500", "bg-blue-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-pink-500", "bg-indigo-500", "bg-emerald-500",
];

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

// ─── Photo / Avatar ───────────────────────────────────────────────────────────

function ResidentAvatar({ item }: { item: ResidentListItem }) {
  const src = mediaUrl(item.photo_url);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={item.full_name}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${avatarColor(item.full_name)}`}>
      {initials(item.full_name)}
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">Eliminar ficha</h2>
        <p className="text-sm text-slate-600 mb-5">
          ¿Eliminar la ficha de <strong>{name}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResidentsPage() {
  const { company } = useParams<{ company: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [items, setItems] = useState<ResidentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ResidentListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 20;

  const canWrite = user?.role === "admin" || user?.role === "doctor" || user?.role === "nurse";
  const canDelete = user?.role === "admin";

  const load = async (q: string, p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get<ResidentsPage>("/api/v1/residents", {
        params: { search: q, page: p, page_size: PAGE_SIZE },
      });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (search.length > 0 && search.length < 2) return;
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(search, 1);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => {
    load(search, page); // eslint-disable-line react-hooks/set-state-in-effect
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/residents/${deleteTarget.id}`);
      setDeleteTarget(null);
      load(search, page);
    } catch {
      // could add toast
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Fichas Gerontológicas</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} residente{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}</p>
        </div>
        {canWrite && (
          <button
            onClick={() => router.push(`/${company}/residents/new`)}
            className="flex items-center gap-2 h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus size={16} />
            Nueva ficha
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 pl-4 pr-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide w-12">Foto</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Identificación</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Habitación</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Fecha ingreso</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">Cargando…</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    {search ? "Sin resultados para esta búsqueda" : "No hay residentes registrados"}
                  </td>
                </tr>
              )}
              {!loading && items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="pl-4 pr-2 py-2.5">
                    <ResidentAvatar item={item} />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{item.full_name}</td>
                  <td className="px-3 py-2.5 text-slate-600">{item.id_number ?? "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">{item.room_number ?? "—"}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {item.registration_date ? fmtDate(item.registration_date) : "—"}
                  </td>
                  <td className="px-3 py-2.5 pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/${company}/residents/${item.id}`)}
                        title="Ver ficha"
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      {canWrite && (
                        <button
                          onClick={() => router.push(`/${company}/residents/${item.id}`)}
                          title="Editar"
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Eliminar"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">{total} residente{total !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1 rounded disabled:opacity-30 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-600">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded disabled:opacity-30 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.full_name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
