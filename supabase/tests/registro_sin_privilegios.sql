-- Ejecutar después de 0023. Prueba el trigger real y RLS dentro de una
-- transacción revertida: no envía correos ni conserva cuentas de prueba.
begin;

do $test$
declare
  solicitado text;
  usuario uuid;
  perfil public.perfiles%rowtype;
begin
  foreach solicitado in array array['admin', 'entrenador', 'cliente', 'rol_invalido', null] loop
    usuario := gen_random_uuid();
    insert into auth.users (id, email, raw_user_meta_data)
    values (
      usuario,
      'auditoria-' || usuario::text || '@example.invalid',
      jsonb_strip_nulls(jsonb_build_object(
        'rol', solicitado,
        'full_name', 'Prueba Google',
        'picture', 'https://example.invalid/avatar.png'
      ))
    );
    select * into strict perfil from public.perfiles where id = usuario;
    if perfil.rol <> 'cliente' then
      raise exception 'Registro inseguro: rol solicitado %, obtenido %', solicitado, perfil.rol;
    end if;
    if perfil.nombre_completo <> 'Prueba Google'
      or perfil.avatar_url <> 'https://example.invalid/avatar.png' then
      raise exception 'Se perdió el nombre o avatar del proveedor';
    end if;
    perform set_config('request.jwt.claim.sub', usuario::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', usuario, 'role', 'authenticated')::text, true);
  end loop;
end;
$test$;

set local role authenticated;
do $test$
begin
  begin
    update public.perfiles set rol = 'admin' where id = auth.uid();
    raise exception 'La clienta pudo promocionarse a administradora';
  exception when insufficient_privilege then
    null; -- Resultado esperado: proteger_rol bloquea la promoción.
  end;
  if not exists (select 1 from public.perfiles where id = auth.uid() and rol = 'cliente') then
    raise exception 'No se conserva el rol cliente';
  end if;
end;
$test$;
reset role;

rollback;
select 'OK: cinco altas siempre cliente, nombre/avatar preservados y autopromoción bloqueada; pruebas revertidas' as resultado;
