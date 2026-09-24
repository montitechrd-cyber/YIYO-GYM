import Link from "next/link";
import { ChevronRight, Dumbbell, History, PlayCircle, Timer } from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FECHA_LARGA, fechaLocal, GRUPOS } from "@/lib/etiquetas";
import {
  Encabezado,
  Insignia,
  Tarjeta,
  TituloTarjeta,
  Vacio,
} from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { TarjetaProgresion } from "@/components/panel/progresion";
import { RegistrarEntrenamiento } from "./registrar";
import { rutinaActivaDe } from "@/lib/rutinas";
import { hoyTexto } from "@/lib/programacion";

export default async function MisEntrenamientos() {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);

  if (!cliente) {
    return (
      <div>
        <Encabezado titulo="Mis entrenamientos" />
        <Vacio
          icono={Dumbbell}
          titulo="Sin ficha activa"
          descripcion="Completa tu evaluación inicial para recibir tu primera rutina"
          accion={<BotonEnlace href="/panel/bienvenida">Empezar</BotonEnlace>}
        />
      </div>
    );
  }

  const supabase = await crearClienteServidor();

  // La rutina con sus días y ejercicios llega en una sola consulta, y en
  // paralelo con el historial y las sesiones de hoy.
  const [activa, { data: registros }, { data: sesionesHoy }] = await Promise.all([
    rutinaActivaDe(cliente.id),
    supabase
      .from("registros_entrenamiento")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("fecha", { ascending: false })
      .limit(10),
    // Solo entrenamiento: si hoy hay además una marca de alimentación,
    // podía colarse como «la sesión de hoy» y el registro del
    // entrenamiento terminaba completando esa marca de dieta.
    supabase
      .from("sesiones")
      .select("*")
      .eq("cliente_id", cliente.id)
      .eq("fecha", hoyTexto())
      .eq("tipo_sesion", "entrenamiento"),
  ]);

  const rutina = activa?.rutina ?? null;
  const dias = activa?.dias ?? [];

  return (
    <div>
      <Encabezado
        titulo="Mis entrenamientos"
        descripcion={
          rutina
            ? `Rutina activa: ${rutina.nombre}`
            : "Todavía no tienes una rutina asignada."
        }
      />

      {rutina && dias.length > 0 ? (
        <div className="space-y-5">
          <TarjetaProgresion fechaInicio={rutina.fecha_inicio} />

          <RegistrarEntrenamiento
            dias={dias}
            sesionHoy={sesionesHoy?.[0]?.id ?? null}
          />

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {dias.map((d) => (
              <Link
                key={d.id}
                href={`/panel/entrenamientos/${d.id}`}
                className="group rounded-4xl border border-lila-200 bg-white p-7 shadow-suave transition-all duration-500 hover:-translate-y-1 hover:border-lila-400 hover:shadow-elevada"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] tracking-[0.22em] text-violeta-500 uppercase">
                      Día {d.numero}
                    </p>
                    <h3 className="mt-1 font-medium text-violeta-800">{d.nombre}</h3>
                  </div>
                  <Insignia>{d.ejercicios.length} ej.</Insignia>
                </div>

                {d.ejercicios.length > 0 ? (
                  <>
                    <ul className="space-y-2.5">
                      {d.ejercicios.slice(0, 4).map((a) => (
                        <li key={a.id} className="rounded-3xl bg-lila-50 px-4 py-3">
                          <p className="flex items-center gap-2 text-sm font-medium text-violeta-800">
                            {a.ejercicio.video_url && (
                              <PlayCircle
                                size={13}
                                className="shrink-0 text-violeta-500"
                              />
                            )}
                            {a.ejercicio.nombre}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-light text-violeta-900/55">
                            <span>{GRUPOS[a.ejercicio.grupo]}</span>
                            <span>
                              {a.series} × {a.repeticiones}
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer size={11} />
                              {a.descanso_seg}s
                            </span>
                          </p>
                        </li>
                      ))}
                    </ul>
                    {d.ejercicios.length > 4 && (
                      <p className="mt-3 text-[11px] font-light text-violeta-900/45">
                        y {d.ejercicios.length - 4} más…
                      </p>
                    )}
                    <p className="mt-5 flex items-center gap-1.5 text-xs font-medium text-violeta-600">
                      Ver ejercicios y videos
                      <ChevronRight
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </p>
                  </>
                ) : (
                  <p className="rounded-3xl border border-dashed border-lila-300 px-4 py-8 text-center text-xs font-light text-violeta-900/45">
                    Día de descanso.
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Vacio
          icono={Dumbbell}
          titulo="Sin rutina asignada"
          descripcion="En cuanto Yiyo revise tu evaluación te asignará tu plan de entrenamiento"
        />
      )}

      <div className="mt-6">
        <Tarjeta>
          <TituloTarjeta>
            <span className="flex items-center gap-2">
              <History size={13} /> Historial reciente
            </span>
          </TituloTarjeta>

          {registros && registros.length > 0 ? (
            <ul className="space-y-3">
              {registros.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-lila-200 px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-violeta-800 first-letter:uppercase">
                      {FECHA_LARGA.format(fechaLocal(r.fecha))}
                    </p>
                    <p className="mt-1 text-xs font-light text-violeta-900/50">
                      {r.duracion_min ? `${r.duracion_min} min` : "Duración no anotada"}
                      {r.esfuerzo_rpe ? ` · RPE ${r.esfuerzo_rpe}/10` : ""}
                      {r.sensacion ? ` · ${r.sensacion}` : ""}
                    </p>
                    {r.notas && (
                      <p className="mt-2 text-xs font-light text-violeta-900/60">
                        {r.notas}
                      </p>
                    )}
                  </div>
                  <Insignia tono="verde">Completado</Insignia>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-light text-violeta-900/45">
              Todavía no has registrado ningún entrenamiento.
            </p>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
