import type { Metadata } from "next";
import { FormularioNuevaContrasena } from "./formulario";

export const metadata: Metadata = { title: "Nueva contraseña — YIYO GYM" };

export default function PaginaNuevaContrasena() {
  return (
    <div>
      <h1 className="text-4xl font-light text-violeta-900">
        Crea tu <span className="font-script text-degradado">nueva clave</span>
      </h1>
      <p className="mt-3 text-sm font-light text-violeta-900/60">
        Elige una contraseña que recuerdes y que nadie más pueda adivinar.
      </p>

      <div className="mt-9">
        <FormularioNuevaContrasena />
      </div>
    </div>
  );
}
