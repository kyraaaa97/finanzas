"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, tokenFor } from "@/lib/auth";

export type AuthState = { error?: string };

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") || "");
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return {
      error:
        "La app no tiene una contraseña configurada. Agrega APP_PASSWORD en Vercel.",
    };
  }
  if (!password || password !== expected) {
    return { error: "Contraseña incorrecta." };
  }

  const token = await tokenFor(password);
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  redirect("/dashboard");
}
