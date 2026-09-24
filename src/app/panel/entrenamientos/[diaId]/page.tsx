import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Dumbbell } from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FECHA_LARGA, fechaLocal } from "@/lib/etiquetas";
import { Encabezado, Insignia, Vacio } from "@/components/panel/piezas";
import { ListaSesion } from "@/components/panel/lista-sesion";
import { diaConSuRutina } from "@/lib/rutinas";
import { desdeFila, duracionEstimada, formatearDuracion } from "@/lib/bloques";
import { hoyTexto } from "@/lib/programacion";

export default async function DiaDeEntrenamiento({
  params,
}: {
  params: Promise<{ diaId: string }>;
}) {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);
  if (!cliente) redirect("/panel");

  const { diaId } = await params;
  const supabase = await crearClienteServidor();

  const hoy = hoyTexto();

  // El día, su rutina y sus ejercicios llegan juntos; en paralelo, la próxima
  // sesión agendada y lo que ya se marcó como hecho hoy. Antes eran cinco
  // consultas, casi todas en cadena.
  const [contenido, { data: proximas }, { data: registroHoy }] = await Promise.all([
    diaConSuRutina(diaId),
    supabase
      .from("sesiones")
      .select("*")
      .eq("cliente_id", cliente.id)
      .eq("rutina_dia_id", diaId)
      .eq("estado", "programada")
      .gte("fecha", hoy)
      .order("fecha")
      .limit(1),
    supabase
      .from("registros_entrenamiento")
      .select("series_registradas(ejercicio_id, completada)")
      .eq("cliente_id", cliente.id)
      .eq("fecha", hoy)
      .limit(1)
      .returns<{ series_registradas: { ejercicio_id: string; completada: boolean }[] }[]>(),
  ]);

  // Las políticas RLS ya impiden ver rutinas ajenas; esto da una respuesta
  // clara en vez de una página vacía.
  if (!contenido) notFound();

  const { rutina, dia } = contenido;
  const ejercicios = dia.ejercicios;
  const siguiente = proximas?.[0];
  const completadosHoy = new Set(
    (registroHoy?.[0]?.series_registradas ?? [])
      .filter((s) => s.completada)
      .map((s) => s.ejercicio_id)
  );

  return (
    <div className="max-w-3xl">
      <Link
        href="/panel/entrenamientos"
        className="mb-6 inline-flex items-center gap-2 text-xs font-light text-violeta-600 transition-colors hover:text-violeta-800"
      >
        <ArrowLeft size={14} />
        Volver a mis entrenamientos
      </Link>

      <Encabezado
        titulo={dia.nombre}
        descripcion={rutina.nombre}
        acciones={
          <Insignia tono="lila">
            {ejercicios.length} ejercicio{ejercicios.length === 1 ? "" : "s"} ·{" "}
            {formatearDuracion(duracionEstimada(dia.bloques.map(desdeFila)))}
          </Insignia>
        }
      />

      {siguiente && (
        <p className="mb-7 flex items-center gap-2 rounded-3xl border border-lila-200 bg-lila-50 px-5 py-4 text-sm font-light text-violeta-900/70">
          <CalendarDays size={15} className="shrink-0 text-violeta-500" />
          <span className="first-letter:uppercase">
            Próxima vez: {FECHA_LARGA.format(fechaLocal(siguiente.fecha))}
            {siguiente.hora ? ` a las ${siguiente.hora.slice(0, 5)}` : ""}
          </span>
        </p>
      )}

      {dia.notas && (
        <p className="mb-7 text-sm leading-relaxed font-light text-violeta-900/70">
          {dia.notas}
        </p>
      )}

      {dia.bloques.length > 0 ? (
        <ListaSesion
          bloques={dia.bloques}
          ejercicios={new Map(ejercicios.map((x) => [x.ejercicio.id, x.ejercicio]))}
          diaId={diaId}
          completadosHoy={completadosHoy}
        />
      ) : (
        <Vacio
          icono={Dumbbell}
          titulo="Día de descanso"
          descripcion="Este día no tiene ejercicios asignados. Aprovecha para recuperarte."
        />
      )}
    </div>
  );
}
