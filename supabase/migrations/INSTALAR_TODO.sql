-- =====================================================================
-- YIYO GYM — Instalación completa
-- Para una base de datos NUEVA y vacía.
-- 20 migraciones, de 0001_esquema.sql a 0020_ejercicios_gif.sql.
-- =====================================================================


-- ///////////////// 0001_esquema.sql /////////////////

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


-- ///////////////// 0002_rls.sql /////////////////

-- =====================================================================
-- YIYO GYM — Row Level Security
-- Ejecutar DESPUÉS de 0001_esquema.sql
-- Regla general: cliente ve lo suyo, entrenador ve lo de sus clientes,
-- admin ve todo.
-- =====================================================================

alter table perfiles                enable row level security;
alter table clientes                enable row level security;
alter table notas_cliente           enable row level security;
alter table evaluaciones            enable row level security;
alter table ejercicios              enable row level security;
alter table rutinas                 enable row level security;
alter table rutina_dias             enable row level security;
alter table rutina_ejercicios       enable row level security;
alter table sesiones                enable row level security;
alter table registros_entrenamiento enable row level security;
alter table series_registradas      enable row level security;
alter table progreso                enable row level security;
alter table conversaciones          enable row level security;
alter table mensajes                enable row level security;
alter table notificaciones          enable row level security;
alter table planes                  enable row level security;
alter table suscripciones           enable row level security;
alter table pagos                   enable row level security;

-- ---------------------------------------------------------------------
-- perfiles
-- ---------------------------------------------------------------------
create policy "perfil propio visible" on perfiles
  for select using (id = auth.uid() or es_staff());

create policy "perfil propio editable" on perfiles
  for update using (id = auth.uid() or es_admin())
  with check (id = auth.uid() or es_admin());

create policy "admin gestiona perfiles" on perfiles
  for delete using (es_admin());

-- ---------------------------------------------------------------------
-- clientes
-- ---------------------------------------------------------------------
create policy "clientes visibles" on clientes
  for select using (
    perfil_id = auth.uid() or entrenador_id = auth.uid() or es_admin()
  );

create policy "staff crea clientes" on clientes
  for insert with check (es_staff() or perfil_id = auth.uid());

create policy "staff edita clientes" on clientes
  for update using (entrenador_id = auth.uid() or es_admin())
  with check (entrenador_id = auth.uid() or es_admin());

create policy "admin borra clientes" on clientes
  for delete using (es_admin());

-- ---------------------------------------------------------------------
-- notas_cliente (solo staff)
-- ---------------------------------------------------------------------
create policy "notas visibles al staff" on notas_cliente
  for select using (es_admin() or (es_staff() and es_mi_cliente(cliente_id)));

create policy "staff escribe notas" on notas_cliente
  for insert with check (autor_id = auth.uid() and es_staff());

create policy "autor edita su nota" on notas_cliente
  for update using (autor_id = auth.uid() or es_admin())
  with check (autor_id = auth.uid() or es_admin());

create policy "autor borra su nota" on notas_cliente
  for delete using (autor_id = auth.uid() or es_admin());

-- ---------------------------------------------------------------------
-- evaluaciones
-- ---------------------------------------------------------------------
create policy "evaluaciones visibles" on evaluaciones
  for select using (es_mi_cliente(cliente_id) or es_admin());

create policy "evaluaciones escritura" on evaluaciones
  for insert with check (es_mi_cliente(cliente_id) or es_admin());

create policy "evaluaciones edicion" on evaluaciones
  for update using (es_mi_cliente(cliente_id) or es_admin())
  with check (es_mi_cliente(cliente_id) or es_admin());

create policy "evaluaciones borrado" on evaluaciones
  for delete using (es_mi_cliente(cliente_id) or es_admin());

-- ---------------------------------------------------------------------
-- ejercicios (biblioteca compartida)
-- ---------------------------------------------------------------------
create policy "ejercicios publicos legibles" on ejercicios
  for select using (publico or creado_por = auth.uid() or es_admin());

create policy "staff crea ejercicios" on ejercicios
  for insert with check (es_staff());

create policy "staff edita ejercicios" on ejercicios
  for update using (creado_por = auth.uid() or es_admin())
  with check (creado_por = auth.uid() or es_admin());

create policy "staff borra ejercicios" on ejercicios
  for delete using (creado_por = auth.uid() or es_admin());

-- ---------------------------------------------------------------------
-- rutinas
-- ---------------------------------------------------------------------
create policy "rutinas visibles" on rutinas
  for select using (
    es_admin()
    or entrenador_id = auth.uid()
    or (cliente_id is not null and es_mi_cliente(cliente_id))
  );

create policy "staff crea rutinas" on rutinas
  for insert with check (es_staff());

create policy "staff edita rutinas" on rutinas
  for update using (entrenador_id = auth.uid() or es_admin())
  with check (entrenador_id = auth.uid() or es_admin());

create policy "staff borra rutinas" on rutinas
  for delete using (entrenador_id = auth.uid() or es_admin());

-- Acceso a una rutina concreta, reutilizado por días y ejercicios
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
        or es_admin()
      )
  )
