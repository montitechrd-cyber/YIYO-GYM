import Link from "next/link";
import { Plus, Salad, User } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { catalogoDePlanes } from "@/lib/catalogo";
import { clientesConSugerencia } from "@/lib/dietas";
import { hoyTexto } from "@/lib/programacion";
import { FECHA_LARGA, fechaLocal } from "@/lib/etiquetas";
import { Encabezado, Insignia } from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { CatalogoDietas } from "./catalogo";

/**
 * Nutrición: el catálogo de planes de alimentación prearmados y lo que ya
 * tiene asignado cada clienta, en una sola pantalla. Mismo criterio que
 * Rutinas: una dieta asignada es una copia de un plan del catálogo, así que
 * viven juntas en vez de en secciones separadas.
 *
 * El catálogo de alimentos (los ingredientes sueltos) sigue en su propia
 * sección: es la materia prima, igual que Ejercicios lo es para Rutinas.
 */
export default async function Dietas({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { cliente } = await searchParams;

  const [planes, { data }, clientes] = await Promise.all([
    catalogoDePlanes(),
    crearClienteServidor().then((s) =>
      s.from("planes_alimentacion").select("*").order("creado_en", { ascending: false })
    ),
    clientesConSugerencia(),
  ]);

  const asignados = (data ?? []).filter((p) => !p.es_sistema);
  const nombrePorCliente = new Map(clientes.map((c) => [c.id, c.nombre]));

  return (
    <div>
      <Encabezado
        titulo="Nutrición"
        descripcion="Elige un plan, dile a quién y las cantidades se ajustan solas a sus calorías."
        acciones={
          <BotonEnlace href="/entrenador/dietas/nueva" variante="contorno">
            <Plus size={16} />
            Armar una desde cero
          </BotonEnlace>
        }
      />

      <CatalogoDietas
        planes={planes}
        clientes={clientes}
        hoy={hoyTexto()}
        clientePreseleccionado={cliente}
      />

      <section className="mt-12">
        <h2 className="text-[11px] tracking-[0.2em] text-violeta-500 uppercase">
          Ya asignadas
        </h2>
        <p className="mt-1.5 mb-6 text-sm font-light text-violeta-900/55">
          {asignados.length} plan{asignados.length === 1 ? "" : "es"} activos o en
          curso, ya sea del catálogo o armados a mano.
        </p>

        {asignados.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {asignados.map((p) => (
              <Link
                key={p.id}
                href={`/entrenador/dietas/${p.id}`}
                className="group rounded-4xl border border-lila-200 bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:border-lila-400 hover:shadow-elevada"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-medium text-violeta-800">
                    {p.emoji && <span aria-hidden>{p.emoji}</span>}
                    {p.nombre}
                  </h3>
                  <Insignia tono={p.activo ? "verde" : "gris"}>
                    {p.activo ? "Activa" : "Inactiva"}
                  </Insignia>
                </div>

                {p.descripcion && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed font-light text-violeta-900/60">
                    {p.descripcion}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-2 border-t border-lila-100 pt-4 text-xs font-light text-violeta-900/55">
                  <User size={13} className="text-lila-400" />
                  {p.cliente_id ? nombrePorCliente.get(p.cliente_id) : "Sin clienta"}
                </div>

                <p className="mt-2 text-[11px] font-light text-violeta-900/40">
                  {p.calorias_objetivo
                    ? `${p.calorias_objetivo} kcal/día · `
                    : "Sin objetivo definido · "}
                  desde el {FECHA_LARGA.format(fechaLocal(p.inicio))}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-4xl border border-dashed border-lila-300 px-6 py-10 text-center text-sm font-light text-violeta-900/45">
            <Salad size={20} className="mx-auto mb-2 text-lila-400" />
            Todavía no le has asignado ningún plan a nadie.
          </p>
        )}
      </section>
    </div>
  );
}
