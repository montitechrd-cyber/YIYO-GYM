-- =====================================================================
-- YIYO GYM — Esquema base
-- Ejecutar completo en Supabase → SQL Editor → New query → Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type rol_usuario as enum ('admin', 'entrenador', 'cliente');
create type estado_cliente as enum ('prospecto', 'activo', 'pausado', 'inactivo');
create type objetivo_fitness as enum (
  'perder_grasa', 'ganar_musculo', 'recomposicion', 'fuerza', 'salud', 'tonificar'
);
create type nivel_experiencia as enum ('principiante', 'intermedio', 'avanzado');
create type grupo_muscular as enum (
  'pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'gluteos',
  'cuadriceps', 'femorales', 'gemelos', 'core', 'cardio', 'cuerpo_completo'
);
create type estado_sesion as enum ('programada', 'completada', 'omitida', 'cancelada');
create type estado_suscripcion as enum ('activa', 'pendiente', 'cancelada', 'vencida', 'prueba');
create type tipo_notificacion as enum (
  'mensaje', 'rutina', 'sesion', 'pago', 'progreso', 'sistema'
);

-- ---------------------------------------------------------------------
-- Perfiles (extiende auth.users)
-- ---------------------------------------------------------------------
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol rol_usuario not null default 'cliente',
  nombre_completo text not null default '',
  correo text not null default '',
  telefono text,
  avatar_url text,
  fecha_nacimiento date,
  genero text,
  ciudad text,
  bio text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse
create or replace function manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into perfiles (id, correo, nombre_completo, rol)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'nombre_completo', ''),
    coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'cliente')
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function manejar_nuevo_usuario();

-- Helpers de rol (security definer evita recursión en las policies)
create or replace function rol_actual()
returns rol_usuario
language sql stable security definer set search_path = public
as $$ select rol from perfiles where id = auth.uid() $$;

create or replace function es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(rol_actual() = 'admin', false) $$;

create or replace function es_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(rol_actual() in ('admin', 'entrenador'), false) $$;

-- ---------------------------------------------------------------------
-- CRM de clientes
-- ---------------------------------------------------------------------
create table clientes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references perfiles(id) on delete cascade,
  entrenador_id uuid references perfiles(id) on delete set null,
  estado estado_cliente not null default 'prospecto',
  origen text,
  etiquetas text[] not null default '{}',
  objetivo objetivo_fitness,
  nivel nivel_experiencia,
  notas text,
  fecha_alta date not null default current_date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index on clientes (entrenador_id);
create index on clientes (estado);

-- Devuelve true si el usuario actual es el entrenador asignado del cliente
create or replace function es_mi_cliente(cliente uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from clientes c
    where c.id = cliente
      and (c.entrenador_id = auth.uid() or c.perfil_id = auth.uid())
  )
$$;

create table notas_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  autor_id uuid not null references perfiles(id) on delete cascade,
  contenido text not null,
  creado_en timestamptz not null default now()
);

create index on notas_cliente (cliente_id, creado_en desc);

-- ---------------------------------------------------------------------
-- Evaluación inicial
-- ---------------------------------------------------------------------
create table evaluaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  fecha date not null default current_date,
  altura_cm numeric(5,1),
  peso_kg numeric(5,1),
  grasa_pct numeric(4,1),
  medidas jsonb not null default '{}',
  objetivos text,
  condiciones_medicas text,
  lesiones text,
  medicamentos text,
  alergias_alimentarias text,
  dias_disponibles int,
  equipo_disponible text,
  habitos_sueno text,
  nivel_estres text,
  fotos text[] not null default '{}',
  creado_en timestamptz not null default now()
);

create index on evaluaciones (cliente_id, fecha desc);

-- ---------------------------------------------------------------------
-- Biblioteca de ejercicios
-- ---------------------------------------------------------------------
create table ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  grupo grupo_muscular not null,
  equipo text,
  nivel nivel_experiencia not null default 'principiante',
  instrucciones text,
  consejos text,
  video_url text,
  imagen_url text,
  creado_por uuid references perfiles(id) on delete set null,
  publico boolean not null default true,
  creado_en timestamptz not null default now()
);

create index on ejercicios (grupo);
create index on ejercicios (nombre);

-- ---------------------------------------------------------------------
-- Rutinas
-- ---------------------------------------------------------------------
create table rutinas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  entrenador_id uuid references perfiles(id) on delete set null,
  cliente_id uuid references clientes(id) on delete cascade,
  es_plantilla boolean not null default false,
  semanas int not null default 4,
  dias_por_semana int not null default 3,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index on rutinas (cliente_id);
create index on rutinas (entrenador_id);

create table rutina_dias (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references rutinas(id) on delete cascade,
  numero int not null,
  nombre text not null default '',
  notas text,
  unique (rutina_id, numero)
);

