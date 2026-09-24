import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { iniciales, mapaPerfiles, nombreVisible } from "@/lib/datos";
import { Encabezado, Tarjeta, Vacio } from "@/components/panel/piezas";
import { Chat } from "@/components/panel/chat";
import { cn } from "@/lib/utils";

export default async function ChatEntrenador({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const perfil = await exigirRol("entrenador", "admin");
  const { c: seleccionada } = await searchParams;

  const supabase = await crearClienteServidor();
  const { data: conversaciones } = await supabase
    .from("conversaciones")
    .select("*")
    .order("ultimo_mensaje_en", { ascending: false });

  const lista = conversaciones ?? [];

  if (lista.length === 0) {
    return (
      <div>
        <Encabezado titulo="Mensajes" />
        <Vacio
          icono={MessageCircle}
          titulo="Sin conversaciones"
          descripcion="Cuando una clienta abra su chat, la conversación aparecerá aquí"
        />
      </div>
    );
  }

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, perfil_id")
    .in(
      "id",
      lista.map((cv) => cv.cliente_id)
    );

  const perfilPorCliente = new Map(
    (clientes ?? []).map((cl) => [cl.id, cl.perfil_id])
  );
  const perfiles = await mapaPerfiles((clientes ?? []).map((cl) => cl.perfil_id));

  const activa = lista.find((cv) => cv.id === seleccionada) ?? lista[0];
  const perfilActiva = perfiles.get(perfilPorCliente.get(activa.cliente_id) ?? "");

  const { data: mensajes } = await supabase
    .from("mensajes")
    .select("*")
    .eq("conversacion_id", activa.id)
    // Los ultimos 200: se piden del mas nuevo al mas viejo para quedarse con
    // la cola de la conversacion, y luego se le da la vuelta para pintarla en
    // orden. Sin tope, una conversacion antigua se carga entera cada vez.
    .order("creado_en", { ascending: false })
    .limit(200);

  return (
    <div>
      <Encabezado
        titulo="Mensajes"
        descripcion={`${lista.length} conversación${lista.length === 1 ? "" : "es"}`}
      />

      <div className="grid gap-5 lg:grid-cols-[19rem_1fr]">
        <Tarjeta className="h-fit p-4">
          <ul className="space-y-1.5">
            {lista.map((cv) => {
              const p = perfiles.get(perfilPorCliente.get(cv.cliente_id) ?? "");
              const esActiva = cv.id === activa.id;
              return (
                <li key={cv.id}>
                  <Link
                    href={`/entrenador/chat?c=${cv.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-3xl px-4 py-3 transition-all duration-300",
                      esActiva
                        ? "fondo-degradado text-white shadow-suave"
                        : "hover:bg-lila-100"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                        esActiva
                          ? "bg-white/25 text-white"
                          : "fondo-degradado text-white"
                      )}
                    >
                      {iniciales(p?.nombre_completo, p?.correo)}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          esActiva ? "text-white" : "text-violeta-800"
                        )}
                      >
                        {nombreVisible(p)}
                      </span>
                      <span
                        className={cn(
                          "block truncate text-[11px] font-light",
                          esActiva ? "text-lila-100/80" : "text-violeta-900/45"
                        )}
                      >
                        {new Date(cv.ultimo_mensaje_en).toLocaleDateString("es-DO", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Tarjeta>

        <Chat
          key={activa.id}
          conversacionId={activa.id}
          perfilId={perfil.id}
          nombreOtro={nombreVisible(perfilActiva)}
          inicialesOtro={iniciales(
            perfilActiva?.nombre_completo,
            perfilActiva?.correo
          )}
          mensajesIniciales={[...(mensajes ?? [])].reverse()}
        />
      </div>
    </div>
  );
}
