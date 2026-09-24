import { MessageCircle } from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { obtenerConversacion } from "@/lib/chat";
import { iniciales, mapaPerfiles, nombreVisible } from "@/lib/datos";
import { Encabezado, Vacio } from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { Chat } from "@/components/panel/chat";

export default async function ChatCliente() {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);

  if (!cliente) {
    return (
      <div>
        <Encabezado titulo="Chat con Yiyo" />
        <Vacio
          icono={MessageCircle}
          titulo="Sin ficha activa"
          descripcion="Completa tu evaluación inicial para abrir tu canal directo con Yiyo."
          accion={<BotonEnlace href="/panel/bienvenida">Empezar</BotonEnlace>}
        />
      </div>
    );
  }

  const conversacion = await obtenerConversacion(cliente.id, cliente.entrenador_id);

  if (!conversacion) {
    return (
      <div>
        <Encabezado titulo="Chat con Yiyo" />
        <Vacio
          icono={MessageCircle}
          titulo="Chat no disponible todavía"
          descripcion="Aún no hay una entrenadora asignada a la plataforma."
        />
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const [{ data: mensajes }, perfiles] = await Promise.all([
    supabase
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", conversacion.id)
      // Los ultimos 200, del mas nuevo al mas viejo; se invierten al pintar.
      .order("creado_en", { ascending: false })
      .limit(200),
    mapaPerfiles([conversacion.entrenador_id]),
  ]);

  const entrenadora = perfiles.get(conversacion.entrenador_id);

  return (
    <div>
      <Encabezado
        titulo="Chat con Yiyo"
        descripcion="Dudas, ajustes, cómo te sientes. Aquí estoy."
      />
      <Chat
        conversacionId={conversacion.id}
        perfilId={perfil.id}
        nombreOtro={nombreVisible(entrenadora)}
        inicialesOtro={iniciales(entrenadora?.nombre_completo, entrenadora?.correo)}
        mensajesIniciales={[...(mensajes ?? [])].reverse()}
      />
    </div>
  );
}
