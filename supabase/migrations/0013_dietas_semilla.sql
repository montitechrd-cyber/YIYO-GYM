-- =====================================================================
-- YIYO GYM — Planes de alimentación prearmados
-- Ejecutar DESPUÉS de 0012_programas_semilla.sql
--
-- ARCHIVO GENERADO. No lo edites a mano: se regenera desde
-- scratchpad/generar-dietas.mjs.
--
-- Cuatro planes completos, uno por objetivo, con sus 7 días y sus 5 comidas
-- diarias ya armadas. Las cantidades corresponden a las calorías base de
-- cada plan; al asignarlo se reescalan al objetivo real de la clienta.
--
-- Es idempotente: si el plan ya existe, se salta.
-- =====================================================================

-- Ayudante temporal: añade un ingrediente buscando el alimento por nombre.
create or replace function seed_ingrediente(
  p_comida uuid, p_orden int, p_alimento text, p_cantidad numeric
) returns void
language plpgsql as $fn$
declare
  v_al uuid;
begin
  select id into v_al from alimentos
    where lower(nombre) = lower(p_alimento)
    order by creado_en limit 1;
  if v_al is null then
    raise exception 'Falta el alimento "%" en el catálogo', p_alimento;
  end if;

  insert into comida_alimentos (comida_id, alimento_id, cantidad, orden)
  values (p_comida, v_al, p_cantidad, p_orden);
end $fn$;


-- ///////////////// 🔥 Pérdida de grasa — 1301 kcal /////////////////
do $$
declare
  v_plan uuid;
  v_dia uuid;
  v_comida uuid;
begin
  if exists (select 1 from planes_alimentacion where es_sistema and nombre = 'Pérdida de grasa') then
    return;
  end if;

  insert into planes_alimentacion (
    cliente_id, nombre, descripcion, es_sistema, objetivo, emoji, resumen,
    calorias_objetivo, proteina_objetivo_g, carbohidratos_objetivo_g,
    grasa_objetivo_g, calorias_base, orden, activo
  ) values (
    null, 'Pérdida de grasa', 'Prioriza la proteína y el volumen de verduras para llegar saciada al final del día. Los carbohidratos se concentran alrededor del entrenamiento.', true, 'perder_grasa', '🔥', 'Alta en proteína, saciante y con déficit sostenible',
    1301, 123, 130, 35, 1301, 0, true
  ) returning id into v_plan;

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 1, 'Lunes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Clara de huevo', 4);
  perform seed_ingrediente(v_comida, 1, 'Huevo entero', 1);
  perform seed_ingrediente(v_comida, 2, 'Pan integral', 1);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 60);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Fresas', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 150);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 120);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 5);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Manzana', 1);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Tilapia', 150);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 120);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 100);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 5);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 2, 'Martes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 40);
  perform seed_ingrediente(v_comida, 1, 'Leche descremada', 200);
  perform seed_ingrediente(v_comida, 2, 'Fresas', 80);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 12);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Carne de res molida 90/10', 130);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 120);
  perform seed_ingrediente(v_comida, 2, 'Habichuelas rojas cocidas', 80);
  perform seed_ingrediente(v_comida, 3, 'Lechuga', 60);
  perform seed_ingrediente(v_comida, 4, 'Tomate', 60);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Papaya (lechosa)', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 140);
  perform seed_ingrediente(v_comida, 1, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 2, 'Zanahoria', 80);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 5);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 3, 'Miércoles') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 2);
  perform seed_ingrediente(v_comida, 1, 'Clara de huevo', 2);
  perform seed_ingrediente(v_comida, 2, 'Tortilla de maíz', 2);
  perform seed_ingrediente(v_comida, 3, 'Aguacate', 40);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Guineo (banana)', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Salmón', 130);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 150);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 100);
  perform seed_ingrediente(v_comida, 3, 'Pepino', 80);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Piña', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Camarones', 150);
  perform seed_ingrediente(v_comida, 1, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 2, 'Cebolla', 40);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 5);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 4, 'Jueves') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Proteína en polvo (whey)', 30);
  perform seed_ingrediente(v_comida, 1, 'Avena en hojuelas', 40);
  perform seed_ingrediente(v_comida, 2, 'Leche descremada', 200);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Manzana', 1);
  perform seed_ingrediente(v_comida, 1, 'Maní (cacahuate)', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 150);
  perform seed_ingrediente(v_comida, 1, 'Yuca cocida', 130);
  perform seed_ingrediente(v_comida, 2, 'Lechuga', 60);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 60);
  perform seed_ingrediente(v_comida, 4, 'Aceite de oliva', 5);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Atún en agua', 140);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 100);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 5, 'Viernes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Clara de huevo', 4);
  perform seed_ingrediente(v_comida, 1, 'Huevo entero', 1);
  perform seed_ingrediente(v_comida, 2, 'Pan integral', 1);
  perform seed_ingrediente(v_comida, 3, 'Aguacate', 35);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Fresas', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Muslo de pollo sin piel', 140);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 120);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Mango', 120);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Tilapia', 150);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 120);
  perform seed_ingrediente(v_comida, 2, 'Zanahoria', 100);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 5);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 6, 'Sábado') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 40);
  perform seed_ingrediente(v_comida, 1, 'Leche descremada', 200);
  perform seed_ingrediente(v_comida, 2, 'Guineo (banana)', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Almendras', 20);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Lomo de cerdo', 140);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 150);
  perform seed_ingrediente(v_comida, 2, 'Lechuga', 60);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 60);
  perform seed_ingrediente(v_comida, 4, 'Aceite de oliva', 5);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Piña', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 140);
  perform seed_ingrediente(v_comida, 1, 'Espinaca', 120);
  perform seed_ingrediente(v_comida, 2, 'Pepino', 80);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 7, 'Domingo') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 2);
  perform seed_ingrediente(v_comida, 1, 'Clara de huevo', 2);
  perform seed_ingrediente(v_comida, 2, 'Plátano verde', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Papaya (lechosa)', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Salmón', 130);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 120);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 5);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Fresas', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Camarones', 150);
  perform seed_ingrediente(v_comida, 1, 'Lechuga', 80);
  perform seed_ingrediente(v_comida, 2, 'Tomate', 80);
  perform seed_ingrediente(v_comida, 3, 'Aguacate', 40);
