"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { Aviso } from "@/components/ui/aviso";
import {
  IconoApple,
  IconoFacebook,
  IconoGoogle,
} from "@/components/brand/iconos-proveedor";

type Proveedor = "google" | "facebook" | "apple";

const PROVEEDORES: Record<
  Proveedor,
  { nombre: string; icono: React.ComponentType<{ className?: string }> }
> = {
  google: { nombre: "Google", icono: IconoGoogle },
  facebook: { nombre: "Facebook", icono: IconoFacebook },
  apple: { nombre: "Apple", icono: IconoApple },
};

/**
 * Qué proveedores se muestran, según `NEXT_PUBLIC_PROVEEDORES_OAUTH`.
 *
 * Se leen de la configuración y no se fijan en el código para que se puedan
 * ir activando de uno en uno según se den de alta en Supabase: un botón de
 * un proveedor no configurado solo llevaría a un error.
 */
function proveedoresActivos(): Proveedor[] {
  const crudo = process.env.NEXT_PUBLIC_PROVEEDORES_OAUTH ?? "";
  return crudo
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is Proveedor => p in PROVEEDORES);
}

export function AccesoSocial({ texto = "Entrar con" }: { texto?: string }) {
  const [cargando, setCargando] = useState<Proveedor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activos = proveedoresActivos();

  if (activos.length === 0) return null;

  const entrar = async (proveedor: Proveedor) => {
    setCargando(proveedor);
    setError(null);

    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: proveedor,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    // Si sale bien, el navegador ya se fue al proveedor y esto no se ejecuta.
    if (error) {
      setError(`No se pudo conectar con ${PROVEEDORES[proveedor].nombre}.`);
      setCargando(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Aviso tono="error">{error}</Aviso>}

      <div className="grid gap-3">
        {activos.map((p) => {
          const { nombre, icono: Icono } = PROVEEDORES[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => entrar(p)}
              disabled={cargando !== null}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-lila-300 bg-white text-sm font-medium text-violeta-800 transition-all duration-300 hover:border-violeta-500 hover:shadow-suave disabled:opacity-50"
            >
              {cargando === p ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Icono className="h-[18px] w-[18px]" />
              )}
              {texto} {nombre}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-lila-200" />
        <span className="text-[10px] tracking-[0.2em] text-violeta-500 uppercase">
          o con tu correo
        </span>
        <span className="h-px flex-1 bg-lila-200" />
      </div>
    </div>
  );
}
