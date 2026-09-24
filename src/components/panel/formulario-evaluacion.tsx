"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { guardarEvaluacion, type Resultado } from "@/app/entrenador/clientes/acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { MEDIDAS, NIVELES, OBJETIVOS } from "@/lib/etiquetas";
import { hoyTexto } from "@/lib/programacion";
import type { Evaluacion, NivelExperiencia, ObjetivoFitness } from "@/lib/supabase/tipos";

const inicial: Resultado = {};

const SUENO = ["Menos de 5 h", "5-6 h", "6-7 h", "7-8 h", "Más de 8 h"];
const ESTRES = ["Bajo", "Moderado", "Alto", "Muy alto"];

export function FormularioEvaluacion({
  clienteId,
  textoBoton = "Guardar evaluación",
  mostrarMedidas = true,
  evaluacion,
  objetivoActual,
  nivelActual,
}: {
  clienteId: string;
  textoBoton?: string;
  /**
   * La clienta llena todo lo suyo al registrarse, menos las medidas
   * corporales: esas las toma la entrenadora para que queden bien tomadas.
   * Cuando este formulario se usa desde el panel de la entrenadora, se deja
   * en `true` para completar esa parte.
   */
  mostrarMedidas?: boolean;
  /** Si se pasa, el formulario edita esta evaluación en vez de crear otra. */
  evaluacion?: Evaluacion | null;
  objetivoActual?: ObjetivoFitness | null;
  nivelActual?: NivelExperiencia | null;
}) {
  const [estado, accion, pendiente] = useActionState(guardarEvaluacion, inicial);
  const hoy = hoyTexto();

  return (
    <form action={accion} className="space-y-10">
      <input type="hidden" name="cliente_id" value={clienteId} />
      {evaluacion && (
        <input type="hidden" name="evaluacion_id" value={evaluacion.id} />
      )}

      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado.exito && <Aviso tono="exito">{estado.exito}</Aviso>}

      <section>
        <h3 className="mb-5 text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
          Datos básicos
        </h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Fecha" htmlFor="fecha">
            <Entrada
              id="fecha"
              name="fecha"
              type="date"
              defaultValue={evaluacion?.fecha ?? hoy}
            />
          </Campo>
          <Campo etiqueta="Altura (cm)" htmlFor="altura_cm">
            <Entrada
              id="altura_cm"
              name="altura_cm"
              type="number"
              step="0.1"
              placeholder="165"
              defaultValue={evaluacion?.altura_cm ?? undefined}
            />
          </Campo>
          <Campo etiqueta="Peso (kg)" htmlFor="peso_kg">
            <Entrada
              id="peso_kg"
              name="peso_kg"
              type="number"
              step="0.1"
              placeholder="68.5"
              defaultValue={evaluacion?.peso_kg ?? undefined}
            />
          </Campo>
          <Campo etiqueta="Grasa corporal (%)" htmlFor="grasa_pct">
            <Entrada
              id="grasa_pct"
              name="grasa_pct"
              type="number"
              step="0.1"
              placeholder="28"
              defaultValue={evaluacion?.grasa_pct ?? undefined}
            />
          </Campo>
        </div>
      </section>

      {mostrarMedidas && (
        <section>
          <h3 className="mb-5 text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
            Medidas corporales (cm)
          </h3>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {MEDIDAS.map((m) => (
              <Campo key={m.clave} etiqueta={m.etiqueta} htmlFor={`medida_${m.clave}`}>
                <Entrada
                  id={`medida_${m.clave}`}
                  name={`medida_${m.clave}`}
                  type="number"
                  step="0.1"
                  placeholder="—"
                  defaultValue={evaluacion?.medidas?.[m.clave] ?? undefined}
                />
              </Campo>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-5 text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
          Objetivo y experiencia
        </h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo etiqueta="Objetivo principal" htmlFor="objetivo">
            <Seleccion id="objetivo" name="objetivo" defaultValue={objetivoActual ?? ""}>
              <option value="">Elegir…</option>
              {Object.entries(OBJETIVOS).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </Seleccion>
          </Campo>
          <Campo etiqueta="Nivel de experiencia" htmlFor="nivel">
            <Seleccion id="nivel" name="nivel" defaultValue={nivelActual ?? ""}>
              <option value="">Elegir…</option>
              {Object.entries(NIVELES).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </Seleccion>
          </Campo>
          <Campo
            etiqueta="Días disponibles por semana"
            htmlFor="dias_disponibles"
          >
            <Seleccion
              id="dias_disponibles"
              name="dias_disponibles"
              defaultValue={evaluacion?.dias_disponibles ?? ""}
            >
              <option value="">Elegir…</option>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? "día" : "días"}
                </option>
              ))}
            </Seleccion>
          </Campo>
        </div>

        <Campo
          etiqueta="¿Qué quieres lograr?"
          htmlFor="objetivos"
          className="mt-5"
          ayuda="Cuéntanos con tus palabras qué esperas de este proceso."
        >
          <AreaTexto
            id="objetivos"
            name="objetivos"
            placeholder="Quiero sentirme más fuerte, bajar de talla y tener energía para mis hijos…"
            defaultValue={evaluacion?.objetivos ?? undefined}
          />
        </Campo>

        <Campo
          etiqueta="Equipo disponible"
          htmlFor="equipo_disponible"
          className="mt-5"
        >
          <Entrada
            id="equipo_disponible"
            name="equipo_disponible"
            placeholder="Gimnasio completo, mancuernas en casa, solo peso corporal…"
            defaultValue={evaluacion?.equipo_disponible ?? undefined}
          />
        </Campo>
      </section>

      <section>
        <h3 className="mb-5 text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
          Salud e historial
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Condiciones médicas" htmlFor="condiciones_medicas">
            <AreaTexto
              id="condiciones_medicas"
              name="condiciones_medicas"
              className="min-h-20"
              placeholder="Hipotiroidismo, hipertensión, ninguna…"
              defaultValue={evaluacion?.condiciones_medicas ?? undefined}
            />
          </Campo>
          <Campo etiqueta="Lesiones o dolores" htmlFor="lesiones">
            <AreaTexto
              id="lesiones"
              name="lesiones"
              className="min-h-20"
              placeholder="Dolor lumbar, rodilla operada, ninguna…"
              defaultValue={evaluacion?.lesiones ?? undefined}
            />
          </Campo>
          <Campo etiqueta="Medicamentos" htmlFor="medicamentos">
            <AreaTexto
              id="medicamentos"
              name="medicamentos"
              className="min-h-20"
              placeholder="Anticonceptivos, levotiroxina, ninguno…"
              defaultValue={evaluacion?.medicamentos ?? undefined}
            />
          </Campo>
          <Campo etiqueta="Alergias alimentarias" htmlFor="alergias_alimentarias">
            <AreaTexto
              id="alergias_alimentarias"
              name="alergias_alimentarias"
              className="min-h-20"
              placeholder="Lactosa, gluten, ninguna…"
              defaultValue={evaluacion?.alergias_alimentarias ?? undefined}
            />
          </Campo>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Horas de sueño" htmlFor="habitos_sueno">
            <Seleccion
              id="habitos_sueno"
              name="habitos_sueno"
              defaultValue={evaluacion?.habitos_sueno ?? ""}
            >
              <option value="">Elegir…</option>
              {SUENO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Seleccion>
          </Campo>
          <Campo etiqueta="Nivel de estrés" htmlFor="nivel_estres">
            <Seleccion
              id="nivel_estres"
              name="nivel_estres"
              defaultValue={evaluacion?.nivel_estres ?? ""}
            >
              <option value="">Elegir…</option>
              {ESTRES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Seleccion>
          </Campo>
        </div>
      </section>

      <Boton type="submit" tamano="lg" disabled={pendiente}>
        {pendiente && <Loader2 size={16} className="animate-spin" />}
        {pendiente ? "Guardando…" : textoBoton}
      </Boton>
    </form>
  );
}
