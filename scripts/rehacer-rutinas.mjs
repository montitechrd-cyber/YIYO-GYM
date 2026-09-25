/**
 * Cambia cada ejercicio de las rutinas por su equivalente con demostración.
 *
 * Yiyo decidió trabajar solo con los ejercicios que tienen demostración
 * animada, y las 18 rutinas estaban armadas con los 64 antiguos, ninguno de
 * los cuales la tiene.
 *
 * Se cambia el ejercicio y nada más: series, repeticiones, descanso, orden,
 * circuitos, notas y los bloques de etiqueta y de descanso se quedan como
 * están. La programación es de ella; lo único que cambia es de dónde sale
 * la demostración. Por eso es un UPDATE fila a fila y no borrar y rehacer:
 * así tampoco se pierde lo que las clientas ya marcaron como hecho.
 *
 *   node scripts/rehacer-rutinas.mjs           -> enseña lo que haría
 *   node scripts/rehacer-rutinas.mjs aplicar   -> lo hace
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = env.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: CLAVE,
  Authorization: `Bearer ${CLAVE}`,
  "Content-Type": "application/json",
};

/**
 * Qué sustituye a qué.
 *
 * El criterio es el mismo movimiento antes que el mismo grupo: una sentadilla
 * se cambia por una sentadilla, no por cualquier cosa de cuádriceps. Las que
 * llevan un segundo valor son aquellas para las que la tanda de
 * demostraciones no trae equivalente, y ese texto dice qué falta: salen
 * listadas aparte para que Yiyo las revise.
 */
