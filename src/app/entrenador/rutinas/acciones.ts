"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/autenticacion";
import { calcularSesiones, hoyTexto } from "@/lib/programacion";
import { asegurarEntrenadora } from "@/lib/datos";
import type { Bloque } from "@/lib/bloques";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

export async function crearRutina(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const nombre = texto(datos, "nombre");
  if (!nombre) return { error: "La rutina necesita un nombre." };

  const dias = Math.min(Math.max(Number(texto(datos, "dias_por_semana")) || 3, 1), 7);
  const clienteId = texto(datos, "cliente_id");
  const inicio = texto(datos, "fecha_inicio") || hoyTexto();

  const { data: rutina, error } = await supabase
    .from("rutinas")
    .insert({
      nombre,
      descripcion: texto(datos, "descripcion") || null,
      entrenador_id: perfil.id,
      cliente_id: clienteId || null,
      es_plantilla: !clienteId,
      semanas: Number(texto(datos, "semanas")) || 4,
      dias_por_semana: dias,
      // Sin esto la rutina queda sin fecha de inicio y la clienta nunca ve
      // en qué semana del ciclo de progresión va.
      fecha_inicio: clienteId ? inicio : null,
    })
    .select()
    .single();

  if (error || !rutina) return { error: error?.message ?? "No se pudo crear." };

  const { data: diasCreados, error: errorDias } = await supabase
    .from("rutina_dias")
    .insert(
      Array.from({ length: dias }, (_, i) => ({
        rutina_id: rutina.id,
        numero: i + 1,
        nombre: `Día ${i + 1}`,
      }))
    )
    .select();

  // Si los días no se crean, la rutina queda vacía y el calendario también.
  // Antes se seguía adelante y la entrenadora veía «creada» con la
  // notificación enviada, sin nada dentro.
  if (errorDias || !diasCreados?.length) {
    await supabase.from("rutinas").delete().eq("id", rutina.id);
    return {
      error: errorDias?.message ?? "No se pudieron crear los días de la rutina.",
    };
  }

  if (clienteId) {
    // Quien le arma la rutina pasa a ser su entrenadora si no tenía ninguna.
    await asegurarEntrenadora(clienteId, perfil.id);

    // Al asignar la rutina se programa sola en el calendario de la clienta.
    await programarEnCalendario(
      rutina.id,
      clienteId,
      perfil.id,
      nombre,
      rutina.semanas,
      diasCreados,
      inicio
    );

    const { data: cliente } = await supabase
      .from("clientes")
      .select("perfil_id")
      .eq("id", clienteId)
      .single();

    if (cliente) {
      await supabase.from("notificaciones").insert({
        perfil_id: cliente.perfil_id,
        tipo: "rutina",
        titulo: "Tienes una rutina nueva",
        cuerpo: `Yiyo te asignó «${nombre}». Ya está en tu calendario.`,
        enlace: "/panel/entrenamientos",
      });
    }
  }

  revalidatePath("/entrenador/rutinas");
  redirect(`/entrenador/rutinas/${rutina.id}`);
}

/** Crea las sesiones de calendario de una rutina, sin duplicar las existentes. */
async function programarEnCalendario(
  rutinaId: string,
  clienteId: string,
  entrenadorId: string,
  nombreRutina: string,
  semanas: number,
  dias: { id: string; numero: number; nombre: string }[],
  fechaInicio: string
) {
  if (dias.length === 0) return 0;

  const supabase = await crearClienteServidor();

  // Borra la programación anterior de esta rutina que aún no se completó.
  await supabase
    .from("sesiones")
    .delete()
    .eq("cliente_id", clienteId)
    .eq("estado", "programada")
    .in(
      "rutina_dia_id",
      dias.map((d) => d.id)
    );

  const planificadas = calcularSesiones(fechaInicio, semanas, dias);

  const { error } = await supabase.from("sesiones").insert(
    planificadas.map((s) => ({
      cliente_id: clienteId,
      entrenador_id: entrenadorId,
      rutina_dia_id: s.dia.id,
      titulo: `${nombreRutina} · ${s.dia.nombre}`,
      fecha: s.fecha,
      hora: "07:00",
      duracion_min: 60,
    }))
  );

  if (error) throw new Error(error.message);
  void rutinaId;
  return planificadas.length;
}

