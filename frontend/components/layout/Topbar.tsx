"use client";

import { useAuth } from "@/lib/auth-context";

export function Topbar({ title }: { title?: string }) {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <span className="text-sm font-medium text-slate-700">
        {title ?? "Centro Gerontológico"}
      </span>
      <span className="text-sm text-slate-500">{user?.email}</span>
    </header>
  );
}
