"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Status = "loading" | "success" | "error";

export default function ConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ message: string }>(
          `/api/v1/auth/confirm/${token}`
        );
        setMessage(data.message);
        setStatus("success");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "No se pudo confirmar la cuenta.";
        setMessage(msg);
        setStatus("error");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-md p-8 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        {status === "loading" && (
          <p className="text-sm text-slate-500">Confirmando cuenta...</p>
        )}
        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-success-600 text-xl">✓</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">¡Cuenta confirmada!</h1>
            <p className="text-sm text-slate-500 mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block h-9 px-5 bg-primary-600 hover:bg-primary-700
                         text-white text-sm font-medium rounded-md transition-colors leading-9"
            >
              Iniciar sesión
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-danger-600 text-xl">✕</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Error de confirmación
            </h1>
            <p className="text-sm text-slate-500 mb-6">{message}</p>
            <Link href="/login" className="text-sm text-primary-600 hover:underline">
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
