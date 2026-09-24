-- =====================================================================
-- YIYO GYM — Programas de entrenamiento prearmados
-- Ejecutar DESPUÉS de 0011_ejercicios_catalogo.sql
--
-- ARCHIVO GENERADO. No lo edites a mano: se regenera desde
-- scratchpad/generar-programas.mjs. Para cambiar un programa ya instalado,
-- hazlo desde la plataforma.
--
-- Tres programas por nivel y cuatro por objetivo. Cada día trae la
-- estructura de clase completa: calentamiento, bloque principal, finisher,
-- core y enfriamiento, según corresponda.
--
-- Es idempotente: si el programa ya existe, se salta.
-- =====================================================================

-- Ayudante temporal: busca el ejercicio por nombre e inserta el bloque.
-- Si el nombre no existe, corta la instalación en vez de dejar el programa
-- a medias con un día vacío.
create or replace function seed_bloque(
  p_dia uuid, p_orden int, p_tipo tipo_bloque,
  p_ejercicio text default null, p_series int default 3,
  p_reps text default '10', p_descanso int default 60,
  p_texto text default null, p_grupo int default null,
  p_grupo_reps int default 1
) returns void
language plpgsql as $fn$
declare
  v_ej uuid;
begin
  if p_ejercicio is not null then
    select id into v_ej from ejercicios
      where lower(nombre) = lower(p_ejercicio)
      order by creado_en limit 1;
    if v_ej is null then
      raise exception 'Falta el ejercicio "%" en la biblioteca', p_ejercicio;
    end if;
  end if;

  insert into rutina_ejercicios
    (dia_id, ejercicio_id, orden, series, repeticiones, descanso_seg,
     tipo, texto, grupo, grupo_repeticiones)
  values
    (p_dia, v_ej, p_orden, p_series, p_reps, p_descanso,
     p_tipo, p_texto, p_grupo, p_grupo_reps);
end $fn$;


-- ///////////////// 🌸 Principiante /////////////////
do $$
declare
  v_rutina uuid;
  v_dia uuid;
begin
  if exists (select 1 from rutinas where es_sistema and nombre = 'Principiante') then
    return;
  end if;

  insert into rutinas (
    nombre, descripcion, es_plantilla, es_sistema, categoria, nivel, emoji,
    duracion_desde, duracion_hasta, resumen, frecuencia,
    semanas, dias_por_semana, orden, activa
  ) values (
    'Principiante', 'Para empezar. Crear el hábito, mejorar la condición física, aprender la técnica y comenzar a desarrollar masa muscular. Descansos de 45 a 60 segundos.', true, true, 'nivel', 'principiante', '🌸',
    30, 45, 'Adaptación, técnica y activación', '3 días por semana',
    6, 3, 0, true
  ) returning id into v_rutina;

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 1, '🍑 Glúteos + Piernas') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Sentadilla con peso corporal', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Hip thrust', 3, '15', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Peso muerto rumano con mancuernas', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Zancadas', 3, '10 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Abducción con banda', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Puente de glúteo', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 2, '💪 Tren superior + Core') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Jalón al pecho', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Remo sentado en polea', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Press de banca', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Curl de bíceps con barra', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Extensión de tríceps en polea', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'etiqueta', p_texto => 'Core');
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Crunch abdominal', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Plancha abdominal', 3, '20-30 s', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 12, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 3, '🔥 Full Body + Cardio') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Sentadilla con peso corporal', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Jalón al pecho', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Press militar', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Peso muerto rumano con mancuernas', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'etiqueta', p_texto => 'Finisher');
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Mountain climbers', 3, '20 s', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Caminata en cinta inclinada', 1, '10-15 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 12, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
end $$;

-- ///////////////// 💜 Intermedio /////////////////
do $$
declare
  v_rutina uuid;
  v_dia uuid;
