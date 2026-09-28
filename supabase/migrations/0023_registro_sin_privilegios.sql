-- El registro público nunca decide permisos mediante user_metadata.
-- Conserva nombre/avatar de los proveedores y los roles de cuentas existentes.
begin;

create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, correo, nombre_completo, avatar_url, rol)
  values (
    new.id,
    coalesce(new.email, ''),
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
    'cliente'::public.rol_usuario
  );
  return new;
end;
$$;

commit;
