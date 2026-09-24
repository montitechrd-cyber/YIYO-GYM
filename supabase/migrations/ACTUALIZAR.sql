-- =====================================================================
-- YIYO GYM — Actualización de una base ya instalada
-- Añade bloques de rutina, alimentación, el catálogo prearmado, el
-- vínculo del calendario con nutrición, marcar ejercicios como hechos
-- y los precios definitivos de los planes.
-- Pega TODO este archivo en Supabase → SQL Editor → New query → Run.
-- =====================================================================


-- ///////////////// 0007_bloques_rutina.sql /////////////////

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

-- ///////////////// 0008_alimentacion.sql /////////////////

-- =====================================================================
-- YIYO GYM — Módulo de alimentación
-- Ejecutar DESPUÉS de 0007_bloques_rutina.sql
--
-- La entrenadora arma un plan semanal por clienta: cada día tiene sus
-- comidas, y cada comida sus alimentos con la cantidad exacta. Los macros
-- se calculan sumando los alimentos, nunca se escriben a mano.
-- =====================================================================

create type categoria_alimento as enum (
  'proteina', 'carbohidrato', 'grasa', 'verdura', 'fruta',
  'lacteo', 'legumbre', 'bebida', 'otro'
);

-- Cómo se mide el alimento. Los macros se guardan por 100 g / 100 ml, o
-- por 1 unidad cuando se cuenta en piezas (un huevo, una rebanada).
create type unidad_alimento as enum ('g', 'ml', 'unidad');

-- ---------------------------------------------------------------------
-- Catálogo de alimentos
-- ---------------------------------------------------------------------
create table alimentos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria categoria_alimento not null default 'otro',
  unidad unidad_alimento not null default 'g',
  -- Valores por 100 g / 100 ml, o por unidad si `unidad` = 'unidad'.
  calorias numeric(7,2) not null default 0,
  proteina_g numeric(6,2) not null default 0,
  carbohidratos_g numeric(6,2) not null default 0,
  grasa_g numeric(6,2) not null default 0,
  fibra_g numeric(6,2) not null default 0,
  /** Gramos que pesa una unidad, para poder convertir. */
  gramos_por_unidad numeric(6,2),
  marca text,
  creado_por uuid references perfiles(id) on delete set null,
  publico boolean not null default true,
  creado_en timestamptz not null default now()
);

create index on alimentos (categoria);
create index on alimentos (nombre);

-- ---------------------------------------------------------------------
-- Plan de alimentación de una clienta
-- ---------------------------------------------------------------------
create table planes_alimentacion (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  entrenador_id uuid references perfiles(id) on delete set null,
  nombre text not null,
  descripcion text,
  -- Objetivo diario. Lo propone la plataforma y lo ajusta la entrenadora.
  calorias_objetivo int,
  proteina_objetivo_g int,
  carbohidratos_objetivo_g int,
  grasa_objetivo_g int,
  activo boolean not null default true,
  inicio date not null default current_date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index on planes_alimentacion (cliente_id);

-- Un día de la semana dentro del plan (1 = lunes … 7 = domingo)
create table plan_dias (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references planes_alimentacion(id) on delete cascade,
  numero int not null check (numero between 1 and 7),
  nombre text not null default '',
  notas text,
  unique (plan_id, numero)
);

-- Una comida del día: desayuno, almuerzo, merienda…
create table plan_comidas (
  id uuid primary key default gen_random_uuid(),
  dia_id uuid not null references plan_dias(id) on delete cascade,
  nombre text not null default 'Comida',
  orden int not null default 0,
  hora time
);

create index on plan_comidas (dia_id, orden);

-- Los ingredientes de esa comida, con su cantidad
create table comida_alimentos (
  id uuid primary key default gen_random_uuid(),
  comida_id uuid not null references plan_comidas(id) on delete cascade,
  alimento_id uuid not null references alimentos(id) on delete restrict,
  /** En gramos, mililitros o unidades, según el alimento. */
  cantidad numeric(7,2) not null default 100,
  orden int not null default 0,
  notas text
);

create index on comida_alimentos (comida_id, orden);

-- La clienta marca lo que cumplió, para poder verificar el seguimiento
create table registro_comidas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  comida_id uuid not null references plan_comidas(id) on delete cascade,
  fecha date not null default current_date,
  cumplida boolean not null default true,
  notas text,
  creado_en timestamptz not null default now(),
  unique (cliente_id, comida_id, fecha)
);

