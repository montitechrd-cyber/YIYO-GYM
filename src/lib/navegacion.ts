import type { EnlacePanel } from "@/components/panel/estructura";
import type { RolUsuario } from "./supabase/tipos";

/**
 * El mismo menú de trabajo para quien entrena y para quien administra.
 *
 * Antes eran dos listas separadas: la de administradora no tenía enlaces a
 * Rutinas, Calendario, Alimentos ni Chat, aunque esas pantallas ya funcionan
 * para su rol —el middleware siempre lo permitió— simplemente nadie se lo
 * mostraba en su propio menú. Ahora hay una sola lista base y la
 * administradora ve, además, lo que le corresponde solo a ella.
 */
export function enlacesDePanel(rol: RolUsuario): EnlacePanel[] {
  const trabajo: EnlacePanel[] = [
    { href: "/entrenador/clientes", texto: "Clientes", icono: "clientes" },
    { href: "/entrenador/calendario", texto: "Sesiones", icono: "calendario" },
    { href: "/entrenador/rutinas", texto: "Rutinas", icono: "rutinas" },
    { href: "/entrenador/ejercicios", texto: "Ejercicios", icono: "ejercicios" },
    { href: "/entrenador/dietas", texto: "Nutrición", icono: "dietas" },
    { href: "/entrenador/alimentos", texto: "Alimentos", icono: "alimentos" },
    { href: "/entrenador/chat", texto: "Mensajes", icono: "chat" },
  ];

  if (rol === "admin") {
    return [
      { href: "/admin", texto: "Resumen", icono: "resumen" },
      ...trabajo,
      { href: "/admin/usuarios", texto: "Usuarios", icono: "usuarios" },
      { href: "/admin/configuracion", texto: "Configuración", icono: "configuracion" },
      { href: "/admin/planes", texto: "Planes y pagos", icono: "pagos" },
      { href: "/admin/analytics", texto: "Analytics", icono: "analytics" },
      { href: "/entrenador/perfil", texto: "Mi perfil", icono: "perfil" },
    ];
  }

  return [
    { href: "/entrenador", texto: "Resumen", icono: "resumen" },
    ...trabajo,
    { href: "/entrenador/perfil", texto: "Mi perfil", icono: "perfil" },
  ];
}
