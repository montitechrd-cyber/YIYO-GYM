import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clientesConPerfil, nombreVisible } from "@/lib/datos";
import { diasAgendables } from "@/lib/rutinas";
import { hoyTexto, ventanaCalendario } from "@/lib/programacion";
import { Encabezado } from "@/components/panel/piezas";
import { Calendario } from "@/components/panel/calendario";
import { NuevaSesion } from "./nueva-sesion";

export default async function CalendarioEntrenador() {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const { desde, hasta } = ventanaCalendario();
  const [{ data: sesiones }, lista, diasDeRutina] = await Promise.all([
    supabase
      .from("sesiones")
      .select("*")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha"),
    clientesConPerfil(),
    diasAgendables(),
  ]);

  const nombrePorCliente = new Map(
    lista.map((c) => [c.id, nombreVisible(c.perfil)])
  );

  return (
    <div>
      <Encabezado
        titulo="Calendario"
        descripcion="Programa y da seguimiento a las sesiones de tus clientas."
        acciones={
          <NuevaSesion
            clientes={lista.map((c) => ({
              id: c.id,
              nombre: nombrePorCliente.get(c.id) ?? "Clienta",
            }))}
            diasDeRutina={diasDeRutina}
          />
        }
      />

      <Calendario
        puedeGestionar
        hoy={hoyTexto()}
        sesiones={(sesiones ?? []).map((s) => ({
          ...s,
          nombreCliente: nombrePorCliente.get(s.cliente_id),
        }))}
      />
    </div>
  );
}
