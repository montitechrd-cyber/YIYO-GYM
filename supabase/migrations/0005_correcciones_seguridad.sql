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
