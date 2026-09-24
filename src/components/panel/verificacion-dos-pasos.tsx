"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";

type Factor = { id: string; estado: "verificado" | "pendiente" };

/**
 * Verificación en dos pasos con una app autenticadora (Google Authenticator,
 * Authy, 1Password…).
 *
 * Se usa app y no SMS a propósito: el SMS depende de un proveedor de pago
 * por mensaje y es el método menos seguro de los dos —se puede interceptar
 * con un duplicado de SIM—. La app es gratis y funciona sin señal.
 */
export function VerificacionDosPasos({
  factoresIniciales,
}: {
  /** Se leen en el servidor: así la tarjeta ya llega con su estado puesto,
   *  sin un parpadeo de «Comprobando…» ni carga en el navegador. */
  factoresIniciales: Factor[];
}) {
  const router = useRouter();
  const [factores, setFactores] = useState<Factor[]>(factoresIniciales);
  const [inscribiendo, setInscribiendo] = useState<{
    id: string;
    qr: string;
    secreto: string;
  } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = async () => {
    const supabase = crearClienteNavegador();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactores(
      (data?.all ?? [])
        .filter((f) => f.factor_type === "totp")
        .map((f) => ({
          id: f.id,
          estado: f.status === "verified" ? "verificado" : "pendiente",
        }))
    );
    // El middleware decide con el nivel del token, así que la sesión del
    // servidor tiene que enterarse del cambio.
    router.refresh();
  };

  const activo = factores.some((f) => f.estado === "verificado");

  const empezar = async () => {
    setOcupado(true);
    setError(null);
    setExito(null);
    const supabase = crearClienteNavegador();

    // Los intentos a medias de veces anteriores bloquean uno nuevo (el
    // nombre choca), así que se limpian antes de empezar. Se recorre `all`
    // y no `totp`: esta última solo devuelve los ya verificados, que es
    // justo lo contrario de lo que hay que borrar aquí.
    const { data: previos } = await supabase.auth.mfa.listFactors();
    for (const f of previos?.all ?? []) {
      if (f.factor_type === "totp" && f.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "YIYO GYM",
    });

    if (error || !data) {
      // Se muestra el motivo real: ocultarlo dejaba a la usuaria (y a quien
      // dé soporte) sin ninguna pista de qué arreglar.
      setError(
        error?.message
          ? `No se pudo activar: ${error.message}`
          : "No se pudo iniciar la verificación en dos pasos."
      );
      setOcupado(false);
      return;
    }

    setInscribiendo({
      id: data.id,
      qr: data.totp.qr_code,
      secreto: data.totp.secret,
    });
    setOcupado(false);
  };

  const confirmar = async () => {
    if (!inscribiendo) return;
    setOcupado(true);
    setError(null);
    const supabase = crearClienteNavegador();

    const { data: reto, error: errorReto } = await supabase.auth.mfa.challenge({
      factorId: inscribiendo.id,
    });
    if (errorReto || !reto) {
      setError("No se pudo verificar el código. Inténtalo otra vez.");
      setOcupado(false);
      return;
    }

    const { error: errorVerif } = await supabase.auth.mfa.verify({
      factorId: inscribiendo.id,
      challengeId: reto.id,
      code: codigo.trim(),
    });

    if (errorVerif) {
      setError("Ese código no es correcto. Revisa la app e inténtalo de nuevo.");
      setOcupado(false);
      return;
    }

    setInscribiendo(null);
    setCodigo("");
    setExito("Listo. Tu cuenta ya pide un código para entrar.");
    setOcupado(false);
    await cargar();
  };

  const desactivar = async () => {
    setOcupado(true);
    setError(null);
    const supabase = crearClienteNavegador();
    for (const f of factores) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setExito("Verificación en dos pasos desactivada.");
    setOcupado(false);
    await cargar();
  };

  return (
    <div className="space-y-5">
      {error && <Aviso tono="error">{error}</Aviso>}
      {exito && <Aviso tono="exito">{exito}</Aviso>}

      {!inscribiendo && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-lila-200 px-5 py-4">
          <span className="flex items-center gap-3">
            <span
              className={
                activo
                  ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
                  : "flex h-10 w-10 items-center justify-center rounded-2xl bg-lila-100 text-violeta-500"
              }
            >
              {activo ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
            </span>
            <span>
              <span className="block text-sm font-medium text-violeta-800">
                {activo ? "Activada" : "Desactivada"}
              </span>
              <span className="block text-xs font-light text-violeta-900/55">
                {activo
                  ? "Al entrar te pediremos un código de tu app."
                  : "Añade un código extra para proteger tu cuenta."}
              </span>
            </span>
          </span>

          {activo ? (
            <Boton variante="contorno" onClick={desactivar} disabled={ocupado}>
              {ocupado && <Loader2 size={15} className="animate-spin" />}
              Desactivar
            </Boton>
          ) : (
            <Boton onClick={empezar} disabled={ocupado}>
              {ocupado && <Loader2 size={15} className="animate-spin" />}
              Activar
            </Boton>
          )}
        </div>
      )}

      {inscribiendo && (
        <div className="space-y-5 rounded-3xl border border-lila-200 bg-lila-50/60 p-6">
          <div className="flex items-start gap-3">
            <Smartphone size={17} className="mt-0.5 shrink-0 text-violeta-500" />
            <p className="text-sm leading-relaxed font-light text-violeta-900/75">
              Abre tu app autenticadora (Google Authenticator, Authy o la de tu
              gestor de contraseñas) y escanea este código.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="rounded-3xl bg-white p-4 shadow-suave">
              {/* El QR llega como SVG incrustado en la propia URL, así que
                  no hay nada que optimizar y `next/image` solo estorba. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inscribiendo.qr}
                alt="Código QR para la verificación en dos pasos"
                width={180}
                height={180}
              />
            </div>
          </div>

          <details className="text-xs font-light text-violeta-900/60">
            <summary className="cursor-pointer">
              ¿No puedes escanear? Escribe el código a mano
            </summary>
            <code className="mt-2 block rounded-2xl bg-white px-4 py-3 font-mono text-[11px] tracking-wider break-all text-violeta-800">
              {inscribiendo.secreto}
            </code>
          </details>

          <Campo
            etiqueta="Código de 6 dígitos"
            htmlFor="codigo_mfa"
            ayuda="El que aparece ahora mismo en tu app."
          >
            <Entrada
              id="codigo_mfa"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="bg-white text-center text-lg tracking-[0.4em]"
            />
          </Campo>

          <div className="flex flex-wrap gap-3">
            <Boton onClick={confirmar} disabled={ocupado || codigo.length < 6}>
              {ocupado && <Loader2 size={15} className="animate-spin" />}
              Confirmar
            </Boton>
            <Boton
              variante="contorno"
              onClick={() => {
                setInscribiendo(null);
                setCodigo("");
                setError(null);
              }}
              disabled={ocupado}
            >
              Cancelar
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
