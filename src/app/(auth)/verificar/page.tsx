import type { Metadata } from "next";
import { FormularioVerificar } from "./formulario";

export const metadata: Metadata = { title: "Verificar — YIYO GYM" };

export default function PaginaVerificar() {
  return (
    <div>
      <h1 className="text-[clamp(2.5rem,13vw,3.75rem)] break-words text-violeta-900">
        Un paso más
      </h1>
      <p className="mt-3 text-sm text-violeta-900/75">
        Abre tu app autenticadora y escribe el código de 6 dígitos.
      </p>

      <div className="mt-9">
        <FormularioVerificar />
      </div>
    </div>
  );
}
