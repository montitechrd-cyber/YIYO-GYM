"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clienteActual, exigirPerfil } from "@/lib/autenticacion";
import { cancelarSuscripcion } from "@/lib/paypal";

export type Resultado = { error?: string; exito?: string };

/** Las altas de pago online están pausadas; se conserva la cancelación de planes existentes. */
export async function confirmarSuscripcion(): Promise<Resultado> {
  await exigirPerfil();
  return { error: "Los pagos online están deshabilitados por ahora. Contacta con Yiyo para gestionar tu plan." };
}

export async function cancelarMiSuscripcion(id: string): Promise<Resultado> {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);
  if (!cliente) return { error: "No encontramos tu ficha de clienta." };

  const supabase = await crearClienteServidor();
  const { data: suscripcion } = await supabase
    .from("suscripciones")
    .select("*")
    .eq("id", id)
    .eq("cliente_id", cliente.id)
    .maybeSingle();

  if (!suscripcion) return { error: "Suscripción no encontrada." };

  if (suscripcion.paypal_suscripcion_id) {
    try {
      await cancelarSuscripcion(
        suscripcion.paypal_suscripcion_id,
        "Cancelada por la clienta desde la plataforma"
      );
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "PayPal rechazó la cancelación.",
      };
    }
  }

  await supabase
    .from("suscripciones")
    .update({ estado: "cancelada", cancelada_en: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/panel/suscripcion");
  revalidatePath("/admin");
  return { exito: "Tu suscripción quedó cancelada." };
}
