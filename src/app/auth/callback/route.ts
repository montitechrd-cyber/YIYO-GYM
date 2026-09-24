import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { destinoPedido, destinoTrasActivar } from "@/lib/primer-acceso";

/**
 * Vuelta desde Google, Facebook o Apple.
 *
 * El proveedor devuelve un código de un solo uso; aquí se canjea por la
 * sesión y se deja la cookie puesta. Es el único punto de entrada de los
 * accesos sociales: sin esta ruta, el proveedor no tendría a dónde volver.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const siguiente = destinoPedido(url.searchParams.get("siguiente"));

  // El proveedor puede devolver un error (por ejemplo si la persona cancela
  // en la pantalla de Google). Se vuelve al login con un aviso legible en vez
  // de dejarla en una página en blanco.
  const errorProveedor =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (errorProveedor) {
    return NextResponse.redirect(
      new URL(`/entrar?error=${encodeURIComponent(errorProveedor)}`, url.origin)
    );
  }

  if (!codigo) {
    return NextResponse.redirect(new URL("/entrar", url.origin));
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(
        `/entrar?error=${encodeURIComponent(error?.message ?? "No se pudo completar el acceso.")}`,
        url.origin
      )
    );
  }

  // Quien entra por primera vez con Google no pasó por el formulario de
  // registro, así que su ficha de clienta no existe todavía. Lo mismo le
  // pasa a quien confirma su correo, y por eso ambos comparten la misma
  // función: cuando esto vivía suelto aquí, el otro camino se quedó sin
  // ficha.
  const destino =
    siguiente ?? (await destinoTrasActivar(supabase, data.user.id, "registro social"));

  return NextResponse.redirect(new URL(destino, url.origin));
}
