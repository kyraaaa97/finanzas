"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Wallet } from "lucide-react";
import { login, signup, type AuthState } from "./actions";

const initialState: AuthState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Cargando…" : label}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useFormState(action, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Controla tus ingresos, gastos y metas de ahorro.
          </p>
        </div>

        <div className="card">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setMode("login")}
              className={`rounded-lg py-1.5 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`rounded-lg py-1.5 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {state.error}
              </p>
            )}
            {state.message && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                {state.message}
              </p>
            )}

            <SubmitButton
              label={mode === "login" ? "Entrar" : "Registrarme"}
            />
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Tus datos se guardan de forma privada en tu propia base de datos de
          Supabase.
        </p>
      </div>
    </main>
  );
}
