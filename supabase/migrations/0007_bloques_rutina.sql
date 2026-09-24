-- =====================================================================
-- YIYO GYM — La rutina se arma como un listado de bloques
-- Ejecutar DESPUÉS de 0006_notificaciones_chat.sql
--
-- Hasta ahora un día solo podía contener ejercicios. Ahora la lista mezcla
-- tres tipos de bloque, como en las apps de entrenamiento:
--   · ejercicio → series, repeticiones y descanso
--   · descanso  → una pausa suelta entre ejercicios
--   · etiqueta  → un título de sección ("Calentamiento", "Parte principal")
--
-- Además los bloques consecutivos pueden agruparse en un circuito que se
-- repite varias veces.
-- =====================================================================

create type tipo_bloque as enum ('ejercicio', 'descanso', 'etiqueta');

alter table rutina_ejercicios
  add column tipo tipo_bloque not null default 'ejercicio',
  -- Texto del bloque de tipo etiqueta.
  add column texto text,
  -- Número de circuito: los bloques con el mismo número se repiten juntos.
  add column grupo int,
  add column grupo_repeticiones int not null default 1;

-- Los bloques de descanso y de etiqueta no apuntan a ningún ejercicio.
alter table rutina_ejercicios
  alter column ejercicio_id drop not null;

-- Coherencia: cada tipo de bloque necesita lo suyo.
alter table rutina_ejercicios
  add constraint bloque_coherente check (
    (tipo = 'ejercicio' and ejercicio_id is not null)
    or (tipo = 'descanso' and descanso_seg is not null)
    or (tipo = 'etiqueta' and texto is not null)
  );

create index on rutina_ejercicios (dia_id, grupo);
