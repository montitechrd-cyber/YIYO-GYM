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
  searchParams: Promise<{ q?: string; grupo?: string; ver?: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { q = "", grupo = "", ver = "" } = await searchParams;

  const supabase = await crearClienteServidor();
  let consulta = supabase.from("ejercicios").select("*").order("nombre");

  // La biblioteca enseña solo los ejercicios en uso. Los demás —los que se
  // quedaron sin demostración— siguen ahí, con su video y todo, pero
  // apartados: se llega a ellos con el filtro «Ocultos», y desde ahí se
  // devuelven a la biblioteca con un botón.
  if (ver === "ocultos") consulta = consulta.eq("publico", false);
  else if (ver !== "todos") consulta = consulta.eq("publico", true);

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
      destacado ||
      tieneVideo ||
      tieneImagen ||
      a.nombre.localeCompare(b.nombre, "es")
    );
  });

  // La biblioteca se parte por parte del cuerpo. Con 143 fichas, una lista
  // corrida obliga a recordar dónde acababa el pecho y empezaba la espalda;
  // por secciones se baja hasta el bloque que interesa y se para ahí.
  // El orden de las secciones es el de `GRUPOS`, que va de arriba abajo del
  // cuerpo, no alfabético: es como se piensa un entrenamiento.
  const porGrupo = (Object.keys(GRUPOS) as GrupoMuscular[])
    .map((g) => ({
      grupo: g,
      titulo: GRUPOS[g],
      lista: ejercicios.filter((e) => e.grupo === g),
    }))
    .filter((s) => s.lista.length > 0);

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
          <Seleccion name="ver" defaultValue={ver} className="w-44">
            <option value="">En la biblioteca</option>
            <option value="ocultos">Ocultos</option>
            <option value="todos">Todos</option>
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
        <div className="space-y-10">
          {porGrupo.map((seccion) => (
            <section key={seccion.grupo}>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-medium text-violeta-800">
                  {seccion.titulo}
                </h2>
                <span className="text-xs font-light text-violeta-900/45">
                  {seccion.lista.length}
                </span>
                <span className="h-px flex-1 bg-lila-200" />
              </div>

              {/* Cuatro por fila desde el portátil. El corte va en `md` y no
                  en `xl`: una pantalla de portátil con la escala de Windows
                  al 150 % reporta menos de 1280 px, así que con `xl` nunca
                  llegaba a cuatro por mucho que la pantalla fuera grande. */}
              <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
                {seccion.lista.map((e) => (
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
                    </div>

                    {/* El pie va justo: con la demostración cuadrada arriba,
                        cada línea que se añada aquí aleja la tarjeta del
                        cuadrado. El nombre a dos líneas como mucho, y las
                        instrucciones no se asoman —se leen al editar—. */}
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm leading-snug font-medium text-violeta-800">
                        {e.nombre}
                      </h3>
                      <p className="mt-1 truncate text-[11px] font-light text-violeta-900/50">
                        {NIVELES[e.nivel]}
                        {e.equipo ? ` · ${e.equipo}` : ""}
                      </p>
                      <div className="mt-3">
                        <GestorEjercicios modo="editar" ejercicio={e} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
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
