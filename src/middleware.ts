import { NextResponse, type NextRequest } from "next/server";
import { origenPublico } from "@/lib/url-publica";
import { createServerClient } from "@supabase/ssr";

const RUTAS_PRIVADAS = ["/panel", "/entrenador", "/admin"];
const RUTAS_AUTH = ["/entrar", "/registro"];

/** Pantalla donde se completa la verificación en dos pasos. */
const RUTA_VERIFICAR = "/verificar";

export async function middleware(request: NextRequest) {
  const ruta = request.nextUrl.pathname;
  const esPrivada = RUTAS_PRIVADAS.some((r) => ruta.startsWith(r));
  const esDeAuth = RUTAS_AUTH.some((r) => ruta.startsWith(r));
  const esVerificar = ruta.startsWith(RUTA_VERIFICAR);

  // Las páginas públicas no necesitan tocar Supabase.
  if (!esPrivada && !esDeAuth && !esVerificar) {
    return NextResponse.next({ request });
  }

  let respuesta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin credenciales configuradas todavía: deja pasar y que la app avise.
  if (!url || !key) return respuesta;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (nuevas) => {
        nuevas.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        nuevas.forEach(({ name, value, options }) =>
          respuesta.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verificación local de la firma del token: sin viaje de red.
  const { data: token } = await supabase.auth.getClaims();
  const idUsuario = token?.claims?.sub as string | undefined;

  if (esPrivada && !idUsuario) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.searchParams.set("siguiente", ruta);
    return NextResponse.redirect(destino);
  }

  if (!idUsuario) {
    // Sin sesión no hay nada que verificar.
    return esVerificar
      ? NextResponse.redirect(new URL("/entrar", origenPublico(request)))
      : respuesta;
  }

  // Verificación en dos pasos: con la contraseña sola el token queda en
  // `aal1` y sube a `aal2` al meter el código. Sin este bloqueo, quien
  // supiera la contraseña podría escribir /panel a mano y saltarse el
  // segundo paso, que entonces no protegería de nada.
  const { data: nivel } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const faltaSegundoPaso =
    nivel?.nextLevel === "aal2" && nivel.currentLevel !== "aal2";

  if (esVerificar) {
    // Nada que verificar: o ya lo hizo, o no tiene segundo factor.
    if (!faltaSegundoPaso) {
      return NextResponse.redirect(new URL("/panel", origenPublico(request)));
    }
    return respuesta;
  }

  if (esPrivada && faltaSegundoPaso) {
    return NextResponse.redirect(new URL(RUTA_VERIFICAR, origenPublico(request)));
  }

  // El rol solo se consulta cuando hace falta decidir con él. El área de la
  // clienta la puede ver cualquier sesión, así que ahí nos ahorramos la consulta.
  const necesitaRol =
    esDeAuth || ruta.startsWith("/admin") || ruta.startsWith("/entrenador");

  if (!necesitaRol) return respuesta;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", idUsuario)
    .single();

  const rol = perfil?.rol ?? "cliente";
  const inicio =
    rol === "admin" ? "/admin" : rol === "entrenador" ? "/entrenador" : "/panel";

  // Con sesión abierta, las pantallas de entrar/registrarse llevan al panel.
  if (esDeAuth) {
    const destino = request.nextUrl.clone();
    destino.search = "";
    destino.pathname = inicio;
    return NextResponse.redirect(destino);
  }

  const permitido =
    (ruta.startsWith("/admin") && rol === "admin") ||
    (ruta.startsWith("/entrenador") && (rol === "entrenador" || rol === "admin"));

  if (!permitido) {
    const destino = request.nextUrl.clone();
    destino.search = "";
    destino.pathname = inicio;
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
