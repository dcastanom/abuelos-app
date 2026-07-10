"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { api } from "@/lib/api";

const schema = z.object({
  company_name: z.string().min(1, "Requerido"),
  legal_id: z.string().min(1, "Requerido"),
  admin_name: z.string().min(1, "Requerido"),
  admin_email: z.string().min(1, "Requerido").email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setServerError("");
    try {
      await api.post("/api/v1/auth/register-company", values);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Error al registrar";
      setServerError(msg);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-full max-w-md p-8 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-success-600 text-xl">✓</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">¡Registro exitoso!</h1>
          <p className="text-sm text-slate-500">
            Hemos enviado un correo de confirmación. Revise su bandeja de entrada para activar su
            cuenta.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-primary-600 hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] py-10">
      <div className="w-full max-w-lg p-8 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Registrar centro</h1>
        <p className="text-sm text-slate-500 mb-6">Cree su cuenta de administrador</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Nombre del centro" error={errors.company_name?.message}>
            <input
              {...register("company_name")}
              placeholder="Centro Gerontológico San José"
              className={inputCls}
            />
          </Field>

          <Field label="NIT / CC (identificación legal)" error={errors.legal_id?.message}>
            <input {...register("legal_id")} placeholder="900123456-7" className={inputCls} />
          </Field>

          <Field label="Nombre del administrador" error={errors.admin_name?.message}>
            <input {...register("admin_name")} placeholder="María García" className={inputCls} />
          </Field>

          <Field label="Correo electrónico" error={errors.admin_email?.message}>
            <input
              type="email"
              autoComplete="email"
              {...register("admin_email")}
              placeholder="admin@centro.com"
              className={inputCls}
            />
          </Field>

          <Field label="Contraseña" error={errors.password?.message}>
            <input
              type="password"
              autoComplete="new-password"
              {...register("password")}
              className={inputCls}
            />
          </Field>

          {serverError && (
            <p className="text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-md">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-60
                       text-white text-sm font-medium rounded-md transition-colors mt-2"
          >
            {isSubmitting ? "Registrando..." : "Registrar centro"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tiene cuenta?{" "}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none " +
  "focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 placeholder:text-slate-400";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}
