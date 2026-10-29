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
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div className="relative min-w-0 flex-1 sm:min-w-56">
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
          <Seleccion name="categoria" defaultValue={categoria} className="w-full sm:w-52">
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIAS_ALIMENTO).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </Seleccion>
          <button
            type="submit"
            className="h-11 w-full cursor-pointer sm:w-auto rounded-sm fondo-degradado px-7 text-sm font-medium text-white shadow-suave transition-all hover:brightness-110"
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
                  <th className="px-4 py-4 font-normal sm:px-6">Alimento</th>
                  <th className="px-3 py-4 font-normal">Medida</th>
                  <th className="px-3 py-4 font-normal">Kcal</th>
                  <th className="px-3 py-4 font-normal">Prot.</th>
                  <th className="px-3 py-4 font-normal">Carb.</th>
                  <th className="px-3 py-4 font-normal">Grasa</th>
                  <th className="px-4 py-4 font-normal sm:px-6"></th>
                </tr>
              </thead>
              <tbody className="font-normal text-violeta-900/75">
                {alimentos.map((a) => (
                  <tr key={a.id} className="border-b border-lila-100 last:border-0">
                    <td className="min-w-48 px-4 py-4 sm:px-6">
                      <p className="font-medium text-violeta-800">{a.nombre}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-violeta-900/45">
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
                    <td className="px-3 py-4 font-medium whitespace-nowrap text-violeta-700">
                      {Math.round(Number(a.calorias))}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">{Number(a.proteina_g)} g</td>
                    <td className="px-3 py-4 whitespace-nowrap">{Number(a.carbohidratos_g)} g</td>
                    <td className="px-3 py-4 whitespace-nowrap">{Number(a.grasa_g)} g</td>
                    <td className="px-4 py-4 sm:px-6">
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
