import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase con permisos de servidor (clave secreta / service role).
// SOLO se usa desde el servidor (Server Components y Server Actions), nunca
// desde el navegador: la clave secreta jamás se envía al cliente.
//
// Con esto, la base de datos NO es accesible directamente desde afuera
// (la protección real está en el servidor + la contraseña de la app).
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