/** Reprograma una rutina ya creada desde la fecha que elija la entrenadora. */
export async function reprogramarRutina(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const rutinaId = texto(datos, "rutina_id");
  const fechaInicio =
    texto(datos, "fecha_inicio") || hoyTexto();

  const { data: rutina } = await supabase
    .from("rutinas")
    .select("*")
    .eq("id", rutinaId)
    .maybeSingle();

  if (!rutina) return { error: "No encontramos la rutina." };
  if (!rutina.cliente_id) {
    return {
      error: "Esta rutina es una plantilla. Asígnala a una clienta para poder programarla.",
    };
  }

  const { data: dias } = await supabase
    .from("rutina_dias")
    .select("id, numero, nombre")
    .eq("rutina_id", rutinaId)
    .order("numero");

  try {
    await asegurarEntrenadora(rutina.cliente_id, perfil.id);

    // La fecha de inicio manda en qué semana del ciclo va la clienta: sin
    // actualizarla, el calendario se movía pero la progresión seguía
    // contando desde la fecha vieja.
    await supabase
      .from("rutinas")
      .update({ fecha_inicio: fechaInicio })
      .eq("id", rutinaId);

    const total = await programarEnCalendario(
      rutina.id,
      rutina.cliente_id,
      perfil.id,
      rutina.nombre,
      rutina.semanas,
      dias ?? [],
      fechaInicio
    );

    const { data: cliente } = await supabase
      .from("clientes")
      .select("perfil_id")
      .eq("id", rutina.cliente_id)
      .single();

    if (cliente) {
      await supabase.from("notificaciones").insert({
        perfil_id: cliente.perfil_id,
        tipo: "sesion",
        titulo: "Tu calendario se actualizó",
        cuerpo: `«${rutina.nombre}» quedó programada desde el ${fechaInicio}.`,
        enlace: "/panel/calendario",
      });
    }

    revalidatePath(`/entrenador/rutinas/${rutinaId}`);
    revalidatePath("/entrenador/calendario");
    revalidatePath("/panel/calendario");
    return { exito: `${total} sesiones programadas en el calendario.` };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo programar la rutina.",
    };
  }
}

export async function renombrarDia(
  diaId: string,
  rutinaId: string,
  nombre: string
) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  await supabase.from("rutina_dias").update({ nombre }).eq("id", diaId);
  revalidatePath(`/entrenador/rutinas/${rutinaId}`);
}

export async function agregarEjercicioADia(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const diaId = texto(datos, "dia_id");
  const ejercicioId = texto(datos, "ejercicio_id");
  const rutinaId = texto(datos, "rutina_id");

  if (!ejercicioId) return { error: "Elige un ejercicio." };

  const { count } = await supabase
    .from("rutina_ejercicios")
    .select("id", { count: "exact", head: true })
    .eq("dia_id", diaId);

  const { error } = await supabase.from("rutina_ejercicios").insert({
    dia_id: diaId,
    ejercicio_id: ejercicioId,
    orden: count ?? 0,
    series: Number(texto(datos, "series")) || 3,
    repeticiones: texto(datos, "repeticiones") || "10",
    descanso_seg: Number(texto(datos, "descanso_seg")) || 60,
    peso_sugerido: texto(datos, "peso_sugerido") || null,
    notas: texto(datos, "notas") || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/entrenador/rutinas/${rutinaId}`);
  return { exito: "Ejercicio añadido." };
}

/**
 * Reemplaza de una vez todos los bloques de un día. La entrenadora arma la
 * lista completa en pantalla y se guarda en una sola llamada, en lugar de un
 * viaje al servidor por cada ejercicio que añade.
 */
export async function guardarBloquesDelDia(
  diaId: string,
  rutinaId: string,
  bloques: Bloque[]
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const invalido = bloques.find(
    (b) =>
      (b.tipo === "ejercicio" && !b.ejercicio_id) ||
      (b.tipo === "etiqueta" && !b.texto?.trim())
  );
  if (invalido) {
    return { error: "Hay un bloque incompleto. Revisa la lista antes de guardar." };
  }

  const { error: errorBorrado } = await supabase
    .from("rutina_ejercicios")
    .delete()
    .eq("dia_id", diaId);

  if (errorBorrado) return { error: errorBorrado.message };

  if (bloques.length > 0) {
    const { error } = await supabase.from("rutina_ejercicios").insert(
      bloques.map((b, i) => ({
        dia_id: diaId,
        tipo: b.tipo,
        ejercicio_id: b.tipo === "ejercicio" ? b.ejercicio_id : null,
        texto: b.tipo === "etiqueta" ? b.texto!.trim() : null,
        orden: i,
        series: b.tipo === "ejercicio" ? b.series : 1,
        repeticiones: b.tipo === "ejercicio" ? b.repeticiones : "",
        descanso_seg: b.descanso_seg,
        peso_sugerido: b.tipo === "ejercicio" ? b.peso_sugerido || null : null,
        notas: b.notas?.trim() || null,
        grupo: b.grupo,
        grupo_repeticiones: b.grupo_repeticiones,
      }))
    );

    if (error) return { error: error.message };
  }

  revalidatePath(`/entrenador/rutinas/${rutinaId}`);
  revalidatePath("/panel/entrenamientos");
  return { exito: "Día guardado." };
}

/** Renombra un día de la rutina («Día 1» → «Pierna y glúteo»). */
export async function renombrarDiaRutina(
  diaId: string,
  rutinaId: string,
  nombre: string
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const limpio = nombre.trim();
  if (!limpio) return { error: "El día necesita un nombre." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("rutina_dias")
    .update({ nombre: limpio })
    .eq("id", diaId);

  if (error) return { error: error.message };

  revalidatePath(`/entrenador/rutinas/${rutinaId}`);
  revalidatePath("/panel/entrenamientos");
  return {};
}

export async function quitarEjercicioDeDia(id: string, rutinaId: string) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  await supabase.from("rutina_ejercicios").delete().eq("id", id);
  revalidatePath(`/entrenador/rutinas/${rutinaId}`);
}

export async function borrarRutina(id: string) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  await supabase.from("rutinas").delete().eq("id", id);
  revalidatePath("/entrenador/rutinas");
  redirect("/entrenador/rutinas");
}