create index on registro_comidas (cliente_id, fecha desc);

create trigger t_planes_alimentacion before update on planes_alimentacion
  for each row execute function tocar_actualizado_en();

-- ---------------------------------------------------------------------
-- Seguridad
-- ---------------------------------------------------------------------
alter table alimentos            enable row level security;
alter table planes_alimentacion  enable row level security;
alter table plan_dias            enable row level security;
alter table plan_comidas         enable row level security;
alter table comida_alimentos     enable row level security;
alter table registro_comidas     enable row level security;

-- Catálogo compartido: todo el mundo lo lee, solo el staff lo edita.
create policy "alimentos legibles" on alimentos
  for select using (publico or creado_por = auth.uid() or es_admin());
create policy "staff crea alimentos" on alimentos
  for insert with check (es_staff());
create policy "staff edita alimentos" on alimentos
  for update using (creado_por = auth.uid() or es_admin())
  with check (creado_por = auth.uid() or es_admin());
create policy "staff borra alimentos" on alimentos
  for delete using (creado_por = auth.uid() or es_admin());

-- Planes: los ve su clienta y su entrenadora.
create policy "planes visibles" on planes_alimentacion
  for select using (es_mi_cliente(cliente_id) or es_admin());
create policy "staff crea planes" on planes_alimentacion
  for insert with check (es_staff() and (es_mi_cliente(cliente_id) or es_admin()));
create policy "staff edita planes" on planes_alimentacion
  for update using (entrenador_id = auth.uid() or es_admin())
  with check (entrenador_id = auth.uid() or es_admin());
create policy "staff borra planes" on planes_alimentacion
  for delete using (entrenador_id = auth.uid() or es_admin());

create or replace function puede_ver_plan(plan uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from planes_alimentacion p
    where p.id = plan and (es_mi_cliente(p.cliente_id) or es_admin())
  )
$$;

create or replace function puede_editar_plan(plan uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from planes_alimentacion p
    where p.id = plan and (p.entrenador_id = auth.uid() or es_admin())
  )
$$;

