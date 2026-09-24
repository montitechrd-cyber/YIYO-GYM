import "server-only";
import { crearClienteServidor } from "./supabase/servidor";
import type { Cliente, EstadoCliente, Perfil } from "./supabase/tipos";

export type PerfilBreve = Pick<
  Perfil,
  "id" | "nombre_completo" | "correo" | "avatar_url"
>;

/**
 * Mapa id → perfil para los ids dados. Evita los `select` con embed de
 * PostgREST, que no encajan con los tipos escritos a mano.
 */
export async function mapaPerfiles(
  ids: (string | null | undefined)[]
): Promise<Map<string, PerfilBreve>> {
  const unicos = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (unicos.length === 0) return new Map();

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, correo, avatar_url")
    .in("id", unicos);

  return new Map((data ?? []).map((p) => [p.id, p as PerfilBreve]));
}

export type ClienteConPerfil = Cliente & { perfil: PerfilBreve | null };

/** Relación a seguir: `clientes` apunta dos veces a `perfiles` (clienta y entrenadora). */
const CON_PERFIL =
  "*, perfiles!clientes_perfil_id_fkey(id, nombre_completo, correo, avatar_url)";

/**
 * Fichas de CRM con el perfil de cada persona en **una sola** consulta, en vez
 * de pedir las fichas y después los perfiles en un segundo viaje.
 */
export async function clientesConPerfil(
  opciones: { estado?: EstadoCliente } = {}
): Promise<ClienteConPerfil[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("clientes")
    .select(CON_PERFIL)
    .order("creado_en", { ascending: false });

  if (opciones.estado) consulta = consulta.eq("estado", opciones.estado);

  const { data } = await consulta.returns<
    (Cliente & { perfiles: PerfilBreve | null })[]
  >();

  return (data ?? []).map(({ perfiles, ...c }) => ({ ...c, perfil: perfiles }));
}

/** Una ficha concreta con su perfil, también en una sola consulta. */
export async function clienteConPerfil(
  id: string
): Promise<ClienteConPerfil | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("clientes")
    .select(CON_PERFIL)
    .eq("id", id)
    .limit(1)
    .returns<(Cliente & { perfiles: PerfilBreve | null })[]>();

  const fila = data?.[0];
  if (!fila) return null;
  const { perfiles, ...c } = fila;
  return { ...c, perfil: perfiles };
}

export function iniciales(nombre?: string | null, correo?: string | null) {
  const base = (nombre || "").trim() || correo || "?";
  return base
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function nombreVisible(perfil?: PerfilBreve | null) {
  return perfil?.nombre_completo?.trim() || perfil?.correo || "Sin nombre";
}

/**
 * Asigna la entrenadora a una clienta que todavía no tiene ninguna. Se llama
 * al crear su rutina o agendarle una sesión: sin esto la ficha quedaría
 * huérfana y no aparecería en el CRM de nadie.
 */
export async function asegurarEntrenadora(clienteId: string, entrenadorId: string) {
  const supabase = await crearClienteServidor();
  await supabase
    .from("clientes")
    .update({ entrenador_id: entrenadorId })
    .eq("id", clienteId)
    .is("entrenador_id", null);
}

/**
 * URLs temporales para leer archivos del bucket privado de progreso.
 * Las fotos se guardan como ruta, no como URL, porque el bucket no es público.
 */
export async function urlsFirmadas(
  rutas: string[],
  segundos = 3600
): Promise<Map<string, string>> {
  if (rutas.length === 0) return new Map();

  const supabase = await crearClienteServidor();
  const { data } = await supabase.storage
    .from("progreso")
    .createSignedUrls(rutas, segundos);

  const mapa = new Map<string, string>();
  for (const f of data ?? []) {
    if (f.path && f.signedUrl) mapa.set(f.path, f.signedUrl);
  }
  return mapa;
}
