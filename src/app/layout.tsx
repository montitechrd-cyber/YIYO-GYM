import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Display: Archivo variable con eje de ancho (wdth), para el titular
// condensado de cartel. Texto: Hanken Grotesk. Solo los pesos en uso.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YIYO GYM — Fuerza que te transforma",
  description:
    "Plataforma de coaching fitness y nutrición de Daniela «Yiyo» Chacón. Entrenamiento personalizado, planes de nutrición y seguimiento real de tu progreso.",
};

// viewport-fit=cover: sin esto env(safe-area-inset-*) vale 0 y la barra inferior
// quedaría bajo la barra de gestos del teléfono.
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Las variables de las fuentes van en <html> y no en <body>: el tema de
    // Tailwind define `--font-sans` y `--font-display` sobre `:root`, que es
    // el propio <html>; puestas en <body> no se resolverían desde ahí.
    <html lang="es" className={`${archivo.variable} ${hanken.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
