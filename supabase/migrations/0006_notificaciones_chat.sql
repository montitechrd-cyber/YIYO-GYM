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
