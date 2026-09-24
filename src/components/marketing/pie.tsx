import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Isotipo, Logo } from "@/components/brand/logo";
import {
  Corazon,
  IconoInstagram,
  IconoWhatsApp,
  Puntitos,
} from "@/components/brand/decoraciones";

const contacto: {
  icono: React.ComponentType<{ className?: string }>;
  texto: string;
  href: string | null;
}[] = [
  { icono: IconoInstagram, texto: "@yiyogym", href: "https://instagram.com/yiyogym" },
  // El enlace de WhatsApp lleva el número sin espacios ni símbolos, que es
  // el único formato que acepta wa.me; el texto sí se muestra legible.
  {
    icono: IconoWhatsApp,
    texto: "+1 (829) 879-7333",
    href: "https://wa.me/18298797333",
  },
  {
    icono: Mail,
    texto: "Yiyogymtrainer@gmail.com",
    href: "mailto:Yiyogymtrainer@gmail.com",
  },
  { icono: MapPin, texto: "Santo Domingo, RD", href: null },
];

const navegacion = [
  { href: "#metodo", texto: "Método" },
  { href: "#yiyo", texto: "Sobre Yiyo" },
  { href: "#planes", texto: "Planes" },
  { href: "#historias", texto: "Historias" },
  { href: "/tienda", texto: "Tienda" },
];

export function Pie() {
  return (
    <footer className="relative overflow-hidden bg-violeta-900 pt-16 pb-8 text-lila-200">
      <Puntitos className="opacity-10" />
      {/* Sello grande al cierre de la página, como la firma del pie. */}
      <Isotipo
        className="pointer-events-none absolute -bottom-20 -left-16 hidden h-80 opacity-[0.07] lg:block"
        invertido
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo invertido />
            <p className="font-script mt-6 text-xl text-lila-300">
              Fuerza que te transforma <Corazon className="inline h-4 w-4 align-baseline" />
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed font-light text-lila-200/60">
              Plataforma de coaching fitness y nutrición online. Entrenamiento,
              alimentación y hábitos diseñados para mujeres reales.
            </p>
          </div>

          <div>
            <h3 className="text-[11px] tracking-[0.24em] text-white uppercase">
              Navegación
            </h3>
            <ul className="mt-5 space-y-3">
              {navegacion.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="text-sm font-light text-lila-200/70 transition-colors hover:text-white"
                  >
                    {n.texto}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/entrar"
                  className="text-sm font-light text-lila-200/70 transition-colors hover:text-white"
                >
                  Entrar a mi cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] tracking-[0.24em] text-white uppercase">
              Contacto
            </h3>
            <ul className="mt-5 space-y-3">
              {contacto.map((c) => (
                <li key={c.texto} className="flex items-center gap-3">
                  <c.icono className="h-4 w-4 shrink-0 text-lila-400" />
                  {c.href ? (
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="text-sm font-light text-lila-200/70 transition-colors hover:text-white"
                    >
                      {c.texto}
                    </a>
                  ) : (
                    <span className="text-sm font-light text-lila-200/70">{c.texto}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-8 text-[11px] font-light text-lila-200/45 sm:flex-row">
          <p>© {new Date().getFullYear()} YIYO GYM. Todos los derechos reservados.</p>
          <p className="letra-ancha uppercase">Fuerza · Disciplina · Evolución</p>
        </div>
      </div>
    </footer>
  );
}
