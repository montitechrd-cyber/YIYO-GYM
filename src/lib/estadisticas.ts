import "server-only";
import { crearClienteServidor } from "./supabase/servidor";
import { macrosDe, sumarMacros } from "./nutricion";
import { hoyTexto, lunesDesde, fechaATexto } from "./programacion";
import type { Alimento, ComidaAlimento } from "./supabase/tipos";

export type EstadisticasSemana = {
  /** Ejercicios distintos marcados como hechos esta semana (lunes a hoy). */
  ejerciciosSemana: number;
  /** Sesiones de entrenamiento completadas esta semana. */
  sesionesSemana: number;
  /** Calorías de las comidas marcadas como hechas hoy. */
  caloriasHoy: number;
  /** Objetivo diario del plan activo, si tiene uno. */
  caloriasObjetivo: number | null;
};

/**
 * Lo que ve la clienta arriba de sus gráficas de peso: cuánto ha hecho esta
 * semana, sin tener que ir a tres pantallas distintas a sumarlo ella misma.
 */
export async function estadisticasSemana(clienteId: string): Promise<EstadisticasSemana> {
  const supabase = await crearClienteServidor();
  const hoy = hoyTexto();
  const inicioSemana = fechaATexto(lunesDesde(new Date(hoy + "T00:00:00")));

  // Registros de esta semana, para saber en cuáles buscar series completadas.
  const { data: registrosSemana } = await supabase
    .from("registros_entrenamiento")
    .select("id")
    .eq("cliente_id", clienteId)
    .gte("fecha", inicioSemana);
  const idsRegistros = (registrosSemana ?? []).map((r) => r.id);

  const [ejercicios, sesiones, comidasHoy, planActivo] = await Promise.all([
    // Ejercicios distintos con al menos una serie completada esta semana.
    idsRegistros.length > 0
      ? supabase
          .from("series_registradas")
          .select("ejercicio_id")
          .eq("completada", true)
          .in("registro_id", idsRegistros)
      : Promise.resolve({ data: [] as { ejercicio_id: string | null }[] }),

    supabase
      .from("sesiones")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", clienteId)
      .eq("tipo_sesion", "entrenamiento")
      .eq("estado", "completada")
      .gte("fecha", inicioSemana),

    supabase
      .from("registro_comidas")
      .select("comida_id")
      .eq("cliente_id", clienteId)
      .eq("fecha", hoy)
      .eq("cumplida", true),

    supabase
      .from("planes_alimentacion")
      .select("calorias_objetivo")
      .eq("cliente_id", clienteId)
      .eq("activo", true)
      .limit(1)
      .maybeSingle(),
  ]);

  const idsEjercicios = new Set(
    (ejercicios.data ?? []).map((s) => s.ejercicio_id).filter((id): id is string => !!id)
  );

  const idsComidas = (comidasHoy.data ?? []).map((r) => r.comida_id);
  let caloriasHoy = 0;
  if (idsComidas.length > 0) {
    const { data: ingredientes } = await supabase
      .from("comida_alimentos")
      .select("cantidad, alimentos(*)")
      .in("comida_id", idsComidas)
      .returns<(ComidaAlimento & { alimentos: Alimento | null })[]>();

    const macros = sumarMacros(
      (ingredientes ?? [])
        .filter((i) => i.alimentos)
        .map((i) => macrosDe(i.alimentos as Alimento, Number(i.cantidad)))
    );
    caloriasHoy = Math.round(macros.calorias);
  }

  return {
    ejerciciosSemana: idsEjercicios.size,
    sesionesSemana: sesiones.count ?? 0,
    caloriasHoy,
    caloriasObjetivo: planActivo.data?.calorias_objetivo ?? null,
  };
}
