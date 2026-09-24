"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clienteActual, exigirPerfil } from "@/lib/autenticacion";
import { cancelarSuscripcion, obtenerSuscripcion } from "@/lib/paypal";
import { hoyTexto } from "@/lib/programacion";

export type Resultado = { error?: string; exito?: string };

/**
 * Confirma con PayPal la suscripción que el navegador acaba de aprobar y la
 * guarda. Nunca confía en los datos del cliente: relee todo desde la API.
 */
export async function confirmarSuscripcion(
  planId: string,
  paypalSuscripcionId: string
): Promise<Resultado> {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);
  if (!cliente) return { error: "No encontramos tu ficha de clienta." };

  let datos;
  try {
    datos = await obtenerSuscripcion(paypalSuscripcionId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No pudimos verificar el pago.",
    };
  }

  const activa = datos.status === "ACTIVE" || datos.status === "APPROVED";
  const supabase = await crearClienteServidor();

  const { data: suscripcion, error } = await supabase
    .from("suscripciones")
    .upsert(
      {
        cliente_id: cliente.id,
        plan_id: planId,
        estado: activa ? "activa" : "pendiente",
        paypal_suscripcion_id: paypalSuscripcionId,
        inicio: datos.start_time?.slice(0, 10) ?? hoyTexto(),
        proximo_cobro: datos.billing_info?.next_billing_time?.slice(0, 10) ?? null,
        cancelada_en: null,
      },
      { onConflict: "paypal_suscripcion_id" }
    )
    .select()
    .single();

  if (error) return { error: error.message };

  const ultimoPago = datos.billing_info?.last_payment?.amount;
  if (ultimoPago?.value) {
    await supabase.from("pagos").insert({
      suscripcion_id: suscripcion.id,
      cliente_id: cliente.id,
      monto: Number(ultimoPago.value),
      moneda: ultimoPago.currency_code ?? "USD",
      estado: "completado",
      paypal_pago_id: `${paypalSuscripcionId}-inicial`,
    });
  }

  await supabase.from("clientes").update({ estado: "activo" }).eq("id", cliente.id);

  revalidatePath("/panel/suscripcion");
  revalidatePath("/admin");
  return { exito: "¡Suscripción activada! Bienvenida a YIYO GYM." };
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
