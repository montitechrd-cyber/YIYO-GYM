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
