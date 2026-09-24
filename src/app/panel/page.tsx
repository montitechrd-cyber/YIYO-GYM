import Link from "next/link";
import {
  CalendarDays,
  Dumbbell,
  Flame,
  TrendingUp,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Encabezado, Metrica, Tarjeta, TituloTarjeta, Vacio, Insignia } from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { Corazon } from "@/components/brand/decoraciones";
import { hoyTexto } from "@/lib/programacion";

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-DO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function ResumenCliente() {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);
  const supabase = await crearClienteServidor();

  if (!cliente) {
    return (
      <div>
        <Encabezado
          titulo={`${saludo()}, ${perfil.nombre_completo.split(" ")[0] || "bienvenida"}`}
          descripcion="Todavía no tienes una ficha de cliente activa"
        />
        <Vacio
          icono={ClipboardList}
          titulo="Completa tu evaluación inicial"
          descripcion="Es el primer paso para que Yiyo diseñe tu plan personalizado"
          accion={
            <BotonEnlace href="/panel/bienvenida">Empezar evaluación</BotonEnlace>
          }
        />
      </div>
    );
  }

  const hoy = hoyTexto();

  const [{ data: sesiones }, { data: progresos }, { data: registros }, { data: evaluacion }] =
    await Promise.all([
      supabase
        .from("sesiones")
        .select("*")
        .eq("cliente_id", cliente.id)
        .gte("fecha", hoy)
        .order("fecha")
        .limit(4),
      supabase
        .from("progreso")
        .select("*")
        .eq("cliente_id", cliente.id)
        .order("fecha", { ascending: false })
        .limit(2),
      supabase
        .from("registros_entrenamiento")
        .select("id, fecha")
        .eq("cliente_id", cliente.id)
        .order("fecha", { ascending: false })
        .limit(60),
      supabase
        .from("evaluaciones")
        .select("peso_kg")
        .eq("cliente_id", cliente.id)
        .order("fecha")
        .limit(1)
        .maybeSingle(),
    ]);

  const ultimoPeso = progresos?.[0]?.peso_kg ?? null;
  const pesoInicial = evaluacion?.peso_kg ?? progresos?.at(-1)?.peso_kg ?? null;
  const diferencia =
    ultimoPeso != null && pesoInicial != null
      ? Number((ultimoPeso - pesoInicial).toFixed(1))
      : null;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const esteMs = (registros ?? []).filter(
    (r) => new Date(r.fecha) >= inicioMes
  ).length;

  return (
    <div>
      <Encabezado
        titulo={
          <>
            {saludo()}, {perfil.nombre_completo.split(" ")[0] || "guerrera"}{" "}
            <Corazon className="inline h-6 w-6 text-lila-400" />
          </>
        }
        descripcion="Este es tu espacio. Aquí vive todo tu proceso"
        acciones={
          <BotonEnlace href="/panel/entrenamientos">
            Entrenar hoy
            <ArrowRight size={16} />
          </BotonEnlace>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          etiqueta="Entrenamientos este mes"
          valor={esteMs}
          detalle="Sesiones registradas"
          icono={Dumbbell}
          destacada
        />
        <Metrica
          etiqueta="Peso actual"
          valor={ultimoPeso != null ? `${ultimoPeso} kg` : "—"}
          detalle={
            diferencia != null
              ? `${diferencia > 0 ? "+" : ""}${diferencia} kg desde el inicio`
              : "Registra tu primer peso"
          }
          icono={TrendingUp}
        />
        <Metrica
          etiqueta="Racha total"
          valor={registros?.length ?? 0}
          detalle="Entrenamientos acumulados"
          icono={Flame}
        />
        <Metrica
          etiqueta="Próxima sesión"
          valor={
            sesiones?.[0]
              ? new Date(sesiones[0].fecha + "T00:00:00").toLocaleDateString("es-DO", {
                  day: "numeric",
                  month: "short",
                })
              : "—"
          }
          detalle={sesiones?.[0]?.titulo ?? "Nada programado"}
          icono={CalendarDays}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Tarjeta>
          <TituloTarjeta
            extra={
              <Link
                href="/panel/calendario"
                className="text-xs font-light text-violeta-600 underline-offset-4 hover:underline"
              >
                Ver calendario
              </Link>
            }
          >
            Próximas sesiones
          </TituloTarjeta>

          {sesiones && sesiones.length > 0 ? (
            <ul className="space-y-3">
              {sesiones.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-lila-200 px-5 py-4 transition-colors hover:border-lila-400 hover:bg-lila-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-violeta-800">
                      {s.titulo}
                    </p>
                    <p className="mt-1 text-xs font-light text-violeta-900/50 first-letter:uppercase">
                      {FORMATO_FECHA.format(new Date(s.fecha + "T00:00:00"))}
                      {s.hora ? ` · ${s.hora.slice(0, 5)}` : ""}
                    </p>
                  </div>
                  <Insignia tono={s.estado === "completada" ? "verde" : "lila"}>
                    {s.estado}
                  </Insignia>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio
              icono={CalendarDays}
              titulo="Sin sesiones programadas"
              descripcion="Cuando Yiyo te asigne una rutina verás aquí tus próximos entrenamientos"
            />
          )}
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta
            extra={
              <Link
                href="/panel/progreso"
                className="text-xs font-light text-violeta-600 underline-offset-4 hover:underline"
              >
                Ver todo
              </Link>
            }
          >
            Último registro
          </TituloTarjeta>

          {progresos && progresos.length > 0 ? (
            <div className="space-y-4">
              <p className="text-5xl font-light text-violeta-700">
                {progresos[0].peso_kg ?? "—"}
                <span className="ml-1 text-lg text-violeta-900/40">kg</span>
              </p>
              <p className="text-xs font-light text-violeta-900/50">
                Registrado el{" "}
                {new Date(progresos[0].fecha + "T00:00:00").toLocaleDateString("es-DO", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
              {progresos[0].grasa_pct != null && (
                <p className="text-sm font-light text-violeta-900/70">
                  Grasa corporal: {progresos[0].grasa_pct}%
                </p>
              )}
            </div>
          ) : (
            <Vacio
              icono={TrendingUp}
              titulo="Aún sin registros"
              descripcion="Anota tu peso y medidas para ver tu evolución en gráficas"
              accion={
                <BotonEnlace href="/panel/progreso" tamano="sm">
                  Registrar ahora
                </BotonEnlace>
              }
            />
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
