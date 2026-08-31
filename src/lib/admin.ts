// Ayudas puras del panel /admin, probables sin navegador.
//
// La regla de seguridad del panel vive en peticionAdmin: la clave viaja
// SIEMPRE en el header X-Clave-Admin y nunca en la query string (no queda
// en logs de Vercel ni en historiales). El order-api valida la clave contra
// Odoo en cada peticion.

export interface PeticionAdmin {
  url: string;
  init: RequestInit;
}

export function peticionAdmin(
  ruta: string,
  clave: string,
  init: RequestInit = {},
): PeticionAdmin {
  if (ruta.includes(encodeURIComponent(clave)) || ruta.includes(clave)) {
    // Red de seguridad: si alguien intenta armar la URL con la clave, se
    // frena aqui antes de que salga del navegador.
    throw new Error('La clave de admin nunca viaja en la URL.');
  }
  const encabezados = new Headers(init.headers);
  encabezados.set('X-Clave-Admin', clave);
  return { url: ruta, init: { ...init, headers: encabezados } };
}

/** "92 min" -> "1 h 32 min"; menos de una hora queda en minutos. */
export function duracionLegible(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined) return '—';
  const redondeados = Math.round(minutos);
  if (redondeados < 60) return `${redondeados} min`;
  const horas = Math.floor(redondeados / 60);
  const resto = redondeados % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

/** Cuanto lleva corriendo algo que empezo en `desde` (fecha UTC de Odoo). */
export function minutosDesde(desde: string, ahora: Date): number {
  const inicio = new Date(desde.replace(' ', 'T') + 'Z');
  return Math.max(0, Math.round((ahora.getTime() - inicio.getTime()) / 60000));
}

// -- lista de pedidos -------------------------------------------------------

/** El estado unificado que manda el order-api en cada lista del panel. */
export type EstadoPedido =
  | 'por_validar'
  | 'listo'
  | 'saliendo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

/** Texto de la insignia: siempre dice el estado, el color solo lo refuerza. */
export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  por_validar: 'Por validar',
  listo: 'Listo para salir',
  saliendo: 'Saliendo',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export interface PedidoLista {
  numero: string;
  estado: EstadoPedido;
  con_retraso?: boolean;
  creado_en?: string | null;
  pagado_en?: string | null;
  terminado_en?: string | null;
  [otro: string]: unknown;
}

export interface ListaPedidos {
  por_validar?: PedidoLista[];
  activos?: PedidoLista[];
  terminados?: PedidoLista[];
}

export interface BloquesPedidos {
  porValidar: PedidoLista[];
  conRetraso: PedidoLista[];
  enProceso: PedidoLista[];
  terminados: PedidoLista[];
}

const porFecha =
  (campo: keyof PedidoLista, direccion: 1 | -1) =>
  (a: PedidoLista, b: PedidoLista): number => {
    const fa = String(a[campo] ?? '');
    const fb = String(b[campo] ?? '');
    if (fa !== fb) return fa < fb ? -direccion : direccion;
    // Mismo segundo: el numero desempata, como en el cursor del order-api.
    return a.numero < b.numero ? -direccion : a.numero > b.numero ? direccion : 0;
  };

/**
 * Ordena la lista del panel por lo que pide atencion: primero los nuevos
 * (esperan validacion; el que lleva mas tiempo esperando, arriba), luego
 * los activos con retraso, luego el resto en proceso (por orden de pago) y
 * al final los terminados, del mas reciente al mas viejo.
 */
export function agruparPedidos(lista: ListaPedidos): BloquesPedidos {
  const activos = lista.activos ?? [];
  return {
    porValidar: [...(lista.por_validar ?? [])].sort(porFecha('creado_en', 1)),
    conRetraso: activos.filter((p) => p.con_retraso).sort(porFecha('pagado_en', 1)),
    enProceso: activos.filter((p) => !p.con_retraso).sort(porFecha('pagado_en', 1)),
    terminados: [...(lista.terminados ?? [])].sort(porFecha('terminado_en', -1)),
  };
}
