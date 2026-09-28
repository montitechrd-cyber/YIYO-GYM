/** Destino compatible con las plantillas predeterminadas y el flujo PKCE. */
export function retornoCorreo(recuperacion = false): string {
  const origen = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!origen && process.env.NODE_ENV === "production") {
    throw new Error("Falta NEXT_PUBLIC_SITE_URL para los correos de autenticación.");
  }
  const url = new URL("/auth/callback", origen || "http://localhost:3000");
  if (recuperacion) url.searchParams.set("siguiente", "/nueva-contrasena");
  return url.toString();
}

export function errorCorreo(error: { code?: string }): string {
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return "Se han solicitado varios correos. Espera unos minutos antes de intentarlo de nuevo.";
  }
  return "No pudimos enviar el correo. Inténtalo de nuevo más tarde o contacta con Yiyo.";
}