const SUSTITUCIONES = {
  // ---- Bíceps: la tanda solo trae uno ----
  "Curl de bíceps con barra": "Flexión de bíceps unilateral con banda elástica",
  "Curl martillo": ["Flexión de bíceps unilateral con banda elástica", "es el único de bíceps que hay"],

  // ---- Cardio: no hay demostraciones de cardio. Lo más cercano es el
  //      trabajo de cuerpo completo, y sube la intensidad ----
  "Caminata suave": ["Pasos laterales a alta velocidad", "no hay cardio suave"],
  "Caminata en cinta inclinada": ["Saltos con rodillas elevadas", "no hay cardio de cinta"],
  "Bicicleta estática": ["Saltar la cuerda", "no hay cardio de máquina"],
  "Stair climber": ["Saltos de tijera", "no hay cardio de máquina"],
  "Sprint en cinta": ["Burpee militar con flexiones y rodillas al pecho", "no hay cardio de cinta"],

  // ---- Core ----
  "Crunch abdominal": "Contracción abdominal",
  "Crunch en polea": "Contracción abdominal",
  "Russian twist": "Lanzamiento de balón medicinal con rotación",
  "Mountain climbers": "Elevación con giro de codo a rodilla opuesta",
  "Plancha abdominal": ["Contracción abdominal", "no hay plancha"],
  "Elevación de piernas tumbada": ["Abdominal concentrado con brazos extendidos", "no hay elevación de piernas"],
  "Elevación de piernas colgada": ["Abdominal de rana con pelota de ejercicios", "no hay elevación colgada"],

  // ---- Cuádriceps ----
  "Sentadilla con barra": "Sentadilla libre con barra",
  "Sentadilla con peso corporal": "Sentadilla",
  "Bulgarian split squat": "Sentadilla búlgara con peso corporal",
  Zancadas: "Zancada libre",
  "Extensión de cuádriceps": "Extensión de pierna de pie con banda elástica",
  "Prensa de piernas": ["Sentadilla en banco con peso corporal", "no hay prensa"],
  "Hack squat": ["Sentadilla con pies juntos", "no hay hack squat"],

  // ---- Cuerpo completo, calentamiento y estiramientos ----
  "Kettlebell swing": "Balanceo con barra elástica Gymstick",
  "Estiramiento de cadena posterior": "Estiramiento de isquiotibiales acostado",
  "Estiramiento de tren superior": "Estiramiento asistido hacia atrás de pecho y hombros",
  "Movilidad articular": ["Círculos con los brazos", "no hay movilidad de cuerpo entero"],

  // ---- Espalda ----
  "Jalón al pecho": "Jalón con banda elástica",
  "Jalón unilateral en polea": "Jalón de rodillas con banda elástica",
  "Remo sentado en polea": "Remo sentado con banda elástica",
  "Remo con mancuerna": "Remo unilateral con apoyo en banco",
  "Remo con barra": "Remo inclinado con barra",
  "Pullover en polea": ["Natación en el suelo", "no hay pullover"],

  // ---- Femorales ----
  "Peso muerto rumano": "Peso muerto con piernas semirrígidas",
  "Peso muerto rumano con mancuernas": "Peso muerto con piernas semirrígidas y banda elástica",
  "Curl femoral tumbada": "Flexión de piernas en máquina acostado",

  // ---- Gemelos ----
  "Elevación de gemelos de pie": "Elevación de talones de pie",

  // ---- Glúteos ----
  "Hip thrust": "Elevación de cadera con peso corporal",
  "Puente de glúteo": "Puente de glúteos",
  "Abducción en máquina": "Abducción de cadera sentado en máquina",
  "Abducción con banda": "Abducción de cadera sentado con banda elástica",
  "Patada de glúteo en polea": "Patada de glúteo con banda elástica",
  "Caminata lateral con banda": "Caminata lateral con banda elástica",
  "Activación de glúteo con banda": "Elevación lateral de pierna con banda elástica",
  "Step up al cajón": "Subida al escalón",
  "Frog pumps": "Elevación de piernas estilo rana",

  // ---- Hombros ----
  "Elevaciones laterales": "Elevaciones laterales de brazos",
  "Press militar": "Empuje de hombros sentado con banda elástica",
  "Face pull": "Aperturas inversas con barra elástica Gymstick para deltoides posteriores",

  // ---- Pecho ----
  "Press de banca": "Empuje de pecho en banco plano con mancuernas",
  Flexiones: "Flexión de brazos completa",
  "Aperturas con mancuernas": "Aperturas de pecho en máquina",
  "Pec deck": "Aperturas de pecho en máquina",
  "Cruce de poleas": "Aperturas de pecho en máquina",
  "Push up chin up": ["Flexión con rotación", "no hay equivalente"],
  "Press inclinado con mancuernas": ["Flexión declinada con pelota de estabilidad", "no hay press inclinado"],

  // ---- Tríceps ----
  "Extensión de tríceps en polea": "Extensión de tríceps con banda elástica en posición horizontal",
  "Extensión de tríceps sobre la cabeza": "Extensión francesa de tríceps de pie con barra elástica Gymstick",
  "Flexiones con agarre cerrado": "Flexiones con manos juntas y rodillas apoyadas",
  "Fondos asistidos": "Flexiones con manos juntas y rodillas apoyadas",
};

const traer = async (ruta) =>
  (await fetch(`${URL_BASE}/rest/v1/${ruta}`, { headers: H })).json();

const ejercicios = await traer("ejercicios?select=id,nombre,grupo,imagen_url&limit=1000");
const porId = Object.fromEntries(ejercicios.map((e) => [e.id, e]));
const porNombre = Object.fromEntries(ejercicios.map((e) => [e.nombre, e]));
const conDemostracion = ejercicios
  .filter((e) => e.imagen_url)
  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

const filas = await traer(
  "rutina_ejercicios?select=id,dia_id,ejercicio_id,orden&tipo=eq.ejercicio&limit=2000"
);
const dias = await traer("rutina_dias?select=id,rutina_id,nombre&limit=500");
const porDia = Object.fromEntries(dias.map((d) => [d.id, d]));

// Comprobación previa: que todo destino exista y tenga demostración. Un
// nombre mal escrito aquí dejaría la rutina apuntando a cualquier cosa.
const problemas = [];
for (const [viejo, destino] of Object.entries(SUSTITUCIONES)) {
  const nombre = Array.isArray(destino) ? destino[0] : destino;
  const e = porNombre[nombre];
  if (!e) problemas.push(`no existe el destino «${nombre}» (para «${viejo}»)`);
  else if (!e.imagen_url) problemas.push(`«${nombre}» no tiene demostración`);
  if (!porNombre[viejo]) problemas.push(`no existe el origen «${viejo}»`);
}
if (problemas.length) {
  problemas.forEach((p) => console.error("X", p));
  process.exit(1);
}

