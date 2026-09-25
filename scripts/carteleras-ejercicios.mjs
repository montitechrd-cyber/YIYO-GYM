/**
 * Saca la cartelera de cada demostración: su primer cuadro, quieto.
 *
 * Un WebP animado dentro de un <img> arranca solo, y no hay forma de
 * pararlo desde el navegador. Para que la demostración espere al clic hace
 * falta una imagen fija que enseñar mientras tanto, y se cambia por la
 * animada al pulsar.
 *
 *   node scripts/carteleras-ejercicios.mjs
 */
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { manifiesto } from "./ejercicios-gif.mjs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = env.SUPABASE_SERVICE_ROLE_KEY;

const ANIMADOS = join(process.env.TEMP ?? ".", "yiyo-ejercicios-webp");
const QUIETOS = join(process.env.TEMP ?? ".", "yiyo-ejercicios-quietos");

mkdirSync(QUIETOS, { recursive: true });
const fichas = manifiesto();
let hechos = 0, subidos = 0, saltados = 0, fallos = 0, peso = 0;

for (const f of fichas) {
  const animado = join(ANIMADOS, `${f.slug}.webp`);
  const quieto = join(QUIETOS, `${f.slug}-quieto.webp`);
  if (!existsSync(animado)) { console.log("FALTA", f.slug); fallos++; continue; }

  if (!existsSync(quieto)) {
    // Sin `animated: true` sharp lee solo la primera página: justo el
    // cuadro que queremos.
    await sharp(animado).webp({ quality: 78 }).toFile(quieto);
  }
  hechos++;
  peso += statSync(quieto).size;

  const r = await fetch(
    `${URL_BASE}/storage/v1/object/ejercicios/biblioteca/${f.slug}-quieto.webp`,
    {
      method: "POST",
      headers: {
        apikey: CLAVE,
        Authorization: `Bearer ${CLAVE}`,
        "Content-Type": "image/webp",
        "cache-control": "31536000",
      },
      body: readFileSync(quieto),
    }
  );
  if (r.ok) subidos++;
  else if (r.status === 409) saltados++;
  else { fallos++; console.log("ERROR", f.slug, r.status); }

  if ((subidos + saltados + fallos) % 40 === 0)
    console.log(`  ${subidos + saltados + fallos}/${fichas.length}`);
}

console.log(`carteleras ${hechos} | subidas ${subidos} | ya estaban ${saltados} | fallos ${fallos}`);
console.log(`peso total de las carteleras: ${(peso / 1048576).toFixed(1)} MB`);
