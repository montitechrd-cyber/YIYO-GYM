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
    <html lang="es">
      <body className={`${poppins.variable} ${dancing.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
