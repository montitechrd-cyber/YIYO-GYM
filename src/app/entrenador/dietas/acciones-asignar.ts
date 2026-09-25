"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/autenticacion";
import { asegurarEntrenadora } from "@/lib/datos";
import { hoyTexto } from "@/lib/programacion";
import type { PlanAlimentacion } from "@/lib/supabase/tipos";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Ajusta una cantidad al objetivo de la clienta.
 *
 * Las unidades se dejan en medios (2,5 huevos se entiende; 2,37 no) y el
 * resto se redondea a múltiplos de 5 g o ml, que es como se pesa la comida
 * en la práctica.
 */
function escalar(cantidad: number, factor: number, esUnidad: boolean) {
  const bruto = cantidad * factor;
  if (esUnidad) return Math.max(0.5, Math.round(bruto * 2) / 2);
  return Math.max(5, Math.round(bruto / 5) * 5);
}

type PlantillaCompleta = PlanAlimentacion & {
  plan_dias: {
    numero: number;
    nombre: string;
    notas: string | null;
    plan_comidas: {
      nombre: string;
      orden: number;
      hora: string | null;
      comida_alimentos: {
        alimento_id: string;
        cantidad: number;
        orden: number;
        notas: string | null;
        alimentos: { unidad: string } | null;
      }[];
    }[];
  }[];
};

/**
 * Asigna un plan de alimentación del catálogo a una clienta.
 *
 * Copia los 7 días con sus comidas y reescala todas las cantidades a las
 * calorías objetivo que se indiquen. La plantilla no se toca.
 */
