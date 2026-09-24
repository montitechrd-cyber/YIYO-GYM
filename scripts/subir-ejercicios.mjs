/**
 * Sube los WebP generados por ejercicios-gif.mjs al almacenamiento.
 *
 * Se salta los que ya están: la subida de 143 archivos se corta por
 * cualquier motivo y hay que poder relanzarla sin repetirlo todo.
 */
import { readFileSync, existsSync } from "node:fs";
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
const ORIGEN = join(process.env.TEMP ?? ".", "yiyo-ejercicios-webp");

const fichas = manifiesto();
let subidos = 0, saltados = 0, fallos = 0;

for (const f of fichas) {
  const archivo = join(ORIGEN, `${f.slug}.webp`);
  if (!existsSync(archivo)) { console.log("FALTA", f.slug); fallos++; continue; }

  const destino = `biblioteca/${f.slug}.webp`;
  const r = await fetch(
    `${URL_BASE}/storage/v1/object/ejercicios/${encodeURI(destino)}`,
    {
      method: "POST",
      headers: {
        apikey: CLAVE,
        Authorization: `Bearer ${CLAVE}`,
        "Content-Type": "image/webp",
        "cache-control": "31536000",
      },
      body: readFileSync(archivo),
    }
  );

  if (r.ok) { subidos++; }
  else if (r.status === 409) { saltados++; }
  else { fallos++; console.log("ERROR", f.slug, r.status, (await r.text()).slice(0, 160)); }

  if ((subidos + saltados + fallos) % 25 === 0)
    console.log(`  ${subidos + saltados + fallos}/${fichas.length}`);
}

console.log(`subidos ${subidos} | ya estaban ${saltados} | fallos ${fallos}`);
