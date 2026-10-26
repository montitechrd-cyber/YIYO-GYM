import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { IconoInstagram, IconoWhatsApp } from "@/components/brand/decoraciones";

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

const enlace = "text-sm text-white/75 transition-colors hover:text-white hover:underline underline-offset-4";

export function Pie() {
  return (
    <footer className="border-t-8 border-violeta-700 bg-violeta-900 pt-16 pb-8 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <p className="font-display text-[clamp(3.5rem,11vw,6rem)] leading-[0.9] font-extrabold uppercase [font-stretch:72%]">
          Fuerza que te transforma
        </p>

        <div className="mt-14 grid gap-12 border-t border-white/30 pt-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo invertido />
            <p className="mt-6 max-w-sm text-sm leading-6 text-white/70">
              Plataforma de coaching fitness y nutrición online. Entrenamiento,
              alimentación y hábitos diseñados para mujeres reales.
            </p>
          </div>

          <div>
            <h3 className="text-xl uppercase">Navegación</h3>
            <ul className="mt-4 space-y-2.5">
              {navegacion.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={enlace}>{n.texto}</a>
                </li>
              ))}
              <li>
                <Link href="/entrar" className={enlace}>Entrar a mi cuenta</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl uppercase">Contacto</h3>
            <ul className="mt-4 space-y-2.5">
              {contacto.map((c) => (
                <li key={c.texto} className="flex items-center gap-3">
                  <c.icono className="h-4 w-4 shrink-0 text-lila-300" />
                  {c.href ? (
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className={enlace}
                    >
                      {c.texto}
                    </a>
                  ) : (
                    <span className="text-sm text-white/75">{c.texto}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/30 pt-6 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} YIYO GYM. Todos los derechos reservados.</p>
          <p className="font-semibold tracking-[0.18em] uppercase">Fuerza · Disciplina · Evolución</p>
        </div>
      </div>
    </footer>
  );
}
