"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * El carrito de la tienda.
 *
 * Vive en el navegador de cada persona, no en la base de datos: se puede
 * comprar sin tener cuenta, y un carrito a medio llenar no es información
 * que merezca ocupar la base. Solo al confirmar el pedido pasa al servidor.
 *
 * El estado se comparte entre todos los componentes que lo usan mediante
 * una suscripción, así el contador de la cabecera y el panel del carrito
 * nunca se contradicen.
 */

const CLAVE = "yiyo:carrito";

export type LineaCarrito = {
  productoId: string;
  slug: string;
  nombre: string;
  /** Null en productos de talla única. */
  talla: string | null;
  precio: number;
  cantidad: number;
  imagen: string;
};

/** Identifica una línea: el mismo producto en dos tallas son dos líneas. */
const claveLinea = (productoId: string, talla: string | null) =>
  `${productoId}::${talla ?? ""}`;

let lineas: LineaCarrito[] = [];
let cargado = false;
const oyentes = new Set<() => void>();

function leerDelNavegador(): LineaCarrito[] {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    // Se valida lo que vuelve: puede venir de una versión anterior de la
    // tienda, o de alguien que editó el almacenamiento a mano.
    return datos.filter(
      (l): l is LineaCarrito =>
        l &&
        typeof l.productoId === "string" &&
        typeof l.nombre === "string" &&
        typeof l.precio === "number" &&
        Number.isFinite(l.precio) &&
        typeof l.cantidad === "number" &&
        l.cantidad > 0
    );
  } catch {
    // Ventana privada, almacenamiento bloqueado o JSON roto: se sigue con
    // el carrito vacío en vez de tumbar la tienda.
    return [];
  }
}

function guardar() {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(lineas));
  } catch {
    // Si no se puede guardar, el carrito sigue funcionando en esta pestaña.
  }
  for (const avisar of oyentes) avisar();
}

function asegurarCargado() {
  if (cargado || typeof window === "undefined") return;
  lineas = leerDelNavegador();
  cargado = true;
}

function suscribir(avisar: () => void) {
  asegurarCargado();
  oyentes.add(avisar);
  // Si la persona tiene la tienda abierta en dos pestañas, ambas se enteran.
  const alCambiarOtraPestana = (e: StorageEvent) => {
    if (e.key !== CLAVE) return;
    lineas = leerDelNavegador();
    for (const a of oyentes) a();
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

const instantanea = () => {
  asegurarCargado();
  return lineas;
};

/** En el servidor el carrito siempre está vacío: vive solo en el navegador. */
const VACIO: LineaCarrito[] = [];
const instantaneaServidor = () => VACIO;

export function useCarrito() {
  const actuales = useSyncExternalStore(
    suscribir,
    instantanea,
    instantaneaServidor
  );

  const agregar = useCallback((linea: Omit<LineaCarrito, "cantidad">, cantidad = 1) => {
    asegurarCargado();
    const clave = claveLinea(linea.productoId, linea.talla);
    const existente = lineas.find(
      (l) => claveLinea(l.productoId, l.talla) === clave
    );
    if (existente) {
      lineas = lineas.map((l) =>
        claveLinea(l.productoId, l.talla) === clave
          ? { ...l, cantidad: l.cantidad + cantidad }
          : l
      );
    } else {
      lineas = [...lineas, { ...linea, cantidad }];
    }
    guardar();
  }, []);

  const cambiarCantidad = useCallback(
    (productoId: string, talla: string | null, cantidad: number) => {
      asegurarCargado();
      const clave = claveLinea(productoId, talla);
      lineas =
        cantidad <= 0
          ? lineas.filter((l) => claveLinea(l.productoId, l.talla) !== clave)
          : lineas.map((l) =>
              claveLinea(l.productoId, l.talla) === clave ? { ...l, cantidad } : l
            );
      guardar();
    },
    []
  );

  const quitar = useCallback((productoId: string, talla: string | null) => {
    asegurarCargado();
    const clave = claveLinea(productoId, talla);
    lineas = lineas.filter((l) => claveLinea(l.productoId, l.talla) !== clave);
    guardar();
  }, []);

  const vaciar = useCallback(() => {
    lineas = [];
    guardar();
  }, []);

  const unidades = actuales.reduce((t, l) => t + l.cantidad, 0);
  const total = actuales.reduce((t, l) => t + l.precio * l.cantidad, 0);

  return { lineas: actuales, unidades, total, agregar, cambiarCantidad, quitar, vaciar };
}
