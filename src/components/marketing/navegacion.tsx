"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BotonEnlace } from "@/components/ui/boton";

const enlaces = [
  { href: "#metodo", texto: "Método" },
  { href: "#yiyo", texto: "Sobre Yiyo" },
  { href: "#planes", texto: "Planes" },
  { href: "#historias", texto: "Historias" },
  // Página propia, no un ancla de la portada.
  { href: "/tienda", texto: "Tienda" },
];

/**
 * Barra superior del sitio público: papel sólido con filete de tinta.
 *
 * Casi todos sus enlaces son anclas de la portada, así que fuera de ella no
 * llevan a ninguna parte (en la tienda se pulsaban y no pasaba nada). Por
 * eso hay una versión reducida: solo volver a la portada.
 */
export function Navegacion({ soloInicio = false }: { soloInicio?: boolean }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-violeta-900 bg-crema">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="YIYO GYM — inicio">
          <Logo tamano="sm" />
        </Link>

        {soloInicio ? (
          <BotonEnlace href="/" variante="contorno" tamano="sm">
            <ArrowLeft size={15} />
            Ir al inicio
          </BotonEnlace>
        ) : (
          <>
            <ul className="hidden items-center gap-8 md:flex">
              {enlaces.map((e) => (
                <li key={e.href}>
                  <a
                    href={e.href}
                    className="text-[13px] font-semibold tracking-[0.1em] text-violeta-900 uppercase decoration-2 underline-offset-8 hover:underline"
                  >
                    {e.texto}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-2 md:flex">
              <BotonEnlace href="/entrar" variante="fantasma" tamano="sm">
                Entrar
              </BotonEnlace>
              <BotonEnlace href="/registro" tamano="sm">
                Empezar
              </BotonEnlace>
            </div>

            <button
              onClick={() => setAbierto((v) => !v)}
              className="rounded-sm p-2 text-violeta-900 transition-colors hover:bg-lila-200 md:hidden"
              aria-label="Abrir menú"
              aria-expanded={abierto}
            >
              {abierto ? <X size={22} /> : <Menu size={22} />}
            </button>
          </>
        )}
      </nav>

      {!soloInicio && abierto && (
        <div className="animate-aparecer border-t border-violeta-900 bg-crema md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-6 pb-5">
            {enlaces.map((e) => (
              <a
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                className="border-b border-violeta-900/15 py-4 font-display text-3xl font-extrabold text-violeta-900 uppercase [font-stretch:72%]"
              >
                {e.texto}
              </a>
            ))}
            <div className="mt-5 flex gap-2">
              <BotonEnlace href="/entrar" variante="contorno" tamano="md" className="flex-1">
                Entrar
              </BotonEnlace>
              <BotonEnlace href="/registro" tamano="md" className="flex-1">
                Empezar
              </BotonEnlace>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