create or replace function plan_de_dia(dia uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select plan_id from plan_dias where id = dia $$;

create or replace function plan_de_comida(comida uuid)
returns uuid language sql stable security definer set search_path = public
as $$
  select d.plan_id from plan_comidas c join plan_dias d on d.id = c.dia_id
  where c.id = comida
$$;

create policy "dias del plan visibles" on plan_dias
  for select using (puede_ver_plan(plan_id));
create policy "dias del plan escritura" on plan_dias
  for insert with check (puede_editar_plan(plan_id));
create policy "dias del plan edicion" on plan_dias
  for update using (puede_editar_plan(plan_id))
  with check (puede_editar_plan(plan_id));
create policy "dias del plan borrado" on plan_dias
  for delete using (puede_editar_plan(plan_id));

create policy "comidas visibles" on plan_comidas
  for select using (puede_ver_plan(plan_de_dia(dia_id)));
create policy "comidas escritura" on plan_comidas
  for insert with check (puede_editar_plan(plan_de_dia(dia_id)));
create policy "comidas edicion" on plan_comidas
  for update using (puede_editar_plan(plan_de_dia(dia_id)))
  with check (puede_editar_plan(plan_de_dia(dia_id)));
create policy "comidas borrado" on plan_comidas
  for delete using (puede_editar_plan(plan_de_dia(dia_id)));

create policy "ingredientes visibles" on comida_alimentos
  for select using (puede_ver_plan(plan_de_comida(comida_id)));
create policy "ingredientes escritura" on comida_alimentos
  for insert with check (puede_editar_plan(plan_de_comida(comida_id)));
create policy "ingredientes edicion" on comida_alimentos
  for update using (puede_editar_plan(plan_de_comida(comida_id)))
  with check (puede_editar_plan(plan_de_comida(comida_id)));
create policy "ingredientes borrado" on comida_alimentos
  for delete using (puede_editar_plan(plan_de_comida(comida_id)));

-- El seguimiento lo escribe la propia clienta; su entrenadora lo consulta.
create policy "registro de comidas visible" on registro_comidas
  for select using (es_mi_cliente(cliente_id) or es_admin());
create policy "registro de comidas escritura" on registro_comidas
  for insert with check (es_mi_cliente(cliente_id) or es_admin());
create policy "registro de comidas edicion" on registro_comidas
  for update using (es_mi_cliente(cliente_id) or es_admin())
  with check (es_mi_cliente(cliente_id) or es_admin());
create policy "registro de comidas borrado" on registro_comidas
  for delete using (es_mi_cliente(cliente_id) or es_admin());

-- ///////////////// 0009_alimentos_semilla.sql /////////////////

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

-- ///////////////// 0010_catalogo.sql /////////////////

-- =====================================================================
-- YIYO GYM — Catálogo prearmado y progresión
-- Ejecutar DESPUÉS de 0009_alimentos_semilla.sql
--
-- Hasta ahora cada rutina y cada dieta había que armarlas a mano, ejercicio
-- por ejercicio e ingrediente por ingrediente. Esto convierte la plataforma
-- en un catálogo: la entrenadora elige un programa ya hecho, lo asigna y el
-- sistema lo copia para esa clienta.
--
--   · Programas por nivel    → Principiante, Intermedio, Avanzado
--   · Programas por objetivo → Glute Grow, Fat Burn, Tonify, Body Sculpt
--   · Planes de alimentación → uno por objetivo, con sus 7 días armados
--
-- Lo del catálogo (`es_sistema = true`) es una plantilla: no pertenece a
-- ninguna clienta y no se toca. Al asignarla se hace una copia, y la copia
-- sí se puede ajustar sin afectar a las demás.
-- =====================================================================

create type categoria_programa as enum ('nivel', 'objetivo');

-- ---------------------------------------------------------------------
-- Rutinas: catálogo + progresión
-- ---------------------------------------------------------------------
alter table rutinas
  add column es_sistema boolean not null default false,
  add column categoria categoria_programa,
  add column nivel nivel_experiencia,
  add column emoji text,
  -- Duración de la clase, en minutos. Es un rango: "30–45 min".
  add column duracion_desde int,
  add column duracion_hasta int,
  -- Frase corta de la tarjeta: "Adaptación, técnica y activación".
  add column resumen text,
  add column frecuencia text,
  add column orden int not null default 0,
  -- Desde cuándo entrena la clienta este programa. Es lo que fija en qué
  -- semana del ciclo de progresión va.
  add column fecha_inicio date,
  -- Plantilla de la que salió esta copia, para saber su origen.
  add column origen_id uuid references rutinas(id) on delete set null;

-- Una plantilla del sistema no es de nadie; una rutina asignada sí.
alter table rutinas
  add constraint plantilla_sin_dueno check (
    not es_sistema or (cliente_id is null and entrenador_id is null)
  );

create index on rutinas (es_sistema, categoria, orden);
create index on rutinas (origen_id);

-- ---------------------------------------------------------------------
-- Alimentación: catálogo
-- ---------------------------------------------------------------------
alter table planes_alimentacion
  alter column cliente_id drop not null;

alter table planes_alimentacion
  add column es_sistema boolean not null default false,
  add column objetivo objetivo_fitness,
  add column emoji text,
  add column resumen text,
  add column orden int not null default 0,
  -- Calorías con las que se escribieron las cantidades de la plantilla.
  -- Al asignarla se reescalan a las calorías reales de la clienta.
  add column calorias_base int,
  add column origen_id uuid references planes_alimentacion(id) on delete set null;

alter table planes_alimentacion
  add constraint plan_con_dueno_o_plantilla check (
    (es_sistema and cliente_id is null) or (not es_sistema and cliente_id is not null)
  );

create index on planes_alimentacion (es_sistema, orden);

-- ---------------------------------------------------------------------
-- Visibilidad del catálogo
--
-- Las plantillas no tienen entrenadora ni clienta, así que las políticas
-- que había las dejaban invisibles para todo el mundo menos la admin.
-- ---------------------------------------------------------------------
create policy "catalogo de rutinas visible" on rutinas
  for select using (es_sistema and es_staff());

create policy "catalogo de planes visible" on planes_alimentacion
  for select using (es_sistema and es_staff());

-- Los días y bloques de una plantilla cuelgan de estas funciones.
create or replace function puede_ver_rutina(rut uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from rutinas r
    where r.id = rut
      and (
        r.entrenador_id = auth.uid()
        or (r.cliente_id is not null and es_mi_cliente(r.cliente_id))
        or (r.es_sistema and es_staff())
        or es_admin()
      )
  )
$$;

create or replace function puede_ver_plan(plan uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from planes_alimentacion p
    where p.id = plan
      and (
        p.entrenador_id = auth.uid()
        or (p.cliente_id is not null and es_mi_cliente(p.cliente_id))
        or (p.es_sistema and es_staff())
        or es_admin()
      )
  )
$$;

-- Solo la admin retoca el catálogo. Las entrenadoras trabajan sobre copias.
create or replace function puede_editar_rutina(rut uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from rutinas r
    where r.id = rut
      and case when r.es_sistema then es_admin()
               else (r.entrenador_id = auth.uid() or es_admin()) end
  )
$$;

create or replace function puede_editar_plan(plan uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from planes_alimentacion p
    where p.id = plan
      and case when p.es_sistema then es_admin()
               else (p.entrenador_id = auth.uid() or es_admin()) end
  )
$$;

-- ///////////////// 0011_ejercicios_catalogo.sql /////////////////

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

-- ///////////////// 0012_programas_semilla.sql /////////////////

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

-- ///////////////// 0013_dietas_semilla.sql /////////////////

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

-- ///////////////// 0014_sesiones_alimentacion.sql /////////////////

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

-- ///////////////// 0015_registro_hecho.sql /////////////////

-- =====================================================================
-- YIYO GYM — Marcar ejercicios como hechos
-- Ejecutar DESPUÉS de 0014_sesiones_alimentacion.sql
--
-- La clienta ahora puede tocar «Hecho» en cada ejercicio de su rutina, sin
-- pasar por el formulario completo de registrar entrenamiento. Las dos vías
-- escriben en las mismas tablas para que el avance sea uno solo, así que
-- necesitan poder hacer upsert: un registro por clienta y día, y una serie
-- por registro+ejercicio+número.
-- =====================================================================

alter table registros_entrenamiento
  add constraint registros_entrenamiento_cliente_fecha_key unique (cliente_id, fecha);

alter table series_registradas
  add constraint series_registradas_registro_ejercicio_serie_key
  unique (registro_id, ejercicio_id, numero_serie);

-- ///////////////// 0016_precios_planes.sql /////////////////

-- =====================================================================
-- YIYO GYM — Precios definitivos de los planes
-- Ejecutar DESPUÉS de 0015_registro_hecho.sql
--
-- Los precios reales del negocio: US$100, US$160 y US$200. Los de la
-- semilla original eran solo un ejemplo. No se toca el nombre, la
-- descripción ni los beneficios de cada plan, ni si ya tiene un
-- `paypal_plan_id` asignado.
-- =====================================================================

update planes set precio_mensual = 100 where nombre = 'Esencial';
update planes set precio_mensual = 160 where nombre = 'Transformación';
update planes set precio_mensual = 200 where nombre = 'Élite';
