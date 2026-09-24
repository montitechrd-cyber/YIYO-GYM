"use server";

import { revalidatePath } from "next/cache";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { EstadoPedido } from "@/lib/supabase/tipos";

/** Mueve un pedido por sus etapas: nuevo → confirmado → enviado → entregado. */
export async function cambiarEstadoPedido(
  pedidoId: string,
  estado: EstadoPedido
) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("pedidos")
    .update({ estado })
    .eq("id", pedidoId);
  if (error) return { error: "No se pudo actualizar el pedido." };
  revalidatePath("/admin/pedidos");
  return {};
}