begin
  if exists (select 1 from rutinas where es_sistema and nombre = 'Intermedio') then
    return;
  end if;

  insert into rutinas (
    nombre, descripcion, es_plantilla, es_sistema, categoria, nivel, emoji,
    duracion_desde, duracion_hasta, resumen, frecuencia,
    semanas, dias_por_semana, orden, activa
  ) values (
    'Intermedio', 'El siguiente paso. Aumentar masa muscular, mejorar la definición y subir el gasto calórico.', true, true, 'nivel', 'intermedio', '💜',
    45, 60, 'Mayor volumen e intensidad', '4 a 5 días por semana',
    6, 5, 1, true
  ) returning id into v_rutina;

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 1, '🍑 Glúteos') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Bulgarian split squat', 3, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Peso muerto rumano', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Patada de glúteo en polea', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Abducción en máquina', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Puente de glúteo', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Finisher');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Caminata lateral con banda', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 12, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 13, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 2, '🏋️ Espalda + Bíceps') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Jalón al pecho', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Remo sentado en polea', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Remo con mancuerna', 3, '10', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Pullover en polea', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Curl de bíceps con barra', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Curl martillo', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Face pull', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 3, '🦵 Piernas') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Sentadilla con barra', 4, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Prensa de piernas', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Peso muerto rumano', 3, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Extensión de cuádriceps', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Curl femoral tumbada', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Zancadas', 3, '10 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Elevación de gemelos de pie', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 12, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 4, '❤️ Pecho + Hombros + Tríceps') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Press de banca', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Press inclinado con mancuernas', 3, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Aperturas con mancuernas', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Press militar', 3, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Elevaciones laterales', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Extensión de tríceps en polea', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Fondos asistidos', 3, '10', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 5, '🔥 Cardio + Abdomen') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Caminata en cinta inclinada', 1, '15 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Bicicleta estática', 1, '10 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Stair climber', 1, '10 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'etiqueta', p_texto => 'Core');
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Crunch abdominal', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Elevación de piernas tumbada', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Russian twist', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Plancha abdominal', 3, '45 s', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 12, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
end $$;

-- ///////////////// 🔥 Avanzado /////////////////
do $$
declare
  v_rutina uuid;
  v_dia uuid;
begin
  if exists (select 1 from rutinas where es_sistema and nombre = 'Avanzado') then
    return;
  end if;

  insert into rutinas (
    nombre, descripcion, es_plantilla, es_sistema, categoria, nivel, emoji,
    duracion_desde, duracion_hasta, resumen, frecuencia,
    semanas, dias_por_semana, orden, activa
  ) values (
    'Avanzado', 'Máximo desarrollo muscular, definición y rendimiento. Exige buena técnica y constancia.', true, true, 'nivel', 'avanzado', '🔥',
    50, 70, 'Alta intensidad y progresión', '5 a 6 días por semana',
    6, 6, 2, true
  ) returning id into v_rutina;

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 1, '🍑 Glúteos Power') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 4, '8', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Bulgarian split squat', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Peso muerto rumano', 4, '8-10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Patada de glúteo en polea', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Abducción en máquina', 4, '15-20', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Step up al cajón', 3, '10 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Finisher');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Frog pumps', 3, '20', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 12, 'ejercicio', 'Caminata lateral con banda', 3, '20', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 13, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 14, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 2, '🏋️ Espalda + Bíceps') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Jalón al pecho', 4, '8-10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Remo con barra', 4, '8-10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Remo sentado en polea', 3, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Jalón unilateral en polea', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Pullover en polea', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Curl de bíceps con barra', 4, '10', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Curl martillo', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 3, '🦵 Piernas') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Sentadilla con barra', 4, '8', 120, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Prensa de piernas', 4, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Hack squat', 3, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Peso muerto rumano', 4, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Extensión de cuádriceps', 3, '15', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Curl femoral tumbada', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Zancadas', 3, '12 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Elevación de gemelos de pie', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 12, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 13, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 4, '💪 Hombros + Brazos') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Press militar', 4, '8-10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Elevaciones laterales', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Face pull', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Curl de bíceps con barra', 3, '10', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Curl martillo', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Extensión de tríceps en polea', 4, '10', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Extensión de tríceps sobre la cabeza', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 5, '❤️ Pecho + Core') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Press de banca', 4, '8-10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Press inclinado con mancuernas', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Pec deck', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Cruce de poleas', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'etiqueta', p_texto => 'Core');
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Crunch en polea', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Elevación de piernas tumbada', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Plancha abdominal', 3, '60 s', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Russian twist', 3, '20', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 12, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 13, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 6, '🔥 Cardio HIIT') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Caminata suave', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Sprint en cinta', 1, '30 s', 0, p_grupo => 1, p_grupo_reps => 8);
  perform seed_bloque(v_dia, 4, 'descanso', p_descanso => 60, p_grupo => 1, p_grupo_reps => 8);
  perform seed_bloque(v_dia, 5, 'etiqueta', p_texto => 'Finisher');
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Stair climber', 1, '10 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Bicicleta estática', 1, '10 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Caminata suave', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
end $$;

-- ///////////////// 🍑 Glute Grow /////////////////
do $$
declare
  v_rutina uuid;
  v_dia uuid;