export async function asignarPlanAlimentacion(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const planId = texto(datos, "plan_id");
  const clienteId = texto(datos, "cliente_id");
  if (!planId) return { error: "Elige un plan." };
  if (!clienteId) return { error: "Elige a quién se lo asignas." };

  const objetivo = Number(texto(datos, "calorias_objetivo"));
  const inicio = texto(datos, "fecha_inicio") || hoyTexto();

  // Sin semanas el plan no tiene final, y el calendario lo enseñaría para
  // siempre. Cuatro es lo que traía por defecto antes de poder elegirlas.
  const semanas = Number(texto(datos, "semanas")) || 4;
  if (!Number.isInteger(semanas) || semanas < 1 || semanas > 52) {
    return { error: "Las semanas van de 1 a 52." };
  }

  const { data, error: errorLectura } = await supabase
    .from("planes_alimentacion")
    .select(
      "*, plan_dias(numero, nombre, notas, plan_comidas(nombre, orden, hora, comida_alimentos(alimento_id, cantidad, orden, notas, alimentos(unidad))))"
    )
    .eq("id", planId)
    .eq("es_sistema", true)
    .limit(1)
    .returns<PlantillaCompleta[]>();

  const plantilla = data?.[0];
  if (errorLectura || !plantilla) {
    return { error: errorLectura?.message ?? "Ese plan ya no está disponible." };
  }

  const base = plantilla.calorias_base ?? plantilla.calorias_objetivo ?? 0;
  const factor = objetivo > 0 && base > 0 ? objetivo / base : 1;
  const ajustar = (n: number | null) =>
    n == null ? null : Math.round(n * factor);

  // Solo un plan activo a la vez.
  await supabase
    .from("planes_alimentacion")
    .update({ activo: false })
    .eq("cliente_id", clienteId)
    .eq("activo", true);

  const { data: copia, error: errorCopia } = await supabase
    .from("planes_alimentacion")
    .insert({
      cliente_id: clienteId,
      entrenador_id: perfil.id,
      semanas,
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      es_sistema: false,
      origen_id: plantilla.id,
      objetivo: plantilla.objetivo,
      emoji: plantilla.emoji,
      resumen: plantilla.resumen,
      calorias_objetivo: objetivo > 0 ? objetivo : plantilla.calorias_objetivo,
      proteina_objetivo_g: ajustar(plantilla.proteina_objetivo_g),
      carbohidratos_objetivo_g: ajustar(plantilla.carbohidratos_objetivo_g),
      grasa_objetivo_g: ajustar(plantilla.grasa_objetivo_g),
      // Las cantidades de la copia ya vienen reescaladas al objetivo, así
      // que su referencia es ese objetivo y no el de la plantilla.
      calorias_base: objetivo > 0 ? objetivo : plantilla.calorias_base,
      inicio,
      activo: true,
    })
    .select()
    .single();

  if (errorCopia || !copia) {
    return { error: errorCopia?.message ?? "No se pudo asignar el plan." };
  }

  const dias = [...(plantilla.plan_dias ?? [])].sort((a, b) => a.numero - b.numero);

  const { data: diasCreados, error: errorDias } = await supabase
    .from("plan_dias")
    .insert(
      dias.map((d) => ({
        plan_id: copia.id,
        numero: d.numero,
        nombre: d.nombre,
        notas: d.notas,
      }))
    )
    .select("id, numero");

  if (errorDias || !diasCreados) {
    return { error: errorDias?.message ?? "No se pudieron copiar los días." };
  }

  const diaPorNumero = new Map(diasCreados.map((d) => [d.numero, d.id]));

  // Las comidas se insertan todas de golpe para no hacer un viaje por cada
  // una: son 35 por plan.
  // El `orden` se reasigna por posición dentro de cada día para que la
  // pareja día+orden sea única: es la clave con la que se emparejan luego
  // los ingredientes, y `plan_comidas` no impide dos comidas con el mismo
  // orden —si las hubiera, sus ingredientes se perderían en silencio.
  const comidasPlanas = dias.flatMap((d) =>
    [...(d.plan_comidas ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((cm, i) => ({ dia: d.numero, orden: i, comida: cm }))
  );

  const { data: comidasCreadas, error: errorComidas } = await supabase
    .from("plan_comidas")
    .insert(
      comidasPlanas.map(({ dia, orden, comida }) => ({
        dia_id: diaPorNumero.get(dia)!,
        nombre: comida.nombre,
        orden,
        hora: comida.hora,
      }))
    )
    .select("id, dia_id, orden");

  if (errorComidas || !comidasCreadas) {
    return { error: errorComidas?.message ?? "No se pudieron copiar las comidas." };
  }

  // Se emparejan por día y orden, que es lo que las identifica sin ambigüedad.
  const idComida = new Map(
    comidasCreadas.map((cm) => [`${cm.dia_id}|${cm.orden}`, cm.id])
  );

  const ingredientes = comidasPlanas.flatMap(({ dia, orden, comida }) => {
    const clave = `${diaPorNumero.get(dia)}|${orden}`;
    const comidaId = idComida.get(clave);
    if (!comidaId) return [];
    return (comida.comida_alimentos ?? []).map((ing) => ({
      comida_id: comidaId,
      alimento_id: ing.alimento_id,
      cantidad: escalar(
        Number(ing.cantidad),
        factor,
        ing.alimentos?.unidad === "unidad"
      ),
      orden: ing.orden,
      notas: ing.notas,
    }));
  });

  if (ingredientes.length) {
    const { error } = await supabase.from("comida_alimentos").insert(ingredientes);
    if (error) return { error: error.message };
  }

  await asegurarEntrenadora(clienteId, perfil.id);

  // El calendario también se entera: se quita la marca del plan anterior de
  // esta clienta (si tenía uno) y se pone la de este, para que lo vea sin
  // tener que entrar a Nutrición.
  //
  // Solo se borra lo que aún no ha pasado: sin filtrar por fecha y estado
  // esto arrasaba también con las marcas ya completadas, borrando el
  // historial de alimentación de la clienta.
  await supabase
    .from("sesiones")
    .delete()
    .eq("cliente_id", clienteId)
    .eq("tipo_sesion", "alimentacion")
    .eq("estado", "programada")
    .gte("fecha", inicio);

  await supabase.from("sesiones").insert({
    cliente_id: clienteId,
    entrenador_id: perfil.id,
    tipo_sesion: "alimentacion",
    plan_alimentacion_id: copia.id,
    titulo: `${plantilla.emoji ?? "🥗"} Empieza: ${plantilla.nombre}`,
    fecha: inicio,
    duracion_min: 0,
    estado: "programada",
  });

  const { data: cliente } = await supabase
    .from("clientes")
    .select("perfil_id")
    .eq("id", clienteId)
    .single();

  if (cliente) {
    await supabase.from("notificaciones").insert({
      perfil_id: cliente.perfil_id,
      tipo: "sistema",
      titulo: "Tienes un plan de alimentación",
      cuerpo: `Yiyo te asignó «${plantilla.nombre}». Ya puedes verlo en Mi alimentación y en tu calendario.`,
      enlace: "/panel/alimentacion",
    });
  }

  revalidatePath("/entrenador/dietas");
  revalidatePath("/entrenador/calendario");
  revalidatePath("/panel/calendario");
  redirect(`/entrenador/dietas/${copia.id}`);
}
