import "server-only";
import { crearClienteServidor } from "./supabase/servidor";

/**
 * Devuelve la conversación entre una clienta y su entrenadora, creándola si
 * todavía no existe. Si la clienta no tiene entrenadora asignada, toma la
 * primera cuenta de staff disponible (el caso típico: solo Yiyo).
 */
export async function obtenerConversacion(
  clienteId: string,
  entrenadorAsignado?: string | null
) {
  const supabase = await crearClienteServidor();

  let entrenadorId = entrenadorAsignado ?? null;

  // Solo se consulta la ficha si quien llama no la tenía ya cargada.
  if (entrenadorAsignado === undefined) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, entrenador_id")
      .eq("id", clienteId)
      .maybeSingle();

    if (!cliente) return null;
    entrenadorId = cliente.entrenador_id;
  }

  if (!entrenadorId) {
    const { data: staff } = await supabase
      .from("perfiles")
      .select("id, rol")
      .in("rol", ["entrenador", "admin"])
      .order("creado_en")
      .limit(1)
      .maybeSingle();

    if (!staff) return null;
    entrenadorId = staff.id;
  }

  const { data: existente } = await supabase
    .from("conversaciones")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("entrenador_id", entrenadorId)
    .maybeSingle();

  if (existente) return existente;

  const { data: nueva } = await supabase
    .from("conversaciones")
    .insert({ cliente_id: clienteId, entrenador_id: entrenadorId })
    .select()
    .single();

  return nueva;
}
