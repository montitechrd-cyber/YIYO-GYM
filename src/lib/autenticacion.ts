import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "./supabase/servidor";
import type { Perfil, RolUsuario } from "./supabase/tipos";

/**
 * Identificador de la persona en sesión, verificando la firma del token en
 * local. Antes se usaba `getUser()`, que preguntaba al servidor de Supabase en
 * cada llamada: un viaje de red de ~90 ms repetido varias veces por página.
 *
 * `cache()` memoriza el resultado durante una misma petición, así el layout y
 * la página comparten la respuesta en vez de pedirla cada uno por su lado.
 */
export const idUsuarioActual = cache(async (): Promise<string | null> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
});

/** Perfil del usuario en sesión, o null si no hay sesión. */
export const perfilActual = cache(async (): Promise<Perfil | null> => {
  const id = await idUsuarioActual();
  if (!id) return null;

  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("perfiles").select("*").eq("id", id).single();
  return data ?? null;
});

/** Exige sesión. Redirige a /entrar si no la hay. */
export async function exigirPerfil(): Promise<Perfil> {
  const perfil = await perfilActual();
  if (!perfil) redirect("/entrar");
  return perfil;
}

/** Exige uno de los roles indicados. Redirige al panel correspondiente si no. */
export async function exigirRol(...roles: RolUsuario[]): Promise<Perfil> {
  const perfil = await exigirPerfil();
  if (!roles.includes(perfil.rol)) redirect(rutaInicio(perfil.rol));
  return perfil;
}

export function rutaInicio(rol: RolUsuario) {
  if (rol === "admin") return "/admin";
  if (rol === "entrenador") return "/entrenador";
  return "/panel";
}

/** Fila de `clientes` del usuario en sesión (solo para rol cliente). */
export const clienteActual = cache(async (perfilId: string) => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("perfil_id", perfilId)
    .maybeSingle();
  return data;
});

export type FactorMfa = { id: string; estado: "verificado" | "pendiente" };

/**
 * Métodos de verificación en dos pasos de quien tiene la sesión abierta.
 *
 * Se lee en el servidor para que la tarjeta de seguridad llegue ya con su
 * estado puesto, sin parpadeo ni una consulta extra desde el navegador.
 */
export async function factoresMfa(): Promise<FactorMfa[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.mfa.listFactors();
  // `all` y no `totp`: esta última omite los factores aún sin verificar.
  return (data?.all ?? [])
    .filter((f) => f.factor_type === "totp")
    .map((f) => ({
      id: f.id,
      estado: f.status === "verified" ? "verificado" : "pendiente",
    }));
}
