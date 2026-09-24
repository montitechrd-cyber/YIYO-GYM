import "server-only";
import { crearClienteServidor } from "./supabase/servidor";
import type {
  PlanAlimentacion,
  Rutina,
  RutinaEjercicio,
} from "./supabase/tipos";

/**
 * El catálogo: los programas y los planes de alimentación que trae la
 * plataforma ya armados.
 *
 * Una plantilla (`es_sistema`) no pertenece a nadie y no se toca. Asignarla
 * significa copiarla entera para una clienta, y esa copia sí se puede
 * ajustar sin afectar a las demás.
 */

export type ProgramaDelCatalogo = Rutina & {
  /** Cuántos días trae y cómo se llama cada uno. */
  dias: { numero: number; nombre: string }[];
  /** Ejercicios distintos que incluye, para la vista previa. */
  totalEjercicios: number;
};

type ProgramaCrudo = Rutina & {
  rutina_dias: {
    numero: number;
    nombre: string;
    rutina_ejercicios: { tipo: string }[];
  }[];
};

/** Los 7 programas de entrenamiento, ordenados: primero niveles. */
export async function catalogoDeProgramas(): Promise<ProgramaDelCatalogo[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("rutinas")
    .select("*, rutina_dias(numero, nombre, rutina_ejercicios(tipo))")
    .eq("es_sistema", true)
    .eq("activa", true)
    .order("orden")
    .returns<ProgramaCrudo[]>();

  return (data ?? []).map((p) => {
    const dias = [...(p.rutina_dias ?? [])].sort((a, b) => a.numero - b.numero);
    return {
      ...p,
      dias: dias.map((d) => ({ numero: d.numero, nombre: d.nombre })),
      totalEjercicios: dias.reduce(
        (n, d) =>
          n + (d.rutina_ejercicios ?? []).filter((b) => b.tipo === "ejercicio").length,
        0
      ),
    };
  });
}

export type PlanDelCatalogo = PlanAlimentacion & {
  totalComidas: number;
};

/** Los planes de alimentación prearmados, uno por objetivo. */
export async function catalogoDePlanes(): Promise<PlanDelCatalogo[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("planes_alimentacion")
    .select("*, plan_dias(plan_comidas(id))")
    .eq("es_sistema", true)
    .order("orden")
    .returns<(PlanAlimentacion & { plan_dias: { plan_comidas: { id: string }[] }[] })[]>();

  return (data ?? []).map((p) => ({
    ...p,
    totalComidas: (p.plan_dias ?? []).reduce(
      (n, d) => n + (d.plan_comidas ?? []).length,
      0
    ),
  }));
}

/** Contenido completo de una plantilla de entrenamiento, para copiarla. */
export async function programaCompleto(programaId: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("rutinas")
    .select("*, rutina_dias(*, rutina_ejercicios(*))")
    .eq("id", programaId)
    .eq("es_sistema", true)
    .limit(1)
    .returns<
      (Rutina & {
        rutina_dias: {
          id: string;
          numero: number;
          nombre: string;
          notas: string | null;
          rutina_ejercicios: RutinaEjercicio[];
        }[];
      })[]
    >();

  const p = data?.[0];
  if (!p) return null;

  return {
    programa: p as Rutina,
    dias: [...(p.rutina_dias ?? [])]
      .sort((a, b) => a.numero - b.numero)
      .map((d) => ({
        numero: d.numero,
        nombre: d.nombre,
        notas: d.notas,
        bloques: [...(d.rutina_ejercicios ?? [])].sort((a, b) => a.orden - b.orden),
      })),
  };
}
