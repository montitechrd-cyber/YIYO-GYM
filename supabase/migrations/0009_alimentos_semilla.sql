-- =====================================================================
-- YIYO GYM — Catálogo inicial de alimentos
-- Ejecutar DESPUÉS de 0008_alimentacion.sql
--
-- Valores aproximados por 100 g de alimento crudo, salvo donde se indica.
-- Son referencias estándar: la entrenadora puede ajustarlas o añadir marcas
-- concretas con los datos exactos de la etiqueta.
-- =====================================================================

insert into alimentos
  (nombre, categoria, unidad, calorias, proteina_g, carbohidratos_g, grasa_g, fibra_g, gramos_por_unidad)
values
  -- ---- Proteínas ----
  ('Pechuga de pollo',            'proteina',     'g',      165, 31.0,  0.0,  3.6, 0.0, null),
  ('Muslo de pollo sin piel',     'proteina',     'g',      179, 24.0,  0.0,  8.2, 0.0, null),
  ('Carne de res molida 90/10',   'proteina',     'g',      176, 20.0,  0.0, 10.0, 0.0, null),
  ('Lomo de cerdo',               'proteina',     'g',      143, 26.0,  0.0,  3.5, 0.0, null),
  ('Salmón',                      'proteina',     'g',      208, 20.0,  0.0, 13.0, 0.0, null),
  ('Atún en agua',                'proteina',     'g',      116, 26.0,  0.0,  1.0, 0.0, null),
  ('Tilapia',                     'proteina',     'g',       96, 20.0,  0.0,  1.7, 0.0, null),
  ('Camarones',                   'proteina',     'g',       99, 24.0,  0.2,  0.3, 0.0, null),
  ('Huevo entero',                'proteina',     'unidad',  72,  6.3,  0.4,  4.8, 0.0, 50),
  ('Clara de huevo',              'proteina',     'unidad',  17,  3.6,  0.2,  0.1, 0.0, 33),
  ('Proteína en polvo (whey)',    'proteina',     'g',      380, 78.0,  8.0,  5.0, 0.0, null),

  -- ---- Carbohidratos ----
  ('Arroz blanco cocido',         'carbohidrato', 'g',      130,  2.7, 28.0,  0.3, 0.4, null),
  ('Arroz integral cocido',       'carbohidrato', 'g',      112,  2.6, 24.0,  0.9, 1.8, null),
  ('Avena en hojuelas',           'carbohidrato', 'g',      389, 17.0, 66.0,  7.0, 11.0, null),
  ('Pasta cocida',                'carbohidrato', 'g',      131,  5.0, 25.0,  1.1, 1.8, null),
  ('Papa cocida',                 'carbohidrato', 'g',       87,  1.9, 20.0,  0.1, 1.8, null),
  ('Batata (camote)',             'carbohidrato', 'g',       86,  1.6, 20.0,  0.1, 3.0, null),
  ('Yuca cocida',                 'carbohidrato', 'g',      160,  1.4, 38.0,  0.3, 1.8, null),
  ('Plátano verde',               'carbohidrato', 'g',      122,  1.3, 32.0,  0.4, 2.3, null),
  ('Pan integral',                'carbohidrato', 'unidad',  80,  4.0, 14.0,  1.1, 2.0, 32),
  ('Tortilla de maíz',            'carbohidrato', 'unidad',  52,  1.4, 11.0,  0.7, 1.5, 24),

  -- ---- Legumbres ----
  ('Habichuelas rojas cocidas',   'legumbre',     'g',      127,  8.7, 23.0,  0.5, 6.4, null),
  ('Lentejas cocidas',            'legumbre',     'g',      116,  9.0, 20.0,  0.4, 8.0, null),
  ('Garbanzos cocidos',           'legumbre',     'g',      164,  8.9, 27.0,  2.6, 7.6, null),

  -- ---- Grasas ----
  ('Aceite de oliva',             'grasa',        'ml',     884,  0.0,  0.0,100.0, 0.0, null),
  ('Aguacate',                    'grasa',        'g',      160,  2.0,  9.0, 15.0, 7.0, null),
  ('Almendras',                   'grasa',        'g',      579, 21.0, 22.0, 50.0, 12.5, null),
  ('Maní (cacahuate)',            'grasa',        'g',      567, 26.0, 16.0, 49.0, 8.5, null),
  ('Mantequilla de maní',         'grasa',        'g',      588, 25.0, 20.0, 50.0, 6.0, null),

  -- ---- Lácteos ----
  ('Leche descremada',            'lacteo',       'ml',      34,  3.4,  5.0,  0.1, 0.0, null),
  ('Leche entera',                'lacteo',       'ml',      61,  3.2,  4.8,  3.3, 0.0, null),
  ('Yogur griego natural 0%',     'lacteo',       'g',       59, 10.0,  3.6,  0.4, 0.0, null),
  ('Queso fresco',                'lacteo',       'g',      264, 18.0,  3.0, 20.0, 0.0, null),

  -- ---- Verduras ----
  ('Brócoli',                     'verdura',      'g',       34,  2.8,  7.0,  0.4, 2.6, null),
  ('Espinaca',                    'verdura',      'g',       23,  2.9,  3.6,  0.4, 2.2, null),
  ('Lechuga',                     'verdura',      'g',       15,  1.4,  2.9,  0.2, 1.3, null),
  ('Tomate',                      'verdura',      'g',       18,  0.9,  3.9,  0.2, 1.2, null),
  ('Zanahoria',                   'verdura',      'g',       41,  0.9, 10.0,  0.2, 2.8, null),
  ('Pepino',                      'verdura',      'g',       15,  0.7,  3.6,  0.1, 0.5, null),
  ('Cebolla',                     'verdura',      'g',       40,  1.1,  9.3,  0.1, 1.7, null),

  -- ---- Frutas ----
  ('Guineo (banana)',             'fruta',        'unidad', 105,  1.3, 27.0,  0.4, 3.1, 118),
  ('Manzana',                     'fruta',        'unidad',  95,  0.5, 25.0,  0.3, 4.4, 182),
  ('Fresas',                      'fruta',        'g',       32,  0.7,  7.7,  0.3, 2.0, null),
  ('Piña',                        'fruta',        'g',       50,  0.5, 13.0,  0.1, 1.4, null),
  ('Papaya (lechosa)',            'fruta',        'g',       43,  0.5, 11.0,  0.3, 1.7, null),
  ('Mango',                       'fruta',        'g',       60,  0.8, 15.0,  0.4, 1.6, null),

  -- ---- Bebidas ----
  ('Agua',                        'bebida',       'ml',       0,  0.0,  0.0,  0.0, 0.0, null),
  ('Café negro sin azúcar',       'bebida',       'ml',        2, 0.1,  0.0,  0.0, 0.0, null)
on conflict do nothing;
