import "server-only";
import { crearClienteServidor } from "./supabase/servidor";
import {
  edadDesde,
  macrosDe,
  sugerirObjetivo,
  sumarMacros,
  type Macros,
  type Sugerencia,
} from "./nutricion";
import { clientesConPerfil, nombreVisible } from "./datos";
import type {
  Alimento,
  ComidaAlimento,
  PlanAlimentacion,
  PlanComida,
} from "./supabase/tipos";

export type IngredienteConAlimento = ComidaAlimento & { alimento: Alimento };

export type ComidaConMacros = PlanComida & {
  ingredientes: IngredienteConAlimento[];
  macros: Macros;
};

export type DiaConComidas = {
  id: string;
  numero: number;
  nombre: string;
  notas: string | null;
  comidas: ComidaConMacros[];
  macros: Macros;
};

export type PlanCompleto = {
  plan: PlanAlimentacion;
  dias: DiaConComidas[];
};

/** Forma cruda que devuelve PostgREST con las relaciones anidadas. */
type PlanAnidado = PlanAlimentacion & {
  plan_dias: {
    id: string;
    numero: number;
    nombre: string;
    notas: string | null;
    plan_comidas: (PlanComida & {
      comida_alimentos: (ComidaAlimento & { alimentos: Alimento | null })[];
    })[];
  }[];
};

const CONSULTA =
  "*, plan_dias(*, plan_comidas(*, comida_alimentos(*, alimentos(*))))";

function ordenar(cruda: PlanAnidado): DiaConComidas[] {
  return [...(cruda.plan_dias ?? [])]
    .sort((a, b) => a.numero - b.numero)
    .map((d) => {
      const comidas: ComidaConMacros[] = [...(d.plan_comidas ?? [])]
        .sort((a, b) => a.orden - b.orden)
        .map((c) => {
          const ingredientes = [...(c.comida_alimentos ?? [])]
            .sort((a, b) => a.orden - b.orden)
            .flatMap((ca) =>
              ca.alimentos ? [{ ...ca, alimento: ca.alimentos }] : []
            );

          return {
            ...c,
            ingredientes,
            macros: sumarMacros(
              ingredientes.map((i) => macrosDe(i.alimento, Number(i.cantidad)))
            ),
          };
        });

      return {
        id: d.id,
        numero: d.numero,
        nombre: d.nombre,
        notas: d.notas,
        comidas,
        macros: sumarMacros(comidas.map((c) => c.macros)),
      };
    });
}

/** Plan de alimentación activo de una clienta, con todo su contenido. */
export async function planActivoDe(
  clienteId: string
): Promise<PlanCompleto | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("planes_alimentacion")
    .select(CONSULTA)
    .eq("cliente_id", clienteId)
    .eq("activo", true)
    .order("creado_en", { ascending: false })
    .limit(1)
    .returns<PlanAnidado[]>();

  const cruda = data?.[0];
  return cruda ? { plan: cruda, dias: ordenar(cruda) } : null;
}

/** Un plan concreto con todo su contenido. */
export async function planCompleto(
  planId: string
): Promise<PlanCompleto | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("planes_alimentacion")
    .select(CONSULTA)
    .eq("id", planId)
    .limit(1)
    .returns<PlanAnidado[]>();

  const cruda = data?.[0];
  return cruda ? { plan: cruda, dias: ordenar(cruda) } : null;
}

export type ClienteConSugerencia = {
  id: string;
  nombre: string;
  /** Calorías propuestas a partir de sus datos, o null si faltan. */
  sugerencia: Sugerencia | null;
  /** Qué datos faltan para poder proponerlas. */
  faltan: string[];
};

/**
 * Las clientas con las calorías que les tocarían según su evaluación.
 *
 * Se usa igual al crear una dieta a mano que al asignar un plan prearmado,
 * así que vive aquí y no dentro de una pantalla.
 */
export async function clientesConSugerencia(): Promise<ClienteConSugerencia[]> {
  const supabase = await crearClienteServidor();
  const clientes = await clientesConPerfil();
  if (clientes.length === 0) return [];

  const [{ data: evaluaciones }, { data: perfiles }] = await Promise.all([
    supabase
      .from("evaluaciones")
      .select("cliente_id, peso_kg, altura_cm, dias_disponibles, fecha")
      .in(
        "cliente_id",
        clientes.map((c) => c.id)
      )
      .order("fecha", { ascending: false }),
    supabase
      .from("perfiles")
      .select("id, fecha_nacimiento, genero")
      .in(
        "id",
        clientes.map((c) => c.perfil_id)
      ),
  ]);

  const perfilPorId = new Map((perfiles ?? []).map((p) => [p.id, p]));

  // Vienen de más reciente a más antigua: nos quedamos con la primera de cada una.
  type Evaluacion = {
    cliente_id: string;
    peso_kg: number | null;
    altura_cm: number | null;
    dias_disponibles: number | null;
  };
  const ultima = new Map<string, Evaluacion>();
  for (const e of (evaluaciones ?? []) as Evaluacion[]) {
    if (!ultima.has(e.cliente_id)) ultima.set(e.cliente_id, e);
  }

  return clientes.map((c) => {
    const ev = ultima.get(c.id);
    const perfil = perfilPorId.get(c.perfil_id);
    const edad = edadDesde(perfil?.fecha_nacimiento);

    const faltan: string[] = [];
    if (!ev?.peso_kg) faltan.push("peso");
    if (!ev?.altura_cm) faltan.push("altura");
    if (!edad) faltan.push("fecha de nacimiento");

    return {
      id: c.id,
      nombre: nombreVisible(c.perfil),
      faltan,
      sugerencia:
        ev?.peso_kg && ev?.altura_cm && edad
          ? sugerirObjetivo({
              pesoKg: Number(ev.peso_kg),
              alturaCm: Number(ev.altura_cm),
              edad,
              genero: perfil?.genero,
              diasEntreno: ev.dias_disponibles,
              objetivo: c.objetivo,
            })
          : null,
    };
  });
}
