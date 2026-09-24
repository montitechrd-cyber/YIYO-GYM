import Link from "next/link";
import { Users, Search } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { clientesConPerfil, iniciales, nombreVisible } from "@/lib/datos";
import {
  ESTADOS_CLIENTE,
  OBJETIVOS,
  TONO_ESTADO_CLIENTE,
  FECHA_LARGA,
  fechaLocal,
} from "@/lib/etiquetas";
import { Encabezado, Insignia, Tarjeta, Vacio } from "@/components/panel/piezas";
import { Entrada, Seleccion } from "@/components/ui/campo";
import type { EstadoCliente } from "@/lib/supabase/tipos";

export default async function ListaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { q = "", estado = "" } = await searchParams;

  const clientes = await clientesConPerfil({
    estado: (estado || undefined) as EstadoCliente | undefined,
  });

  const busqueda = q.trim().toLowerCase();
  const visibles = busqueda
    ? clientes.filter(
        (c) =>
          c.perfil?.nombre_completo?.toLowerCase().includes(busqueda) ||
          c.perfil?.correo?.toLowerCase().includes(busqueda) ||
          c.etiquetas.some((e) => e.toLowerCase().includes(busqueda))
      )
    : clientes;

  return (
    <div>
      <Encabezado
        titulo="Clientes"
        descripcion={`${clientes.length} ficha${clientes.length === 1 ? "" : "s"} en el CRM`}
      />

      <Tarjeta className="mb-6">
        <form className="flex flex-wrap items-end gap-4">
          <div className="relative min-w-56 flex-1">
            <Search
              size={16}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-violeta-400"
            />
            <Entrada
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, correo o etiqueta"
              className="pl-11"
            />
          </div>
          <Seleccion name="estado" defaultValue={estado} className="w-48">
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS_CLIENTE).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Seleccion>
          <button
            type="submit"
            className="h-11 cursor-pointer rounded-full fondo-degradado px-7 text-sm font-medium text-white shadow-suave transition-all hover:brightness-110"
          >
            Filtrar
          </button>
        </form>
      </Tarjeta>

      {visibles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((c) => {
            const p = c.perfil;
            return (
              <Link
                key={c.id}
                href={`/entrenador/clientes/${c.id}`}
                // `min-w-0`: una celda de rejilla no encoge por debajo del
                // ancho mínimo de su contenido salvo que se le diga. Sin esto
                // la tarjeta se salía de la pantalla en móviles estrechos.
                className="group min-w-0 rounded-4xl border border-lila-200 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:border-lila-400 hover:shadow-elevada"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full fondo-degradado text-xs font-medium text-white">
                      {iniciales(p?.nombre_completo, p?.correo)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-violeta-800">
                        {nombreVisible(p)}
                      </span>
                      <span className="block truncate text-xs font-light text-violeta-900/50">
                        {p?.correo}
                      </span>
                    </span>
                  </div>
                  <Insignia tono={TONO_ESTADO_CLIENTE[c.estado]}>
                    {ESTADOS_CLIENTE[c.estado]}
                  </Insignia>
                </div>

                <dl className="mt-5 space-y-2 border-t border-lila-100 pt-4 text-xs font-light">
                  <div className="flex justify-between gap-3">
                    <dt className="text-violeta-900/45">Objetivo</dt>
                    <dd className="text-right text-violeta-900/75">
                      {c.objetivo ? OBJETIVOS[c.objetivo] : "Sin definir"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-violeta-900/45">Alta</dt>
                    <dd className="text-right text-violeta-900/75">
                      {FECHA_LARGA.format(fechaLocal(c.fecha_alta))}
                    </dd>
                  </div>
                </dl>

                {c.etiquetas.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.etiquetas.slice(0, 4).map((e) => (
                      <span
                        key={e}
                        className="rounded-full bg-lila-100 px-2.5 py-1 text-[10px] text-violeta-600"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <Vacio
          icono={Users}
          titulo={
            busqueda || estado ? "Sin resultados" : "Todavía no hay clientas"
          }
          descripcion={
            busqueda || estado
              ? "Prueba con otros filtros de búsqueda."
              : "Cuando alguien se registre en la plataforma aparecerá aquí automáticamente."
          }
        />
      )}
    </div>
  );
}