$$;

create or replace function puede_editar_rutina(rut uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from rutinas r
    where r.id = rut and (r.entrenador_id = auth.uid() or es_admin())
  )
$$;

-- ---------------------------------------------------------------------
-- rutina_dias
-- ---------------------------------------------------------------------
create policy "dias visibles" on rutina_dias
  for select using (puede_ver_rutina(rutina_id));

create policy "dias escritura" on rutina_dias
  for insert with check (puede_editar_rutina(rutina_id));

create policy "dias edicion" on rutina_dias
  for update using (puede_editar_rutina(rutina_id))
  with check (puede_editar_rutina(rutina_id));

create policy "dias borrado" on rutina_dias
  for delete using (puede_editar_rutina(rutina_id));

-- ---------------------------------------------------------------------
-- rutina_ejercicios
-- ---------------------------------------------------------------------
create or replace function rutina_de_dia(dia uuid)
returns uuid
language sql stable security definer set search_path = public
as $$ select rutina_id from rutina_dias where id = dia $$;

create policy "ejercicios de rutina visibles" on rutina_ejercicios
  for select using (puede_ver_rutina(rutina_de_dia(dia_id)));

create policy "ejercicios de rutina escritura" on rutina_ejercicios
  for insert with check (puede_editar_rutina(rutina_de_dia(dia_id)));

create policy "ejercicios de rutina edicion" on rutina_ejercicios
  for update using (puede_editar_rutina(rutina_de_dia(dia_id)))
  with check (puede_editar_rutina(rutina_de_dia(dia_id)));

create policy "ejercicios de rutina borrado" on rutina_ejercicios
  for delete using (puede_editar_rutina(rutina_de_dia(dia_id)));

-- ---------------------------------------------------------------------
-- sesiones
-- ---------------------------------------------------------------------
create policy "sesiones visibles" on sesiones
  for select using (es_mi_cliente(cliente_id) or es_admin());

create policy "sesiones escritura" on sesiones
  for insert with check (es_mi_cliente(cliente_id) or es_admin());

create policy "sesiones edicion" on sesiones
  for update using (es_mi_cliente(cliente_id) or es_admin())
  with check (es_mi_cliente(cliente_id) or es_admin());

create policy "sesiones borrado" on sesiones
  for delete using (
    (es_staff() and es_mi_cliente(cliente_id)) or es_admin()
  );

-- ---------------------------------------------------------------------
-- registros_entrenamiento
-- ---------------------------------------------------------------------
create policy "registros visibles" on registros_entrenamiento
  for select using (es_mi_cliente(cliente_id) or es_admin());

create policy "registros escritura" on registros_entrenamiento
  for insert with check (es_mi_cliente(cliente_id) or es_admin());

create policy "registros edicion" on registros_entrenamiento
  for update using (es_mi_cliente(cliente_id) or es_admin())
  with check (es_mi_cliente(cliente_id) or es_admin());

create policy "registros borrado" on registros_entrenamiento
  for delete using (es_mi_cliente(cliente_id) or es_admin());

-- ---------------------------------------------------------------------
-- series_registradas
-- ---------------------------------------------------------------------
create or replace function cliente_de_registro(reg uuid)
returns uuid
language sql stable security definer set search_path = public
as $$ select cliente_id from registros_entrenamiento where id = reg $$;

create policy "series visibles" on series_registradas
  for select using (es_mi_cliente(cliente_de_registro(registro_id)) or es_admin());

create policy "series escritura" on series_registradas
  for insert with check (es_mi_cliente(cliente_de_registro(registro_id)) or es_admin());

create policy "series edicion" on series_registradas
  for update using (es_mi_cliente(cliente_de_registro(registro_id)) or es_admin())
  with check (es_mi_cliente(cliente_de_registro(registro_id)) or es_admin());

create policy "series borrado" on series_registradas
  for delete using (es_mi_cliente(cliente_de_registro(registro_id)) or es_admin());

-- ---------------------------------------------------------------------
-- progreso
-- ---------------------------------------------------------------------
create policy "progreso visible" on progreso
  for select using (es_mi_cliente(cliente_id) or es_admin());

create policy "progreso escritura" on progreso
  for insert with check (es_mi_cliente(cliente_id) or es_admin());

create policy "progreso edicion" on progreso
  for update using (es_mi_cliente(cliente_id) or es_admin())
  with check (es_mi_cliente(cliente_id) or es_admin());

create policy "progreso borrado" on progreso
  for delete using (es_mi_cliente(cliente_id) or es_admin());

-- ---------------------------------------------------------------------
-- conversaciones y mensajes
-- ---------------------------------------------------------------------
create policy "conversaciones visibles" on conversaciones
  for select using (
    entrenador_id = auth.uid() or es_mi_cliente(cliente_id) or es_admin()
  );

create policy "conversaciones escritura" on conversaciones
  for insert with check (
    entrenador_id = auth.uid() or es_mi_cliente(cliente_id) or es_admin()
  );

