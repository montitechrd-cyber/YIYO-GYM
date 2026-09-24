"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirPerfil } from "@/lib/autenticacion";

export type Resultado = { error?: string };

export async function enviarMensaje(
  conversacionId: string,
  contenido: string
): Promise<Resultado> {
  const perfil = await exigirPerfil();
  const limpio = contenido.trim();
  if (!limpio) return { error: "El mensaje está vacío." };

  const supabase = await crearClienteServidor();

  const { error } = await supabase.from("mensajes").insert({
    conversacion_id: conversacionId,
    autor_id: perfil.id,
    contenido: limpio,
  });

  if (error) return { error: error.message };

  await supabase
    .from("conversaciones")
    .update({ ultimo_mensaje_en: new Date().toISOString() })
    .eq("id", conversacionId);

  // Notifica a la otra parte de la conversación.
  const { data: conversacion } = await supabase
    .from("conversaciones")
    .select("cliente_id, entrenador_id")
    .eq("id", conversacionId)
    .single();

  if (conversacion) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("perfil_id")
      .eq("id", conversacion.cliente_id)
      .single();

    const destinatario =
      perfil.id === conversacion.entrenador_id
        ? cliente?.perfil_id
        : conversacion.entrenador_id;

    if (destinatario && destinatario !== perfil.id) {
      await supabase.from("notificaciones").insert({
        perfil_id: destinatario,
        tipo: "mensaje",
        titulo: `Nuevo mensaje de ${perfil.nombre_completo || "tu entrenadora"}`,
        cuerpo: limpio.slice(0, 120),
        enlace:
          perfil.id === conversacion.entrenador_id
            ? "/panel/chat"
            : "/entrenador/chat",
      });
    }
  }

  revalidatePath("/panel/chat");
  revalidatePath("/entrenador/chat");
  return {};
}

export async function marcarLeidos(conversacionId: string) {
  const perfil = await exigirPerfil();
  const supabase = await crearClienteServidor();

  await supabase
    .from("mensajes")
    .update({ leido: true })
    .eq("conversacion_id", conversacionId)
    .neq("autor_id", perfil.id)
    .eq("leido", false);
}
