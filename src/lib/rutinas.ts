import "server-only";
import { crearClienteServidor } from "./supabase/servidor";
import type { Ejercicio, Rutina, RutinaEjercicio } from "./supabase/tipos";

export type EjercicioDelDia = RutinaEjercicio & { ejercicio: Ejercicio };

export type DiaConEjercicios = {
  id: string;
  numero: number;
  nombre: string;
  notas: string | null;
  /** Todos los bloques en orden: ejercicios, descansos y títulos. */
  bloques: RutinaEjercicio[];
  /** Solo los bloques de ejercicio, ya emparejados con su ficha. */
  ejercicios: EjercicioDelDia[];
};

/** Forma cruda que devuelve PostgREST al pedir las relaciones anidadas. */
type RutinaAnidada = Rutina & {
  rutina_dias: (Omit<DiaConEjercicios, "ejercicios"> & {
    rutina_ejercicios: (RutinaEjercicio & { ejercicios: Ejercicio | null })[];
  })[];
};

const CONSULTA = "*, rutina_dias(*, rutina_ejercicios(*, ejercicios(*)))";

function ordenar(cruda: RutinaAnidada): DiaConEjercicios[] {
  return [...(cruda.rutina_dias ?? [])]
    .sort((a, b) => a.numero - b.numero)
    .map((d) => {
      const enOrden = [...(d.rutina_ejercicios ?? [])].sort(
        (a, b) => a.orden - b.orden
      );
      return {
        id: d.id,
        numero: d.numero,
        nombre: d.nombre,
        notas: d.notas,
        // El editor necesita la fila cruda, sin el ejercicio anidado.
        // `tipo` puede faltar si todavía no se aplicó la migración de bloques:
        // en ese caso toda fila es un ejercicio, como era antes.
        bloques: enOrden.map((re) => {
          const fila = { ...re } as Partial<typeof re>;
          delete fila.ejercicios;
          return {
            ...fila,
            tipo: re.tipo ?? "ejercicio",
            texto: re.texto ?? null,
            grupo: re.grupo ?? null,
            grupo_repeticiones: re.grupo_repeticiones ?? 1,
          } as RutinaEjercicio;
        }),
        ejercicios: enOrden.flatMap((re) =>
          (re.tipo ?? "ejercicio") === "ejercicio" && re.ejercicios
            ? [{ ...re, tipo: "ejercicio" as const, ejercicio: re.ejercicios }]
            : []
        ),
      };
    });
}

/**
 * Rutina activa de una clienta con sus días y ejercicios, en **una sola**
 * consulta. Antes eran cuatro viajes encadenados a la base (rutina → días →
 * ejercicios asignados → catálogo), y cada viaje cuesta ~90 ms.
 */
export async function rutinaActivaDe(
  clienteId: string
): Promise<{ rutina: Rutina; dias: DiaConEjercicios[] } | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("rutinas")
    .select(CONSULTA)
    .eq("cliente_id", clienteId)
    .eq("activa", true)
    .order("creado_en", { ascending: false })
    .limit(1)
    .returns<RutinaAnidada[]>();

  const cruda = data?.[0];
  if (!cruda) return null;
  return { rutina: cruda, dias: ordenar(cruda) };
}

/**
 * Un día concreto con su rutina y sus ejercicios. Se pide por la rutina que
 * contiene ese día, para traerlo todo de una vez.
 */
export async function diaConSuRutina(
  diaId: string
): Promise<{ rutina: Rutina; dia: DiaConEjercicios } | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("rutinas")
    .select(CONSULTA)
    .eq("rutina_dias.id", diaId)
    .not("rutina_dias", "is", null)
    .limit(1)
    .returns<RutinaAnidada[]>();

  const cruda = data?.[0];
  if (!cruda) return null;

  const dia = ordenar(cruda).find((d) => d.id === diaId);
  return dia ? { rutina: cruda, dia } : null;
}

export type DiaAgendable = {
  id: string;
  clienteId: string;
  etiqueta: string;
};

/**
 * Días de las rutinas activas asignadas a alguien, para poder agendarlos desde
 * el calendario. Sin esto, una sesión creada a mano no lleva ejercicios.
 */
export async function diasAgendables(): Promise<DiaAgendable[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("rutinas")
    .select("id, nombre, cliente_id, rutina_dias(id, numero, nombre)")
    .eq("activa", true)
    .returns<
      {
        id: string;
        nombre: string;
        cliente_id: string | null;
        rutina_dias: { id: string; numero: number; nombre: string }[];
      }[]
    >();

  return (data ?? [])
    .filter((r) => r.cliente_id)
    .flatMap((r) =>
      [...(r.rutina_dias ?? [])]
        .sort((a, b) => a.numero - b.numero)
        .map((d) => ({
          id: d.id,
          clienteId: r.cliente_id!,
          etiqueta: `${r.nombre} · ${d.nombre}`,
        }))
    );
}

/** Una rutina concreta con todo su contenido, también en una sola consulta. */
export async function rutinaConDias(
  rutinaId: string
): Promise<{ rutina: Rutina; dias: DiaConEjercicios[] } | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("rutinas")
    .select(CONSULTA)
    .eq("id", rutinaId)
    .limit(1)
    .returns<RutinaAnidada[]>();

  const cruda = data?.[0];
  if (!cruda) return null;
  return { rutina: cruda, dias: ordenar(cruda) };
}
