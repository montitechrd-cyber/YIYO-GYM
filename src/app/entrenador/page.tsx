import Link from "next/link";
import { Users, UserPlus, CalendarDays, MessageCircle, ArrowRight } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clientesConPerfil, iniciales, nombreVisible } from "@/lib/datos";
import {
  Encabezado,
  Insignia,
  Metrica,
  Tarjeta,
  TituloTarjeta,
  Vacio,
} from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import type { EstadoCliente } from "@/lib/supabase/tipos";
import { hoyTexto } from "@/lib/programacion";

const TONO_ESTADO: Record<EstadoCliente, "verde" | "lila" | "ambar" | "gris"> = {
  activo: "verde",
  prospecto: "lila",
  pausado: "ambar",
  inactivo: "gris",
};

export default async function ResumenEntrenador() {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  const hoy = hoyTexto();

  const [lista, { data: sesiones }] = await Promise.all([
    clientesConPerfil(),
    supabase.from("sesiones").select("*").gte("fecha", hoy).order("fecha").limit(6),
  ]);

  const agenda = sesiones ?? [];
  const clientesPorId = new Map(lista.map((c) => [c.id, c]));

  const activos = lista.filter((c) => c.estado === "activo").length;
  const prospectos = lista.filter((c) => c.estado === "prospecto").length;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const nuevosMes = lista.filter((c) => new Date(c.creado_en) >= inicioMes).length;

  return (
    <div>
      <Encabezado
        titulo={`Hola, ${perfil.nombre_completo.split(" ")[0] || "entrenadora"}`}
        descripcion="Tu cartera de clientas de un vistazo"
        acciones={
          <BotonEnlace href="/entrenador/clientes">
            Ver clientes
            <ArrowRight size={16} />
          </BotonEnlace>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          etiqueta="Clientas activas"
          valor={activos}
          detalle={`${lista.length} en total`}
          icono={Users}
          destacada
        />
        <Metrica
          etiqueta="Prospectos"
          valor={prospectos}
          detalle="Pendientes de convertir"
          icono={UserPlus}
        />
        <Metrica
          etiqueta="Nuevas este mes"
          valor={nuevosMes}
          detalle="Altas recientes"
          icono={UserPlus}
        />
        <Metrica
          etiqueta="Sesiones próximas"
          valor={agenda.length}
          detalle="En los próximos días"
          icono={CalendarDays}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Tarjeta>
          <TituloTarjeta
            extra={
              <Link
                href="/entrenador/clientes"
                className="text-xs font-light text-violeta-600 underline-offset-4 hover:underline"
              >
                Ver todas
              </Link>
            }
          >
            Clientas recientes
          </TituloTarjeta>

          {lista.length > 0 ? (
            <ul className="space-y-3">
              {lista.slice(0, 6).map((c) => {
                const p = c.perfil;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/entrenador/clientes/${c.id}`}
                      className="flex items-center justify-between gap-4 rounded-3xl border border-lila-200 px-5 py-4 transition-colors hover:border-lila-400 hover:bg-lila-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full fondo-degradado text-[11px] font-medium text-white">
                          {iniciales(p?.nombre_completo, p?.correo)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-violeta-800">
                            {nombreVisible(p)}
                          </span>
                          <span className="block truncate text-xs font-light text-violeta-900/50">
                            {p?.correo}
                          </span>
                        </span>
                      </div>
                      <Insignia tono={TONO_ESTADO[c.estado]}>{c.estado}</Insignia>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vacio
              icono={Users}
              titulo="Todavía no tienes clientas"
              descripcion="Cuando alguien se registre en la plataforma aparecerá aquí"
            />
          )}
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta
            extra={
              <Link
                href="/entrenador/calendario"
                className="text-xs font-light text-violeta-600 underline-offset-4 hover:underline"
              >
                Calendario
              </Link>
            }
          >
            Agenda próxima
          </TituloTarjeta>

          {agenda.length > 0 ? (
            <ul className="space-y-3">
              {agenda.map((s) => {
                const p = clientesPorId.get(s.cliente_id)?.perfil ?? null;
                return (
                  <li key={s.id} className="rounded-3xl border border-lila-200 px-5 py-4">
                    <p className="text-sm font-medium text-violeta-800">
                      {nombreVisible(p)}
                    </p>
                    <p className="mt-1 text-xs font-light text-violeta-900/50">
                      {new Date(s.fecha + "T00:00:00").toLocaleDateString("es-DO", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      {s.hora ? ` · ${s.hora.slice(0, 5)}` : ""} — {s.titulo}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vacio
              icono={MessageCircle}
              titulo="Agenda despejada"
              descripcion="No hay sesiones programadas próximamente"
            />
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
