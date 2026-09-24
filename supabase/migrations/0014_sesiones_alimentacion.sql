-- =====================================================================
-- YIYO GYM — El calendario también refleja la alimentación
-- Ejecutar DESPUÉS de 0013_dietas_semilla.sql
--
-- Hasta ahora `sesiones` solo servía para entrenamientos. Al asignar un
-- plan de alimentación no pasaba nada en el calendario, así que la clienta
-- no se enteraba de que tenía un plan nuevo si no entraba a Nutrición.
--
-- Se añade un tipo de sesión y, para las de alimentación, a qué plan
-- pertenecen. El resto de columnas (duración, estado…) son de entrenamiento
-- y para una marca de alimentación no aplican; se dejan con su valor por
-- defecto y la interfaz simplemente no las muestra para ese tipo.
-- =====================================================================

create type tipo_sesion as enum ('entrenamiento', 'alimentacion');

alter table sesiones
  add column tipo_sesion tipo_sesion not null default 'entrenamiento',
  add column plan_alimentacion_id uuid references planes_alimentacion(id) on delete cascade;

alter table sesiones
  add constraint sesion_coherente check (
    (tipo_sesion = 'entrenamiento' and plan_alimentacion_id is null)
    or (tipo_sesion = 'alimentacion' and plan_alimentacion_id is not null)
  );

create index on sesiones (plan_alimentacion_id);