create policy "conversaciones edicion" on conversaciones
  for update using (
    entrenador_id = auth.uid() or es_mi_cliente(cliente_id) or es_admin()
  )
  with check (
    entrenador_id = auth.uid() or es_mi_cliente(cliente_id) or es_admin()
  );

create policy "mensajes visibles" on mensajes
  for select using (participa_en_conversacion(conversacion_id) or es_admin());

create policy "mensajes escritura" on mensajes
  for insert with check (
    autor_id = auth.uid() and participa_en_conversacion(conversacion_id)
  );

create policy "mensajes edicion" on mensajes
  for update using (participa_en_conversacion(conversacion_id))
  with check (participa_en_conversacion(conversacion_id));

-- ---------------------------------------------------------------------
-- notificaciones
-- ---------------------------------------------------------------------
create policy "notificaciones propias" on notificaciones
  for select using (perfil_id = auth.uid() or es_admin());

create policy "notificaciones escritura" on notificaciones
  for insert with check (es_staff() or perfil_id = auth.uid());

create policy "notificaciones marcar leida" on notificaciones
  for update using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());

create policy "notificaciones borrado" on notificaciones
  for delete using (perfil_id = auth.uid() or es_admin());

-- ---------------------------------------------------------------------
-- planes (catálogo público)
-- ---------------------------------------------------------------------
create policy "planes activos publicos" on planes
  for select using (activo or es_admin());

create policy "admin gestiona planes" on planes
  for all using (es_admin()) with check (es_admin());

-- ---------------------------------------------------------------------
-- suscripciones y pagos
-- ---------------------------------------------------------------------
create policy "suscripciones visibles" on suscripciones
  for select using (es_mi_cliente(cliente_id) or es_admin());

create policy "suscripciones escritura" on suscripciones
  for insert with check (es_mi_cliente(cliente_id) or es_admin());

create policy "suscripciones edicion" on suscripciones
  for update using (es_mi_cliente(cliente_id) or es_admin())
  with check (es_mi_cliente(cliente_id) or es_admin());

create policy "pagos visibles" on pagos
  for select using (es_mi_cliente(cliente_id) or es_admin());

-- ---------------------------------------------------------------------
-- Realtime para el chat y las notificaciones
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table mensajes;
alter publication supabase_realtime add table notificaciones;
alter publication supabase_realtime add table conversaciones;


-- ///////////////// 0003_almacenamiento.sql /////////////////

-- =====================================================================
-- YIYO GYM — Buckets de Storage
-- Ejecutar DESPUÉS de 0002_rls.sql
-- =====================================================================

insert into storage.buckets (id, name, public)
values
  ('avatares', 'avatares', true),
  ('ejercicios', 'ejercicios', true),
  ('progreso', 'progreso', false),
  ('adjuntos', 'adjuntos', false)
on conflict (id) do nothing;

-- ---- avatares: lectura pública, cada quien sube el suyo ----
create policy "avatares lectura publica" on storage.objects
  for select using (bucket_id = 'avatares');

