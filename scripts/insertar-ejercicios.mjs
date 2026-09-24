/**
 * Mete las fichas de 0020 en la base que ya está en marcha.
 *
 * La migración es para una instalación desde cero; esto es para la que ya
 * corre. Sale del mismo manifiesto que la migración para que no puedan
 * decir cosas distintas.
 */
import { readFileSync } from "node:fs";
import { manifiesto } from "./ejercicios-gif.mjs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = env.SUPABASE_SERVICE_ROLE_KEY;
const cabeceras = {
  apikey: CLAVE,
  Authorization: `Bearer ${CLAVE}`,
  "Content-Type": "application/json",
};

const existentes = new Set(
  (await (await fetch(`${URL_BASE}/rest/v1/ejercicios?select=nombre`, { headers: cabeceras })).json())
    .map((e) => e.nombre)
);

const filas = manifiesto()
  .filter((f) => !existentes.has(f.nombre))
  .map((f) => ({
    nombre: f.nombre,
    grupo: f.grupo,
    equipo: f.equipo,
    nivel: "principiante",
    imagen_url: `${URL_BASE}/storage/v1/object/public/ejercicios/biblioteca/${f.slug}.webp`,
    publico: true,
  }));

console.log(`${filas.length} por insertar (${existentes.size} ya en la biblioteca)`);
if (!filas.length) process.exit(0);

// En tandas: un cuerpo con 143 filas es más fácil de perder entero que de
// reintentar por partes.
for (let i = 0; i < filas.length; i += 40) {
  const tanda = filas.slice(i, i + 40);
  const r = await fetch(`${URL_BASE}/rest/v1/ejercicios`, {
    method: "POST",
    headers: { ...cabeceras, Prefer: "return=minimal" },
    body: JSON.stringify(tanda),
  });
  if (!r.ok) { console.error("ERROR", r.status, (await r.text()).slice(0, 300)); process.exit(1); }
  console.log(`  ${Math.min(i + 40, filas.length)}/${filas.length}`);
}
console.log("listo");
