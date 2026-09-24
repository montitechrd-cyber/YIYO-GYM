import { TrendingUp, Scale, Percent, Ruler, Dumbbell, Flame, CalendarCheck } from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FECHA_CORTA, FECHA_LARGA, MEDIDAS, fechaLocal } from "@/lib/etiquetas";
import {
  Encabezado,
  Metrica,
  Tarjeta,
  TituloTarjeta,
  Vacio,
} from "@/components/panel/piezas";
import { GraficaArea, GraficaLineas } from "@/components/panel/graficas-carga";
import { GaleriaProgreso } from "@/components/panel/galeria-progreso";
import { urlsFirmadas } from "@/lib/datos";
import { estadisticasSemana } from "@/lib/estadisticas";
import { RegistrarProgreso } from "./registrar";
import { BotonEnlace } from "@/components/ui/boton";

export default async function MiProgreso() {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);

  if (!cliente) {
    return (
      <div>
        <Encabezado titulo="Mi progreso" />
        <Vacio
          icono={TrendingUp}
          titulo="Sin ficha activa"
          descripcion="Completa tu evaluación inicial para empezar a medir tu evolución."
          accion={<BotonEnlace href="/panel/bienvenida">Empezar</BotonEnlace>}
        />
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const [{ data: registros }, { data: evaluacion }, semana] = await Promise.all([
    supabase
      .from("progreso")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("fecha"),
    supabase
      .from("evaluaciones")
      .select("peso_kg, grasa_pct, medidas")
      .eq("cliente_id", cliente.id)
      .order("fecha")
      .limit(1)
      .maybeSingle(),
    estadisticasSemana(cliente.id),
  ]);

  const lista = registros ?? [];
  const ultimo = lista.at(-1);
  const primero = lista[0];

  const pesoInicial = evaluacion?.peso_kg ?? primero?.peso_kg ?? null;
  const grasaInicial = evaluacion?.grasa_pct ?? primero?.grasa_pct ?? null;

  const delta = (actual: number | null, inicial: number | null) =>
    actual != null && inicial != null
      ? Number((actual - inicial).toFixed(1))
      : null;

  const deltaPeso = delta(ultimo?.peso_kg ?? null, pesoInicial);
  const deltaGrasa = delta(ultimo?.grasa_pct ?? null, grasaInicial);

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

  // Las fotos viven en un bucket privado: hay que firmarlas para poder verlas.
  const rutasFotos = lista.flatMap((r) => (r.fotos ?? []).map((f) => ({ f, fecha: r.fecha })));
  const firmadas = await urlsFirmadas(rutasFotos.map((x) => x.f));
  const fotos = rutasFotos
    .map((x) => ({ fecha: x.fecha, url: firmadas.get(x.f) ?? "" }))
    .filter((x) => x.url)
    .reverse();

  return (
    <div>
      <Encabezado
        titulo="Mi progreso"
        descripcion="Los datos no mienten. Aquí ves tu evolución real."
        acciones={<RegistrarProgreso />}
      />

      <section className="mb-8">
        <h2 className="mb-4 text-[11px] tracking-[0.2em] text-violeta-500 uppercase">
          Tu semana
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Metrica
            etiqueta="Ejercicios hechos"
            valor={semana.ejerciciosSemana}
            detalle="Esta semana"
            icono={Dumbbell}
          />
          <Metrica
            etiqueta="Sesiones completadas"
            valor={semana.sesionesSemana}
            detalle="Esta semana"
            icono={CalendarCheck}
          />
          <Metrica
            etiqueta="Calorías hoy"
            valor={
              semana.caloriasObjetivo
                ? `${semana.caloriasHoy} / ${semana.caloriasObjetivo}`
                : semana.caloriasHoy
            }
            detalle={
              semana.caloriasObjetivo
                ? "De tu objetivo diario"
                : "Marca tus comidas en Nutrición"
            }
            icono={Flame}
          />
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          etiqueta="Peso actual"
          valor={ultimo?.peso_kg != null ? `${ultimo.peso_kg} kg` : "—"}
          detalle={
            deltaPeso != null
              ? `${deltaPeso > 0 ? "+" : ""}${deltaPeso} kg desde el inicio`
              : "Sin comparativa aún"
          }
          icono={Scale}
          destacada
        />
        <Metrica
          etiqueta="Grasa corporal"
          valor={ultimo?.grasa_pct != null ? `${ultimo.grasa_pct}%` : "—"}
          detalle={
            deltaGrasa != null
              ? `${deltaGrasa > 0 ? "+" : ""}${deltaGrasa} puntos`
              : "Sin comparativa aún"
          }
          icono={Percent}
        />
        <Metrica
          etiqueta="Masa muscular"
          valor={ultimo?.musculo_pct != null ? `${ultimo.musculo_pct}%` : "—"}
          detalle="Último registro"
          icono={TrendingUp}
        />
        <Metrica
          etiqueta="Registros"
          valor={lista.length}
          detalle={
            ultimo
              ? `Último: ${FECHA_LARGA.format(fechaLocal(ultimo.fecha))}`
              : "Ninguno todavía"
          }
          icono={Ruler}
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
              <TituloTarjeta>Medidas corporales (cm)</TituloTarjeta>
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
                  Registra tus medidas para verlas aquí.
                </p>
              )}
            </Tarjeta>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <Vacio
            icono={TrendingUp}
            titulo={
              lista.length === 1
                ? "Necesitas al menos dos registros"
                : "Sin registros todavía"
            }
            descripcion="Registra tu peso y medidas cada semana para ver tus gráficas de evolución."
            accion={<RegistrarProgreso />}
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

      {lista.length > 0 && (
        <div className="mt-6">
          <Tarjeta>
            <TituloTarjeta>Historial</TituloTarjeta>
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-125 text-sm">
                <thead>
                  <tr className="border-b border-lila-200 text-left text-[10px] tracking-[0.16em] text-violeta-500 uppercase">
                    <th className="px-2 py-3 font-normal">Fecha</th>
                    <th className="px-2 py-3 font-normal">Peso</th>
                    <th className="px-2 py-3 font-normal">Grasa</th>
                    <th className="px-2 py-3 font-normal">Músculo</th>
                    <th className="px-2 py-3 font-normal">Notas</th>
                  </tr>
                </thead>
                <tbody className="font-light text-violeta-900/75">
                  {[...lista].reverse().map((r) => (
                    <tr key={r.id} className="border-b border-lila-100 last:border-0">
                      <td className="px-2 py-3 whitespace-nowrap">
                        {FECHA_LARGA.format(fechaLocal(r.fecha))}
                      </td>
                      <td className="px-2 py-3">
                        {r.peso_kg != null ? `${r.peso_kg} kg` : "—"}
                      </td>
                      <td className="px-2 py-3">
                        {r.grasa_pct != null ? `${r.grasa_pct}%` : "—"}
                      </td>
                      <td className="px-2 py-3">
                        {r.musculo_pct != null ? `${r.musculo_pct}%` : "—"}
                      </td>
                      <td className="max-w-75 truncate px-2 py-3 text-violeta-900/55">
                        {r.notas ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        </div>
      )}
    </div>
  );
}
