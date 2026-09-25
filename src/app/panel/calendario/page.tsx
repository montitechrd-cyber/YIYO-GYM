import { CalendarDays } from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Encabezado, Vacio } from "@/components/panel/piezas";
import { Calendario } from "@/components/panel/calendario";
import { hoyTexto, ventanaCalendario } from "@/lib/programacion";
import { alimentacionPorDia } from "@/lib/agenda";

export default async function CalendarioCliente() {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);

  if (!cliente) {
    return (
      <div>
        <Encabezado titulo="Calendario" />
        <Vacio
          icono={CalendarDays}
          titulo="Sin ficha activa"
          descripcion="Completa tu evaluación inicial para empezar a recibir sesiones"
        />
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const { desde, hasta } = ventanaCalendario();
  const [{ data: sesiones }, alimentacion] = await Promise.all([
    supabase
      .from("sesiones")
      .select("*")
      .eq("cliente_id", cliente.id)
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha"),
    alimentacionPorDia(desde, hasta, [cliente.id]),
  ]);

  return (
    <div>
      <Encabezado
        titulo="Mi calendario"
        descripcion="Tu entrenamiento y tus comidas, día a día"
      />
      <Calendario
        sesiones={sesiones ?? []}
        alimentacion={alimentacion}
        prefijoEjercicios="/panel/entrenamientos"
        hoy={hoyTexto()}
      />
    </div>
  );
}
