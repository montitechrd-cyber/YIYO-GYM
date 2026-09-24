import "server-only";

const BASE =
  process.env.PAYPAL_ENTORNO === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export function paypalConfigurado() {
  return Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  );
}

async function token() {
  const credenciales = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const respuesta = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credenciales}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!respuesta.ok) {
    throw new Error(`PayPal rechazó las credenciales (${respuesta.status}).`);
  }

  const datos = (await respuesta.json()) as { access_token: string };
  return datos.access_token;
}

async function llamar<T>(ruta: string, init?: RequestInit): Promise<T> {
  const acceso = await token();
  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${acceso}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const cuerpo = await respuesta.text();
  if (!respuesta.ok) {
    throw new Error(`PayPal ${respuesta.status}: ${cuerpo}`);
  }
  return cuerpo ? (JSON.parse(cuerpo) as T) : ({} as T);
}

export type SuscripcionPaypal = {
  id: string;
  status: string;
  plan_id: string;
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { amount?: { value?: string; currency_code?: string } };
  };
};

export function obtenerSuscripcion(id: string) {
  return llamar<SuscripcionPaypal>(`/v1/billing/subscriptions/${id}`);
}

export function cancelarSuscripcion(id: string, motivo: string) {
  return llamar(`/v1/billing/subscriptions/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: motivo }),
  });
}

/** Verifica la firma de un webhook contra la API de PayPal. */
export async function verificarWebhook(
  cabeceras: Headers,
  cuerpoCrudo: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const resultado = await llamar<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: cabeceras.get("paypal-auth-algo"),
        cert_url: cabeceras.get("paypal-cert-url"),
        transmission_id: cabeceras.get("paypal-transmission-id"),
        transmission_sig: cabeceras.get("paypal-transmission-sig"),
        transmission_time: cabeceras.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: JSON.parse(cuerpoCrudo),
      }),
    }
  );

  return resultado.verification_status === "SUCCESS";
}
