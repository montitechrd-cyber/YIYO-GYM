-- =====================================================================
-- YIYO GYM — Lo que falta por ejecutar
-- Para la base que ya está en marcha.
--
-- Las fichas de 0020 (los 143 ejercicios con demostración animada) ya
-- están metidas en la base en marcha, así que ese archivo no aparece aquí;
-- sigue en INSTALAR_TODO para quien parta de cero.
-- =====================================================================


-- ///////////////// 0019_ejercicio_destacado.sql /////////////////

-- =====================================================================
-- YIYO GYM — Ejercicios destacados
-- Ejecutar DESPUÉS de 0018_tienda.sql
--
-- La biblioteca ordena por «tiene video» y luego alfabéticamente. Eso no
-- deja poner un ejercicio concreto al principio, que es justo lo que hace
-- falta cuando Yiyo graba uno nuevo y quiere que sea lo primero que vean.
-- =====================================================================

alter table ejercicios
  add column if not exists destacado boolean not null default false;

-- Los destacados encabezan la lista; el resto sigue como estaba.
create index if not exists ejercicios_destacado_idx
  on ejercicios (destacado desc, nombre);

-- ---------------------------------------------------------------------
-- Push up
--
-- Ejercicio nuevo con el video que grabó Yiyo. Se añade como pieza propia
-- y no se toca «Flexiones», que ya existe con su propio video y está
-- programado en dos rutinas: retirarlo dejaría esas rutinas cojas.
-- Las instrucciones quedan vacías a propósito: las escribe ella, no se
-- inventan.
-- ---------------------------------------------------------------------
insert into ejercicios (nombre, grupo, equipo, nivel, video_url, publico, destacado)
values (
  'Push up',
  'pecho',
  'Peso corporal',
  'principiante',
  'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/push-up.mp4',
  true,
  true
)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Push up en los días de pecho del catálogo
--
-- Se añade al final del trabajo de pecho de cada día, justo antes de que
-- la sesión pase a otro grupo. Series y descanso siguen la pauta que la
-- propia Yiyo usó para «Flexiones» (3×12) y la del resto del día.
--
-- Solo se tocan las PLANTILLAS del catálogo (rutinas sin clienta). Las
-- rutinas ya asignadas son el programa que alguien está siguiendo ahora
-- mismo: cambiarlo a mitad de camino es decisión de la entrenadora, no
-- de una migración.
-- ---------------------------------------------------------------------
do $$
declare
  ej_push uuid;
  d record;
  pos int;
begin
  select id into ej_push from ejercicios where nombre = 'Push up' limit 1;
  if ej_push is null then
    raise notice 'No existe el ejercicio «Push up»: no se toca ninguna rutina.';
    return;
  end if;

  for d in
    select rd.id
    from rutina_dias rd
    join rutinas r on r.id = rd.rutina_id
    where r.cliente_id is null          -- solo plantillas del catálogo
      and rd.nombre ilike '%Pecho%'
  loop
    -- Si ya lo tiene, no se duplica: la migración se puede repetir.
    if exists (
      select 1 from rutina_ejercicios
      where dia_id = d.id and ejercicio_id = ej_push
    ) then
      continue;
    end if;

    -- Justo después del último ejercicio de pecho del día.
    select max(re.orden) + 1 into pos
    from rutina_ejercicios re
    join ejercicios e on e.id = re.ejercicio_id
    where re.dia_id = d.id and e.grupo = 'pecho';

    if pos is null then
      continue;
    end if;

    -- Se abre hueco corriendo todo lo que venga después.
    update rutina_ejercicios
      set orden = orden + 1
      where dia_id = d.id and orden >= pos;

    insert into rutina_ejercicios
      (dia_id, ejercicio_id, orden, tipo, series, repeticiones, descanso_seg)
    values
      (d.id, ej_push, pos, 'ejercicio', 3, '12', 60);
  end loop;
end $$;