create policy "avatar propio subida" on storage.objects
  for insert with check (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar propio edicion" on storage.objects
  for update using (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar propio borrado" on storage.objects
  for delete using (
    bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---- ejercicios: lectura pública, solo staff sube ----
create policy "ejercicios lectura publica" on storage.objects
  for select using (bucket_id = 'ejercicios');

create policy "staff sube media de ejercicios" on storage.objects
  for insert with check (bucket_id = 'ejercicios' and es_staff());

create policy "staff edita media de ejercicios" on storage.objects
  for update using (bucket_id = 'ejercicios' and es_staff());

create policy "staff borra media de ejercicios" on storage.objects
  for delete using (bucket_id = 'ejercicios' and es_staff());

-- ---- progreso: privado. Carpeta = uuid del perfil dueño ----
create policy "fotos progreso lectura" on storage.objects
  for select using (
    bucket_id = 'progreso'
    and ((storage.foldername(name))[1] = auth.uid()::text or es_staff())
  );

create policy "fotos progreso subida" on storage.objects
  for insert with check (
    bucket_id = 'progreso'
    and ((storage.foldername(name))[1] = auth.uid()::text or es_staff())
  );

create policy "fotos progreso borrado" on storage.objects
  for delete using (
    bucket_id = 'progreso'
    and ((storage.foldername(name))[1] = auth.uid()::text or es_staff())
  );

-- ---- adjuntos de chat: privado, carpeta = uuid del autor ----
create policy "adjuntos lectura" on storage.objects
  for select using (
    bucket_id = 'adjuntos'
    and ((storage.foldername(name))[1] = auth.uid()::text or es_staff())
  );

create policy "adjuntos subida" on storage.objects
  for insert with check (
    bucket_id = 'adjuntos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "adjuntos borrado" on storage.objects
  for delete using (
    bucket_id = 'adjuntos' and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ///////////////// 0004_semillas.sql /////////////////

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


-- ///////////////// 0005_correcciones_seguridad.sql /////////////////

-- =====================================================================
-- YIYO GYM — Correcciones de seguridad y coherencia
-- Ejecutar DESPUÉS de 0004_semillas.sql
--
-- Resuelve seis problemas detectados en la auditoría:
--   1. Cualquier cuenta podía auto-asignarse el rol de administradora.
--   2. La clienta no podía activar su propia ficha al terminar la evaluación.
--   3. La clienta no podía registrar el pago inicial de su suscripción.
--   4. Cualquiera podía reescribir los mensajes de la otra persona del chat.
--   5. Una entrenadora no veía ninguna clienta ni podía agendarle sesiones.
--   6. Faltaba proteger el campo `entrenador_id` de la propia clienta.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. El rol solo lo cambia una administradora
--    RLS filtra filas, no columnas: sin esto la política «perfil propio
--    editable» permitía cambiar la columna `rol`.
-- ---------------------------------------------------------------------
create or replace function proteger_rol()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.rol is distinct from old.rol and not es_admin() then
    raise exception 'Solo una administradora puede cambiar el rol de una cuenta.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists t_proteger_rol on perfiles;
create trigger t_proteger_rol
  before update on perfiles
  for each row execute function proteger_rol();

-- ---------------------------------------------------------------------
-- 2 y 6. La clienta gestiona su ficha, pero no se cambia de entrenadora
-- ---------------------------------------------------------------------
create policy "clienta actualiza su ficha" on clientes
  for update using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());

create or replace function proteger_ficha_cliente()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Solo el staff decide quién entrena a quién.
  if not es_staff() then
    new.entrenador_id := old.entrenador_id;
    new.perfil_id := old.perfil_id;
  end if;
  return new;
end;
$$;

drop trigger if exists t_proteger_ficha_cliente on clientes;
create trigger t_proteger_ficha_cliente
  before update on clientes
  for each row execute function proteger_ficha_cliente();

-- ---------------------------------------------------------------------
-- 3. La clienta registra el pago inicial que confirma con PayPal
--    (los cobros recurrentes los inserta el webhook con la clave secreta)
-- ---------------------------------------------------------------------
create policy "pagos escritura" on pagos
  for insert with check (es_mi_cliente(cliente_id) or es_admin());

-- ---------------------------------------------------------------------
-- 4. Quien recibe un mensaje solo puede marcarlo como leído
-- ---------------------------------------------------------------------
create or replace function proteger_mensaje()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is distinct from old.autor_id then
    new.contenido := old.contenido;
    new.adjunto_url := old.adjunto_url;
    new.autor_id := old.autor_id;
    new.conversacion_id := old.conversacion_id;
    new.creado_en := old.creado_en;
  end if;
  return new;
end;
$$;

drop trigger if exists t_proteger_mensaje on mensajes;
create trigger t_proteger_mensaje
  before update on mensajes
  for each row execute function proteger_mensaje();

-- ---------------------------------------------------------------------
-- 5. Una entrenadora ve y puede tomar las clientas sin asignar
--    Antes solo veía las que ya tuvieran `entrenador_id` = ella, pero
--    nada asignaba ese campo: su CRM salía vacío y no podía agendar.
-- ---------------------------------------------------------------------
create or replace function es_mi_cliente(cliente uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from clientes c
    where c.id = cliente
      and (
        c.entrenador_id = auth.uid()
        or c.perfil_id = auth.uid()
        or (c.entrenador_id is null and es_staff())
      )
  )
$$;

drop policy if exists "clientes visibles" on clientes;
create policy "clientes visibles" on clientes
  for select using (
    perfil_id = auth.uid()
    or entrenador_id = auth.uid()
    or (entrenador_id is null and es_staff())
    or es_admin()
  );

drop policy if exists "staff edita clientes" on clientes;
create policy "staff edita clientes" on clientes
  for update using (
    entrenador_id = auth.uid()
    or (entrenador_id is null and es_staff())
    or es_admin()
  )
  with check (
    entrenador_id = auth.uid()
    or (entrenador_id is null and es_staff())
    or es_admin()
  );


-- ///////////////// 0006_notificaciones_chat.sql /////////////////

-- =====================================================================
-- YIYO GYM — Aviso de mensajes nuevos entre clienta y entrenadora
-- Ejecutar DESPUÉS de 0005_correcciones_seguridad.sql
--
-- Problema: al escribir por el chat, la clienta intentaba crear la
-- notificación para su entrenadora y la política se lo impedía, así que
-- la entrenadora nunca se enteraba del mensaje. Fallaba en silencio.
--
-- Antes esto parecía funcionar solo porque la cuenta de prueba se había
-- auto-promovido a administradora aprovechando el fallo que corrige 0005.
-- =====================================================================

-- Solo se puede notificar a alguien con quien realmente se comparte un chat.
create or replace function comparte_conversacion(otro uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from conversaciones cv
    join clientes c on c.id = cv.cliente_id
    where (c.perfil_id = auth.uid() and cv.entrenador_id = otro)
       or (cv.entrenador_id = auth.uid() and c.perfil_id = otro)
  )
$$;

drop policy if exists "notificaciones escritura" on notificaciones;
create policy "notificaciones escritura" on notificaciones
  for insert with check (
    es_staff()
    or perfil_id = auth.uid()
    or comparte_conversacion(perfil_id)
  );


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


-- ///////////////// 0017_aislamiento_entrenadoras.sql /////////////////

-- =====================================================================
-- YIYO GYM — Cada entrenadora, solo con sus clientas
-- Ejecutar DESPUÉS de 0016_precios_planes.sql
--
-- Varias políticas comprobaban únicamente `es_staff()` sin mirar de quién
-- era la clienta. Con una sola cuenta (la de Yiyo, que es admin) no se
-- notaba, pero en cuanto haya una segunda entrenadora significaba que
-- cualquiera podía ver las fotos corporales de todas las clientas del
-- sistema, leer adjuntos de chats ajenos y escribir en fichas que no son
-- suyas.
--
-- La admin conserva acceso a todo: es la dueña del negocio.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fotos de progreso y adjuntos de chat
--
-- `es_staff()` a secas dejaba leer cualquier archivo del bucket conociendo
-- la ruta. La carpeta es el uuid del perfil dueño, así que se comprueba
-- que ese perfil sea el de una clienta suya.
-- ---------------------------------------------------------------------
create or replace function es_perfil_de_mi_cliente(perfil uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from clientes c
    where c.perfil_id = perfil and c.entrenador_id = auth.uid()
  )
$$;

drop policy if exists "fotos progreso lectura" on storage.objects;
create policy "fotos progreso lectura" on storage.objects
  for select using (
    bucket_id = 'progreso'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or es_admin()
      or es_perfil_de_mi_cliente(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "fotos progreso subida" on storage.objects;
create policy "fotos progreso subida" on storage.objects
  for insert with check (
    bucket_id = 'progreso'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or es_admin()
      or es_perfil_de_mi_cliente(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "fotos progreso borrado" on storage.objects;
create policy "fotos progreso borrado" on storage.objects
  for delete using (
    bucket_id = 'progreso'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or es_admin()
      or es_perfil_de_mi_cliente(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "adjuntos lectura" on storage.objects;
create policy "adjuntos lectura" on storage.objects
  for select using (
    bucket_id = 'adjuntos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or es_admin()
      or es_perfil_de_mi_cliente(((storage.foldername(name))[1])::uuid)
    )
  );

-- ---------------------------------------------------------------------
-- 2. Rutinas: no asignar a clientas ajenas
--
-- `staff crea rutinas` solo exigía `es_staff()`, así que se podía insertar
-- una rutina con el `cliente_id` de la clienta de otra entrenadora y esa
-- clienta la veía aparecer en su panel. Las plantillas sin clienta siguen
-- permitidas para cualquier staff.
-- ---------------------------------------------------------------------
drop policy if exists "staff crea rutinas" on rutinas;
create policy "staff crea rutinas" on rutinas
  for insert with check (
    es_staff() and (cliente_id is null or es_mi_cliente(cliente_id) or es_admin())
  );

-- ---------------------------------------------------------------------
-- 3. Notas: no escribir en fichas ajenas
--
-- Ya se filtraba por `autor_id`, pero no por de quién era la ficha.
-- ---------------------------------------------------------------------
drop policy if exists "staff escribe notas" on notas_cliente;
create policy "staff escribe notas" on notas_cliente
  for insert with check (
    autor_id = auth.uid()
    and es_staff()
    and (es_mi_cliente(cliente_id) or es_admin())
  );

-- ---------------------------------------------------------------------
-- 4. Alimentos del catálogo: que se puedan editar y borrar
--
-- Las políticas exigían `creado_por = auth.uid()`, pero los alimentos
-- sembrados tienen `creado_por` nulo: nadie podía tocarlos y `borrarAlimento`
-- fallaba en silencio sobre todo el catálogo inicial.
-- ---------------------------------------------------------------------
drop policy if exists "staff edita alimentos" on alimentos;
create policy "staff edita alimentos" on alimentos
  for update using (creado_por = auth.uid() or creado_por is null or es_admin())
  with check (creado_por = auth.uid() or creado_por is null or es_admin());

drop policy if exists "staff borra alimentos" on alimentos;
create policy "staff borra alimentos" on alimentos
  for delete using (creado_por = auth.uid() or creado_por is null or es_admin());

-- Mismo problema en la biblioteca de ejercicios sembrada.
drop policy if exists "staff edita ejercicios" on ejercicios;
create policy "staff edita ejercicios" on ejercicios
  for update using (creado_por = auth.uid() or creado_por is null or es_admin())
  with check (creado_por = auth.uid() or creado_por is null or es_admin());

drop policy if exists "staff borra ejercicios" on ejercicios;
create policy "staff borra ejercicios" on ejercicios
  for delete using (creado_por = auth.uid() or creado_por is null or es_admin());


-- ///////////////// 0018_tienda.sql /////////////////

-- =====================================================================
-- YIYO GYM — Tienda online
-- Ejecutar DESPUÉS de 0017_aislamiento_entrenadoras.sql
--
-- Catálogo de productos de la marca, carrito (que vive en el navegador de
-- cada persona) y pedidos. El pedido se guarda aquí SIEMPRE, aunque el
-- aviso por WhatsApp no llegue a enviarse: la plataforma es la fuente de
-- verdad, el WhatsApp solo es el aviso.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Productos
-- ---------------------------------------------------------------------
create table productos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  categoria text not null,
  -- Lo que lee la clienta en la tienda.
  descripcion text not null,
  -- Ficha técnica: cada línea es una característica ya confirmada.
  especificaciones text[] not null default '{}',
  cuidado text,
  -- Tallas disponibles. Vacío = producto de talla única.
  tallas text[] not null default '{}',
  precio numeric(10, 2) not null check (precio >= 0),
  imagen_url text not null,
  -- Lo que falta validar antes de prometerlo en la ficha. NO se muestra a
  -- las clientas: es el recordatorio de Yiyo de qué no puede anunciar
  -- todavía (soporte del sujetador, opacidad de los leggings, horas de
  -- frío de la botella…).
  notas_internas text,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create index on productos (activo, orden);

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create type estado_pedido as enum (
  'nuevo',
  'confirmado',
  'enviado',
  'entregado',
  'cancelado'
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  -- Número corto y legible para hablar con la clienta por WhatsApp: el
  -- uuid no se puede dictar por teléfono.
  numero serial not null unique,
  -- Si quien compra tiene cuenta se guarda; si no, el pedido igual entra.
  cliente_id uuid references clientes(id) on delete set null,
  nombre text not null,
  telefono text not null,
  correo text,
  -- Dirección y referencias para la entrega, tal como las escribe ella.
  entrega text,
  notas text,
  total numeric(10, 2) not null check (total >= 0),
  estado estado_pedido not null default 'nuevo',
  -- Queda constancia de si el aviso por WhatsApp llegó a abrirse.
  avisado_whatsapp boolean not null default false,
  creado_en timestamptz not null default now()
);

create index on pedidos (estado, creado_en desc);
create index on pedidos (cliente_id);

create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  -- El nombre, la talla y el precio se copian al pedido. Si mañana sube el
  -- precio o se retira el producto, el pedido sigue diciendo lo que se
  -- compró y por cuánto.
  nombre text not null,
  talla text,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0)
);

create index on pedido_items (pedido_id);

-- ---------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------
alter table productos enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;

-- El catálogo es público: la tienda se ve sin cuenta.
create policy "catalogo publico" on productos
  for select using (activo or es_staff());

create policy "staff gestiona productos" on productos
  for all using (es_staff()) with check (es_staff());

-- Cualquiera puede hacer un pedido, tenga cuenta o no.
create policy "cualquiera pide" on pedidos
  for insert with check (true);

create policy "cada quien ve su pedido" on pedidos
  for select using (
    es_staff()
    or (cliente_id is not null and es_mi_cliente(cliente_id))
  );

create policy "staff gestiona pedidos" on pedidos
  for update using (es_staff()) with check (es_staff());

create policy "staff borra pedidos" on pedidos
  for delete using (es_admin());

create policy "cualquiera anade lineas" on pedido_items
  for insert with check (true);

create policy "lineas del pedido visible" on pedido_items
  for select using (
    exists (
      select 1 from pedidos p
      where p.id = pedido_id
        and (
          es_staff()
          or (p.cliente_id is not null and es_mi_cliente(p.cliente_id))
        )
    )
  );

-- ---------------------------------------------------------------------
-- Catálogo inicial
--
-- Precios y fichas tal como los entregó Yiyo. En `especificaciones` va
-- solo lo confirmado; lo que está pendiente de validar vive en
-- `notas_internas` y no se muestra en la tienda.
-- ---------------------------------------------------------------------
insert into productos
  (slug, nombre, categoria, precio, imagen_url, orden, tallas, descripcion, especificaciones, cuidado, notas_internas)
values
(
  'motion-bra', 'YIYO Motion Bra', 'Ropa deportiva', 28.00,
  '/tienda/motion-bra.webp', 1,
  array['XS','S','M','L','XL'],
  'Un top deportivo de líneas limpias y espalda deportiva para acompañar tu rutina con el estilo de YIYO.',
  array[
    'Tejido exterior: 78% nailon y 22% elastano, 220–250 g/m²',
    'Doble capa frontal, banda inferior ancha y costuras planas',
    'Ajuste ceñido',
    'Morado YIYO con símbolo blanco centrado',
    'Personalización por transferencia elástica'
  ],
  'Lavado suave en frío y secado al aire.',
  'Por confirmar: medidas por talla, forro, copas y nivel de soporte. NO anunciar soporte alto sin probarlo.'
),
(
  'sculpt-leggings', 'YIYO Sculpt Leggings', 'Ropa deportiva', 38.00,
  '/tienda/sculpt-leggings.webp', 2,
  array['XS','S','M','L','XL'],
  'Leggings de cintura alta y diseño depurado que combinan con tu Motion Bra.',
  array[
    'Tejido: 78% nailon y 22% elastano, 240–270 g/m²',
    'Cintura doble de aproximadamente 10 cm y costuras planas',
    'Corte ajustado, largo al tobillo, sin bolsillos',
    'Morado YIYO con símbolo blanco en la cadera',
    'Personalización por transferencia elástica'
  ],
  'Lavado en frío. Sin suavizante ni secadora.',
  'Por confirmar: entrepierna, tabla de tallas, opacidad al estirar y recuperación del tejido. NO publicar «no transparenta» sin validar una muestra.'
),
(
  'essential-tee', 'YIYO Essential Tee', 'Ropa', 22.00,
  '/tienda/essential-tee.webp', 3,
  array['XS','S','M','L','XL'],
  'Una camiseta blanca de corte amplio con el detalle justo de YIYO para completar tu look diario.',
  array[
    'Algodón peinado 100%, 190–210 g/m²',
    'Corte amplio, hombro caído y manga corta',
    'Cuello redondo con acabado acanalado',
    'Blanco con logo morado en el pecho izquierdo',
    'Serigrafía a un color'
  ],
  'Lavar del revés en frío. No planchar el estampado.',
  'Por confirmar: encogimiento, medidas y resistencia del estampado al lavado.'
),
(
  'studio-sweatshirt', 'YIYO Studio Sweatshirt', 'Ropa', 36.00,
  '/tienda/studio-sweatshirt.webp', 4,
  array['XS','S','M','L','XL'],
  'Sudadera corta y relajada para combinar con tus leggings dentro y fuera del gimnasio.',
  array[
    '80% algodón y 20% poliéster, 280–300 g/m²',
    'Interior de rizo tipo French terry',
    'Corte corto y holgado, manga larga y hombro caído',
    'Cuello redondo, puños y bajo acanalados',
    'Morado con símbolo blanco bordado en el pecho izquierdo'
  ],
  'Lavado suave en frío y secado al aire.',
  'Por confirmar: largo por talla, encogimiento y acabado interior.'
),
(
  'signature-cap', 'YIYO Signature Cap', 'Accesorios', 18.00,
  '/tienda/signature-cap.webp', 5,
  array[]::text[],
  'Una gorra blanca de diseño limpio con el símbolo YIYO bordado al frente.',
  array[
    'Sarga de algodón 100%',
    'Seis paneles, visera curva y ojales de ventilación',
    'Cierre posterior regulable',
    'Contorno 54–60 cm',
    'Blanca con bordado morado'
  ],
  'Limpiar a mano y secar conservando su forma.',
  'Por confirmar: rango real de ajuste y material del cierre.'
),
(
  'crew-socks', 'YIYO Crew Socks', 'Accesorios', 9.00,
  '/tienda/crew-socks.webp', 6,
  array['EU 35–38','EU 39–42'],
  'Calcetines de media caña con textura acanalada y un discreto símbolo morado.',
  array[
    '75% algodón, 22% poliamida y 3% elastano',
    'Caña acanalada con refuerzo en talón y puntera',
    'Altura de caña 16–18 cm',
    'Blancos con símbolo morado tejido',
    'Se venden por par'
  ],
  'Lavado a 30 °C. Evitar blanqueador.',
  'Por confirmar: equivalencias de talla, elasticidad y encogimiento.'
),
(
  'daily-bottle', 'YIYO Daily Bottle', 'Accesorios', 22.00,
  '/tienda/daily-bottle.webp', 7,
  array[]::text[],
  'Una botella blanca de acabado mate que lleva la identidad YIYO a tu rutina diaria.',
  array[
    'Capacidad 500 ml',
    'Interior de acero inoxidable 304',
    'Doble pared con aislamiento al vacío',
    'Tapa roscada con junta de silicona',
    'Aproximadamente 26 × 7 cm',
    'Blanco mate con logo morado vertical'
  ],
  'Lavado manual. No usar en microondas.',
  'Por confirmar: capacidad útil, aptitud para contacto alimentario, estanqueidad y rendimiento térmico. NO prometer horas de conservación sin ensayos.'
),
(
  'flow-mat', 'YIYO Flow Mat', 'Equipamiento', 29.00,
  '/tienda/flow-mat.webp', 8,
  array[]::text[],
  'Una esterilla morada para crear tu espacio de movimiento en casa o en el estudio.',
  array[
    'TPE con superficie texturizada',
    'Medidas 183 × 61 cm',
    'Grosor 6 mm',
    'Enrollable, incluye cinta de transporte',
    'Morada con logo blanco en un extremo',
    'Para yoga, movilidad y ejercicios de suelo'
  ],
  'Paño húmedo y jabón suave. Secar antes de enrollar.',
  'Por confirmar: agarre en seco y húmedo, peso, durabilidad y adherencia del logo. NO anunciar certificaciones ambientales sin documentación.'
),
(
  'everyday-tote', 'YIYO Everyday Tote', 'Bolsos', 18.00,
  '/tienda/everyday-tote.webp', 9,
  array[]::text[],
  'Un bolso de tela amplio y sencillo para llevar tus esenciales con el sello YIYO.',
  array[
    'Lona de algodón 100%, 280–320 g/m²',
    'Medidas 38 × 40 × 10 cm',
    'Asas de aproximadamente 60 cm',
    'Compartimento abierto con asas reforzadas',
    'Blanco natural con logo morado frontal'
  ],
  'Limpieza localizada para conservar su forma.',
  'Por confirmar: carga admisible, tono final del tejido y encogimiento.'
),
(
  'training-duffel', 'YIYO Training Duffel', 'Bolsos', 42.00,
  '/tienda/training-duffel.webp', 10,
  array[]::text[],
  'Un bolso deportivo de líneas suaves para organizar lo que necesitas en cada entrenamiento.',
  array[
    'Exterior de poliéster 600D con forro de poliéster',
    'Medidas 45 × 25 × 25 cm',
    'Cierre superior, dos asas y correa de hombro regulable',
    'Bolsillo interior para objetos personales',
    'Morado con logo blanco frontal'
  ],
  'Limpiar con paño húmedo. No lavar a máquina.',
  'Por confirmar: capacidad, carga máxima, resistencia de cierres y anclajes. NO anunciar impermeabilidad sin validación.'
),
(
  'gift-packaging', 'YIYO Gift Packaging', 'Complementos', 6.00,
  '/tienda/gift-packaging.webp', 11,
  array[]::text[],
  'Completa tu regalo con una caja YIYO, papel morado y una etiqueta a juego.',
  array[
    'Cartón rígido de 1,5–2 mm',
    'Medidas interiores 35 × 28 × 10 cm',
    'Acabado blanco mate con logo morado',
    'Incluye caja, dos hojas de papel de seda y etiqueta colgante',
    'Para prendas dobladas y accesorios pequeños'
  ],
  'Mantener en un lugar seco.',
  null
);


-- ///////////////// 0019_ejercicio_destacado.sql /////////////////

-- =====================================================================
-- YIYO GYM — Ejercicios destacados
-- Ejecutar DESPUÉS de 0018_tienda.sql
--
-- La biblioteca ordena por «tiene video» y luego alfabéticamente. Eso no
-- deja poner un ejercicio concreto al principio, que es justo lo que hace
-- falta cuando Yiyo graba uno nuevo y quiere que sea lo primero que vean.
-- =====================================================================

alter table ejercicios
  add column if not exists destacado boolean not null default false;

-- Los destacados encabezan la lista; el resto sigue como estaba.
create index if not exists ejercicios_destacado_idx
  on ejercicios (destacado desc, nombre);

-- ---------------------------------------------------------------------
-- Push up
--
-- Ejercicio nuevo con el video que grabó Yiyo. Se añade como pieza propia
-- y no se toca «Flexiones», que ya existe con su propio video y está
-- programado en dos rutinas: retirarlo dejaría esas rutinas cojas.
-- Las instrucciones quedan vacías a propósito: las escribe ella, no se
-- inventan.
-- ---------------------------------------------------------------------
insert into ejercicios (nombre, grupo, equipo, nivel, video_url, publico, destacado)
values (
  'Push up',
  'pecho',
  'Peso corporal',
  'principiante',
  'https://qdzffyldkofxgrhukumo.supabase.co/storage/v1/object/public/ejercicios/biblioteca/push-up.mp4',
  true,
  true
)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Push up en los días de pecho del catálogo
--
-- Se añade al final del trabajo de pecho de cada día, justo antes de que
-- la sesión pase a otro grupo. Series y descanso siguen la pauta que la
-- propia Yiyo usó para «Flexiones» (3×12) y la del resto del día.
--
-- Solo se tocan las PLANTILLAS del catálogo (rutinas sin clienta). Las
-- rutinas ya asignadas son el programa que alguien está siguiendo ahora
-- mismo: cambiarlo a mitad de camino es decisión de la entrenadora, no
-- de una migración.
-- ---------------------------------------------------------------------
do $$
declare
  ej_push uuid;
  d record;
  pos int;
begin
  select id into ej_push from ejercicios where nombre = 'Push up' limit 1;
  if ej_push is null then
    raise notice 'No existe el ejercicio «Push up»: no se toca ninguna rutina.';
    return;
  end if;

  for d in
    select rd.id
    from rutina_dias rd
    join rutinas r on r.id = rd.rutina_id
    where r.cliente_id is null          -- solo plantillas del catálogo
      and rd.nombre ilike '%Pecho%'
  loop
    -- Si ya lo tiene, no se duplica: la migración se puede repetir.
    if exists (
      select 1 from rutina_ejercicios
      where dia_id = d.id and ejercicio_id = ej_push
    ) then
      continue;
    end if;

    -- Justo después del último ejercicio de pecho del día.
    select max(re.orden) + 1 into pos
    from rutina_ejercicios re
    join ejercicios e on e.id = re.ejercicio_id
    where re.dia_id = d.id and e.grupo = 'pecho';

    if pos is null then
      continue;
    end if;

    -- Se abre hueco corriendo todo lo que venga después.
    update rutina_ejercicios
      set orden = orden + 1
      where dia_id = d.id and orden >= pos;

    insert into rutina_ejercicios
      (dia_id, ejercicio_id, orden, tipo, series, repeticiones, descanso_seg)
    values
      (d.id, ej_push, pos, 'ejercicio', 3, '12', 60);
  end loop;
end $$;


-- ///////////////// 0020_ejercicios_gif.sql /////////////////

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
