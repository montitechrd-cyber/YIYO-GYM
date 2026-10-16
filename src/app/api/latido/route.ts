import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Sin caché: una respuesta guardada no tocaría la base, que es justo lo
// único que esta ruta existe para hacer.
export const dynamic = "force-dynamic";

/**
 * Señal de vida para que Supabase no duerma el proyecto.
 *
 * El plan gratuito pausa un proyecto tras una semana sin actividad y, al
 * pausarlo, retira su dominio: la plataforma siguió cargando pero sin poder
 * leer nada, y así estuvo más de dos semanas sin que nadie se enterara.
 *
 * Hace una consulta de verdad —no un `select 1`— porque lo que cuenta como
 * actividad es una petición real a la base. Lee productos porque es una
 * tabla pública: no hace falta sesión ni clave de servicio.
 *
 * La llama un cron de GitHub Actions. Ver `.github/workflows/mantener-despierta.yml`.
 */
export async function GET() {
  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true });

  if (error) {
    // 503 y no 200: el cron tiene que poder fallar y avisar. Un latido que
    // siempre responde «bien» no sirve de nada.
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, productos: count ?? 0 });
}