/**
 * Un estiramiento no sustituye a un ejercicio de fuerza.
 *
 * La tanda trae 24 estiramientos mezclados con el resto, y al buscar
 * suplente por orden alfabético salían los primeros: «Cruce de poleas»
 * acabó cambiado por un estiramiento de pecho, que en mitad de una serie no
 * tiene ningún sentido.
 */
const esEstiramiento = (n) =>
  /estiramiento|masaje|postura|abrazo de rodilla|c[íi]rculos con|rodar como|rodillas alternas/i.test(
    n
  );

/** Otro del mismo grupo que ese día todavía no use. */
function suplente(grupo, yaEnElDia) {
  const delGrupo = conDemostracion.filter(
    (e) => e.grupo === grupo && !yaEnElDia.has(e.id)
  );
  return delGrupo.find((e) => !esEstiramiento(e.nombre)) ?? delGrupo[0];
}

const cambios = [];
const sinMapa = new Set();
const usadosPorDia = {};

for (const fila of filas.sort((a, b) => a.orden - b.orden)) {
  const viejo = porId[fila.ejercicio_id];
  if (!viejo) continue;
  if (viejo.imagen_url) continue; // ya tiene demostración: no se toca

  const destino = SUSTITUCIONES[viejo.nombre];
  if (!destino) {
    sinMapa.add(viejo.nombre);
    continue;
  }

  const nombre = Array.isArray(destino) ? destino[0] : destino;
  let nuevo = porNombre[nombre];

  // Dos ejercicios distintos del mismo día pueden acabar en el mismo
  // destino. Repetirlo dejaría el día más corto de lo que Yiyo escribió,
  // así que se busca otro del mismo grupo en vez de encogerlo.
  const yaEnElDia = (usadosPorDia[fila.dia_id] ??= new Set());
  if (yaEnElDia.has(nuevo.id)) nuevo = suplente(nuevo.grupo, yaEnElDia) ?? nuevo;
  yaEnElDia.add(nuevo.id);

  cambios.push({
    id: fila.id,
    de: viejo.nombre,
    a: nuevo.nombre,
    nuevoId: nuevo.id,
    falta: Array.isArray(destino) ? destino[1] : null,
    rutinaId: porDia[fila.dia_id]?.rutina_id,
  });
}

console.log(`filas de ejercicio: ${filas.length} | a cambiar: ${cambios.length}`);
if (sinMapa.size) {
  console.log("\nSIN SUSTITUTO (se quedarían como están):");
  [...sinMapa].forEach((n) => console.log("   ", n));
}

const resumen = {};
cambios.forEach((c) => ((resumen[`${c.de} -> ${c.a}`] ??= { n: 0, falta: c.falta }).n++));
console.log("\nSustituciones (veces | de -> a):");
Object.entries(resumen)
  .sort((a, b) => b[1].n - a[1].n)
  .forEach(([k, v]) => console.log(String(v.n).padStart(4), k, v.falta ? `   [${v.falta}]` : ""));

const flojas = cambios.filter((c) => c.falta).length;
console.log(`\nfilas sin equivalente exacto: ${flojas} de ${cambios.length}`);

if (process.argv[2] !== "aplicar") {
  console.log("\n(prueba; para hacerlo: node scripts/rehacer-rutinas.mjs aplicar)");
  process.exit(0);
}

let hechos = 0;
for (const c of cambios) {
  const r = await fetch(`${URL_BASE}/rest/v1/rutina_ejercicios?id=eq.${c.id}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ ejercicio_id: c.nuevoId }),
  });
  if (!r.ok) {
    console.error("ERROR", c.id, r.status, (await r.text()).slice(0, 200));
    process.exit(1);
  }
  if (++hechos % 100 === 0) console.log(`  ${hechos}/${cambios.length}`);
}
console.log(
  `\ncambiadas ${hechos} filas en ${new Set(cambios.map((c) => c.rutinaId)).size} rutinas`
);
