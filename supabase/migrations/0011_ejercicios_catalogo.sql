-- =====================================================================
-- YIYO GYM — Ejercicios que usan los programas prearmados
-- Ejecutar DESPUÉS de 0010_catalogo.sql
--
-- Solo añade los que faltan: si un ejercicio ya existe con ese nombre se
-- deja como está, así que este archivo se puede volver a ejecutar sin
-- duplicar nada ni pisar lo que la entrenadora haya editado.
--
-- Ninguno lleva video. Los videos los sube Yiyo desde la plataforma.
-- =====================================================================

insert into ejercicios (nombre, grupo, equipo, nivel, instrucciones, publico)
select v.nombre, v.grupo::grupo_muscular, v.equipo, v.nivel::nivel_experiencia, v.instrucciones, true
from (values

  -- ---- Calentamiento y movilidad ----
  ('Movilidad articular', 'cuerpo_completo', 'Peso corporal', 'principiante',
   'Círculos de tobillo, rodilla, cadera, hombro y cuello. Recorrido amplio y sin forzar, para entrar en calor.'),
  ('Gato-camello', 'core', 'Peso corporal', 'principiante',
   'A cuatro apoyos, alterna arquear y redondear la espalda acompañando la respiración.'),
  ('Activación de glúteo con banda', 'gluteos', 'Banda', 'principiante',
   'Banda por encima de las rodillas. Abre y cierra las piernas sentada o en puente, sintiendo el glúteo antes de empezar.'),

  -- ---- Glúteos ----
  ('Abducción con banda', 'gluteos', 'Banda', 'principiante',
   'Banda sobre las rodillas, separa las piernas contra la resistencia y vuelve controlando.'),
  ('Abducción en máquina', 'gluteos', 'Máquina', 'principiante',
   'Sentada, abre las piernas contra la resistencia. Inclina un poco el torso hacia delante para implicar más el glúteo.'),
  ('Caminata lateral con banda', 'gluteos', 'Banda', 'principiante',
   'Banda en los tobillos, semiflexión de rodillas, da pasos laterales sin juntar del todo los pies.'),
  ('Step up al cajón', 'gluteos', 'Mancuernas', 'intermedio',
   'Sube al cajón empujando con el talón de la pierna de arriba, sin impulsarte con la de abajo.'),
  ('Frog pumps', 'gluteos', 'Peso corporal', 'principiante',
   'Tumbada, plantas de los pies juntas y rodillas abiertas. Eleva la cadera apretando el glúteo arriba.'),

  -- ---- Piernas ----
  ('Sentadilla con peso corporal', 'cuadriceps', 'Peso corporal', 'principiante',
   'Pies al ancho de hombros, baja llevando la cadera atrás con el pecho arriba y el peso en el medio del pie.'),
  ('Zancadas', 'cuadriceps', 'Peso corporal', 'principiante',
   'Da un paso al frente y baja hasta que ambas rodillas formen 90°, con el torso erguido.'),
  ('Bulgarian split squat', 'cuadriceps', 'Mancuernas', 'intermedio',
   'Pie de atrás apoyado en un banco. Baja en vertical cargando la pierna de delante.'),
  ('Peso muerto rumano con mancuernas', 'femorales', 'Mancuernas', 'principiante',
   'Rodillas algo flexionadas, lleva la cadera atrás bajando las mancuernas pegadas a las piernas hasta notar el femoral.'),
  ('Extensión de cuádriceps', 'cuadriceps', 'Máquina', 'principiante',
   'Extiende las rodillas hasta arriba, aprieta un segundo y baja despacio.'),
  ('Hack squat', 'cuadriceps', 'Máquina', 'avanzado',
   'Espalda apoyada en el respaldo, baja hasta 90° manteniendo los talones pegados a la plataforma.'),

  -- ---- Espalda ----
  ('Remo sentado en polea', 'espalda', 'Polea', 'principiante',
   'Espalda recta, tira del agarre al abdomen juntando las escápulas y vuelve sin dejarte llevar.'),
  ('Remo con mancuerna', 'espalda', 'Mancuerna', 'principiante',
   'Rodilla y mano apoyadas en el banco, tira la mancuerna hacia la cadera con el codo pegado.'),
  ('Pullover en polea', 'espalda', 'Polea', 'intermedio',
   'Brazos casi rectos, baja la barra en arco hasta los muslos usando el dorsal, sin doblar los codos.'),
  ('Jalón unilateral en polea', 'espalda', 'Polea', 'intermedio',
   'Un brazo cada vez, tira hacia abajo y atrás buscando el estiramiento completo arriba.'),

  -- ---- Pecho ----
  ('Aperturas con mancuernas', 'pecho', 'Mancuernas', 'principiante',
   'Brazos en arco con los codos algo flexionados, abre hasta notar el pecho y cierra sin chocar las mancuernas.'),
  ('Pec deck', 'pecho', 'Máquina', 'principiante',
   'Espalda pegada al respaldo, junta los brazos al frente apretando el pecho un segundo.'),
  ('Cruce de poleas', 'pecho', 'Polea', 'intermedio',
   'Poleas altas, cruza las manos por delante del cuerpo describiendo un arco y aprieta al final.'),

  -- ---- Brazos ----
  ('Fondos asistidos', 'triceps', 'Máquina', 'principiante',
   'Baja flexionando los codos hacia atrás con el torso ligeramente inclinado y sube extendiendo.'),
  ('Extensión de tríceps sobre la cabeza', 'triceps', 'Mancuerna', 'principiante',
   'Mancuerna por detrás de la cabeza, extiende los brazos manteniendo los codos quietos y apuntando arriba.'),

  -- ---- Core ----
  ('Crunch abdominal', 'core', 'Peso corporal', 'principiante',
   'Despega solo los omóplatos llevando las costillas hacia la cadera. No tires del cuello.'),
  ('Crunch en polea', 'core', 'Polea', 'intermedio',
   'De rodillas frente a la polea, baja llevando los codos a los muslos redondeando el abdomen.'),
  ('Elevación de piernas tumbada', 'core', 'Peso corporal', 'principiante',
   'Tumbada boca arriba, sube las piernas rectas sin despegar la lumbar del suelo.'),
  ('Mountain climbers', 'core', 'Peso corporal', 'principiante',
   'En plancha alta, lleva las rodillas al pecho alternando rápido sin subir la cadera.'),

  -- ---- Cardio ----
  ('Bicicleta estática', 'cardio', 'Bicicleta', 'principiante',
   'Ritmo constante que te permita hablar con algo de esfuerzo. Ajusta el sillín a la altura de la cadera.'),
  ('Stair climber', 'cardio', 'Máquina', 'principiante',
   'Postura erguida, sin colgarte de los apoyos. Pisa el escalón completo.'),
  ('Sprint en cinta', 'cardio', 'Cinta', 'avanzado',
   'Carrera al máximo durante el intervalo indicado. Súbete y bájate por los laterales, con la cinta ya en marcha.'),
  ('Caminata suave', 'cardio', 'Cinta', 'principiante',
   'Ritmo cómodo, sin inclinación, para bajar pulsaciones al terminar.'),

  -- ---- Enfriamiento ----
  ('Estiramiento de cadena posterior', 'cuerpo_completo', 'Peso corporal', 'principiante',
   'Sentada o de pie, lleva el pecho hacia las piernas y mantén sin rebotes, respirando.'),
  ('Estiramiento de tren superior', 'cuerpo_completo', 'Peso corporal', 'principiante',
   'Pecho, dorsal, hombro y tríceps. Mantén cada posición sin forzar y respira.')

) as v(nombre, grupo, equipo, nivel, instrucciones)
where not exists (
  select 1 from ejercicios e where lower(e.nombre) = lower(v.nombre)
);