end $$;

-- ///////////////// 💪 Ganancia muscular — 2798 kcal /////////////////
do $$
declare
  v_plan uuid;
  v_dia uuid;
  v_comida uuid;
begin
  if exists (select 1 from planes_alimentacion where es_sistema and nombre = 'Ganancia muscular') then
    return;
  end if;

  insert into planes_alimentacion (
    cliente_id, nombre, descripcion, es_sistema, objetivo, emoji, resumen,
    calorias_objetivo, proteina_objetivo_g, carbohidratos_objetivo_g,
    grasa_objetivo_g, calorias_base, orden, activo
  ) values (
    null, 'Ganancia muscular', 'Más carbohidratos y más volumen total para tener con qué construir. Proteína repartida en las cinco comidas.', true, 'ganar_musculo', '💪', 'Superávit calórico con proteína alta en cada comida',
    2798, 205, 294, 93, 2798, 1, true
  ) returning id into v_plan;

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 1, 'Lunes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 80);
  perform seed_ingrediente(v_comida, 1, 'Leche entera', 250);
  perform seed_ingrediente(v_comida, 2, 'Guineo (banana)', 1);
  perform seed_ingrediente(v_comida, 3, 'Mantequilla de maní', 20);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 200);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 25);
  perform seed_ingrediente(v_comida, 2, 'Manzana', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 200);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 250);
  perform seed_ingrediente(v_comida, 2, 'Habichuelas rojas cocidas', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Proteína en polvo (whey)', 30);
  perform seed_ingrediente(v_comida, 1, 'Pan integral', 2);
  perform seed_ingrediente(v_comida, 2, 'Mantequilla de maní', 20);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Carne de res molida 90/10', 180);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 250);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 2, 'Martes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 3);
  perform seed_ingrediente(v_comida, 1, 'Clara de huevo', 3);
  perform seed_ingrediente(v_comida, 2, 'Pan integral', 2);
  perform seed_ingrediente(v_comida, 3, 'Aguacate', 60);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Leche entera', 250);
  perform seed_ingrediente(v_comida, 1, 'Avena en hojuelas', 50);
  perform seed_ingrediente(v_comida, 2, 'Fresas', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Salmón', 180);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 250);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 200);
  perform seed_ingrediente(v_comida, 1, 'Maní (cacahuate)', 30);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 180);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 250);
  perform seed_ingrediente(v_comida, 2, 'Zanahoria', 100);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 3, 'Miércoles') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Proteína en polvo (whey)', 35);
  perform seed_ingrediente(v_comida, 1, 'Avena en hojuelas', 80);
  perform seed_ingrediente(v_comida, 2, 'Leche entera', 250);
  perform seed_ingrediente(v_comida, 3, 'Mantequilla de maní', 20);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Guineo (banana)', 1);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 25);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Muslo de pollo sin piel', 200);
  perform seed_ingrediente(v_comida, 1, 'Yuca cocida', 250);
  perform seed_ingrediente(v_comida, 2, 'Lechuga', 80);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 80);
  perform seed_ingrediente(v_comida, 4, 'Aceite de oliva', 10);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 200);
  perform seed_ingrediente(v_comida, 1, 'Piña', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Carne de res molida 90/10', 180);
  perform seed_ingrediente(v_comida, 1, 'Pasta cocida', 250);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 4, 'Jueves') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 3);
  perform seed_ingrediente(v_comida, 1, 'Avena en hojuelas', 60);
  perform seed_ingrediente(v_comida, 2, 'Leche entera', 250);
  perform seed_ingrediente(v_comida, 3, 'Guineo (banana)', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Queso fresco', 80);
  perform seed_ingrediente(v_comida, 1, 'Pan integral', 2);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 200);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 250);
  perform seed_ingrediente(v_comida, 2, 'Lentejas cocidas', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Proteína en polvo (whey)', 30);
  perform seed_ingrediente(v_comida, 1, 'Manzana', 1);
  perform seed_ingrediente(v_comida, 2, 'Maní (cacahuate)', 25);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Tilapia', 200);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 250);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 5, 'Viernes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 80);
  perform seed_ingrediente(v_comida, 1, 'Leche entera', 250);
  perform seed_ingrediente(v_comida, 2, 'Mantequilla de maní', 25);
  perform seed_ingrediente(v_comida, 3, 'Fresas', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 200);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 25);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Lomo de cerdo', 200);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 250);
  perform seed_ingrediente(v_comida, 2, 'Garbanzos cocidos', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pan integral', 2);
  perform seed_ingrediente(v_comida, 1, 'Aguacate', 60);
  perform seed_ingrediente(v_comida, 2, 'Huevo entero', 2);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 180);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 250);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 6, 'Sábado') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 3);
  perform seed_ingrediente(v_comida, 1, 'Clara de huevo', 3);
  perform seed_ingrediente(v_comida, 2, 'Plátano verde', 200);
  perform seed_ingrediente(v_comida, 3, 'Aguacate', 50);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Leche entera', 250);
  perform seed_ingrediente(v_comida, 1, 'Guineo (banana)', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Carne de res molida 90/10', 200);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 250);
  perform seed_ingrediente(v_comida, 2, 'Habichuelas rojas cocidas', 120);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 200);
  perform seed_ingrediente(v_comida, 1, 'Mango', 150);
  perform seed_ingrediente(v_comida, 2, 'Almendras', 25);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Salmón', 180);
  perform seed_ingrediente(v_comida, 1, 'Pasta cocida', 250);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 7, 'Domingo') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Proteína en polvo (whey)', 35);
  perform seed_ingrediente(v_comida, 1, 'Avena en hojuelas', 80);
  perform seed_ingrediente(v_comida, 2, 'Leche entera', 250);
  perform seed_ingrediente(v_comida, 3, 'Manzana', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Queso fresco', 80);
  perform seed_ingrediente(v_comida, 1, 'Pan integral', 2);
  perform seed_ingrediente(v_comida, 2, 'Tomate', 60);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 200);
  perform seed_ingrediente(v_comida, 1, 'Yuca cocida', 250);
  perform seed_ingrediente(v_comida, 2, 'Lentejas cocidas', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 200);
  perform seed_ingrediente(v_comida, 1, 'Maní (cacahuate)', 30);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Camarones', 200);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 250);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 10);
