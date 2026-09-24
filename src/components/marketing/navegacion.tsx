"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BotonEnlace } from "@/components/ui/boton";
import { cn } from "@/lib/utils";

const enlaces = [
  { href: "#metodo", texto: "Método" },
  { href: "#yiyo", texto: "Sobre Yiyo" },
  { href: "#planes", texto: "Planes" },
  { href: "#historias", texto: "Historias" },
  // Página propia, no un ancla de la portada.
  { href: "/tienda", texto: "Tienda" },
];

export function Navegacion() {
  const [fija, setFija] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const alScroll = () => setFija(window.scrollY > 24);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        fija ? "py-2" : "py-5"
      )}
    >
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-3 transition-all duration-500",
          fija || abierto ? "vidrio shadow-suave" : "bg-transparent"
        )}
      >
        <Link href="/" aria-label="YIYO GYM — inicio">
          <Logo tamano="sm" />
        </Link>

        <ul className="hidden items-center gap-9 md:flex">
          {enlaces.map((e) => (
            <li key={e.href}>
              <a
                href={e.href}
                className="group relative text-sm font-light tracking-wide text-violeta-800/80 transition-colors hover:text-violeta-700"
              >
                {e.texto}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-violeta-500 transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <BotonEnlace href="/entrar" variante="fantasma" tamano="sm">
            Entrar
          </BotonEnlace>
          <BotonEnlace href="/registro" tamano="sm">
            Empezar
          </BotonEnlace>
        </div>

        <button
          onClick={() => setAbierto((v) => !v)}
          className="rounded-full p-2 text-violeta-700 transition-colors hover:bg-lila-100 md:hidden"
          aria-label="Abrir menú"
        >
          {abierto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {abierto && (
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar menú"
          className="fixed inset-0 -z-10 cursor-default bg-violeta-900/25 backdrop-blur-[2px] md:hidden"
        />
      )}

      {abierto && (
        <div className="animate-aparecer mx-auto mt-2 max-w-6xl px-4 md:hidden">
          {/* Blanco sólido, no `vidrio`: ese cristal es blanco al 72% y con
              el titular del hero detrás las opciones no se leían. */}
          <div className="flex flex-col gap-1 rounded-4xl border border-lila-200 bg-white p-4 shadow-elevada">
            {enlaces.map((e) => (
              <a
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                className="rounded-2xl px-4 py-3 text-sm text-violeta-800 transition-colors hover:bg-lila-100"
              >
                {e.texto}
              </a>
            ))}
            <div className="mt-2 flex gap-2 px-1">
              <BotonEnlace href="/entrar" variante="contorno" tamano="sm" className="flex-1">
                Entrar
              </BotonEnlace>
              <BotonEnlace href="/registro" tamano="sm" className="flex-1">
                Empezar
              </BotonEnlace>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
