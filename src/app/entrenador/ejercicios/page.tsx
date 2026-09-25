import { Dumbbell, Search } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { GRUPOS, NIVELES } from "@/lib/etiquetas";
import { Encabezado, Tarjeta, Vacio } from "@/components/panel/piezas";
import { Entrada, Seleccion } from "@/components/ui/campo";
import { GestorEjercicios } from "./gestor";
import { VistaPreviaVideo } from "@/components/panel/video-ejercicio";
import { Demostracion } from "@/components/panel/demostracion-ejercicio";
import type { GrupoMuscular } from "@/lib/supabase/tipos";

export default async function BibliotecaEjercicios({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grupo?: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { q = "", grupo = "" } = await searchParams;

  const supabase = await crearClienteServidor();
  let consulta = supabase.from("ejercicios").select("*").order("nombre");
  if (grupo) consulta = consulta.eq("grupo", grupo as GrupoMuscular);
  if (q.trim()) consulta = consulta.ilike("nombre", `%${q.trim()}%`);

  const { data } = await consulta;

  // Orden de la biblioteca, de más a menos prioritario:
  //   1. Los destacados, que Yiyo fija a mano cuando graba algo nuevo.
  //   2. Los que tienen video, grabados por ella.
  //   3. Los que tienen la demostración animada.
  //   4. Alfabético dentro de cada grupo.
  //
  // Los que no enseñan nada van al final: son fichas a medio hacer, y
  // encabezando la lista solo estorban a quien busca con qué armar el día.
  const ejercicios = (data ?? []).sort((a, b) => {
    const destacado = Number(!!b.destacado) - Number(!!a.destacado);
    const tieneVideo = Number(!!b.video_url) - Number(!!a.video_url);
    const tieneImagen = Number(!!b.imagen_url) - Number(!!a.imagen_url);
    return (
      destacado || tieneVideo || tieneImagen || a.nombre.localeCompare(b.nombre, "es")
    );
  });

  return (
    <div>
      <Encabezado
        titulo="Biblioteca de ejercicios"
        descripcion={`${ejercicios.length} ejercicio${ejercicios.length === 1 ? "" : "s"} disponibles`}
        acciones={<GestorEjercicios modo="crear" />}
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
              placeholder="Buscar ejercicio"
              className="pl-11"
            />
          </div>
          <Seleccion name="grupo" defaultValue={grupo} className="w-52">
            <option value="">Todos los grupos</option>
            {Object.entries(GRUPOS).map(([v, t]) => (
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

      {ejercicios.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ejercicios.map((e) => (
            <article
              key={e.id}
              className="group overflow-hidden rounded-4xl border border-lila-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:border-lila-400 hover:shadow-elevada"
            >
              <div className="relative">
                {e.video_url ? (
                  <VistaPreviaVideo url={e.video_url} titulo={e.nombre} />
                ) : e.imagen_url ? (
                  <Demostracion url={e.imagen_url} titulo={e.nombre} />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br from-lila-100 to-lila-200">
                    <Dumbbell
                      size={34}
                      strokeWidth={1.2}
                      className="text-violeta-500/40"
                    />
                  </div>
                )}
                <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[10px] tracking-wide text-violeta-700 backdrop-blur">
                  {GRUPOS[e.grupo]}
                </span>
              </div>

              <div className="p-6">
                <h3 className="font-medium text-violeta-800">{e.nombre}</h3>
                <p className="mt-1 text-xs font-light text-violeta-900/50">
                  {NIVELES[e.nivel]}
                  {e.equipo ? ` · ${e.equipo}` : ""}
                </p>
                {e.instrucciones && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed font-light text-violeta-900/60">
                    {e.instrucciones}
                  </p>
                )}
                <div className="mt-5">
                  <GestorEjercicios modo="editar" ejercicio={e} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Vacio
          icono={Dumbbell}
          titulo={q || grupo ? "Sin resultados" : "Biblioteca vacía"}
          descripcion={
            q || grupo
              ? "Prueba con otros filtros."
              : "Añade tu primer ejercicio para empezar a construir rutinas."
          }
          accion={<GestorEjercicios modo="crear" />}
        />
      )}
    </div>
  );
}
