import type { Metadata } from "next";
import { FormularioVerificar } from "./formulario";

export const metadata: Metadata = { title: "Verificar — YIYO GYM" };

export default function PaginaVerificar() {
  return (
    <div>
      <h1 className="text-4xl font-light text-violeta-900">
        Un paso más <span className="font-script text-degradado">✿</span>
      </h1>
      <p className="mt-3 text-sm font-light text-violeta-900/60">
        Abre tu app autenticadora y escribe el código de 6 dígitos.
      </p>

      <div className="mt-9">
        <FormularioVerificar />
      </div>
    </div>
  );
}
