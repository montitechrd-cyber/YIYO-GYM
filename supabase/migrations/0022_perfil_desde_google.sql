-- =====================================================================
-- YIYO GYM — El perfil recoge lo que manda Google
-- Ejecutar DESPUÉS de 0021_plan_semanas.sql
--
-- El disparador que crea el perfil solo miraba `nombre_completo`, que es el
-- campo que rellena nuestro formulario de registro. Google no manda ese
-- nombre: manda `full_name` y `name`. Resultado: quien entraba con «Continuar
-- con Google» se quedaba sin nombre, y en el CRM aparecía como su dirección
-- de correo.
--
-- Lo mismo con la foto: Google manda `avatar_url` (y `picture`), y se estaba
-- tirando a la basura pudiendo enseñarla en el panel.
-- =====================================================================

create or replace function manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into perfiles (id, correo, nombre_completo, avatar_url, rol)
  values (
    new.id,
    coalesce(new.email, ''),
    -- `nullif` porque el campo puede venir presente pero vacío, y entonces
    -- `coalesce` lo daría por bueno y no seguiría mirando.
    coalesce(
      nullif(new.raw_user_meta_data->>'nombre_completo', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      ''
    ),
    coalesce(
      nullif(new.raw_user_meta_data->>'avatar_url', ''),
      nullif(new.raw_user_meta_data->>'picture', '')
    ),
    coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'cliente')
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Los que ya entraron por Google y se quedaron sin nombre
--
-- Solo se tocan los perfiles vacíos: si alguien escribió su nombre en el
-- panel, manda el suyo y no el de Google.
-- ---------------------------------------------------------------------
update perfiles p
set
  nombre_completo = coalesce(
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(u.raw_user_meta_data->>'name', ''),
    p.nombre_completo
  ),
  avatar_url = coalesce(
    p.avatar_url,
    nullif(u.raw_user_meta_data->>'avatar_url', ''),
    nullif(u.raw_user_meta_data->>'picture', '')
  )
from auth.users u
where u.id = p.id
  and trim(p.nombre_completo) = '';
