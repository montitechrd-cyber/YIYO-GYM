"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirPerfil, exigirRol } from "@/lib/autenticacion";
import { asegurarEntrenadora } from "@/lib/datos";
import { fechaATexto } from "@/lib/programacion";
import type { EstadoSesion } from "@/lib/supabase/tipos";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

export async function crearSesion(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const clienteId = texto(datos, "cliente_id");
  const fecha = texto(datos, "fecha");
  if (!clienteId || !fecha) return { error: "Elige clienta y fecha." };

  // Agendar a una clienta sin entrenadora la deja asignada a quien agenda.
  await asegurarEntrenadora(clienteId, perfil.id);

  // Al agendar un día de una rutina, la sesión queda enlazada a él: así la
  // clienta abre la sesión desde su calendario y ve los ejercicios y videos.
  const diaRutinaId = texto(datos, "rutina_dia_id") || null;
  let tituloDia: string | null = null;

  if (diaRutinaId) {
    const { data: dia } = await supabase
      .from("rutina_dias")
      .select("id, nombre, rutina_id")
      .eq("id", diaRutinaId)
      .maybeSingle();

    if (!dia) return { error: "Ese día de rutina ya no existe." };

    const { data: rutina } = await supabase
      .from("rutinas")
      .select("nombre, cliente_id")
      .eq("id", dia.rutina_id)
      .maybeSingle();

    if (rutina?.cliente_id && rutina.cliente_id !== clienteId) {
      return { error: "Esa rutina pertenece a otra clienta." };
    }
    tituloDia = rutina ? `${rutina.nombre} · ${dia.nombre}` : dia.nombre;
  }

  const titulo = texto(datos, "titulo") || tituloDia || "Entrenamiento";
  const repetir = Math.min(Math.max(Number(texto(datos, "repetir")) || 1, 1), 12);

  const base = new Date(fecha + "T00:00:00");
  const filas = Array.from({ length: repetir }, (_, i) => {
    const f = new Date(base);
    f.setDate(base.getDate() + i * 7);
    return {
      cliente_id: clienteId,
      entrenador_id: perfil.id,
      rutina_dia_id: diaRutinaId,
      titulo,
      fecha: fechaATexto(f),
      hora: texto(datos, "hora") || null,
      duracion_min: Number(texto(datos, "duracion_min")) || 60,
      notas: texto(datos, "notas") || null,
    };
  });

  const { error } = await supabase.from("sesiones").insert(filas);
  if (error) return { error: error.message };

  const { data: cliente } = await supabase
    .from("clientes")
    .select("perfil_id")
    .eq("id", clienteId)
    .single();

  if (cliente) {
    await supabase.from("notificaciones").insert({
      perfil_id: cliente.perfil_id,
      tipo: "sesion",
      titulo: repetir > 1 ? "Nuevas sesiones agendadas" : "Nueva sesión agendada",
      cuerpo: `${titulo} — primera el ${fecha}.`,
      enlace: "/panel/calendario",
    });
  }

  revalidatePath("/entrenador/calendario");
  revalidatePath("/entrenador");
  revalidatePath("/panel/calendario");
  revalidatePath("/panel");
  revalidatePath("/panel/entrenamientos");
  return { exito: repetir > 1 ? `${repetir} sesiones creadas.` : "Sesión creada." };
}

export async function cambiarEstadoSesion(id: string, estado: EstadoSesion) {
  await exigirPerfil();
  const supabase = await crearClienteServidor();
  await supabase.from("sesiones").update({ estado }).eq("id", id);
  revalidatePath("/entrenador/calendario");
  revalidatePath("/entrenador");
  revalidatePath("/panel/calendario");
  revalidatePath("/panel");
  revalidatePath("/panel/entrenamientos");
}

export async function borrarSesion(id: string) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  await supabase.from("sesiones").delete().eq("id", id);
  revalidatePath("/entrenador/calendario");
  revalidatePath("/entrenador");
  revalidatePath("/panel/calendario");
  revalidatePath("/panel");
  revalidatePath("/panel/entrenamientos");
}
