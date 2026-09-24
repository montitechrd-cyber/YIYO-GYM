import { exigirPerfil, idUsuarioActual } from "@/lib/autenticacion";
import { notificacionesDe } from "@/lib/notificaciones";
import { EstructuraPanel, type EnlacePanel } from "@/components/panel/estructura";

const enlaces: EnlacePanel[] = [
  { href: "/panel", texto: "Resumen", icono: "resumen" },
  { href: "/panel/entrenamientos", texto: "Mis entrenamientos", icono: "ejercicios" },
  { href: "/panel/alimentacion", texto: "Mi alimentación", icono: "dietas" },
  { href: "/panel/calendario", texto: "Calendario", icono: "calendario" },
  { href: "/panel/progreso", texto: "Mi progreso", icono: "progreso" },
  { href: "/panel/chat", texto: "Chat con Yiyo", icono: "chat" },
  { href: "/panel/suscripcion", texto: "Mi suscripción", icono: "pagos" },
  { href: "/panel/perfil", texto: "Mi perfil", icono: "perfil" },
];

export default async function LayoutCliente({
  children,
}: {
  children: React.ReactNode;
}) {
  // Perfil y notificaciones en paralelo: el id sale del token, sin ir a la base.
  const id = await idUsuarioActual();
  const [perfil, notificaciones] = await Promise.all([
    exigirPerfil(),
    id ? notificacionesDe(id) : Promise.resolve([]),
  ]);
  return (
    <EstructuraPanel
      perfil={perfil}
      enlaces={enlaces}
      notificaciones={notificaciones}
    >
      {children}
    </EstructuraPanel>
  );
}
