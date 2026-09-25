-- =====================================================================
-- YIYO GYM — Cuánto dura un plan de alimentación
-- Ejecutar DESPUÉS de 0020_ejercicios_gif.sql
--
-- Un plan guardaba cuándo empieza pero no cuánto dura, así que el
-- calendario tenía que dar por hecho que todos duran lo mismo. Al asignar
-- una dieta el 1 de octubre por tres semanas no había forma de decirlo, ni
-- de que terminara donde tocaba.
--
-- Se guarda en semanas y no como fecha de fin porque es como se piensa y
-- como se escribe al asignarla —«tres semanas», no «hasta el 21»—, y así
-- mover el inicio arrastra el final sin tener que recalcular nada a mano.
-- =====================================================================

alter table planes_alimentacion
  add column if not exists semanas int not null default 4;

-- Un plan de cero semanas no existe, y uno de más de un año tampoco:
-- casi siempre sería un cero de más al teclear.
alter table planes_alimentacion
  drop constraint if exists plan_semanas_razonables;

alter table planes_alimentacion
  add constraint plan_semanas_razonables
  check (semanas between 1 and 52);

-- El calendario pregunta «qué planes cubren esta fecha», que se resuelve
-- por clienta y fecha de inicio.
create index if not exists planes_alimentacion_inicio_idx
  on planes_alimentacion (cliente_id, inicio);
