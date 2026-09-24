-- =====================================================================
-- YIYO GYM — Biblioteca en movimiento
-- Ejecutar DESPUÉS de 0019_ejercicio_destacado.sql
--
-- 143 fichas nuevas con su demostración animada: las 119
-- de fuerza y los 24 estiramientos que entregó Yiyo, repartidos por
-- partes del cuerpo.
--
-- La animación va en `imagen_url` y no en `video_url` a propósito: son
-- bucles de demostración, sin sonido y de pocos segundos, y la tarjeta los
-- reproduce sola. El reproductor de video es para los videos que graba
-- ella, donde sí hace falta pulsar para ver.
--
-- El grupo sale de las carpetas que armó Yiyo. Solo se afina donde el
-- catálogo no tiene ese cajón —«Brazos» se reparte entre bíceps y tríceps,
-- «Piernas» entre cuádriceps y femorales— siguiendo cómo están clasificados
-- ya los que había.
--
-- `nivel` entra como principiante porque la columna no admite vacío, y
-- `instrucciones` queda en blanco: las escribe ella, no se inventan.
--
-- Solo añade los que faltan, así que se puede volver a ejecutar sin
-- duplicar nada ni pisar lo que la entrenadora haya editado.
-- =====================================================================

insert into ejercicios (nombre, grupo, equipo, nivel, imagen_url, publico)
select v.nombre, v.grupo::grupo_muscular, v.equipo, 'principiante'::nivel_experiencia,
       v.imagen_url, true
