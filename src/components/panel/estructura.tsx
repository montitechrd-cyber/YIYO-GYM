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
              "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-light transition-all duration-300",
              activo
                ? "fondo-degradado font-medium text-white shadow-suave"
                : "text-violeta-900/70 hover:bg-lila-100 hover:text-violeta-800"
            )}
          >
            <Icono size={18} strokeWidth={1.6} />
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );

  const pie = (
    <div className="border-t border-lila-200 pt-5">
      <div className="mb-4 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full fondo-degradado text-xs font-medium text-white">
          {iniciales(perfil.nombre_completo, perfil.correo)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-violeta-800">
            {perfil.nombre_completo || "Sin nombre"}
          </span>
          <span className="block truncate text-[11px] font-light text-violeta-900/50">
            {perfil.correo}
          </span>
        </span>
      </div>
      <form action={salir}>
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-light text-violeta-900/60 transition-colors hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut size={17} strokeWidth={1.6} />
          Cerrar sesión
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-lila-50">
      {/* Barra superior móvil */}
      <header className="vidrio sticky top-0 z-40 flex items-center justify-between px-5 py-3 lg:hidden">
        <Logo tamano="sm" />
        <div className="flex items-center gap-1">
          <CentroNotificaciones perfilId={perfil.id} iniciales={notificaciones} />
          <button
            onClick={() => setAbierto(true)}
            className="rounded-full p-2 text-violeta-700 transition-colors hover:bg-lila-100"
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
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 border-r border-lila-200 bg-white/70 p-6 backdrop-blur lg:flex">
          <div className="flex shrink-0 items-start justify-between">
            <div>
              <Link href="/">
                <Logo tamano="sm" />
              </Link>
              <p className="mt-4 text-[10px] tracking-[0.22em] text-violeta-500 uppercase">
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
              className="absolute inset-0 bg-violeta-900/40 backdrop-blur-sm"
              onClick={() => setAbierto(false)}
            />
            <aside className="animate-aparecer absolute top-0 left-0 flex h-full w-72 flex-col gap-6 bg-white p-6 shadow-elevada">
              <div className="flex shrink-0 items-start justify-between">
                <div>
                  <Logo tamano="sm" />
                  <p className="mt-4 text-[10px] tracking-[0.22em] text-violeta-500 uppercase">
                    {ETIQUETA_ROL[perfil.rol]}
                  </p>
                </div>
                <button
                  onClick={() => setAbierto(false)}
                  className="rounded-full p-2 text-violeta-700 hover:bg-lila-100"
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

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
