import { Check, MessageCircle } from "lucide-react";
import { Tarjeta, TituloTarjeta } from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { MONEDA } from "@/lib/etiquetas";
import type { Plan } from "@/lib/supabase/tipos";

/** Catálogo informativo mientras los pagos online están deshabilitados. */
export function SelectorPlanes({ planes }: { planes: Plan[] }) {
  return (
    <Tarjeta>
      <TituloTarjeta>Conoce nuestros planes</TituloTarjeta>
      <div className="grid gap-4 lg:grid-cols-3">
        {planes.map((p) => (
          <article key={p.id} className="rounded-4xl border border-lila-200 bg-white p-7">
            <h3 className="text-sm font-medium text-violeta-800">{p.nombre}</h3>
            {p.descripcion && (
              <p className="mt-3 text-sm font-light text-violeta-900/60">{p.descripcion}</p>
            )}
            <p className="mt-4 text-2xl font-light text-violeta-800">
              {MONEDA.format(Number(p.precio_mensual))}
              <span className="ml-1 text-sm">/mes</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {p.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex items-start gap-2.5 text-xs font-light text-violeta-900/70">
                  <Check size={13} className="mt-0.5 shrink-0 text-violeta-500" />
                  {beneficio}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {planes.length === 0 && (
        <p className="text-sm text-violeta-900/70">Consulta con Yiyo las opciones disponibles para ti.</p>
      )}
      <div className="mt-7">
        <BotonEnlace href="/panel/chat">
          <MessageCircle size={16} /> Consultar mi plan con Yiyo
        </BotonEnlace>
      </div>
    </Tarjeta>
  );
}
