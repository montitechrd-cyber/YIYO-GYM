"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { IconoWhatsApp } from "@/components/brand/decoraciones";
import { crearPedido } from "./acciones";

const dinero = (n: number) => `US$${n.toFixed(2)}`;

type Confirmado = { numero: number; enlace: string };

/**
 * Carrito de la tienda: botón flotante, panel lateral y confirmación.
 *
 * Al confirmar, el pedido se guarda en la plataforma y se abre WhatsApp con
 * el pedido ya escrito. Si la persona no llega a enviarlo, Yiyo lo ve igual
 * en su panel: el aviso es un extra, no el único registro.
 */
export function PanelCarrito() {
  const { lineas, unidades, total, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [abierto, setAbierto] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [confirmado, setConfirmado] = useState<Confirmado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const confirmar = (datos: FormData) => {
    setError(null);
    iniciar(async () => {
      const r = await crearPedido(
        datos,
        lineas.map((l) => ({
          productoId: l.productoId,
          talla: l.talla,
          cantidad: l.cantidad,
        }))
      );
      if ("error" in r) {
        setError(r.error);
        return;
      }
      // El carrito se vacía solo cuando el pedido ya está guardado.
      vaciar();
      setPagando(false);
      setConfirmado({ numero: r.numero, enlace: r.enlaceWhatsApp });
    });
  };

  return (
    <>
      {/* Botón flotante: siempre visible mientras haya algo en el carrito. */}
      {unidades > 0 && !abierto && !confirmado && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="fixed right-5 bottom-5 z-40 flex cursor-pointer items-center gap-2 rounded-full fondo-degradado px-5 py-3.5 text-sm font-medium text-white shadow-elevada transition-transform duration-300 hover:scale-105"
        >
          <ShoppingBag size={17} />
          {unidades} {unidades === 1 ? "artículo" : "artículos"}
          <span className="ml-1 border-l border-white/30 pl-2">{dinero(total)}</span>
        </button>
      )}

      {(abierto || confirmado) && (
        <>
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={() => {
              setAbierto(false);
              setPagando(false);
              setConfirmado(null);
            }}
            className="fixed inset-0 z-40 cursor-default bg-violeta-900/35 backdrop-blur-[2px]"
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-crema shadow-elevada">
            <header className="flex shrink-0 items-center justify-between border-b border-lila-200 px-5 py-4">
              <h2 className="text-sm font-medium text-violeta-800">
                {confirmado ? "Pedido registrado" : "Tu pedido"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  setPagando(false);
                  setConfirmado(null);
                }}
                aria-label="Cerrar"
                className="cursor-pointer rounded-full p-2 text-violeta-600 transition-colors hover:bg-lila-100"
              >
                <X size={18} />
              </button>
            </header>

            {confirmado ? (
              <Confirmacion datos={confirmado} alCerrar={() => setConfirmado(null)} />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {lineas.length === 0 ? (
                  <p className="mt-10 text-center text-sm font-light text-violeta-900/50">
                    Tu carrito está vacío
                  </p>
                ) : pagando ? (
                  <form action={confirmar} className="space-y-4">
                    {error && <Aviso tono="error">{error}</Aviso>}

                    <Campo etiqueta="Tu nombre" htmlFor="nombre">
                      <Entrada id="nombre" name="nombre" required autoComplete="name" />
                    </Campo>
                    <Campo
                      etiqueta="WhatsApp o teléfono"
                      htmlFor="telefono"
                      ayuda="Por aquí coordinamos entrega y pago."
                    >
                      <Entrada
                        id="telefono"
                        name="telefono"
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="809 000 0000"
                      />
                    </Campo>
                    <Campo etiqueta="Correo (opcional)" htmlFor="correo">
                      <Entrada id="correo" name="correo" type="email" autoComplete="email" />
                    </Campo>
                    <Campo
                      etiqueta="¿Dónde te lo llevamos? (opcional)"
                      htmlFor="entrega"
                    >
                      <Entrada id="entrega" name="entrega" placeholder="Sector, calle, referencia" />
                    </Campo>
                    <Campo etiqueta="Notas (opcional)" htmlFor="notas">
                      <Entrada id="notas" name="notas" placeholder="Algo que deba saber" />
                    </Campo>

                    <div className="flex items-center justify-between border-t border-lila-200 pt-4 text-sm">
                      <span className="text-violeta-900/60">Total</span>
                      <span className="text-lg font-medium text-violeta-800">
                        {dinero(total)}
                      </span>
                    </div>

                    <Boton type="submit" tamano="lg" className="w-full" disabled={enviando}>
                      {enviando && <Loader2 size={16} className="animate-spin" />}
                      {enviando ? "Registrando…" : "Confirmar pedido"}
                    </Boton>
                    <button
                      type="button"
                      onClick={() => setPagando(false)}
                      className="w-full cursor-pointer text-center text-xs font-light text-violeta-600 hover:underline"
                    >
                      Volver al carrito
                    </button>
                  </form>
                ) : (
                  <ul className="space-y-3">
                    {lineas.map((l) => (
                      <li
                        key={`${l.productoId}-${l.talla ?? ""}`}
                        className="flex gap-3 rounded-3xl border border-lila-200 bg-white p-3"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-lila-50">
                          <Image
                            src={l.imagen}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-contain p-1"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="truncate text-sm font-medium text-violeta-800">
                            {l.nombre}
                          </p>
                          {l.talla && (
                            <p className="text-xs font-light text-violeta-900/50">
                              Talla {l.talla}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-violeta-600">
                            {dinero(l.precio)} c/u
                          </p>

                          <div className="mt-auto flex items-center gap-1 pt-2">
                            <BotonCantidad
                              etiqueta={`Quitar uno de ${l.nombre}`}
                              onClick={() =>
                                cambiarCantidad(l.productoId, l.talla, l.cantidad - 1)
                              }
                            >
                              <Minus size={13} />
                            </BotonCantidad>
                            <span className="min-w-8 text-center text-sm font-medium text-violeta-800 tabular-nums">
                              {l.cantidad}
                            </span>
                            <BotonCantidad
                              etiqueta={`Añadir uno de ${l.nombre}`}
                              onClick={() =>
                                cambiarCantidad(l.productoId, l.talla, l.cantidad + 1)
                              }
                            >
                              <Plus size={13} />
                            </BotonCantidad>
                            <button
                              type="button"
                              onClick={() => quitar(l.productoId, l.talla)}
                              aria-label={`Quitar ${l.nombre} del carrito`}
                              className="ml-auto cursor-pointer rounded-full p-2 text-rose-500 transition-colors hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!confirmado && !pagando && lineas.length > 0 && (
              <footer className="shrink-0 border-t border-lila-200 px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-violeta-900/60">Total</span>
                  <span className="text-xl font-medium text-violeta-800">
                    {dinero(total)}
                  </span>
                </div>
                <Boton
                  tamano="lg"
                  className="mt-3 w-full"
                  onClick={() => setPagando(true)}
                >
                  Continuar
                </Boton>
              </footer>
            )}
          </aside>
        </>
      )}
    </>
  );
}

function BotonCantidad({
  etiqueta,
  onClick,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-lila-300 text-violeta-700 transition-colors hover:border-violeta-400 hover:bg-lila-50"
    >
      {children}
    </button>
  );
}

function Confirmacion({
  datos,
  alCerrar,
}: {
  datos: Confirmado;
  alCerrar: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 text-center">
      <p className="text-[11px] tracking-[0.2em] text-violeta-500 uppercase">
        Pedido #{datos.numero}
      </p>
      <h3 className="mt-3 text-2xl font-light text-violeta-900">
        Ya lo tengo anotado <span className="font-script text-degradado">✿</span>
      </h3>
      <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed font-light text-violeta-900/65">
        Tu pedido quedó registrado. Envíamelo por WhatsApp y coordinamos la
        entrega y el pago por ahí mismo
      </p>

      <a
        href={datos.enlace}
        target="_blank"
        rel="noreferrer"
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-sm font-medium text-white shadow-suave transition-transform duration-300 hover:scale-[1.02]"
      >
        <IconoWhatsApp className="h-5 w-5" />
        Enviar mi pedido por WhatsApp
      </a>

      <button
        type="button"
        onClick={alCerrar}
        className="mt-5 w-full cursor-pointer text-xs font-light text-violeta-600 hover:underline"
      >
        Seguir viendo la tienda
      </button>
    </div>
  );
}
