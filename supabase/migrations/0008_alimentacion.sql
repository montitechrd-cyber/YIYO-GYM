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