from (values

  -- ---- Abdomen ----
  ('Abdominal concentrado con brazos extendidos', 'core', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/abdominal-concentrado-con-brazos-extendidos.webp'),
  ('Abdominal de rana con pelota de ejercicios', 'core', 'Pelota', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/abdominal-de-rana-con-pelota-de-ejercicios.webp'),
  ('Contracción abdominal', 'core', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/contraccion-abdominal.webp'),
  ('Elevación con giro de codo a rodilla opuesta', 'core', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-con-giro-de-codo-a-rodilla-opuesta.webp'),
  ('Inclinación pélvica', 'core', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/inclinacion-pelvica.webp'),
  ('Lanzamiento de balón medicinal con rotación', 'core', 'Balón medicinal', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/lanzamiento-de-balon-medicinal-con-rotacion.webp'),
  ('Molino corporal', 'core', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/molino-corporal.webp'),
  ('Rodamiento sobre pelota suiza', 'core', 'Pelota', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/rodamiento-sobre-pelota-suiza.webp'),

  -- ---- Brazos ----
  ('Estiramiento del desviador cubital y extensor de muñeca', 'triceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-del-desviador-cubital-y-extensor-de-muneca.webp'),
  ('Extensión de tríceps con banda elástica en posición horizontal', 'triceps', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-de-triceps-con-banda-elastica-en-posicion-horizontal.webp'),
  ('Extensión francesa de tríceps de pie con barra elástica Gymstick', 'triceps', 'Barra elástica', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-francesa-de-triceps-de-pie-con-barra-elastica-gymstick.webp'),
  ('Flexión de bíceps unilateral con banda elástica', 'biceps', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-de-biceps-unilateral-con-banda-elastica.webp'),
  ('Flexiones con manos juntas y rodillas apoyadas', 'triceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexiones-con-manos-juntas-y-rodillas-apoyadas.webp'),

  -- ---- Cuerpo completo ----
  ('Balanceo con barra elástica Gymstick', 'cuerpo_completo', 'Barra elástica', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/balanceo-con-barra-elastica-gymstick.webp'),
  ('Burpee militar con flexiones y rodillas al pecho', 'cuerpo_completo', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/burpee-militar-con-flexiones-y-rodillas-al-pecho.webp'),
  ('Pasos laterales a alta velocidad', 'cuerpo_completo', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/pasos-laterales-a-alta-velocidad.webp'),
  ('Saltar la cuerda', 'cuerpo_completo', 'Cuerda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/saltar-la-cuerda.webp'),
  ('Saltos con rodillas elevadas', 'cuerpo_completo', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/saltos-con-rodillas-elevadas.webp'),
  ('Saltos de tijera', 'cuerpo_completo', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/saltos-de-tijera.webp'),

  -- ---- Espalda ----
  ('Dominada asistida con banda elástica', 'espalda', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/dominada-asistida-con-banda-elastica.webp'),
  ('Extensión de espalda con brazos y piernas elevados', 'espalda', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-de-espalda-con-brazos-y-piernas-elevados.webp'),
  ('Hiperextensión del tronco', 'espalda', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/hiperextension-del-tronco.webp'),
  ('Jalón con banda elástica', 'espalda', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/jalon-con-banda-elastica.webp'),
  ('Jalón de rodillas con banda elástica', 'espalda', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/jalon-de-rodillas-con-banda-elastica.webp'),
  ('Masaje de espalda con rodillo de espuma', 'espalda', 'Rodillo', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/masaje-de-espalda-con-rodillo-de-espuma.webp'),
  ('Natación en el suelo', 'espalda', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/natacion-en-el-suelo.webp'),
  ('Remo inclinado con agarre prono', 'espalda', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/remo-inclinado-con-agarre-prono.webp'),
  ('Remo inclinado con banda elástica', 'espalda', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/remo-inclinado-con-banda-elastica.webp'),
  ('Remo inclinado con barra', 'espalda', 'Barra', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/remo-inclinado-con-barra.webp'),
  ('Remo sentado con banda elástica', 'espalda', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/remo-sentado-con-banda-elastica.webp'),
  ('Remo unilateral con apoyo en banco', 'espalda', 'Banco', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/remo-unilateral-con-apoyo-en-banco.webp'),
  ('Remo unilateral con barra elástica Gymstick', 'espalda', 'Barra elástica', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/remo-unilateral-con-barra-elastica-gymstick.webp'),
  ('Rodar como una pelota', 'espalda', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/rodar-como-una-pelota.webp'),

  -- ---- Glúteos y caderas ----
  ('Abducción de cadera de pie', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/abduccion-de-cadera-de-pie.webp'),
  ('Abducción de cadera en polea', 'gluteos', 'Polea', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/abduccion-de-cadera-en-polea.webp'),
  ('Abducción de cadera sentado con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/abduccion-de-cadera-sentado-con-banda-elastica.webp'),
  ('Abducción de cadera sentado en máquina', 'gluteos', 'Máquina', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/abduccion-de-cadera-sentado-en-maquina.webp'),
  ('Abrazo de rodilla de pie', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/abrazo-de-rodilla-de-pie.webp'),
  ('Caminata lateral con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/caminata-lateral-con-banda-elastica.webp'),
  ('Elevación de cadera con peso corporal', 'gluteos', 'Peso corporal', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-cadera-con-peso-corporal.webp'),
  ('Elevación de cadera de rodillas con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-cadera-de-rodillas-con-banda-elastica.webp'),
  ('Elevación de piernas acostado de lado', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-piernas-acostado-de-lado.webp'),
  ('Elevación de piernas estilo rana', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-piernas-estilo-rana.webp'),
  ('Elevación lateral de pierna acostado con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-lateral-de-pierna-acostado-con-banda-elastica.webp'),
  ('Elevación lateral de pierna con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-lateral-de-pierna-con-banda-elastica.webp'),
  ('Elevación lateral de pierna en cuatro apoyos', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-lateral-de-pierna-en-cuatro-apoyos.webp'),
  ('Elevación pélvica con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-pelvica-con-banda-elastica.webp'),
  ('Extensión de cadera de pie', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-de-cadera-de-pie.webp'),
  ('Extensión de cadera de pie con rodillas flexionadas', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-de-cadera-de-pie-con-rodillas-flexionadas.webp'),
  ('Extensión de glúteo de pie', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-de-gluteo-de-pie.webp'),
  ('Extensión de pierna recta', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-de-pierna-recta.webp'),
  ('Flexión de rodilla en cuatro apoyos', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-de-rodilla-en-cuatro-apoyos.webp'),
  ('Patada de burro', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/patada-de-burro.webp'),
  ('Patada de glúteo con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/patada-de-gluteo-con-banda-elastica.webp'),
  ('Patada de glúteo con barra elástica Gymstick', 'gluteos', 'Barra elástica', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/patada-de-gluteo-con-barra-elastica-gymstick.webp'),
  ('Patada de glúteo con pierna flexionada', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/patada-de-gluteo-con-pierna-flexionada.webp'),
  ('Patada de glúteo con pierna flexionada y banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/patada-de-gluteo-con-pierna-flexionada-y-banda-elastica.webp'),
  ('Patada de glúteo de pie con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/patada-de-gluteo-de-pie-con-banda-elastica.webp'),
  ('Postura del bebé feliz', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/postura-del-bebe-feliz.webp'),
  ('Puente con banda elástica', 'gluteos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/puente-con-banda-elastica.webp'),
  ('Puente de glúteos', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/puente-de-gluteos.webp'),
  ('Puente unilateral', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/puente-unilateral.webp'),
  ('Puente unilateral con una pierna elevada', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/puente-unilateral-con-una-pierna-elevada.webp'),
  ('Puente unilateral en banco', 'gluteos', 'Banco', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/puente-unilateral-en-banco.webp'),
  ('Rodillas alternas al pecho', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/rodillas-alternas-al-pecho.webp'),

  -- ---- Hombros ----
  ('Aducción de hombro con banda elástica', 'hombros', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/aduccion-de-hombro-con-banda-elastica.webp'),
  ('Aperturas inversas con barra elástica Gymstick para deltoides posteriores', 'hombros', 'Barra elástica', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/aperturas-inversas-con-barra-elastica-gymstick-para-deltoides-posteriores.webp'),
  ('Aperturas inversas en máquina', 'hombros', 'Máquina', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/aperturas-inversas-en-maquina.webp'),
  ('Círculos con los brazos', 'hombros', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/circulos-con-los-brazos.webp'),
  ('Círculos con un brazo', 'hombros', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/circulos-con-un-brazo.webp'),
  ('Elevaciones laterales de brazos', 'hombros', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevaciones-laterales-de-brazos.webp'),
  ('Empuje de hombros sentado con banda elástica', 'hombros', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/empuje-de-hombros-sentado-con-banda-elastica.webp'),
  ('Extensión de hombro con banda elástica', 'hombros', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-de-hombro-con-banda-elastica.webp'),
  ('Flexión de hombro con banda elástica', 'hombros', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-de-hombro-con-banda-elastica.webp'),
  ('Tijeras de brazos', 'hombros', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/tijeras-de-brazos.webp'),

  -- ---- Pantorrillas ----
  ('Elevación de talón de pie a una pierna', 'gemelos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-talon-de-pie-a-una-pierna.webp'),
  ('Elevación de talones con banda elástica', 'gemelos', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-talones-con-banda-elastica.webp'),
  ('Elevación de talones de pie', 'gemelos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-talones-de-pie.webp'),
  ('Elevación de talones de pie - variante 2', 'gemelos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-talones-de-pie-variante-2.webp'),
  ('Estiramiento de pantorrilla a una pierna', 'gemelos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-de-pantorrilla-a-una-pierna.webp'),
  ('Estiramiento de pantorrilla con descenso del talón', 'gemelos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-de-pantorrilla-con-descenso-del-talon.webp'),
  ('Estiramiento de pantorrilla con una pierna extendida', 'gemelos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-de-pantorrilla-con-una-pierna-extendida.webp'),
  ('Estiramiento de pantorrilla sentado con pierna extendida', 'gemelos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-de-pantorrilla-sentado-con-pierna-extendida.webp'),
  ('Flexión plantar con peso corporal', 'gemelos', 'Peso corporal', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-plantar-con-peso-corporal.webp'),

  -- ---- Pecho ----
  ('Aperturas de pecho en máquina', 'pecho', 'Máquina', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/aperturas-de-pecho-en-maquina.webp'),
  ('Empuje de pecho en banco plano con mancuernas', 'pecho', 'Mancuernas', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/empuje-de-pecho-en-banco-plano-con-mancuernas.webp'),
  ('Estiramiento asistido hacia atrás de pecho y hombros', 'pecho', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-asistido-hacia-atras-de-pecho-y-hombros.webp'),
  ('Estiramiento asistido hacia atrás de pecho y hombros - variante 2', 'pecho', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-asistido-hacia-atras-de-pecho-y-hombros-variante-2.webp'),
  ('Flexión cobra', 'pecho', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-cobra.webp'),
  ('Flexión con rotación', 'pecho', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-con-rotacion.webp'),
  ('Flexión con una pierna elevada', 'pecho', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-con-una-pierna-elevada.webp'),
  ('Flexión de brazos completa', 'pecho', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-de-brazos-completa.webp'),
  ('Flexión declinada con pelota de estabilidad', 'pecho', 'Pelota', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-declinada-con-pelota-de-estabilidad.webp'),
  ('Flexiones con rodillas apoyadas', 'pecho', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexiones-con-rodillas-apoyadas.webp'),
  ('Flexiones contra la pared', 'pecho', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexiones-contra-la-pared.webp'),

  -- ---- Piernas ----
  ('Aducción de cadera en polea', 'gluteos', 'Polea', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/aduccion-de-cadera-en-polea.webp'),
  ('Aducción de piernas - estiramiento del aductor mayor', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/aduccion-de-piernas-estiramiento-del-aductor-mayor.webp'),
  ('Elevación de pierna de pie con banda elástica', 'cuadriceps', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-pierna-de-pie-con-banda-elastica.webp'),
  ('Elevación de pierna recta de pie con banda elástica', 'cuadriceps', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/elevacion-de-pierna-recta-de-pie-con-banda-elastica.webp'),
  ('Empuje alterno de piernas acostado con barra elástica Gymstick', 'cuadriceps', 'Barra elástica', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/empuje-alterno-de-piernas-acostado-con-barra-elastica-gymstick.webp'),
  ('Estiramiento de aductores de pie con piernas abiertas', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-de-aductores-de-pie-con-piernas-abiertas.webp'),
  ('Estiramiento de aductores de rodillas con pierna extendida', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-de-aductores-de-rodillas-con-pierna-extendida.webp'),
  ('Estiramiento de isquiotibiales acostado', 'femorales', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-de-isquiotibiales-acostado.webp'),
  ('Estiramiento lateral de la cara interna del muslo', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramiento-lateral-de-la-cara-interna-del-muslo.webp'),
  ('Extensión de pierna de pie con banda elástica', 'cuadriceps', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/extension-de-pierna-de-pie-con-banda-elastica.webp'),
  ('Flexión de piernas acostado con banda elástica', 'femorales', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-de-piernas-acostado-con-banda-elastica.webp'),
  ('Flexión de piernas con banda elástica', 'femorales', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-de-piernas-con-banda-elastica.webp'),
  ('Flexión de piernas en máquina acostado', 'femorales', 'Máquina', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-de-piernas-en-maquina-acostado.webp'),
  ('Flexión de piernas sobre pelota de estabilidad', 'femorales', 'Pelota', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/flexion-de-piernas-sobre-pelota-de-estabilidad.webp'),
  ('Masaje de isquiotibiales con rodillo de espuma', 'femorales', 'Rodillo', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/masaje-de-isquiotibiales-con-rodillo-de-espuma.webp'),
  ('Peso muerto a una pierna', 'femorales', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/peso-muerto-a-una-pierna.webp'),
  ('Peso muerto a una pierna con balón medicinal', 'femorales', 'Balón medicinal', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/peso-muerto-a-una-pierna-con-balon-medicinal.webp'),
  ('Peso muerto a una pierna en máquina Smith', 'femorales', 'Máquina', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/peso-muerto-a-una-pierna-en-maquina-smith.webp'),
  ('Peso muerto con piernas semirrígidas', 'femorales', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/peso-muerto-con-piernas-semirrigidas.webp'),
  ('Peso muerto con piernas semirrígidas y banda elástica', 'femorales', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/peso-muerto-con-piernas-semirrigidas-y-banda-elastica.webp'),
  ('Peso muerto sumo', 'femorales', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/peso-muerto-sumo.webp'),
  ('Peso muerto sumo con barra', 'femorales', 'Barra', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/peso-muerto-sumo-con-barra.webp'),
  ('Postura de media rana', 'gluteos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/postura-de-media-rana.webp'),
  ('Sentadilla', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla.webp'),
  ('Sentadilla a una pierna con pierna al frente', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-a-una-pierna-con-pierna-al-frente.webp'),
  ('Sentadilla búlgara con peso corporal', 'cuadriceps', 'Peso corporal', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-bulgara-con-peso-corporal.webp'),
  ('Sentadilla camarón', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-camaron.webp'),
  ('Sentadilla con barra elástica Gymstick', 'cuadriceps', 'Barra elástica', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-con-barra-elastica-gymstick.webp'),
  ('Sentadilla con pies juntos', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-con-pies-juntos.webp'),
  ('Sentadilla cosaca', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-cosaca.webp'),
  ('Sentadilla de copa con pesa rusa y banda elástica', 'cuadriceps', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-de-copa-con-pesa-rusa-y-banda-elastica.webp'),
  ('Sentadilla de patinador', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-de-patinador.webp'),
  ('Sentadilla en banco con peso corporal', 'cuadriceps', 'Banco', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-en-banco-con-peso-corporal.webp'),
  ('Sentadilla en zancada con banda elástica', 'cuadriceps', 'Banda', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-en-zancada-con-banda-elastica.webp'),
  ('Sentadilla libre con barra', 'cuadriceps', 'Barra', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-libre-con-barra.webp'),
  ('Sentadilla sumo con mancuernas', 'cuadriceps', 'Mancuernas', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-sumo-con-mancuernas.webp'),
  ('Sentadilla sumo con peso corporal', 'cuadriceps', 'Peso corporal', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-sumo-con-peso-corporal.webp'),
  ('Sentadilla sumo sin pesas', 'cuadriceps', 'Peso corporal', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/sentadilla-sumo-sin-pesas.webp'),
  ('Subida al escalón', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/subida-al-escalon.webp'),
  ('Subida al escalón con elevación de rodilla', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/subida-al-escalon-con-elevacion-de-rodilla.webp'),
  ('Zancada con barra elástica Gymstick', 'cuadriceps', 'Barra elástica', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/zancada-con-barra-elastica-gymstick.webp'),
  ('Zancada hacia atrás', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/zancada-hacia-atras.webp'),
  ('Zancada hacia atrás con elevación de rodilla', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/zancada-hacia-atras-con-elevacion-de-rodilla.webp'),
  ('Zancada lateral', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/zancada-lateral.webp'),
  ('Zancada libre', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/zancada-libre.webp'),
  ('Zancadas alternas con salto', 'cuadriceps', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/zancadas-alternas-con-salto.webp'),
  ('Zancadas con mancuernas', 'cuadriceps', 'Mancuernas', 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/zancadas-con-mancuernas.webp'),

  -- ---- Pies y tobillos ----
  ('Estiramientos de pies y tobillos', 'gemelos', null, 'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/estiramientos-de-pies-y-tobillos.webp')
) as v(nombre, grupo, equipo, imagen_url)
where not exists (
  select 1 from ejercicios e where e.nombre = v.nombre
);
