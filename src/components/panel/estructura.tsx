"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Apple,
  ListChecks,
  LogOut,
  Menu,
  MessageCircle,
  Salad,
  Package,
  Settings,
  TrendingUp,
  User,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { salir } from "@/app/(auth)/acciones";
import { CentroNotificaciones } from "./notificaciones";
import { cn } from "@/lib/utils";
import type { Notificacion, Perfil } from "@/lib/supabase/tipos";

/**
 * Los layouts son componentes de servidor y este es de cliente, así que los
 * enlaces viajan con el nombre del icono —no el componente— porque React no
 * puede serializar funciones a través de esa frontera.
 */
const ICONOS = {
  resumen: LayoutDashboard,
  clientes: Users,
  usuarios: UserCog,
  ejercicios: Dumbbell,
  rutinas: ListChecks,
  alimentos: Apple,
  dietas: Salad,
  calendario: CalendarDays,
  progreso: TrendingUp,
  chat: MessageCircle,
  pagos: CreditCard,
  analytics: BarChart3,
  perfil: User,
  configuracion: Settings,
  pedidos: Package,
} as const;

export type NombreIcono = keyof typeof ICONOS;

export type EnlacePanel = {
  href: string;
  texto: string;
  icono: NombreIcono;
};

function iniciales(nombre: string, correo: string) {
  const base = nombre.trim() || correo;
  return base
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const ETIQUETA_ROL: Record<Perfil["rol"], string> = {
  admin: "Administración",
  entrenador: "Entrenadora",
  cliente: "Mi espacio",
};

export function EstructuraPanel({
  perfil,
  enlaces,
  notificaciones,
  children,
}: {
  perfil: Perfil;
  enlaces: EnlacePanel[];
  notificaciones: Notificacion[];
  children: React.ReactNode;
}) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  const menu = (
    <nav className="flex flex-1 flex-col gap-1">
      {enlaces.map((e) => {
        const activo = ruta === e.href || ruta.startsWith(e.href + "/");
        const Icono = ICONOS[e.icono];
        return (
          <Link
            key={e.href}
            href={e.href}
            onClick={() => setAbierto(false)}
            className={cn(
              "group flex min-w-0 items-center gap-3 rounded-sm px-3 py-2.5 text-[13px] font-semibold tracking-wide transition-colors duration-200",
              activo
                ? "bg-violeta-700 text-white"
                : "text-violeta-900/75 hover:bg-lila-200 hover:text-violeta-900"
            )}
          >
            <Icono size={18} strokeWidth={2} className="shrink-0" />
            <span className="min-w-0 truncate">{e.texto}</span>
          </Link>
        );
      })}
    </nav>
  );

  const pie = (
    <div className="border-t-2 border-violeta-900 pt-5">
      <div className="mb-4 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-violeta-700 text-xs font-bold tracking-wider text-white">
          {iniciales(perfil.nombre_completo, perfil.correo)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-violeta-900">
            {perfil.nombre_completo || "Sin nombre"}
          </span>
          <span className="block truncate text-[11px] text-violeta-900/65">
            {perfil.correo}
          </span>
        </span>
      </div>
      <form action={salir}>
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 text-[13px] font-semibold text-violeta-900/70 transition-colors hover:bg-rose-100 hover:text-rose-900"
        >
          <LogOut size={17} strokeWidth={2} className="shrink-0" />
          Cerrar sesión
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-crema">
      {/* Barra superior móvil */}
      <header className="vidrio sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 lg:hidden">
        <Logo tamano="sm" />
        <div className="flex shrink-0 items-center gap-1">
          <CentroNotificaciones perfilId={perfil.id} iniciales={notificaciones} />
          <button
            onClick={() => setAbierto(true)}
            className="rounded-sm p-2 text-violeta-900 transition-colors hover:bg-lila-200"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Barra lateral escritorio.
            El logo y el pie quedan fijos; solo el menú del medio se
            desplaza. Sin `min-h-0` en el contenedor del menú, flexbox no lo
            deja encogerse por debajo de su contenido y `overflow-y-auto` no
            hace nada — con un menú largo (como el de la administradora,
            que ve también las secciones de la entrenadora) los últimos
            enlaces quedaban fuera de la pantalla y no había forma de
            llegar a ellos. */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-violeta-900 bg-lila-50 p-6 lg:flex">
          <div className="flex shrink-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href="/">
                <Logo tamano="sm" />
              </Link>
              <p className="mt-5 inline-block bg-violeta-900 px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-white uppercase">
                {ETIQUETA_ROL[perfil.rol]}
              </p>
            </div>
            <CentroNotificaciones
              perfilId={perfil.id}
              iniciales={notificaciones}
              alinear="izquierda"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{menu}</div>
          {pie}
        </aside>

        {/* Cajón móvil */}
        {abierto && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-violeta-900/60"
              onClick={() => setAbierto(false)}
            />
            <aside className="animate-aparecer absolute top-0 left-0 flex h-full w-72 max-w-[calc(100vw-3rem)] flex-col gap-6 border-r border-violeta-900 bg-lila-50 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 sm:pt-[max(1.5rem,env(safe-area-inset-top))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="flex shrink-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <Logo tamano="sm" />
                  <p className="mt-5 inline-block bg-violeta-900 px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-white uppercase">
                    {ETIQUETA_ROL[perfil.rol]}
                  </p>
                </div>
                <button
                  onClick={() => setAbierto(false)}
                  className="shrink-0 rounded-sm p-2 text-violeta-900 hover:bg-lila-200"
                  aria-label="Cerrar menú"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{menu}</div>
              {pie}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
