import { Settings } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { Encabezado, Vacio } from "@/components/panel/piezas";

/**
 * Placeholder de la Fase 4: aquí vivirán los parámetros de cálculo
 * nutricional (factores de actividad, ajuste por objetivo, proteína por
 * kilo) que hoy están fijos en `src/lib/nutricion.ts`, para que se puedan
 * ajustar sin tocar código.
 */
export default async function Configuracion() {
  await exigirRol("admin");

  return (
    <div>
      <Encabezado
        titulo="Configuración"
        descripcion="Los parámetros de cálculo de la plataforma."
      />
      <Vacio
        icono={Settings}
        titulo="Próximamente"
        descripcion="Aquí podrás ajustar los factores del cálculo de calorías y macros sin tocar código."
      />
    </div>
  );
}
