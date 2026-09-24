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
