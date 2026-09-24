import "server-only";
import { crearClienteServidor } from "./supabase/servidor";
import type { Notificacion } from "./supabase/tipos";

export async function notificacionesDe(perfilId: string): Promise<Notificacion[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("perfil_id", perfilId)
    .order("creado_en", { ascending: false })
    .limit(30);

  return data ?? [];
}
