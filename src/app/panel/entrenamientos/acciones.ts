"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clienteActual, exigirPerfil } from "@/lib/autenticacion";
import { hoyTexto } from "@/lib/programacion";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Guarda un entrenamiento completo. Las series llegan como campos
 * `serie_<ejercicioId>_<n>_<peso|reps|rpe>` desde el formulario.
 */
export async function registrarEntrenamiento(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);
  if (!cliente) return { error: "No encontramos tu ficha de clienta." };

  const supabase = await crearClienteServidor();
  const sesionId = texto(datos, "sesion_id");

  // Un solo registro por clienta y día: si ya existe (por ejemplo porque ya
  // marcó algún ejercicio como hecho desde la lista), este formulario lo
  // completa en vez de crear uno aparte.
  //
  // Solo se mandan los campos que la clienta llenó de verdad: enviarlos
  // todos hacía que un formulario a medias borrara con null lo que ya
  // estuviera guardado de ese día.
  const duracion = numeroOpcional(texto(datos, "duracion_min"));
  const rpe = numeroOpcional(texto(datos, "esfuerzo_rpe"));
  const sensacion = texto(datos, "sensacion");
  const notas = texto(datos, "notas");

  const { data: registro, error } = await supabase
    .from("registros_entrenamiento")
    .upsert(
      {
        cliente_id: cliente.id,
        fecha: texto(datos, "fecha") || hoyTexto(),
        ...(sesionId ? { sesion_id: sesionId } : {}),
        ...(duracion != null ? { duracion_min: duracion } : {}),
        ...(rpe != null ? { esfuerzo_rpe: rpe } : {}),
        ...(sensacion ? { sensacion } : {}),
        ...(notas ? { notas } : {}),
      },
      { onConflict: "cliente_id,fecha" }
    )
    .select()
    .single();

  if (error || !registro) {
    return { error: error?.message ?? "No se pudo guardar el entrenamiento." };
  }

  type SerieBorrador = {
    ejercicio_id: string;
    numero_serie: number;
    repeticiones: number | null;
    peso_kg: number | null;
    rpe: number | null;
  };

  const borradores = new Map<string, SerieBorrador>();

  for (const [campo, valor] of datos.entries()) {
    if (!campo.startsWith("serie_") || typeof valor !== "string") continue;

    const partes = campo.split("_");
    if (partes.length < 4) continue;

    const propiedad = partes[partes.length - 1];
    const numeroSerie = Number(partes[partes.length - 2]);
    const ejercicioId = partes.slice(1, partes.length - 2).join("_");
    if (!Number.isFinite(numeroSerie)) continue;

    const llave = `${ejercicioId}#${numeroSerie}`;
    const actual = borradores.get(llave) ?? {
      ejercicio_id: ejercicioId,
      numero_serie: numeroSerie,
      repeticiones: null,
      peso_kg: null,
      rpe: null,
    };

    const n = numeroOpcional(valor.trim());
    if (propiedad === "reps") actual.repeticiones = n;
    if (propiedad === "peso") actual.peso_kg = n;
    if (propiedad === "rpe") actual.rpe = n;

    borradores.set(llave, actual);
  }

  const series = [...borradores.values()].filter(
    (s) => s.repeticiones != null || s.peso_kg != null
  );

  if (series.length > 0) {
    const { error: errorSeries } = await supabase
      .from("series_registradas")
      .upsert(
        series.map((s) => ({ ...s, registro_id: registro.id })),
        { onConflict: "registro_id,ejercicio_id,numero_serie" }
      );

    if (errorSeries) return { error: errorSeries.message };
  }

  if (sesionId) {
    await supabase
      .from("sesiones")
      .update({ estado: "completada" })
      .eq("id", sesionId);
  }

  revalidatePath("/panel");
  revalidatePath("/panel/entrenamientos");
  revalidatePath("/panel/calendario");
  return { exito: "¡Entrenamiento registrado! Buen trabajo." };
}

