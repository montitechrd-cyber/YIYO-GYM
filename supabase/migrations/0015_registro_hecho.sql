-- =====================================================================
-- YIYO GYM — Marcar ejercicios como hechos
-- Ejecutar DESPUÉS de 0014_sesiones_alimentacion.sql
--
-- La clienta ahora puede tocar «Hecho» en cada ejercicio de su rutina, sin
-- pasar por el formulario completo de registrar entrenamiento. Las dos vías
-- escriben en las mismas tablas para que el avance sea uno solo, así que
-- necesitan poder hacer upsert: un registro por clienta y día, y una serie
-- por registro+ejercicio+número.
-- =====================================================================

alter table registros_entrenamiento
  add constraint registros_entrenamiento_cliente_fecha_key unique (cliente_id, fecha);

alter table series_registradas
  add constraint series_registradas_registro_ejercicio_serie_key
  unique (registro_id, ejercicio_id, numero_serie);
