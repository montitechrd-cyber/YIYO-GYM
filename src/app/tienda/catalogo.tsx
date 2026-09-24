"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import { Boton } from "@/components/ui/boton";
import { cn } from "@/lib/utils";
import type { Producto } from "@/lib/supabase/tipos";
import { PanelCarrito } from "./panel-carrito";

const dinero = (n: number) => `US$${n.toFixed(2)}`;

export function Catalogo({
  productos,
  categorias,
}: {
  productos: Producto[];
  categorias: string[];
}) {
  const [filtro, setFiltro] = useState<string | null>(null);
  const visibles = filtro
    ? productos.filter((p) => p.categoria === filtro)
    : productos;

  if (productos.length === 0) {
    return (
      <p className="mt-16 text-center font-light text-violeta-900/55">
        La tienda abre pronto
      </p>
    );
  }

  return (
    <>
      <PanelCarrito />

      {categorias.length > 1 && (
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          <Filtro activo={filtro === null} onClick={() => setFiltro(null)}>
            Todo
          </Filtro>
          {categorias.map((c) => (
            <Filtro key={c} activo={filtro === c} onClick={() => setFiltro(c)}>
              {c}
            </Filtro>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <TarjetaProducto key={p.id} producto={p} />
        ))}
      </div>
    </>
  );
}

function Filtro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full px-4 py-2 text-xs font-medium transition-colors",
        activo
          ? "bg-violeta-600 text-white"
          : "border border-lila-300 bg-white/70 text-violeta-700 hover:border-violeta-400"
      )}
    >
      {children}
    </button>
  );
}

function TarjetaProducto({ producto }: { producto: Producto }) {
  const { agregar } = useCarrito();
  const conTallas = producto.tallas.length > 0;
  const [talla, setTalla] = useState<string | null>(null);
  const [anadido, setAnadido] = useState(false);
  const [falta, setFalta] = useState(false);

  const alAnadir = () => {
    if (conTallas && !talla) {
      // Pedir la talla en vez de añadir algo incompleto al carrito.
      setFalta(true);
      return;
    }
    agregar({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      talla: conTallas ? talla : null,
      precio: Number(producto.precio),
      imagen: producto.imagen_url,
    });
    setFalta(false);
    setAnadido(true);
    window.setTimeout(() => setAnadido(false), 1800);
  };

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-4xl border border-lila-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:border-lila-400 hover:shadow-elevada">
      <div className="relative aspect-square bg-lila-50">
        <Image
          src={producto.imagen_url}
          alt={producto.nombre}
          fill
          sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
          className="object-contain p-4"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-[10px] tracking-[0.18em] text-violeta-500 uppercase">
          {producto.categoria}
        </p>
        <h2 className="mt-2 text-lg font-medium text-violeta-800">
          {producto.nombre}
        </h2>
        <p className="mt-2 text-xs leading-relaxed font-light text-violeta-900/60">
          {producto.descripcion}
        </p>

        <details className="mt-3 text-xs font-light text-violeta-900/55">
          <summary className="cursor-pointer text-violeta-600 marker:text-violeta-400">
            Ver detalles
          </summary>
          <ul className="mt-2 space-y-1">
            {producto.especificaciones.map((e) => (
              <li key={e} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lila-400" />
                {e}
              </li>
            ))}
          </ul>
          {producto.cuidado && (
            <p className="mt-3 border-t border-lila-100 pt-2 text-violeta-900/45">
              {producto.cuidado}
            </p>
          )}
        </details>

        {conTallas && (
          <div className="mt-4">
            <p className="text-[10px] tracking-[0.14em] text-violeta-500 uppercase">
              Talla
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {producto.tallas.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTalla(t);
                    setFalta(false);
                  }}
                  className={cn(
                    "min-w-11 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-colors",
                    talla === t
                      ? "bg-violeta-600 text-white"
                      : "border border-lila-300 text-violeta-700 hover:border-violeta-400"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {falta && (
              <p role="alert" className="mt-2 text-xs text-rose-600">
                Elige tu talla para añadirlo
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-xl font-medium text-violeta-800">
            {dinero(Number(producto.precio))}
          </span>
          <Boton onClick={alAnadir} className="shrink-0">
            {anadido ? <Check size={15} /> : <ShoppingBag size={15} />}
            {anadido ? "Añadido" : "Añadir"}
          </Boton>
        </div>
      </div>
    </article>
  );
}
