// Pruebas de los recorridos de autenticación, sin enviar correos ni tocar cuentas.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

process.env.NEXT_PUBLIC_SITE_URL = 'https://yiyo.example';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test';

function cargar(archivo, dependencias = {}) {
  const codigo = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const modulo = { exports: {} };
  const importar = (nombre) => {
    if (nombre in dependencias) return dependencias[nombre];
    throw new Error(`Dependencia de prueba no declarada: ${nombre}`);
  };
  new Function('require', 'module', 'exports', codigo)(importar, modulo, modulo.exports);
  return modulo.exports;
}

const correos = cargar('src/lib/correos-auth.ts');
function acciones(auth) {
  return cargar('src/app/(auth)/acciones.ts', {
    'next/cache': { revalidatePath() {} },
    'next/navigation': { redirect(url) { throw new Error(`redirect:${url}`); } },
    '@/lib/supabase/servidor': { crearClienteServidor: async () => ({ auth }) },
    '@/lib/autenticacion': { rutaInicio: () => '/panel' },
    '@/lib/correos-auth': correos,
  });
}
function formulario(datos) {
  const resultado = new FormData();
  for (const [clave, valor] of Object.entries(datos)) resultado.set(clave, valor);
  return resultado;
}
function ruta(archivo, auth) {
  return cargar(`src/app/auth/${archivo}/route.ts`, {
    'next/server': { NextResponse: { redirect: (url) => new URL(url) } },
    '@/lib/supabase/servidor': { crearClienteServidor: async () => ({ auth }) },
    '@/lib/primer-acceso': { destinoPedido: (url) => url?.startsWith('/') && !url.startsWith('//') ? url : null, destinoTrasActivar: async () => '/panel/bienvenida' },
    '@/lib/url-publica': { origenPublico: () => process.env.NEXT_PUBLIC_SITE_URL },
  });
}

test('recuperación solicita un enlace al callback con destino a nueva contraseña', async () => {
  let parametros;
  const api = acciones({ resetPasswordForEmail: async (...args) => { parametros = args; return {}; } });
  const estado = await api.recuperar({}, formulario({ correo: ' clienta@example.com ' }));
  assert.ok(estado.exito);
  assert.equal(parametros[0], 'clienta@example.com');
  const url = new URL(parametros[1].redirectTo);
  assert.equal(url.pathname, '/auth/callback');
  assert.equal(url.searchParams.get('siguiente'), '/nueva-contrasena');
});

test('registro pendiente configura callback sin crear ficha antes de confirmar', async () => {
  let parametros;
  const api = acciones({ signUp: async (args) => { parametros = args; return { data: { session: null } }; } });
  const estado = await api.registrar({}, formulario({ nombre: 'Prueba', correo: 'clienta@example.com', contrasena: 'Test-clave-123', repetir: 'Test-clave-123' }));
  assert.ok(estado.exito);
  assert.equal(parametros.options.emailRedirectTo, 'https://yiyo.example/auth/callback');
});

test('reenviar confirmación usa signup y rechaza correo vacío', async () => {
  let parametros;
  const api = acciones({ resend: async (args) => { parametros = args; return {}; } });
  assert.ok((await api.reenviarConfirmacion({}, formulario({ correo: '' }))).error);
  assert.equal(parametros, undefined);
  assert.ok((await api.reenviarConfirmacion({}, formulario({ correo: 'clienta@example.com' }))).exito);
  assert.equal(parametros.type, 'signup');
});

test('error de envío no muestra éxito ni detalles internos', async () => {
  const api = acciones({ resetPasswordForEmail: async () => ({ error: { code: 'unexpected_failure', message: 'SMTP secret' } }) });
  const estado = await api.recuperar({}, formulario({ correo: 'clienta@example.com' }));
  assert.ok(estado.error);
  assert.equal(estado.exito, undefined);
  assert.ok(!estado.error.includes('SMTP secret'));
});

test('cuenta sin confirmar recibe instrucciones de reenvío', async () => {
  const api = acciones({ signInWithPassword: async () => ({ error: { code: 'email_not_confirmed' } }) });
  assert.match((await api.entrar({}, formulario({ correo: 'clienta@example.com', contrasena: 'clave' }))).error, /Reenviar confirmación/);
});

for (const tipo of ['signup', 'recovery']) {
  test(`token ${tipo} válido llega a su pantalla`, async () => {
    const handler = ruta('confirm', { verifyOtp: async (args) => { assert.equal(args.type, tipo); return { data: { user: { id: 'test' } } }; } });
    const destino = await handler.GET({ url: `https://interno/auth/confirm?token_hash=prueba&type=${tipo}` });
    assert.equal(destino.pathname, tipo === 'recovery' ? '/nueva-contrasena' : '/panel/bienvenida');
    assert.equal(destino.origin, 'https://yiyo.example');
  });
  test(`token ${tipo} vencido permite pedir el correo correcto`, async () => {
    const handler = ruta('confirm', { verifyOtp: async () => ({ data: {}, error: { code: 'otp_expired' } }) });
    const destino = await handler.GET({ url: `https://interno/auth/confirm?token_hash=prueba&type=${tipo}` });
    assert.equal(destino.pathname, tipo === 'recovery' ? '/recuperar' : '/confirmar-correo');
  });
}

test('callback canjea código PKCE y conserva destino de recuperación', async () => {
  const handler = ruta('callback', { exchangeCodeForSession: async (code) => { assert.equal(code, 'prueba'); return { data: { user: { id: 'test' } } }; } });
  const destino = await handler.GET({ url: 'https://interno/auth/callback?code=prueba&siguiente=%2Fnueva-contrasena' });
  assert.equal(destino.pathname, '/nueva-contrasena');
});

test('callback con código vencido vuelve a recuperar con aviso', async () => {
  const handler = ruta('callback', { exchangeCodeForSession: async () => ({ data: {}, error: { code: 'bad_code' } }) });
  const destino = await handler.GET({ url: 'https://interno/auth/callback?code=prueba&siguiente=%2Fnueva-contrasena' });
  assert.equal(destino.pathname, '/recuperar');
  assert.ok(destino.searchParams.get('error'));
});
