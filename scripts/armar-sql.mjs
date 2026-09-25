/**
 * Rehace los dos archivos que se pegan en el editor SQL de Supabase.
 *
 * Se juntaban a mano y es justo el tipo de tarea donde se cuela un archivo
 * olvidado: INSTALAR_TODO tiene que llevar todas las migraciones, en orden,
 * o una instalación desde cero sale coja.
 *
 *   node scripts/armar-sql.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";

// Las que aún no se han ejecutado en la base que está en marcha.
const PENDIENTES = ["0022_perfil_desde_google.sql"];

const migraciones = readdirSync(DIR)
  .filter((f) => /^\d{4}_.*\.sql$/.test(f))
  .sort();

const juntar = (archivos) =>
  archivos
    .map((f) => `\n\n-- ///////////////// ${f} /////////////////\n\n` + readFileSync(join(DIR, f), "utf8"))
    .join("");

writeFileSync(
  join(DIR, "INSTALAR_TODO.sql"),
  `-- =====================================================================
-- YIYO GYM — Instalación completa
-- Para una base de datos NUEVA y vacía.
-- ${migraciones.length} migraciones, de ${migraciones[0]} a ${migraciones.at(-1)}.
-- =====================================================================
` + juntar(migraciones),
  "utf8"
);

writeFileSync(
  join(DIR, "PENDIENTE.sql"),
  `-- =====================================================================
-- YIYO GYM — Lo que falta por ejecutar
-- Para la base que ya está en marcha.
--
-- 0019, 0020 y 0021 ya están ejecutados en la base en marcha; siguen en
-- INSTALAR_TODO para quien parta de cero.
--
-- 0022 arregla el perfil de quien entra con Google: el disparador solo
-- miraba el campo de nombre que rellena nuestro formulario, y Google manda
-- otro, así que esas cuentas se quedaban sin nombre.
-- =====================================================================
` + juntar(PENDIENTES),
  "utf8"
);

console.log(`INSTALAR_TODO: ${migraciones.length} migraciones`);
console.log(`PENDIENTE: ${PENDIENTES.join(", ")}`);
