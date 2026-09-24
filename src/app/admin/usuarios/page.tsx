import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { iniciales } from "@/lib/datos";
import { FECHA_LARGA } from "@/lib/etiquetas";
import { Encabezado, Tarjeta } from "@/components/panel/piezas";
import { SelectorRol } from "./selector-rol";

export default async function Usuarios() {
  const admin = await exigirRol("admin");
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("perfiles")
    .select("*")
    .order("creado_en", { ascending: false });

  const usuarios = data ?? [];

  return (
    <div>
      <Encabezado
        titulo="Usuarios"
        descripcion={`${usuarios.length} cuenta${usuarios.length === 1 ? "" : "s"} registradas. Cambia el rol para dar acceso de entrenadora o administración.`}
      />

      <Tarjeta>
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-150 text-sm">
            <thead>
              <tr className="border-b border-lila-200 text-left text-[10px] tracking-[0.16em] text-violeta-500 uppercase">
                <th className="px-2 py-3 font-normal">Usuaria</th>
                <th className="px-2 py-3 font-normal">Registro</th>
                <th className="px-2 py-3 font-normal">Teléfono</th>
                <th className="px-2 py-3 font-normal">Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-lila-100 last:border-0">
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full fondo-degradado text-[11px] font-medium text-white">
                        {iniciales(u.nombre_completo, u.correo)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-violeta-800">
                          {u.nombre_completo || "Sin nombre"}
                        </span>
                        <span className="block truncate text-xs font-light text-violeta-900/50">
                          {u.correo}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-4 font-light whitespace-nowrap text-violeta-900/60">
                    {FECHA_LARGA.format(new Date(u.creado_en))}
                  </td>
                  <td className="px-2 py-4 font-light text-violeta-900/60">
                    {u.telefono || "—"}
                  </td>
                  <td className="px-2 py-4">
                    <SelectorRol
                      perfilId={u.id}
                      rol={u.rol}
                      esYo={u.id === admin.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </div>
  );
}
