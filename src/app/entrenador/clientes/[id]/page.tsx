import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Ruler, StickyNote } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { iniciales, mapaPerfiles, nombreVisible } from "@/lib/datos";
import {
  ESTADOS_CLIENTE,
  FECHA_LARGA,
  MEDIDAS,
  NIVELES,
  OBJETIVOS,
  TONO_ESTADO_CLIENTE,
  fechaLocal,
} from "@/lib/etiquetas";
import {
  Insignia,
  Tarjeta,
  TituloTarjeta,
  Vacio,
} from "@/components/panel/piezas";
import { FormularioFicha } from "./formulario-ficha";
import { PanelNotas } from "./notas";
import { BotonAsignarme } from "./asignarme";
import { BotonEnlace } from "@/components/ui/boton";

export default async function FichaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { id } = await params;

  const supabase = await crearClienteServidor();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) notFound();

  const [{ data: evaluaciones }, { data: notas }, perfiles] = await Promise.all([
    supabase
      .from("evaluaciones")
      .select("*")
      .eq("cliente_id", id)
      .order("fecha", { ascending: false }),
    supabase
      .from("notas_cliente")
      .select("*")
      .eq("cliente_id", id)
      .order("creado_en", { ascending: false }),
    mapaPerfiles([cliente.perfil_id]),
  ]);

  const perfil = perfiles.get(cliente.perfil_id);
  const autores = await mapaPerfiles((notas ?? []).map((n) => n.autor_id));
  const ultima = evaluaciones?.[0];

  return (
    <div>
      <Link
        href="/entrenador/clientes"
        className="mb-6 inline-flex items-center gap-2 text-xs font-light text-violeta-600 transition-colors hover:text-violeta-800"
      >
        <ArrowLeft size={14} />
        Volver a clientes
      </Link>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full fondo-degradado text-lg font-medium text-white shadow-suave">
            {iniciales(perfil?.nombre_completo, perfil?.correo)}
          </span>
          <div>
            <h1 className="text-3xl font-light text-violeta-900">
              {nombreVisible(perfil)}
            </h1>
            <p className="mt-1 text-sm font-light text-violeta-900/55">
              {perfil?.correo} · Alta el{" "}
              {FECHA_LARGA.format(fechaLocal(cliente.fecha_alta))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Insignia tono={TONO_ESTADO_CLIENTE[cliente.estado]}>
            {ESTADOS_CLIENTE[cliente.estado]}
          </Insignia>
          {!cliente.entrenador_id && <BotonAsignarme clienteId={cliente.id} />}
          <BotonEnlace
            href={`/entrenador/clientes/${cliente.id}/progreso`}
            variante="contorno"
            tamano="sm"
          >
            Ver progreso
          </BotonEnlace>
          <BotonEnlace
            href={`/entrenador/dietas?cliente=${cliente.id}`}
            variante="contorno"
            tamano="sm"
          >
            Asignar plan
          </BotonEnlace>
          <BotonEnlace
            href={`/entrenador/rutinas?cliente=${cliente.id}`}
            tamano="sm"
          >
            Asignar rutina
          </BotonEnlace>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5">
          <Tarjeta>
            <TituloTarjeta>Ficha de seguimiento</TituloTarjeta>
            <FormularioFicha cliente={cliente} />
          </Tarjeta>

          <Tarjeta>
            <TituloTarjeta>
              <span className="flex items-center gap-2">
                <StickyNote size={13} /> Notas internas
              </span>
            </TituloTarjeta>
            <PanelNotas
              clienteId={cliente.id}
              notas={(notas ?? []).map((n) => ({
                ...n,
                autor: nombreVisible(autores.get(n.autor_id)),
              }))}
            />
          </Tarjeta>
        </div>

        <div className="space-y-5">
          <Tarjeta>
            <TituloTarjeta
              extra={
                <Link
                  href={`/entrenador/clientes/${cliente.id}/evaluacion`}
                  className="text-xs font-light text-violeta-600 underline-offset-4 hover:underline"
                >
                  Nueva evaluación
                </Link>
              }
            >
              <span className="flex items-center gap-2">
                <ClipboardList size={13} /> Evaluación inicial
              </span>
            </TituloTarjeta>

            {ultima ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { et: "Altura", v: ultima.altura_cm, u: "cm" },
                    { et: "Peso", v: ultima.peso_kg, u: "kg" },
                    { et: "Grasa", v: ultima.grasa_pct, u: "%" },
                  ].map((m) => (
                    <div
                      key={m.et}
                      className="rounded-3xl bg-lila-50 px-4 py-4 text-center"
                    >
                      <p className="text-[10px] tracking-[0.16em] text-violeta-500 uppercase">
                        {m.et}
                      </p>
                      <p className="mt-2 text-2xl font-light text-violeta-800">
                        {m.v ?? "—"}
                        {m.v != null && (
                          <span className="ml-0.5 text-xs text-violeta-900/40">
                            {m.u}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {Object.keys(ultima.medidas ?? {}).length > 0 && (
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-[11px] tracking-[0.16em] text-violeta-500 uppercase">
                      <Ruler size={12} /> Medidas (cm)
                    </p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-light sm:grid-cols-3">
                      {MEDIDAS.filter((m) => ultima.medidas[m.clave] != null).map(
                        (m) => (
                          <div key={m.clave} className="flex justify-between gap-2">
                            <dt className="text-violeta-900/50">{m.etiqueta}</dt>
                            <dd className="text-violeta-900/80">
                              {ultima.medidas[m.clave]}
                            </dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                )}

                <dl className="space-y-4 border-t border-lila-100 pt-5 text-sm font-light">
                  {[
                    { et: "Objetivos", v: ultima.objetivos },
                    { et: "Condiciones médicas", v: ultima.condiciones_medicas },
                    { et: "Lesiones", v: ultima.lesiones },
                    { et: "Medicamentos", v: ultima.medicamentos },
                    { et: "Alergias", v: ultima.alergias_alimentarias },
                    { et: "Equipo disponible", v: ultima.equipo_disponible },
                    {
                      et: "Días disponibles",
                      v: ultima.dias_disponibles
                        ? `${ultima.dias_disponibles} por semana`
                        : null,
                    },
                    { et: "Sueño", v: ultima.habitos_sueno },
                    { et: "Estrés", v: ultima.nivel_estres },
                  ]
                    .filter((x) => x.v)
                    .map((x) => (
                      <div key={x.et}>
                        <dt className="text-[11px] tracking-[0.14em] text-violeta-500 uppercase">
                          {x.et}
                        </dt>
                        <dd className="mt-1 leading-relaxed text-violeta-900/75">
                          {x.v}
                        </dd>
                      </div>
                    ))}
                </dl>

                {(evaluaciones?.length ?? 0) > 1 && (
                  <p className="text-xs font-light text-violeta-900/45">
                    {evaluaciones!.length} evaluaciones registradas. Mostrando la más
                    reciente ({FECHA_LARGA.format(fechaLocal(ultima.fecha))}).
                  </p>
                )}
              </div>
            ) : (
              <Vacio
                icono={ClipboardList}
                titulo="Sin evaluación todavía"
                descripcion="Registra medidas, objetivos e historial médico para diseñar su plan"
                accion={
                  <BotonEnlace
                    href={`/entrenador/clientes/${cliente.id}/evaluacion`}
                    tamano="sm"
                  >
                    Registrar evaluación
                  </BotonEnlace>
                }
              />
            )}
          </Tarjeta>

          <Tarjeta>
            <TituloTarjeta>Resumen</TituloTarjeta>
            <dl className="space-y-3 text-sm font-light">
              {[
                {
                  et: "Objetivo",
                  v: cliente.objetivo ? OBJETIVOS[cliente.objetivo] : "Sin definir",
                },
                {
                  et: "Nivel",
                  v: cliente.nivel ? NIVELES[cliente.nivel] : "Sin definir",
                },
                { et: "Origen", v: cliente.origen || "No indicado" },
              ].map((x) => (
                <div key={x.et} className="flex justify-between gap-4">
                  <dt className="text-violeta-900/45">{x.et}</dt>
                  <dd className="text-right text-violeta-900/80">{x.v}</dd>
                </div>
              ))}
            </dl>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
