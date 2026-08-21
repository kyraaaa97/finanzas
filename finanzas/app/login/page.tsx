"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Wallet, Lock } from "lucide-react";
import { login, type AuthState } from "./actions";

const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa la contraseña para acceder.
          </p>
        </div>

        <div className="card">
          <form action={formAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  className="input pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {state.error}
              </p>
            )}

            <SubmitButton />
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Acceso protegido por contraseña.
        </p>
      </div>
    </main>
  );
}
