"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "residents", icon: Users, label: "Fichas" },
  { href: "notes", icon: ClipboardList, label: "Evoluciones" },
  { href: "contracts", icon: FileText, label: "Contratos" },
];

const adminItems = [{ href: "users", icon: UserCog, label: "Usuarios" }];

export function Sidebar({ companySlug }: { companySlug: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const active = (href: string) => pathname.includes(`/${companySlug}/${href}`);

  return (
    <aside className="w-60 bg-[#1E293B] flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-slate-700">
        <span className="text-white font-semibold text-base">Abuelos App</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="space-y-0.5 px-2">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={`/${companySlug}/${href}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active(href)
                  ? "bg-primary-700 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}

          {user?.role === "admin" && (
            <>
              <p className="mt-4 mb-1 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-widest">
                Administración
              </p>
              {adminItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={`/${companySlug}/${href}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    active(href)
                      ? "bg-primary-700 text-white"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-slate-700">
        <p className="text-slate-300 text-xs font-medium truncate">{user?.full_name}</p>
        <p className="text-slate-500 text-[11px] capitalize mb-3">{user?.role}</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