end $$;

-- ///////////////// ⚖️ Recomposición — 1921 kcal /////////////////
do $$
declare
  v_plan uuid;
  v_dia uuid;
  v_comida uuid;
begin
  if exists (select 1 from planes_alimentacion where es_sistema and nombre = 'Recomposición') then
    return;
  end if;

  insert into planes_alimentacion (
    cliente_id, nombre, descripcion, es_sistema, objetivo, emoji, resumen,
    calorias_objetivo, proteina_objetivo_g, carbohidratos_objetivo_g,
    grasa_objetivo_g, calorias_base, orden, activo
  ) values (
    null, 'Recomposición', 'Para bajar grasa y ganar músculo a la vez. Calorías cercanas al mantenimiento con proteína alta y carbohidratos alrededor del entrenamiento.', true, 'recomposicion', '⚖️', 'Mantener calorías, subir proteína y ganar calidad',
    1921, 157, 208, 55, 1921, 2, true
  ) returning id into v_plan;

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 1, 'Lunes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 2);
  perform seed_ingrediente(v_comida, 1, 'Clara de huevo', 3);
  perform seed_ingrediente(v_comida, 2, 'Pan integral', 2);
  perform seed_ingrediente(v_comida, 3, 'Aguacate', 40);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 170);
  perform seed_ingrediente(v_comida, 1, 'Fresas', 100);
  perform seed_ingrediente(v_comida, 2, 'Almendras', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 180);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 180);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 8);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Manzana', 1);
  perform seed_ingrediente(v_comida, 1, 'Maní (cacahuate)', 20);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Salmón', 150);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 180);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 2, 'Martes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 60);
  perform seed_ingrediente(v_comida, 1, 'Leche descremada', 250);
  perform seed_ingrediente(v_comida, 2, 'Guineo (banana)', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 170);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 20);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Carne de res molida 90/10', 160);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 180);
  perform seed_ingrediente(v_comida, 2, 'Habichuelas rojas cocidas', 100);
  perform seed_ingrediente(v_comida, 3, 'Lechuga', 80);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Papaya (lechosa)', 180);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Tilapia', 170);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 180);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 8);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 3, 'Miércoles') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Proteína en polvo (whey)', 30);
  perform seed_ingrediente(v_comida, 1, 'Avena en hojuelas', 60);
  perform seed_ingrediente(v_comida, 2, 'Leche descremada', 250);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Queso fresco', 70);
  perform seed_ingrediente(v_comida, 1, 'Tomate', 80);
  perform seed_ingrediente(v_comida, 2, 'Pan integral', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Muslo de pollo sin piel', 170);
  perform seed_ingrediente(v_comida, 1, 'Yuca cocida', 180);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 8);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 170);
  perform seed_ingrediente(v_comida, 1, 'Piña', 120);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Atún en agua', 160);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 160);
  perform seed_ingrediente(v_comida, 2, 'Zanahoria', 100);
  perform seed_ingrediente(v_comida, 3, 'Pepino', 80);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 4, 'Jueves') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 3);
  perform seed_ingrediente(v_comida, 1, 'Tortilla de maíz', 2);
  perform seed_ingrediente(v_comida, 2, 'Aguacate', 45);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 170);
  perform seed_ingrediente(v_comida, 1, 'Fresas', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 180);
  perform seed_ingrediente(v_comida, 1, 'Pasta cocida', 180);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 8);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Guineo (banana)', 1);
  perform seed_ingrediente(v_comida, 1, 'Mantequilla de maní', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Camarones', 170);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 160);
  perform seed_ingrediente(v_comida, 2, 'Lechuga', 80);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 80);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 5, 'Viernes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 60);
  perform seed_ingrediente(v_comida, 1, 'Leche descremada', 250);
  perform seed_ingrediente(v_comida, 2, 'Fresas', 100);
  perform seed_ingrediente(v_comida, 3, 'Mantequilla de maní', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 170);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 20);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Lomo de cerdo', 170);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 180);
  perform seed_ingrediente(v_comida, 2, 'Lentejas cocidas', 100);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 8);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Mango', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 170);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 180);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 6, 'Sábado') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 2);
  perform seed_ingrediente(v_comida, 1, 'Clara de huevo', 3);
  perform seed_ingrediente(v_comida, 2, 'Plátano verde', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 170);
  perform seed_ingrediente(v_comida, 1, 'Mango', 120);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Salmón', 160);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 180);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 8);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Manzana', 1);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 20);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Carne de res molida 90/10', 160);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 170);
  perform seed_ingrediente(v_comida, 2, 'Lechuga', 80);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 80);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 7, 'Domingo') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Proteína en polvo (whey)', 30);
  perform seed_ingrediente(v_comida, 1, 'Avena en hojuelas', 60);
  perform seed_ingrediente(v_comida, 2, 'Leche descremada', 250);
  perform seed_ingrediente(v_comida, 3, 'Guineo (banana)', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Queso fresco', 70);
  perform seed_ingrediente(v_comida, 1, 'Pan integral', 1);
  perform seed_ingrediente(v_comida, 2, 'Aguacate', 40);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 180);
  perform seed_ingrediente(v_comida, 1, 'Yuca cocida', 180);
  perform seed_ingrediente(v_comida, 2, 'Garbanzos cocidos', 100);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 8);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 170);
  perform seed_ingrediente(v_comida, 1, 'Papaya (lechosa)', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Tilapia', 170);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 160);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
end $$;

-- ///////////////// ✨ Tonificar — 1619 kcal /////////////////
do $$
declare
  v_plan uuid;
  v_dia uuid;
  v_comida uuid;
begin
  if exists (select 1 from planes_alimentacion where es_sistema and nombre = 'Tonificar') then
    return;
  end if;

  insert into planes_alimentacion (
    cliente_id, nombre, descripcion, es_sistema, objetivo, emoji, resumen,
    calorias_objetivo, proteina_objetivo_g, carbohidratos_objetivo_g,
    grasa_objetivo_g, calorias_base, orden, activo
  ) values (
    null, 'Tonificar', 'Comidas sencillas y equilibradas, sin extremos. Suficiente proteína para acompañar el entrenamiento de fuerza y carbohidratos para llegar con energía.', true, 'tonificar', '✨', 'Equilibrado, sencillo de sostener todos los días',
    1619, 134, 176, 45, 1619, 3, true
  ) returning id into v_plan;

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 1, 'Lunes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 50);
  perform seed_ingrediente(v_comida, 1, 'Leche descremada', 220);
  perform seed_ingrediente(v_comida, 2, 'Fresas', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 160);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 150);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 7);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Manzana', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Tilapia', 150);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 150);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 100);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 7);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 2, 'Martes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 2);
  perform seed_ingrediente(v_comida, 1, 'Clara de huevo', 2);
  perform seed_ingrediente(v_comida, 2, 'Pan integral', 1);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 60);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Guineo (banana)', 1);
  perform seed_ingrediente(v_comida, 1, 'Maní (cacahuate)', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Carne de res molida 90/10', 150);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 150);
  perform seed_ingrediente(v_comida, 2, 'Habichuelas rojas cocidas', 90);
  perform seed_ingrediente(v_comida, 3, 'Lechuga', 70);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Piña', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 150);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 150);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 3, 'Miércoles') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Proteína en polvo (whey)', 25);
  perform seed_ingrediente(v_comida, 1, 'Avena en hojuelas', 50);
  perform seed_ingrediente(v_comida, 2, 'Leche descremada', 220);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Fresas', 100);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Salmón', 140);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 160);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 7);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Papaya (lechosa)', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Camarones', 160);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 140);
  perform seed_ingrediente(v_comida, 2, 'Zanahoria', 90);
  perform seed_ingrediente(v_comida, 3, 'Pepino', 80);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 4, 'Jueves') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 2);
  perform seed_ingrediente(v_comida, 1, 'Tortilla de maíz', 2);
  perform seed_ingrediente(v_comida, 2, 'Aguacate', 40);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 160);
  perform seed_ingrediente(v_comida, 1, 'Pasta cocida', 160);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 7);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Manzana', 1);
  perform seed_ingrediente(v_comida, 1, 'Maní (cacahuate)', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Atún en agua', 150);
  perform seed_ingrediente(v_comida, 1, 'Batata (camote)', 150);
  perform seed_ingrediente(v_comida, 2, 'Lechuga', 80);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 80);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 5, 'Viernes') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 50);
  perform seed_ingrediente(v_comida, 1, 'Leche descremada', 220);
  perform seed_ingrediente(v_comida, 2, 'Guineo (banana)', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Queso fresco', 60);
  perform seed_ingrediente(v_comida, 1, 'Pan integral', 1);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Muslo de pollo sin piel', 150);
  perform seed_ingrediente(v_comida, 1, 'Arroz blanco cocido', 150);
  perform seed_ingrediente(v_comida, 2, 'Lentejas cocidas', 90);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 7);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Mango', 120);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Tilapia', 150);
  perform seed_ingrediente(v_comida, 1, 'Yuca cocida', 150);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 100);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 6, 'Sábado') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Huevo entero', 2);
  perform seed_ingrediente(v_comida, 1, 'Clara de huevo', 2);
  perform seed_ingrediente(v_comida, 2, 'Plátano verde', 120);
  perform seed_ingrediente(v_comida, 3, 'Aguacate', 35);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Fresas', 120);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 160);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 150);
  perform seed_ingrediente(v_comida, 2, 'Garbanzos cocidos', 90);
  perform seed_ingrediente(v_comida, 3, 'Aceite de oliva', 7);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Salmón', 140);
  perform seed_ingrediente(v_comida, 1, 'Papa cocida', 150);
  perform seed_ingrediente(v_comida, 2, 'Brócoli', 150);

  insert into plan_dias (plan_id, numero, nombre)
    values (v_plan, 7, 'Domingo') returning id into v_dia;
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Desayuno', 0, '07:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Avena en hojuelas', 50);
  perform seed_ingrediente(v_comida, 1, 'Leche descremada', 220);
  perform seed_ingrediente(v_comida, 2, 'Mantequilla de maní', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Media mañana', 1, '10:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Yogur griego natural 0%', 150);
  perform seed_ingrediente(v_comida, 1, 'Piña', 120);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Almuerzo', 2, '13:00') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Carne de res molida 90/10', 150);
  perform seed_ingrediente(v_comida, 1, 'Yuca cocida', 150);
  perform seed_ingrediente(v_comida, 2, 'Lechuga', 80);
  perform seed_ingrediente(v_comida, 3, 'Tomate', 80);
  perform seed_ingrediente(v_comida, 4, 'Aceite de oliva', 7);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Merienda', 3, '16:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Manzana', 1);
  perform seed_ingrediente(v_comida, 1, 'Almendras', 15);
  insert into plan_comidas (dia_id, nombre, orden, hora)
    values (v_dia, 'Cena', 4, '19:30') returning id into v_comida;
  perform seed_ingrediente(v_comida, 0, 'Pechuga de pollo', 150);
  perform seed_ingrediente(v_comida, 1, 'Arroz integral cocido', 140);
  perform seed_ingrediente(v_comida, 2, 'Espinaca', 120);
end $$;

drop function seed_ingrediente(uuid, int, text, numeric);
