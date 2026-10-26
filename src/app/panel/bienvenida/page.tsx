import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Tarjeta } from "@/components/panel/piezas";
import { FormularioEvaluacion } from "@/components/panel/formulario-evaluacion";

export default async function Bienvenida() {
  const perfil = await exigirPerfil();
  let cliente = await clienteActual(perfil.id);

  // Si la ficha de CRM no existe todavía (registro previo al CRM), créala.
  if (!cliente && perfil.rol === "cliente") {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("clientes")
      .insert({ perfil_id: perfil.id, estado: "prospecto", origen: "registro web" })
      .select()
      .single();
    cliente = data;
  }

  if (!cliente) redirect("/panel");

  const supabase = await crearClienteServidor();
  const { count } = await supabase
    .from("evaluaciones")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", cliente.id);

  if ((count ?? 0) > 0) redirect("/panel");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 rounded-sm bg-violeta-700 px-8 py-10 text-white">
        <span className="inline-flex items-center gap-2 rounded-sm bg-crema px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-violeta-900 uppercase">
          <Sparkles size={12} />
          Primer paso
        </span>
        <h1 className="mt-5 text-6xl">
          Bienvenida, {perfil.nombre_completo.split(" ")[0] || "guerrera"}        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-white/90">
          Cuéntame de dónde partes. Con esta información diseño tu plan de
          entrenamiento y nutrición a tu medida. Solo la fecha es obligatoria: lo que
          no sepas ahora lo completamos después.
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
          Las medidas corporales (cintura, cadera, brazo…) las toma Yiyo en tu
          primera sesión, para que queden bien tomadas — no hace falta que las
          adivines tú.
        </p>
      </div>

      <Tarjeta>
        <FormularioEvaluacion
          clienteId={cliente.id}
          textoBoton="Enviar mi evaluación"
          mostrarMedidas={false}
        />
      </Tarjeta>
    </div>
  );
}
