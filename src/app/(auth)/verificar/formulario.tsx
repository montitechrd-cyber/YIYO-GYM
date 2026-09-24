"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { salir } from "../acciones";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";

export function FormularioVerificar() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificar = async () => {
    setOcupado(true);
    setError(null);
    const supabase = crearClienteNavegador();

    const { data: factores, error: errorFactores } =
      await supabase.auth.mfa.listFactors();
    const factor = factores?.totp?.find((f) => f.status === "verified");

    if (errorFactores || !factor) {
      setError("No encontramos tu método de verificación. Vuelve a entrar.");
      setOcupado(false);
      return;
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: codigo.trim(),
    });

    if (error) {
      setError("Ese código no es correcto. Revisa la app e inténtalo de nuevo.");
      setCodigo("");
      setOcupado(false);
      return;
    }

    // El middleware decide a dónde va cada rol.
    router.push("/panel");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {error && <Aviso tono="error">{error}</Aviso>}

      <Campo etiqueta="Código de 6 dígitos" htmlFor="codigo">
        <Entrada
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && codigo.length === 6) verificar();
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          placeholder="123456"
          className="text-center text-2xl tracking-[0.5em]"
        />
      </Campo>

      <Boton
        onClick={verificar}
        tamano="lg"
        className="w-full"
        disabled={ocupado || codigo.length < 6}
      >
        {ocupado && <Loader2 size={16} className="animate-spin" />}
        {ocupado ? "Verificando…" : "Verificar"}
      </Boton>

      <form action={salir}>
        <button
          type="submit"
          className="w-full cursor-pointer text-center text-xs font-light text-violeta-600 underline-offset-4 hover:underline"
        >
          Entrar con otra cuenta
        </button>
      </form>
    </div>
  );
}
