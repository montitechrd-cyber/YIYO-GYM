import { NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { verificarWebhook } from "@/lib/paypal";
import type { EstadoSuscripcion } from "@/lib/supabase/tipos";

type EventoPaypal = {
  event_type: string;
  resource: {
    id?: string;
    billing_agreement_id?: string;
    status?: string;
    billing_info?: { next_billing_time?: string };
    amount?: { total?: string; currency?: string };
  };
};

const ESTADO_POR_EVENTO: Record<string, EstadoSuscripcion> = {
  "BILLING.SUBSCRIPTION.ACTIVATED": "activa",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED": "activa",
  "BILLING.SUBSCRIPTION.CANCELLED": "cancelada",
  "BILLING.SUBSCRIPTION.SUSPENDED": "pendiente",
  "BILLING.SUBSCRIPTION.EXPIRED": "vencida",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED": "pendiente",
};

export async function POST(peticion: Request) {
  const cuerpo = await peticion.text();

  const valido = await verificarWebhook(peticion.headers, cuerpo).catch(() => false);
  if (!valido) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const evento = JSON.parse(cuerpo) as EventoPaypal;
  const supabase = crearClienteAdmin();

  const nuevoEstado = ESTADO_POR_EVENTO[evento.event_type];
  if (nuevoEstado && evento.resource.id) {
    await supabase
      .from("suscripciones")
      .update({
        estado: nuevoEstado,
        proximo_cobro:
          evento.resource.billing_info?.next_billing_time?.slice(0, 10) ?? null,
        ...(nuevoEstado === "cancelada"
          ? { cancelada_en: new Date().toISOString() }
          : {}),
      })
      .eq("paypal_suscripcion_id", evento.resource.id);
  }

  // Cada cobro recurrente completado se registra como pago.
  if (evento.event_type === "PAYMENT.SALE.COMPLETED") {
    const suscripcionPaypal = evento.resource.billing_agreement_id;
    const monto = evento.resource.amount?.total;

    if (suscripcionPaypal && monto) {
      const { data: suscripcion } = await supabase
        .from("suscripciones")
        .select("id, cliente_id")
        .eq("paypal_suscripcion_id", suscripcionPaypal)
        .maybeSingle();

      if (suscripcion) {
        await supabase.from("pagos").upsert(
          {
            suscripcion_id: suscripcion.id,
            cliente_id: suscripcion.cliente_id,
            monto: Number(monto),
            moneda: evento.resource.amount?.currency ?? "USD",
            estado: "completado",
            paypal_pago_id: evento.resource.id ?? null,
          },
          { onConflict: "paypal_pago_id" }
        );

        const { data: cliente } = await supabase
          .from("clientes")
          .select("perfil_id")
          .eq("id", suscripcion.cliente_id)
          .maybeSingle();

        if (cliente) {
          await supabase.from("notificaciones").insert({
            perfil_id: cliente.perfil_id,
            tipo: "pago",
            titulo: "Pago recibido",
            cuerpo: `Procesamos tu pago de $${monto}. ¡Gracias!`,
            enlace: "/panel/suscripcion",
          });
        }
      }
    }
  }

  return NextResponse.json({ recibido: true });
}