export async function borrarRegistro(id: string) {
  await exigirPerfil();
  const supabase = await crearClienteServidor();
  await supabase.from("registros_entrenamiento").delete().eq("id", id);
  revalidatePath("/panel/entrenamientos");
  revalidatePath("/panel");
}

/**
 * Marca (o desmarca) un ejercicio como hecho hoy, sin pasar por el
 * formulario completo. Escribe en las mismas tablas que «Registrar
 * entrenamiento» —un registro por día, una serie por ejercicio— así que las
 * dos formas de anotar el entrenamiento se ven entre sí y alimentan el mismo
 * avance.
 *
 * Si al marcarlo quedan todos los ejercicios del día hechos, la sesión de
 * hoy en el calendario (si la hay) pasa sola a «completada»; si se desmarca
 * uno, vuelve a «programada».
 */
export async function marcarEjercicioHecho(
  diaId: string,
  ejercicioId: string,
  hecho: boolean
): Promise<Resultado> {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);
  if (!cliente) return { error: "No encontramos tu ficha de clienta." };

  const supabase = await crearClienteServidor();
  const hoy = hoyTexto();

  const { data: sesionHoy } = await supabase
    .from("sesiones")
    .select("id, estado")
    .eq("cliente_id", cliente.id)
    .eq("rutina_dia_id", diaId)
    .eq("fecha", hoy)
    .eq("tipo_sesion", "entrenamiento")
    .maybeSingle();

  // `sesion_id` solo se manda si hay sesión hoy: mandar null borraba el
  // vínculo que el registro del día ya pudiera tener guardado.
  const { data: registro, error: errorRegistro } = await supabase
    .from("registros_entrenamiento")
    .upsert(
      {
        cliente_id: cliente.id,
        fecha: hoy,
        ...(sesionHoy?.id ? { sesion_id: sesionHoy.id } : {}),
      },
      { onConflict: "cliente_id,fecha", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (errorRegistro || !registro) {
    return { error: errorRegistro?.message ?? "No se pudo guardar." };
  }

  const { error: errorSerie } = await supabase.from("series_registradas").upsert(
    {
      registro_id: registro.id,
      ejercicio_id: ejercicioId,
      numero_serie: 1,
      completada: hecho,
    },
    { onConflict: "registro_id,ejercicio_id,numero_serie" }
  );
  if (errorSerie) return { error: errorSerie.message };

  // ¿Quedó completo el día? Se compara contra los ejercicios reales del día,
  // no contra lo que haya en `series_registradas` (que puede traer series
  // sueltas de otros días si el registro se reutiliza).
  const { data: dias } = await supabase
    .from("rutina_dias")
    .select("rutina_ejercicios(ejercicio_id, tipo)")
    .eq("id", diaId)
    .limit(1)
    .returns<{ rutina_ejercicios: { ejercicio_id: string | null; tipo: string }[] }[]>();

  const idsDelDia = (dias?.[0]?.rutina_ejercicios ?? [])
    .filter((b) => b.tipo === "ejercicio" && b.ejercicio_id)
    .map((b) => b.ejercicio_id as string);

  if (idsDelDia.length > 0 && sesionHoy) {
    const { data: series } = await supabase
      .from("series_registradas")
      .select("ejercicio_id, completada")
      .eq("registro_id", registro.id)
      .in("ejercicio_id", idsDelDia);

    const hechos = new Set(
      (series ?? []).filter((s) => s.completada).map((s) => s.ejercicio_id)
    );
    const completo = idsDelDia.every((id) => hechos.has(id));

    if (completo && sesionHoy.estado !== "completada") {
      await supabase.from("sesiones").update({ estado: "completada" }).eq("id", sesionHoy.id);
    } else if (!completo && sesionHoy.estado === "completada") {
      await supabase.from("sesiones").update({ estado: "programada" }).eq("id", sesionHoy.id);
    }
  }

  revalidatePath(`/panel/entrenamientos/${diaId}`);
  revalidatePath("/panel/entrenamientos");
  revalidatePath("/panel/calendario");
  revalidatePath("/panel");
  revalidatePath("/panel/progreso");
  return {};
}