create table rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  dia_id uuid not null references rutina_dias(id) on delete cascade,
  ejercicio_id uuid not null references ejercicios(id) on delete restrict,
  orden int not null default 0,
  series int not null default 3,
  repeticiones text not null default '10',
  descanso_seg int not null default 60,
  peso_sugerido text,
  notas text
);

create index on rutina_ejercicios (dia_id, orden);

-- ---------------------------------------------------------------------
-- Programación / calendario
-- ---------------------------------------------------------------------
create table sesiones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  entrenador_id uuid references perfiles(id) on delete set null,
  rutina_dia_id uuid references rutina_dias(id) on delete set null,
  titulo text not null default 'Entrenamiento',
  fecha date not null,
  hora time,
  duracion_min int not null default 60,
  estado estado_sesion not null default 'programada',
  notas text,
  creado_en timestamptz not null default now()
);

create index on sesiones (cliente_id, fecha);
create index on sesiones (entrenador_id, fecha);

-- ---------------------------------------------------------------------
-- Registro de entrenamiento
-- ---------------------------------------------------------------------
create table registros_entrenamiento (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid references sesiones(id) on delete set null,
  cliente_id uuid not null references clientes(id) on delete cascade,
  fecha date not null default current_date,
  duracion_min int,
  esfuerzo_rpe int check (esfuerzo_rpe between 1 and 10),
  sensacion text,
  notas text,
  creado_en timestamptz not null default now()
);

create index on registros_entrenamiento (cliente_id, fecha desc);

create table series_registradas (
  id uuid primary key default gen_random_uuid(),
  registro_id uuid not null references registros_entrenamiento(id) on delete cascade,
  ejercicio_id uuid not null references ejercicios(id) on delete restrict,
  numero_serie int not null,
  repeticiones int,
  peso_kg numeric(6,2),
  rpe int check (rpe between 1 and 10),
  completada boolean not null default true
);

create index on series_registradas (registro_id);

-- ---------------------------------------------------------------------
-- Seguimiento de progreso
-- ---------------------------------------------------------------------
create table progreso (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  fecha date not null default current_date,
  peso_kg numeric(5,1),
  grasa_pct numeric(4,1),
  musculo_pct numeric(4,1),
  medidas jsonb not null default '{}',
  fotos text[] not null default '{}',
  notas text,
  creado_en timestamptz not null default now(),
  unique (cliente_id, fecha)
);

create index on progreso (cliente_id, fecha desc);

-- ---------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------
create table conversaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  entrenador_id uuid not null references perfiles(id) on delete cascade,
  ultimo_mensaje_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  unique (cliente_id, entrenador_id)
);

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references conversaciones(id) on delete cascade,
  autor_id uuid not null references perfiles(id) on delete cascade,
  contenido text not null,
  adjunto_url text,
  leido boolean not null default false,
  creado_en timestamptz not null default now()
);

create index on mensajes (conversacion_id, creado_en desc);

-- Participa en la conversación (cliente o entrenador)
create or replace function participa_en_conversacion(conv uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from conversaciones cv
    join clientes c on c.id = cv.cliente_id
    where cv.id = conv
      and (cv.entrenador_id = auth.uid() or c.perfil_id = auth.uid())
  )
$$;

-- ---------------------------------------------------------------------
-- Notificaciones
-- ---------------------------------------------------------------------
create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  tipo tipo_notificacion not null default 'sistema',
  titulo text not null,
  cuerpo text,
  enlace text,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

create index on notificaciones (perfil_id, creado_en desc);

-- ---------------------------------------------------------------------
-- Planes, suscripciones y pagos
-- ---------------------------------------------------------------------
create table planes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio_mensual numeric(10,2) not null,
  moneda text not null default 'USD',
  beneficios text[] not null default '{}',
  paypal_plan_id text,
  destacado boolean not null default false,
  activo boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

create table suscripciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  plan_id uuid not null references planes(id) on delete restrict,
  estado estado_suscripcion not null default 'pendiente',
  paypal_suscripcion_id text unique,
  inicio date,
  proximo_cobro date,
  cancelada_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index on suscripciones (cliente_id);

create table pagos (
  id uuid primary key default gen_random_uuid(),
  suscripcion_id uuid references suscripciones(id) on delete set null,
  cliente_id uuid not null references clientes(id) on delete cascade,
  monto numeric(10,2) not null,
  moneda text not null default 'USD',
  estado text not null default 'completado',
  paypal_pago_id text unique,
  fecha timestamptz not null default now()
);

create index on pagos (cliente_id, fecha desc);

-- ---------------------------------------------------------------------
-- actualizado_en automático
-- ---------------------------------------------------------------------
create or replace function tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger t_perfiles before update on perfiles
  for each row execute function tocar_actualizado_en();
create trigger t_clientes before update on clientes
  for each row execute function tocar_actualizado_en();
create trigger t_rutinas before update on rutinas
  for each row execute function tocar_actualizado_en();
create trigger t_suscripciones before update on suscripciones
  for each row execute function tocar_actualizado_en();
