// Autenticación simple con UNA sola contraseña para toda la app.
// Sin cuentas ni correos. La contraseña se define en la variable
// de entorno APP_PASSWORD (en Vercel).
//
// Este archivo NO importa next/headers para poder usarse también
// dentro del middleware (Edge runtime).

export const AUTH_COOKIE = "finanzas_auth";

// Genera un token (hash SHA-256) a partir de la contraseña.
// Guardamos el hash en la cookie, nunca la contraseña en texto plano.
export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode("finanzas::" + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Token esperado según la contraseña configurada. null si no hay ninguna.
export async function expectedToken(): Promise<string | null> {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return null;
  return tokenFor(pw);
}
