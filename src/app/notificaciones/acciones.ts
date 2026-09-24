"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirPerfil } from "@/lib/autenticacion";

export async function marcarNotificacionLeida(id: string) {
  await exigirPerfil();
  const supabase = await crearClienteServidor();
  await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function marcarTodasLeidas() {
  const perfil = await exigirPerfil();
  const supabase = await crearClienteServidor();
  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("perfil_id", perfil.id)
    .eq("leida", false);
  revalidatePath("/", "layout");
}