begin
  if exists (select 1 from rutinas where es_sistema and nombre = 'Glute Grow') then
    return;
  end if;

  insert into rutinas (
    nombre, descripcion, es_plantilla, es_sistema, categoria, nivel, emoji,
    duracion_desde, duracion_hasta, resumen, frecuencia,
    semanas, dias_por_semana, orden, activa
  ) values (
    'Glute Grow', 'Prioriza hip thrust, peso muerto rumano, bulgarian split squat, patadas, abducciones y step ups, con dos días de glúteos por semana.', true, true, 'objetivo', 'intermedio', '🍑',
    45, 60, 'Desarrollar glúteos', '4 días por semana · 2 de glúteos',
    6, 4, 3, true
  ) returning id into v_rutina;

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 1, '🍑 Glúteos — Fuerza') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 4, '8', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Bulgarian split squat', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Peso muerto rumano', 4, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Step up al cajón', 3, '12 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Abducción en máquina', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 2, '💪 Tren superior') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Jalón al pecho', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Remo sentado en polea', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Press de banca', 3, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Elevaciones laterales', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Curl de bíceps con barra', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Extensión de tríceps en polea', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 3, '🍑 Glúteos — Volumen') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 4, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Patada de glúteo en polea', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Puente de glúteo', 3, '20', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Abducción con banda', 3, '20', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'etiqueta', p_texto => 'Finisher');
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Frog pumps', 3, '20', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Caminata lateral con banda', 3, '20', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 12, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 4, '🦵 Piernas + Core') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Sentadilla con barra', 4, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Prensa de piernas', 4, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Curl femoral tumbada', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Extensión de cuádriceps', 3, '15', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Elevación de gemelos de pie', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'etiqueta', p_texto => 'Core');
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Plancha abdominal', 3, '45 s', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 12, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
end $$;

-- ///////////////// 🔥 Fat Burn /////////////////
do $$
declare
  v_rutina uuid;
  v_dia uuid;
begin
  if exists (select 1 from rutinas where es_sistema and nombre = 'Fat Burn') then
    return;
  end if;

  insert into rutinas (
    nombre, descripcion, es_plantilla, es_sistema, categoria, nivel, emoji,
    duracion_desde, duracion_hasta, resumen, frecuencia,
    semanas, dias_por_semana, orden, activa
  ) values (
    'Fat Burn', 'Combina fuerza, cardio y core a lo largo de la semana para elevar el gasto calórico sin perder músculo.', true, true, 'objetivo', 'intermedio', '🔥',
    45, 60, 'Reducir grasa corporal', '5 días por semana',
    6, 5, 4, true
  ) returning id into v_rutina;

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 1, '🦵 Piernas + Cardio') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Sentadilla con barra', 4, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Prensa de piernas', 3, '15', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Zancadas', 3, '12 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Curl femoral tumbada', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'etiqueta', p_texto => 'Finisher');
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Caminata en cinta inclinada', 1, '20 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 2, '💪 Tren superior + Abdomen') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Jalón al pecho', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Remo sentado en polea', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Press de banca', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Elevaciones laterales', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'etiqueta', p_texto => 'Core');
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Crunch abdominal', 3, '20', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Plancha abdominal', 3, '45 s', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 3, '🔥 Cardio') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Caminata suave', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Caminata en cinta inclinada', 1, '20 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Bicicleta estática', 1, '15 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Stair climber', 1, '10 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Caminata suave', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 4, '🍑 Glúteos + Piernas') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 4, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Peso muerto rumano', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Bulgarian split squat', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Patada de glúteo en polea', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Abducción en máquina', 3, '20', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 5, '🔥 Full Body + HIIT') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Sentadilla con peso corporal', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Press militar', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Remo con mancuerna', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Kettlebell swing', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'etiqueta', p_texto => 'Finisher');
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Sprint en cinta', 1, '30 s', 0, p_grupo => 1, p_grupo_reps => 8);
  perform seed_bloque(v_dia, 9, 'descanso', p_descanso => 60, p_grupo => 1, p_grupo_reps => 8);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Caminata suave', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
end $$;

-- ///////////////// 💪 Tonify /////////////////
do $$
declare
  v_rutina uuid;
  v_dia uuid;
