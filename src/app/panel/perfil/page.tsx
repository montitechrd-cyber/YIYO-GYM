import { exigirPerfil, clienteActual, factoresMfa } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Encabezado, Tarjeta, TituloTarjeta } from "@/components/panel/piezas";
import { FormularioPerfil } from "./formulario";
import { VerificacionDosPasos } from "@/components/panel/verificacion-dos-pasos";
import { MEDIDAS, FECHA_LARGA, fechaLocal, OBJETIVOS, NIVELES } from "@/lib/etiquetas";

export default async function MiPerfil() {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);
  const factores = await factoresMfa();

  const supabase = await crearClienteServidor();
  const { data: evaluacion } = cliente
    ? await supabase
        .from("evaluaciones")
        .select("*")
        .eq("cliente_id", cliente.id)
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="max-w-4xl">
      <Encabezado
        titulo="Mi perfil"
        descripcion="Tus datos personales y tu evaluación inicial"
      />

      <div className="space-y-5">
        <Tarjeta>
          <TituloTarjeta>Datos personales</TituloTarjeta>
          <FormularioPerfil perfil={perfil} />
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Verificación en dos pasos</TituloTarjeta>
          <VerificacionDosPasos factoresIniciales={factores} />
        </Tarjeta>

        {evaluacion && (
          <Tarjeta>
            <TituloTarjeta>
              Evaluación del {FECHA_LARGA.format(fechaLocal(evaluacion.fecha))}
            </TituloTarjeta>

            <div className="grid grid-cols-3 gap-3">
              {[
                { et: "Altura", v: evaluacion.altura_cm, u: "cm" },
                { et: "Peso", v: evaluacion.peso_kg, u: "kg" },
                { et: "Grasa", v: evaluacion.grasa_pct, u: "%" },
              ].map((m) => (
                <div key={m.et} className="rounded-3xl bg-lila-50 px-4 py-4 text-center">
                  <p className="text-[10px] tracking-[0.16em] text-violeta-500 uppercase">
                    {m.et}
                  </p>
                  <p className="mt-2 text-2xl font-light text-violeta-800">
                    {m.v ?? "—"}
                    {m.v != null && (
                      <span className="ml-0.5 text-xs text-violeta-900/40">{m.u}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {Object.keys(evaluacion.medidas ?? {}).length > 0 && (
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-lila-100 pt-5 text-sm font-light sm:grid-cols-3">
                {MEDIDAS.filter((m) => evaluacion.medidas[m.clave] != null).map((m) => (
                  <div key={m.clave} className="flex justify-between gap-2">
                    <dt className="text-violeta-900/50">{m.etiqueta}</dt>
                    <dd className="text-violeta-900/80">
                      {evaluacion.medidas[m.clave]} cm
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {cliente && (
              <dl className="mt-6 space-y-3 border-t border-lila-100 pt-5 text-sm font-light">
                <div className="flex justify-between gap-4">
                  <dt className="text-violeta-900/45">Objetivo</dt>
                  <dd className="text-violeta-900/80">
                    {cliente.objetivo ? OBJETIVOS[cliente.objetivo] : "Sin definir"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-violeta-900/45">Nivel</dt>
                  <dd className="text-violeta-900/80">
                    {cliente.nivel ? NIVELES[cliente.nivel] : "Sin definir"}
                  </dd>
                </div>
              </dl>
            )}
          </Tarjeta>
        )}
      </div>
    </div>
  );
}
