/**
 * Prepara la tanda de ejercicios en GIF que grabó Yiyo.
 *
 * Los GIF vienen a 1080x1080 y 2,3 MB de media: 265 MB en total, que ni
 * caben cómodos en el almacenamiento ni se pueden servir a un teléfono.
 * Se convierten a WebP animado de 480 px, que conserva el bucle y baja el
 * peso un 93 % —de 2,3 MB a unos 160 KB—.
 *
 *   node scripts/ejercicios-gif.mjs convertir   -> genera los .webp
 *   node scripts/ejercicios-gif.mjs manifiesto  -> imprime la clasificación
 */
import sharp from "sharp";
import { readdirSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";

const ORIGEN = "C:/Users/OK/Pictures/yiyo/EJERCICIOS";
const DESTINO = join(process.env.TEMP ?? ".", "yiyo-ejercicios-webp");

/** Nombre de archivo: sin acentos, sin espacios, sin sorpresas en una URL. */
export function aSlug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Grupo muscular a partir de la carpeta y del nombre.
 *
 * La carpeta es la clasificación de Yiyo y manda. Solo se afina cuando el
 * catálogo no tiene ese cajón —«Brazos» y «Piernas» no existen como grupo,
 * y el nombre dice cuál es— o cuando no hay ninguno que encaje, y entonces
 * se marca como dudoso para que ella lo revise: preferimos una lista corta
 * de dudas declaradas a 143 fichas que parecen revisadas y no lo están.
 */
function grupoDe(carpeta, nombre) {
  const n = nombre.toLowerCase();
  const directos = {
    Abdomen: "core",
    "Cuerpo completo": "cuerpo_completo",
    Espalda: "espalda",
    "Glúteos y caderas": "gluteos",
    Hombros: "hombros",
    Pantorrillas: "gemelos",
    Pecho: "pecho",
  };
  if (directos[carpeta]) return [directos[carpeta], false];

  if (carpeta === "Brazos") {
    if (/tr[ií]ceps/.test(n)) return ["triceps", false];
    if (/b[ií]ceps/.test(n)) return ["biceps", false];
    // Flexiones con manos juntas: el agarre cerrado lo lleva al tríceps, y
    // así está ya «Flexiones con agarre cerrado» en la biblioteca.
    if (/manos juntas/.test(n)) return ["triceps", false];
    if (/mu[ñn]eca|cubital/.test(n)) return ["triceps", true];
    return ["biceps", true];
  }

  if (carpeta === "Piernas") {
    // Cadera: el catálogo ya mete ahí la abducción con banda, así que la
    // aducción va al mismo cajón por coherencia.
    if (/aduc/.test(n)) return ["gluteos", /estiramiento|muslo/.test(n)];
    if (/peso muerto|flexi[óo]n de piernas|isquiotibial/.test(n))
      return ["femorales", false];
    if (/sentadilla|zancada|subida al escal[óo]n|extensi[óo]n de pierna/.test(n))
      return ["cuadriceps", false];
    if (/empuje alterno|elevaci[óo]n de pierna/.test(n)) return ["cuadriceps", true];
    if (/rana|media rana/.test(n)) return ["gluteos", true];
    return ["cuadriceps", true];
  }

  // Pies y tobillos: no hay grupo para el pie. Gemelos es lo más cercano
  // —comparten tobillo— pero es una decisión nuestra, no suya.
  if (carpeta === "Pies y tobillos") return ["gemelos", true];

  return ["cuerpo_completo", true];
}

/**
 * Material, leído del propio nombre y de ningún otro sitio. Si el nombre no
 * lo dice, se queda vacío: es preferible a adivinarlo.
 */
function equipoDe(nombre) {
  const n = nombre.toLowerCase();
  if (/barra el[áa]stica|gymstick/.test(n)) return "Barra elástica";
  if (/banda el[áa]stica/.test(n)) return "Banda";
  if (/mancuerna/.test(n)) return "Mancuernas";
  if (/pesa rusa|kettlebell/.test(n)) return "Kettlebell";
  if (/bal[óo]n medicinal/.test(n)) return "Balón medicinal";
  if (/pelota (suiza|de ejercicios|de estabilidad)/.test(n)) return "Pelota";
  if (/rodillo de espuma/.test(n)) return "Rodillo";
  if (/cuerda/.test(n)) return "Cuerda";
  if (/m[áa]quina|smith/.test(n)) return "Máquina";
  if (/polea/.test(n)) return "Polea";
  if (/barra/.test(n)) return "Barra";
  if (/banco/.test(n)) return "Banco";
  if (/peso corporal|sin pesas/.test(n)) return "Peso corporal";
  return null;
}

function recorrer(dir, carpeta = null) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const ruta = join(dir, d.name);
    if (d.isDirectory()) return recorrer(ruta, carpeta ?? d.name);
    if (!d.name.endsWith(".gif")) return [];
    const nombre = basename(d.name, ".gif");
    const [grupo, dudoso] = grupoDe(carpeta, nombre);
    return [{
      ruta,
      nombre,
      carpeta,
      grupo,
      dudoso,
      equipo: equipoDe(nombre),
      // El estiramiento vive en su propia subcarpeta dentro de cada parte.
      estiramiento: ruta.includes("Estiramientos"),
      slug: aSlug(nombre),
    }];
  });
}

export function manifiesto() {
  const fichas = recorrer(ORIGEN);
  const vistos = new Map();
  for (const f of fichas) {
    // Dos partes del cuerpo pueden traer el mismo nombre de archivo.
    if (vistos.has(f.slug)) f.slug = `${f.slug}-${aSlug(f.carpeta)}`;
    vistos.set(f.slug, true);
  }
  return fichas;
}

async function convertir() {
  mkdirSync(DESTINO, { recursive: true });
  const fichas = manifiesto();
  let entra = 0, sale = 0;
  for (const f of fichas) {
    const destino = join(DESTINO, `${f.slug}.webp`);
    await sharp(f.ruta, { animated: true, limitInputPixels: false })
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 72, effort: 4 })
      .toFile(destino);
    entra += statSync(f.ruta).size;
    sale += statSync(destino).size;
  }
  console.log(`${fichas.length} convertidos en ${DESTINO}`);
  console.log(
    `${(entra / 1048576).toFixed(0)} MB -> ${(sale / 1048576).toFixed(1)} MB` +
      ` (${(100 - (sale / entra) * 100).toFixed(0)} % menos)`
  );
}

const orden = process.argv[2];
if (orden === "convertir") await convertir();
else if (orden === "manifiesto") {
  const f = manifiesto();
  writeFileSync(
    join(process.env.TEMP ?? ".", "yiyo-manifiesto.json"),
    JSON.stringify(f, null, 2)
  );
  console.log(JSON.stringify(f.map(({ ruta, ...r }) => r), null, 1));
}
