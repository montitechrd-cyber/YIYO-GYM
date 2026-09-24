-- =====================================================================
-- YIYO GYM — Datos iniciales (planes + biblioteca de ejercicios)
-- Ejecutar DESPUÉS de 0003_almacenamiento.sql
-- =====================================================================

insert into planes (nombre, descripcion, precio_mensual, beneficios, destacado, orden)
values
  (
    'Esencial',
    'Para empezar con estructura y sin excusas.',
    35,
    array[
      'Rutina de entrenamiento mensual',
      'Biblioteca de ejercicios en video',
      'Registro de entrenamientos',
      'Seguimiento de peso y medidas'
    ],
    false,
    1
  ),
  (
    'Transformación',
    'El plan completo: entrenamiento + nutrición + acompañamiento.',
    69,
    array[
      'Todo lo del plan Esencial',
      'Plan de nutrición personalizado',
      'Ajustes cada 2 semanas',
      'Chat directo con Yiyo',
      'Fotos de progreso comparativas'
    ],
    true,
    2
  ),
  (
    'Élite',
    'Acompañamiento uno a uno, máxima cercanía.',
    129,
    array[
      'Todo lo del plan Transformación',
      '2 videollamadas al mes',
      'Revisión semanal de técnica',
      'Plan de suplementación',
      'Prioridad en respuestas'
    ],
    false,
    3
  )
on conflict do nothing;

insert into ejercicios (nombre, grupo, equipo, nivel, instrucciones, publico) values
  ('Sentadilla con barra', 'cuadriceps', 'Barra', 'intermedio', 'Barra sobre trapecios, pies al ancho de hombros, baja hasta que los muslos queden paralelos al suelo manteniendo la espalda neutra.', true),
  ('Sentadilla goblet', 'cuadriceps', 'Mancuerna', 'principiante', 'Sujeta una mancuerna contra el pecho y baja manteniendo el torso erguido.', true),
  ('Prensa de piernas', 'cuadriceps', 'Máquina', 'principiante', 'Pies al ancho de hombros en la plataforma, baja de forma controlada sin despegar la zona lumbar.', true),
  ('Peso muerto rumano', 'femorales', 'Barra', 'intermedio', 'Rodillas ligeramente flexionadas, empuja la cadera hacia atrás bajando la barra pegada a las piernas.', true),
  ('Curl femoral tumbada', 'femorales', 'Máquina', 'principiante', 'Talones hacia los glúteos con movimiento controlado, sin despegar la cadera.', true),
  ('Hip thrust', 'gluteos', 'Barra', 'intermedio', 'Espalda apoyada en banco, empuja la cadera hacia arriba apretando glúteos en el punto alto.', true),
  ('Patada de glúteo en polea', 'gluteos', 'Polea', 'principiante', 'Lleva la pierna hacia atrás contrayendo el glúteo, sin arquear la lumbar.', true),
  ('Puente de glúteo', 'gluteos', 'Peso corporal', 'principiante', 'Tumbada boca arriba, eleva la cadera apretando glúteos 2 segundos arriba.', true),
  ('Press de banca', 'pecho', 'Barra', 'intermedio', 'Escápulas retraídas, baja la barra al esternón y empuja sin rebotar.', true),
  ('Press inclinado con mancuernas', 'pecho', 'Mancuernas', 'intermedio', 'Banco a 30-45°, baja las mancuernas al nivel del pecho y empuja juntándolas arriba.', true),
  ('Flexiones', 'pecho', 'Peso corporal', 'principiante', 'Cuerpo en línea recta, baja hasta que el pecho casi toque el suelo.', true),
  ('Dominadas asistidas', 'espalda', 'Máquina', 'principiante', 'Agarre prono, tira con la espalda llevando el pecho hacia la barra.', true),
  ('Remo con barra', 'espalda', 'Barra', 'intermedio', 'Torso inclinado 45°, tira la barra al abdomen apretando escápulas.', true),
  ('Jalón al pecho', 'espalda', 'Polea', 'principiante', 'Tira la barra al pecho llevando los codos hacia abajo y atrás.', true),
  ('Press militar', 'hombros', 'Barra', 'intermedio', 'Empuja la barra por encima de la cabeza sin arquear la lumbar.', true),
  ('Elevaciones laterales', 'hombros', 'Mancuernas', 'principiante', 'Sube los brazos hasta la altura de los hombros con ligera flexión de codo.', true),
  ('Face pull', 'hombros', 'Polea', 'principiante', 'Tira la cuerda hacia la cara separando las manos al final del recorrido.', true),
  ('Curl de bíceps con barra', 'biceps', 'Barra', 'principiante', 'Codos pegados al torso, sube la barra sin balancear el cuerpo.', true),
  ('Curl martillo', 'biceps', 'Mancuernas', 'principiante', 'Agarre neutro, sube alternando o a la vez sin mover los codos.', true),
  ('Extensión de tríceps en polea', 'triceps', 'Polea', 'principiante', 'Codos fijos a los costados, extiende los brazos completamente.', true),
  ('Fondos en banco', 'triceps', 'Peso corporal', 'principiante', 'Manos en el borde del banco, baja flexionando los codos a 90°.', true),
  ('Elevación de gemelos de pie', 'gemelos', 'Máquina', 'principiante', 'Sube sobre las puntas al máximo rango y baja controlando.', true),
  ('Plancha abdominal', 'core', 'Peso corporal', 'principiante', 'Antebrazos y puntas de pies, cuerpo en línea recta sin hundir la cadera.', true),
  ('Elevación de piernas colgada', 'core', 'Barra', 'avanzado', 'Colgada de la barra, sube las piernas rectas sin balancearte.', true),
  ('Russian twist', 'core', 'Disco', 'principiante', 'Sentada con torso inclinado, gira el tronco tocando el suelo a cada lado.', true),
  ('Caminata en cinta inclinada', 'cardio', 'Cinta', 'principiante', 'Inclinación 10-12%, ritmo constante sin agarrarte de los soportes.', true),
  ('Burpees', 'cuerpo_completo', 'Peso corporal', 'intermedio', 'Sentadilla, plancha, flexión, salto. Movimiento continuo y fluido.', true),
  ('Kettlebell swing', 'cuerpo_completo', 'Kettlebell', 'intermedio', 'Impulso desde la cadera, no desde los brazos. La pesa llega a la altura del pecho.', true)
on conflict do nothing;
