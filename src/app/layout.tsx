import type { Metadata } from "next";
import { Poppins, Dancing_Script } from "next/font/google";
import "./globals.css";

// Solo los pesos que se usan de verdad: cada peso extra es un archivo más que
// el navegador descarga antes de poder pintar el texto.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YIYO GYM — Fuerza que te transforma",
  description:
    "Plataforma de coaching fitness y nutrición de Daniela «Yiyo» Chacón. Entrenamiento personalizado, planes de nutrición y seguimiento real de tu progreso.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Las variables de las fuentes van en <html> y no en <body>: el tema de
    // Tailwind define `--font-sans` y `--font-script` sobre `:root`, que es
    // el propio <html>. Puestas en <body> quedaban en un descendiente, y
    // desde `:root` no se veían: ambas se quedaban sin resolver y todo el
    // sitio caía a la tipografía del sistema —la cursiva de la marca no
    // llegó a mostrarse nunca—.
    <html lang="es" className={`${poppins.variable} ${dancing.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
