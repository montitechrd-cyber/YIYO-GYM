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
