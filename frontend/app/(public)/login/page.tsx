"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser } from "@/lib/auth-context";

const schema = z.object({
  email: z.string().min(1, "Requerido").email("Correo inválido"),
  password: z.string().min(1, "Requerido"),
});
type FormData = z.infer<typeof schema>;

interface LoginResponse {
  access_token: string;
  company_slug: string;
  role: string;
  user_id: string;
  email: string;
  full_name: string;
  company_id: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setServerError("");
    try {
      const { data } = await api.post<LoginResponse>("/api/v1/auth/login", values);
      const user: AuthUser = {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role as AuthUser["role"],
        company_id: data.company_id,
        company_slug: data.company_slug,
      };
      login(data.access_token, user);
      router.push(`/${data.company_slug}/dashboard`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Error al iniciar sesión";
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-md p-8 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Iniciar sesión</h1>
        <p className="text-sm text-slate-500 mb-6">Acceda a su centro gerontológico</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none
                         focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20
                         placeholder:text-slate-400"
              placeholder="admin@empresa.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none
                         focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-md">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-60
                       text-white text-sm font-medium rounded-md transition-colors"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tiene cuenta?{" "}
          <Link href="/register" className="text-primary-600 hover:underline font-medium">
            Registrar centro
          </Link>
        </p>
      </div>
    </div>
  );
}
