import { Salad } from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { planActivoDe } from "@/lib/dietas";
import { hoyTexto } from "@/lib/programacion";
import { Encabezado, Vacio } from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { VistaAlimentacion } from "./vista";

export default async function MiAlimentacion() {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);

  if (!cliente) {
    return (
      <div>
        <Encabezado titulo="Mi alimentación" />
        <Vacio
          icono={Salad}
          titulo="Sin ficha activa"
          descripcion="Completa tu evaluación inicial para recibir tu plan de alimentación"
          accion={<BotonEnlace href="/panel/bienvenida">Empezar</BotonEnlace>}
        />
      </div>
    );
  }

  const contenido = await planActivoDe(cliente.id);

  if (!contenido) {
    return (
      <div>
        <Encabezado titulo="Mi alimentación" />
        <Vacio
          icono={Salad}
          titulo="Sin plan de alimentación"
          descripcion="En cuanto Yiyo prepare tu dieta la verás aquí, con tus comidas de cada día y tus macros"
        />
      </div>
    );
  }

  // Las comidas ya marcadas hoy, para que los botones salgan en su estado.
  const supabase = await crearClienteServidor();
  const { data: registros } = await supabase
    .from("registro_comidas")
    .select("comida_id, cumplida")
    .eq("cliente_id", cliente.id)
    .eq("fecha", hoyTexto());

  // getDay(): domingo = 0; el plan usa lunes = 1 … domingo = 7.
  const diaSemana = ((new Date().getDay() + 6) % 7) + 1;

  return (
    <div>
      <Encabezado
        titulo="Mi alimentación"
        descripcion={contenido.plan.nombre}
      />
      <VistaAlimentacion
        contenido={contenido}
        diaDeHoy={diaSemana}
        cumplidas={(registros ?? [])
          .filter((r) => r.cumplida)
          .map((r) => r.comida_id)}
      />
    </div>
  );
}
