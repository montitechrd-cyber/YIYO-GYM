/**
 * Escribe la migración con las fichas de los ejercicios en GIF.
 *
 * Se genera en vez de escribirse a mano por la misma razón que el resto:
 * 143 filas copiadas a dedo acaban con un acento mal puesto o un grupo
 * que no cuadra con el archivo que sí se subió.
 */
import { writeFileSync } from "node:fs";
import { manifiesto } from "./ejercicios-gif.mjs";

const BASE =
  "https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca";

const cita = (t) => (t == null ? "null" : `'${String(t).replace(/'/g, "''")}'`);

const fichas = manifiesto().sort(
  (a, b) => a.carpeta.localeCompare(b.carpeta, "es") || a.nombre.localeCompare(b.nombre, "es")
);

let sql = `-- =====================================================================
-- YIYO GYM — Biblioteca en movimiento
-- Ejecutar DESPUÉS de 0019_ejercicio_destacado.sql
--
-- ${fichas.length} fichas nuevas con su demostración animada: las ${fichas.filter((f) => !f.estiramiento).length}
-- de fuerza y los ${fichas.filter((f) => f.estiramiento).length} estiramientos que entregó Yiyo, repartidos por
-- partes del cuerpo.
--
-- La animación va en \`imagen_url\` y no en \`video_url\` a propósito: son
-- bucles de demostración, sin sonido y de pocos segundos, y la tarjeta los
-- reproduce sola. El reproductor de video es para los videos que graba
-- ella, donde sí hace falta pulsar para ver.
--
-- El grupo sale de las carpetas que armó Yiyo. Solo se afina donde el
-- catálogo no tiene ese cajón —«Brazos» se reparte entre bíceps y tríceps,
-- «Piernas» entre cuádriceps y femorales— siguiendo cómo están clasificados
-- ya los que había.
--
-- \`nivel\` entra como principiante porque la columna no admite vacío, y
-- \`instrucciones\` queda en blanco: las escribe ella, no se inventan.
--
-- Solo añade los que faltan, así que se puede volver a ejecutar sin
-- duplicar nada ni pisar lo que la entrenadora haya editado.
-- =====================================================================

insert into ejercicios (nombre, grupo, equipo, nivel, imagen_url, publico)
select v.nombre, v.grupo::grupo_muscular, v.equipo, 'principiante'::nivel_experiencia,
       v.imagen_url, true
from (values
`;

let carpetaActual = null;
const filas = [];
for (const f of fichas) {
  if (f.carpeta !== carpetaActual) {
    carpetaActual = f.carpeta;
    filas.push(`\n  -- ---- ${carpetaActual} ----`);
  }
  filas.push(
    `  (${cita(f.nombre)}, ${cita(f.grupo)}, ${cita(f.equipo)}, ${cita(`${BASE}/${f.slug}.webp`)})`
  );
}

// Las líneas de comentario no llevan coma; las filas sí, menos la última.
const cuerpo = filas
  .map((l, i) => {
    if (l.trim().startsWith("--")) return l;
    const quedan = filas.slice(i + 1).some((x) => !x.trim().startsWith("--"));
    return quedan ? l + "," : l;
  })
  .join("\n");

sql += cuerpo + `
) as v(nombre, grupo, equipo, imagen_url)
where not exists (
  select 1 from ejercicios e where e.nombre = v.nombre
);
`;

writeFileSync("supabase/migrations/0020_ejercicios_gif.sql", sql, "utf8");
console.log("escrita 0020_ejercicios_gif.sql con", fichas.length, "fichas");
