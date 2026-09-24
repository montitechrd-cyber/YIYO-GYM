import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { rutaInicio } from "@/lib/autenticacion";

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
  const siguiente = url.searchParams.get("siguiente");

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
  // registro, así que su ficha de clienta no existe todavía: se crea aquí
  // para que llegue directo a su evaluación inicial, igual que en el
  // registro normal.
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", data.user.id)
    .maybeSingle();

  if (perfil?.rol === "cliente") {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("perfil_id", data.user.id)
      .maybeSingle();

    if (!cliente) {
      await supabase.from("clientes").insert({
        perfil_id: data.user.id,
        estado: "prospecto",
        origen: "registro social",
      });
      return NextResponse.redirect(new URL("/panel/bienvenida", url.origin));
    }
  }

  // Cada rol entra por su propia puerta. Antes esto mandaba siempre a
  // `/panel`, dando por hecho que el middleware reencaminaría según el rol
  // —y no lo hace: solo protege `/admin` y `/entrenador`—, así que una
  // administradora acababa dentro del panel de clienta.
  return NextResponse.redirect(
    new URL(siguiente ?? rutaInicio(perfil?.rol ?? "cliente"), url.origin)
  );
}
