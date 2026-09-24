import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Dumbbell, TrendingUp } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { mapaPerfiles, nombreVisible, urlsFirmadas } from "@/lib/datos";
import { GaleriaProgreso } from "@/components/panel/galeria-progreso";
import { FECHA_CORTA, FECHA_LARGA, MEDIDAS, fechaLocal } from "@/lib/etiquetas";
import {
  Encabezado,
  Metrica,
  Tarjeta,
  TituloTarjeta,
  Vacio,
} from "@/components/panel/piezas";
import { GraficaArea, GraficaLineas } from "@/components/panel/graficas-carga";
import { RegistrarProgreso } from "@/app/panel/progreso/registrar";

export default async function ProgresoDeCliente({
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

  const [{ data: registros }, { data: entrenamientos }, perfiles] =
    await Promise.all([
      supabase.from("progreso").select("*").eq("cliente_id", id).order("fecha"),
      supabase
        .from("registros_entrenamiento")
        .select("*")
        .eq("cliente_id", id)
        .order("fecha", { ascending: false })
        .limit(15),
      mapaPerfiles([cliente.perfil_id]),
    ]);

  const lista = registros ?? [];
  const ultimo = lista.at(-1);
  const primero = lista[0];

  const serie = lista.map((r) => ({
    fecha: FECHA_CORTA.format(fechaLocal(r.fecha)),
    peso: r.peso_kg,
    grasa: r.grasa_pct,
    musculo: r.musculo_pct,
    ...Object.fromEntries(
      MEDIDAS.map((m) => [m.clave, r.medidas?.[m.clave] ?? null])
    ),
  }));

  const medidasConDatos = MEDIDAS.filter((m) =>
    lista.some((r) => r.medidas?.[m.clave] != null)
  );

  const rutasFotos = lista.flatMap((r) =>
    (r.fotos ?? []).map((f) => ({ f, fecha: r.fecha }))
  );
  const firmadas = await urlsFirmadas(rutasFotos.map((x) => x.f));
  const fotos = rutasFotos
    .map((x) => ({ fecha: x.fecha, url: firmadas.get(x.f) ?? "" }))
    .filter((x) => x.url)
    .reverse();

  const deltaPeso =
    ultimo?.peso_kg != null && primero?.peso_kg != null
      ? Number((ultimo.peso_kg - primero.peso_kg).toFixed(1))
      : null;

  return (
    <div>
      <Link
        href={`/entrenador/clientes/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-xs font-light text-violeta-600 transition-colors hover:text-violeta-800"
      >
        <ArrowLeft size={14} />
        Volver a la ficha
      </Link>

      <Encabezado
        titulo="Progreso"
        descripcion={nombreVisible(perfiles.get(cliente.perfil_id))}
        acciones={
          <RegistrarProgreso
            clienteId={cliente.id}
            etiqueta={lista.length === 0 ? "Marcar medición inicial" : "Registrar este mes"}
          />
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          etiqueta="Peso actual"
          valor={ultimo?.peso_kg != null ? `${ultimo.peso_kg} kg` : "—"}
          detalle={
            deltaPeso != null
              ? `${deltaPeso > 0 ? "+" : ""}${deltaPeso} kg de cambio`
              : "Sin comparativa"
          }
          icono={TrendingUp}
          destacada
        />
        <Metrica
          etiqueta="Grasa corporal"
          valor={ultimo?.grasa_pct != null ? `${ultimo.grasa_pct}%` : "—"}
          detalle="Último registro"
        />
        <Metrica
          etiqueta="Registros de peso"
          valor={lista.length}
          detalle={
            ultimo ? FECHA_LARGA.format(fechaLocal(ultimo.fecha)) : "Ninguno"
          }
        />
        <Metrica
          etiqueta="Entrenamientos"
          valor={entrenamientos?.length ?? 0}
          detalle="Últimos registrados"
          icono={Dumbbell}
        />
      </div>

      {lista.length > 1 ? (
        <div className="mt-6 space-y-5">
          <Tarjeta>
            <TituloTarjeta>Evolución del peso</TituloTarjeta>
            <GraficaArea datos={serie} clave="peso" etiqueta="Peso" unidad=" kg" />
          </Tarjeta>

          <div className="grid gap-5 lg:grid-cols-2">
            <Tarjeta>
              <TituloTarjeta>Composición corporal</TituloTarjeta>
              <GraficaLineas
                datos={serie}
                series={[
                  { clave: "grasa", etiqueta: "Grasa %" },
                  { clave: "musculo", etiqueta: "Músculo %" },
                ]}
              />
            </Tarjeta>

            <Tarjeta>
              <TituloTarjeta>Medidas (cm)</TituloTarjeta>
              {medidasConDatos.length > 0 ? (
                <GraficaLineas
                  datos={serie}
                  series={medidasConDatos.map((m) => ({
                    clave: m.clave,
                    etiqueta: m.etiqueta,
                  }))}
                />
              ) : (
                <p className="py-12 text-center text-sm font-light text-violeta-900/45">
                  Sin medidas registradas.
                </p>
              )}
            </Tarjeta>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <Vacio
            icono={TrendingUp}
            titulo="Sin datos suficientes"
            descripcion="Esta clienta necesita al menos dos registros de progreso para ver gráficas."
          />
        </div>
      )}

      {fotos.length > 0 && (
        <div className="mt-6">
          <Tarjeta>
            <TituloTarjeta>Fotos de progreso</TituloTarjeta>
            <GaleriaProgreso fotos={fotos} />
          </Tarjeta>
        </div>
      )}

      <div className="mt-6">
        <Tarjeta>
          <TituloTarjeta>Entrenamientos recientes</TituloTarjeta>
          {entrenamientos && entrenamientos.length > 0 ? (
            <ul className="space-y-3">
              {entrenamientos.map((e) => (
                <li key={e.id} className="rounded-3xl border border-lila-200 px-5 py-4">
                  <p className="text-sm font-medium text-violeta-800 first-letter:uppercase">
                    {FECHA_LARGA.format(fechaLocal(e.fecha))}
                  </p>
                  <p className="mt-1 text-xs font-light text-violeta-900/50">
                    {e.duracion_min ? `${e.duracion_min} min` : "Sin duración"}
                    {e.esfuerzo_rpe ? ` · RPE ${e.esfuerzo_rpe}/10` : ""}
                    {e.sensacion ? ` · ${e.sensacion}` : ""}
                  </p>
                  {e.notas && (
                    <p className="mt-2 text-xs leading-relaxed font-light text-violeta-900/65">
                      {e.notas}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-light text-violeta-900/45">
              Todavía no ha registrado entrenamientos.
            </p>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
