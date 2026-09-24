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
