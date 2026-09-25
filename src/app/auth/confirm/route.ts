import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { destinoPedido, destinoTrasActivar } from "@/lib/primer-acceso";
import { origenPublico } from "@/lib/url-publica";

const TIPOS: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Enlaces de los correos de autenticación: confirmar la cuenta, recuperar la
 * contraseña y confirmar un cambio de dirección.
 *
 * Las plantillas apuntan aquí con `token_hash` y no con el enlace por
 * defecto de Supabase. La diferencia importa: el enlace por defecto vuelve
 * con un código que solo sirve en el navegador donde empezó el registro, y
 * el correo casi siempre se abre en otro sitio —el móvil, el navegador que
 * tenga abierta la sesión de Gmail—. Con `token_hash` el canje ocurre aquí,
 * en el servidor, y funciona desde cualquier aparato.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  // Detrás del proxy de Railway, `url.origin` es el puerto interno.
  const origen = origenPublico(request);
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;

  const fallo = (mensaje: string) =>
    NextResponse.redirect(
      new URL(`/entrar?error=${encodeURIComponent(mensaje)}`, origen)
    );

  if (!tokenHash || !tipo || !TIPOS.includes(tipo)) {
    return fallo("El enlace del correo no es válido. Pide uno nuevo.");
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.verifyOtp({
    type: tipo,
    token_hash: tokenHash,
  });

  if (error || !data.user) {
    // Casi siempre es un enlace caducado o ya usado —cada uno vale una sola
    // vez—, y ahí Supabase responde `otp_expired`. Se traduce en vez de
    // soltar su mensaje en inglés. Por el código y no por el texto: el
    // texto cambia de una versión a otra sin avisar.
    const caducado =
      error?.code === "otp_expired" ||
      error?.message?.toLowerCase().includes("expired");

    return fallo(
      caducado
        ? "Ese enlace ya caducó o se usó antes. Pide uno nuevo desde «¿Olvidaste tu contraseña?»."
        : (error?.message ?? "No se pudo validar el enlace del correo.")
    );
  }

  // Recuperar contraseña deja la sesión abierta a propósito y solo para
  // esto: el formulario de nueva clave la necesita para poder guardarla.
  if (tipo === "recovery") {
    return NextResponse.redirect(new URL("/nueva-contrasena", origen));
  }

  const destino =
    destinoPedido(url.searchParams.get("siguiente")) ??
    (await destinoTrasActivar(supabase, data.user.id, "registro web"));

  return NextResponse.redirect(new URL(destino, origen));
}
