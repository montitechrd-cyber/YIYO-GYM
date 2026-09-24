import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rutaInicio } from "./autenticacion";
import type { Database } from "./supabase/tipos";

/**
 * Destino interno pedido por la URL, o null si no lo es.
 *
 * Solo rutas de esta plataforma: un `siguiente` que empiece por `//` o por
 * `http` sería un enlace saliente firmado con nuestro dominio, justo lo que
 * busca quien reparte enlaces de acceso manipulados.
 */
export function destinoPedido(valor: string | null): string | null {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) return null;
  return valor;
}

/**
 * A dónde va alguien la primera vez que su cuenta queda activa.
 *
 * Hay dos caminos que terminan aquí —volver de Google y confirmar el correo—
 * y ninguno de los dos pasa por el formulario de registro, así que la ficha
 * de clienta no existe todavía: se crea en este punto o el panel recibiría a
 * una clienta sin expediente. Lo comparten los dos para que no se separen:
 * cuando esto vivía duplicado en la vuelta de Google, el otro camino se
 * quedó sin la ficha.
 */
export async function destinoTrasActivar(
  supabase: SupabaseClient<Database>,
  usuarioId: string,
  origen: "registro social" | "registro web"
): Promise<string> {
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", usuarioId)
    .maybeSingle();

  if (perfil?.rol === "cliente") {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("perfil_id", usuarioId)
      .maybeSingle();

    if (!cliente) {
      await supabase
        .from("clientes")
        .insert({ perfil_id: usuarioId, estado: "prospecto", origen });
      return "/panel/bienvenida";
    }
  }

  // Cada rol entra por su propia puerta. Antes esto mandaba siempre a
  // `/panel`, dando por hecho que el middleware reencaminaría según el rol
  // —y no lo hace: solo protege `/admin` y `/entrenador`—, así que una
  // administradora acababa dentro del panel de clienta.
  return rutaInicio(perfil?.rol ?? "cliente");
}
