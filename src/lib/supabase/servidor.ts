import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./tipos";

export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return almacen.getAll();
        },
        setAll(nuevas) {
          try {
            nuevas.forEach(({ name, value, options }) =>
              almacen.set(name, value, options)
            );
          } catch {
            // Los Server Components no pueden escribir cookies; el middleware
            // ya refresca la sesión, así que aquí es seguro ignorarlo.
          }
        },
      },
    }
  );
}

/** Cliente con permisos de administrador. Solo en servidor, nunca expuesto. */
export function crearClienteAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
