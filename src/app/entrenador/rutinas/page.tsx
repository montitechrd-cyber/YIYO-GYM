import Link from "next/link";
import { ListChecks, Plus, User } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clientesConPerfil, nombreVisible } from "@/lib/datos";
import { catalogoDeProgramas } from "@/lib/catalogo";
import { hoyTexto } from "@/lib/programacion";
import { FECHA_LARGA } from "@/lib/etiquetas";
import { Encabezado, Insignia } from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { Catalogo } from "./catalogo";

/**
 * Rutinas: el catálogo prearmado y lo que ya tiene asignado cada clienta,
 * en una sola pantalla.
 *
 * Antes «Programas» (el catálogo) y «Rutinas» (lo asignado) eran dos
 * secciones separadas del menú y se sentían como la misma cosa, porque lo
 * eran: una rutina asignada es solo una copia de un programa del catálogo.
 * Ahora es un solo recorrido: eliges el programa arriba, lo asignas, y
 * aparece abajo en «Ya asignadas».
 */
export default async function Rutinas({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { cliente } = await searchParams;

  const [programas, { data }, clientes] = await Promise.all([
    catalogoDeProgramas(),
    crearClienteServidor().then((s) =>
      s.from("rutinas").select("*").order("creado_en", { ascending: false })
    ),
    clientesConPerfil(),
  ]);

  // El catálogo puede venir vacío en dos casos distintos: porque falta la
  // migración (columna es_sistema inexistente) o porque simplemente no hay
  // clientas todavía. Aquí solo filtramos lo asignado.
  const asignadas = (data ?? []).filter((r) => !r.es_sistema);
  const perfilPorCliente = new Map(clientes.map((c) => [c.id, c.perfil]));

  return (
    <div>
      <Encabezado
        titulo="Rutinas"
        descripcion="Elige un programa, dile a quién y el calendario se llena solo"
        acciones={
          <BotonEnlace href="/entrenador/rutinas/nueva" variante="contorno">
            <Plus size={16} />
            Armar una desde cero
          </BotonEnlace>
        }
      />

      <Catalogo
        programas={programas}
        clientes={clientes.map((c) => ({ id: c.id, nombre: nombreVisible(c.perfil) }))}
        hoy={hoyTexto()}
        clientePreseleccionado={cliente}
      />

      <section className="mt-12">
        <h2 className="text-[11px] tracking-[0.2em] text-violeta-500 uppercase">
          Ya asignadas
        </h2>
        <p className="mt-1.5 mb-6 text-sm font-light text-violeta-900/55">
          {asignadas.length} rutina{asignadas.length === 1 ? "" : "s"} activas o
          en curso, ya sea del catálogo o armadas a mano.
        </p>

        {asignadas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {asignadas.map((r) => {
              const p = r.cliente_id ? perfilPorCliente.get(r.cliente_id) : null;
              return (
                <Link
                  key={r.id}
                  href={`/entrenador/rutinas/${r.id}`}
                  className="group rounded-4xl border border-lila-200 bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:border-lila-400 hover:shadow-elevada"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="flex items-center gap-2 font-medium text-violeta-800">
                      {r.emoji && <span aria-hidden>{r.emoji}</span>}
                      {r.nombre}
                    </h3>
                    <Insignia tono={r.activa ? "verde" : "gris"}>
                      {r.activa ? "Activa" : "Archivada"}
                    </Insignia>
                  </div>

                  {r.descripcion && (
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed font-light text-violeta-900/60">
                      {r.descripcion}
                    </p>
                  )}

                  <div className="mt-5 flex items-center gap-2 border-t border-lila-100 pt-4 text-xs font-light text-violeta-900/55">
                    <User size={13} className="text-lila-400" />
                    {p ? nombreVisible(p) : "Sin clienta asignada"}
                  </div>

                  <p className="mt-2 text-[11px] font-light text-violeta-900/40">
                    {r.dias_por_semana} días/semana · {r.semanas} semanas · creada
                    el {FECHA_LARGA.format(new Date(r.creado_en))}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="rounded-4xl border border-dashed border-lila-300 px-6 py-10 text-center text-sm font-light text-violeta-900/45">
            <ListChecks size={20} className="mx-auto mb-2 text-lila-400" />
            Todavía no le has asignado ninguna rutina a nadie.
          </p>
        )}
      </section>
    </div>
  );
}
