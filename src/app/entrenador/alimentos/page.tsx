import { Apple, Search } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { CATEGORIAS_ALIMENTO } from "@/lib/nutricion";
import { Encabezado, Insignia, Tarjeta, Vacio } from "@/components/panel/piezas";
import { Entrada, Seleccion } from "@/components/ui/campo";
import { GestorAlimento } from "./gestor";
import type { CategoriaAlimento } from "@/lib/supabase/tipos";

export default async function CatalogoAlimentos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { q = "", categoria = "" } = await searchParams;

  const supabase = await crearClienteServidor();
  let consulta = supabase.from("alimentos").select("*").order("nombre");
  if (categoria) consulta = consulta.eq("categoria", categoria as CategoriaAlimento);
  if (q.trim()) consulta = consulta.ilike("nombre", `%${q.trim()}%`);

  const { data } = await consulta;
  const alimentos = data ?? [];

  return (
    <div>
      <Encabezado
        titulo="Alimentos"
        descripcion={`${alimentos.length} alimento${alimentos.length === 1 ? "" : "s"} en el catálogo. Con ellos armas las dietas.`}
        acciones={<GestorAlimento modo="crear" />}
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
              placeholder="Buscar alimento"
              className="pl-11"
            />
          </div>
          <Seleccion name="categoria" defaultValue={categoria} className="w-52">
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIAS_ALIMENTO).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
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

      {alimentos.length > 0 ? (
        <Tarjeta className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-sm">
              <thead>
                <tr className="border-b border-lila-200 text-left text-[10px] tracking-[0.16em] text-violeta-500 uppercase">
                  <th className="px-6 py-4 font-normal">Alimento</th>
                  <th className="px-3 py-4 font-normal">Medida</th>
                  <th className="px-3 py-4 font-normal">Kcal</th>
                  <th className="px-3 py-4 font-normal">Prot.</th>
                  <th className="px-3 py-4 font-normal">Carb.</th>
                  <th className="px-3 py-4 font-normal">Grasa</th>
                  <th className="px-6 py-4 font-normal"></th>
                </tr>
              </thead>
              <tbody className="font-light text-violeta-900/75">
                {alimentos.map((a) => (
                  <tr key={a.id} className="border-b border-lila-100 last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-medium text-violeta-800">{a.nombre}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-violeta-900/45">
                        <Insignia tono="lila">
                          {CATEGORIAS_ALIMENTO[a.categoria]}
                        </Insignia>
                        {a.marca}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-xs whitespace-nowrap">
                      {a.unidad === "unidad"
                        ? `por unidad${a.gramos_por_unidad ? ` (${a.gramos_por_unidad} g)` : ""}`
                        : `por 100 ${a.unidad}`}
                    </td>
                    <td className="px-3 py-4 font-medium text-violeta-700">
                      {Math.round(Number(a.calorias))}
                    </td>
                    <td className="px-3 py-4">{Number(a.proteina_g)} g</td>
                    <td className="px-3 py-4">{Number(a.carbohidratos_g)} g</td>
                    <td className="px-3 py-4">{Number(a.grasa_g)} g</td>
                    <td className="px-6 py-4">
                      <GestorAlimento modo="editar" alimento={a} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      ) : (
        <Vacio
          icono={Apple}
          titulo={q || categoria ? "Sin resultados" : "Catálogo vacío"}
          descripcion={
            q || categoria
              ? "Prueba con otros filtros."
              : "Añade alimentos para poder construir dietas con ellos."
          }
          accion={<GestorAlimento modo="crear" />}
        />
      )}
    </div>
  );
}
