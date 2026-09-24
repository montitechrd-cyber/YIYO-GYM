import { exigirRol, idUsuarioActual } from "@/lib/autenticacion";
import { notificacionesDe } from "@/lib/notificaciones";
import { EstructuraPanel } from "@/components/panel/estructura";
import { enlacesDePanel } from "@/lib/navegacion";

export default async function LayoutEntrenador({
  children,
}: {
  children: React.ReactNode;
}) {
  // Perfil y notificaciones en paralelo: el id sale del token, sin ir a la base.
  const id = await idUsuarioActual();
  const [perfil, notificaciones] = await Promise.all([
    exigirRol("entrenador", "admin"),
    id ? notificacionesDe(id) : Promise.resolve([]),
  ]);
  return (
    <EstructuraPanel
      perfil={perfil}
      enlaces={enlacesDePanel(perfil.rol)}
      notificaciones={notificaciones}
    >
      {children}
    </EstructuraPanel>
  );
}
