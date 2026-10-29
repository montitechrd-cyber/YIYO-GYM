"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Apple,
  ListChecks,
  LogOut,
  MessageCircle,
  Salad,
  Package,
  Settings,
  TrendingUp,
  User,
  UserCog,
  Users,
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
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const barra = useRef<HTMLElement>(null);

  // El enlace activo siempre queda a la vista dentro de la barra deslizable.
  useEffect(() => {
    barra.current
      ?.querySelector<HTMLElement>("[aria-current='page']")
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [ruta]);

  return (
    <div className="min-h-dvh bg-crema">
      {/* Barra superior: marca, notificaciones y cuenta */}
      <header className="vidrio sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="shrink-0">
            <Logo tamano="sm" />
          </Link>
          <span className="hidden bg-violeta-900 px-2 py-1 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap text-white uppercase sm:inline-block">
            {ETIQUETA_ROL[perfil.rol]}
          </span>
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          <CentroNotificaciones perfilId={perfil.id} iniciales={notificaciones} />
          <button
            onClick={() => setPerfilAbierto((v) => !v)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm bg-violeta-700 text-xs font-bold tracking-wider text-white"
            aria-label="Mi cuenta"
            aria-expanded={perfilAbierto}
          >
            {iniciales(perfil.nombre_completo, perfil.correo)}
          </button>
          {perfilAbierto && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPerfilAbierto(false)}
              />
              <div className="animate-aparecer absolute top-full right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] border border-violeta-900 bg-crema p-4 shadow-elevada">
                <p className="mb-3 inline-block bg-violeta-900 px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-white uppercase sm:hidden">
                  {ETIQUETA_ROL[perfil.rol]}
                </p>
                <p className="truncate text-sm font-semibold text-violeta-900">
                  {perfil.nombre_completo || "Sin nombre"}
                </p>
                <p className="truncate text-[11px] text-violeta-900/65">
                  {perfil.correo}
                </p>
                <form action={salir} className="mt-4 border-t-2 border-violeta-900 pt-3">
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-2 py-2.5 text-[13px] font-semibold text-violeta-900/70 transition-colors hover:bg-rose-100 hover:text-rose-900"
                  >
                    <LogOut size={17} strokeWidth={2} className="shrink-0" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="min-w-0 px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-28 lg:px-12 lg:py-12 lg:pb-32">
        {children}
      </main>

      {/* Navegación inferior: deslizable si hay muchos enlaces */}
      <nav
        ref={barra}
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto overscroll-x-contain border-t-2 border-violeta-900 bg-lila-50 pb-[env(safe-area-inset-bottom)] sin-barra"
      >
        {enlaces.map((e) => {
          const activo = ruta === e.href || ruta.startsWith(e.href + "/");
          const Icono = ICONOS[e.icono];
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex min-w-[4.75rem] flex-1 shrink-0 flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] leading-tight font-semibold tracking-wide transition-colors duration-200",
                activo
                  ? "bg-violeta-700 text-white"
                  : "text-violeta-900/75 hover:bg-lila-200 hover:text-violeta-900"
              )}
            >
              <Icono size={20} strokeWidth={2} className="shrink-0" />
              <span className="max-w-full truncate">{e.texto}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