begin
  if exists (select 1 from rutinas where es_sistema and nombre = 'Tonify') then
    return;
  end if;

  insert into rutinas (
    nombre, descripcion, es_plantilla, es_sistema, categoria, nivel, emoji,
    duracion_desde, duracion_hasta, resumen, frecuencia,
    semanas, dias_por_semana, orden, activa
  ) values (
    'Tonify', 'Rangos de 8 a 15 repeticiones, entrenamiento de fuerza, cardio moderado y progresión de cargas semana a semana.', true, true, 'objetivo', 'principiante', '💪',
    45, 60, 'Mejorar composición corporal', '4 días por semana',
    6, 4, 5, true
  ) returning id into v_rutina;

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 1, '🍑 Glúteos + Piernas') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 4, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Sentadilla con barra', 3, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Peso muerto rumano', 3, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Abducción en máquina', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Puente de glúteo', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 2, '🏋️ Espalda + Hombros') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Jalón al pecho', 4, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Remo sentado en polea', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Elevaciones laterales', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Face pull', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Curl martillo', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 3, '❤️ Pecho + Brazos + Core') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Press de banca', 3, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Aperturas con mancuernas', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Extensión de tríceps en polea', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Curl de bíceps con barra', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'etiqueta', p_texto => 'Core');
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Crunch abdominal', 3, '15', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Plancha abdominal', 3, '40 s', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 4, '🦵 Piernas + Cardio moderado') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Prensa de piernas', 4, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Zancadas', 3, '12 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Curl femoral tumbada', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Extensión de cuádriceps', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Elevación de gemelos de pie', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'etiqueta', p_texto => 'Finisher');
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Bicicleta estática', 1, '15 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 11, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 12, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
end $$;

-- ///////////////// 🍑 Body Sculpt /////////////////
do $$
declare
  v_rutina uuid;
  v_dia uuid;
begin
  if exists (select 1 from rutinas where es_sistema and nombre = 'Body Sculpt') then
    return;
  end if;

  insert into rutinas (
    nombre, descripcion, es_plantilla, es_sistema, categoria, nivel, emoji,
    duracion_desde, duracion_hasta, resumen, frecuencia,
    semanas, dias_por_semana, orden, activa
  ) values (
    'Body Sculpt', 'Distribución de lunes a sábado: glúteos, espalda y brazos, cardio y abdomen, piernas, glúteos y hombros, y un cardio opcional el sábado.', true, true, 'objetivo', 'intermedio', '🍑',
    45, 60, 'Glúteos y piernas sin descuidar el tren superior', '6 días por semana',
    6, 6, 6, true
  ) returning id into v_rutina;

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 1, '🍑 Glúteos') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 4, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Bulgarian split squat', 3, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Peso muerto rumano', 4, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Patada de glúteo en polea', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Abducción en máquina', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 2, '🏋️ Espalda + Brazos') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Jalón al pecho', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Remo sentado en polea', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Remo con mancuerna', 3, '10', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Curl de bíceps con barra', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Curl martillo', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Extensión de tríceps en polea', 3, '12', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 10, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 3, '🔥 Cardio + Abdomen') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Caminata suave', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Caminata en cinta inclinada', 1, '15 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Stair climber', 1, '10 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'etiqueta', p_texto => 'Core');
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Crunch abdominal', 3, '15', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Elevación de piernas tumbada', 3, '15', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Russian twist', 3, '20', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Plancha abdominal', 3, '45 s', 40, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 4, '🦵 Piernas') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Sentadilla con barra', 4, '10', 90, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Prensa de piernas', 4, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Curl femoral tumbada', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Extensión de cuádriceps', 3, '12', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Zancadas', 3, '12 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Elevación de gemelos de pie', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 5, '🍑 Glúteos + Hombros') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Movilidad articular', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'ejercicio', 'Activación de glúteo con banda', 2, '15', 30, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 3, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Hip thrust', 4, '12', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'ejercicio', 'Step up al cajón', 3, '12 por pierna', 60, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Puente de glúteo', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 7, 'ejercicio', 'Press militar', 4, '10', 75, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 8, 'ejercicio', 'Elevaciones laterales', 4, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 9, 'ejercicio', 'Face pull', 3, '15', 45, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 10, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 11, 'ejercicio', 'Estiramiento de tren superior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);

  insert into rutina_dias (rutina_id, numero, nombre)
    values (v_rutina, 6, '🔥 Cardio opcional') returning id into v_dia;
  perform seed_bloque(v_dia, 0, 'etiqueta', p_texto => 'Calentamiento');
  perform seed_bloque(v_dia, 1, 'ejercicio', 'Caminata suave', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 2, 'etiqueta', p_texto => 'Bloque principal');
  perform seed_bloque(v_dia, 3, 'ejercicio', 'Caminata en cinta inclinada', 1, '20 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 4, 'ejercicio', 'Bicicleta estática', 1, '15 min', 0, p_grupo => null, p_grupo_reps => 1);
  perform seed_bloque(v_dia, 5, 'etiqueta', p_texto => 'Enfriamiento');
  perform seed_bloque(v_dia, 6, 'ejercicio', 'Estiramiento de cadena posterior', 1, '5 min', 0, p_grupo => null, p_grupo_reps => 1);
end $$;

drop function seed_bloque(uuid, int, tipo_bloque, text, int, text, int, text, int, int);
