// Cliente del stock proxy (seccion 6 de la propuesta).
// El frontend nunca habla con Odoo directamente: toda la disponibilidad
// visible al cliente sale del proxy. Este modulo es la UNICA fuente de
// umbral, texto y estado de stock: tarjeta, ficha y panel de compra deben
// leer de aqui para no contradecirse entre si.

const PROXY_URL = import.meta.env.PUBLIC_STOCK_PROXY_URL as string | undefined;

export interface StockItem {
  sku: string;
  available: number;
  on_hand?: number;
  reserved?: number;
  warehouse?: string;
  updated_at: string;
  stale?: boolean;
  // Precios en centavos (seccion de ofertas). El proxy los omite solo en su
  // fallback degradado sin historia: si faltan, dejar en paz lo ya pintado.
  price_cents?: number;
  offer_price_cents?: number;
  // Unidades vendidas en pedidos confirmados de Odoo; catalogo-build las
  // suma a las ventas manuales (src/data/ventas.ts) para ordenar el catalogo.
  sold_units?: number;
}

export type StockStatus = 'in-stock' | 'low' | 'out';

// Umbral de "pocas unidades": con 1..LOW_STOCK_THRESHOLD se muestra
// "Últimas N disponibles". Configurable aqui, no regado por el codigo.
export const LOW_STOCK_THRESHOLD = 5;

// El proxy rechaza consultas de mas de 50 SKUs (MAX_SKUS del servicio);
// fetchStock trocea la lista para que paginas como /plantas (147 SKUs)
// puedan refrescar todas sus tarjetas.
const MAX_SKUS_POR_CONSULTA = 50;

// Piso de compra: un producto es comprable solo si lo que se cobra SUPERA
// $1.00. Es el mismo umbral (y el mismo <=) que PRECIO_MINIMO_CENTAVOS del
// order-api: cubre el 0 y el 1.0 por defecto de Odoo. Por debajo el producto
// se muestra "Proximamente" — visible, en su lugar, pero sin comprar — y en
// cuanto Abraham le pone precio real en Odoo pasa a comprable solo.
export const PRECIO_MINIMO_CENTAVOS = 100;

// Lo que la pagina debe mostrar y cobrar para un item del proxy, resuelto en
// UN solo lugar: tarjeta, ficha y carrito leen de aqui para no contradecirse.
export interface PrecioVista {
  vigente: number; // dolares: lo que se cobra hoy (la oferta si esta activa)
  regular: number | null; // dolares: el precio a tachar; null si no hay oferta
  descuentoPct: number | null; // para la etiqueta "-25%" sobre la foto
  comprable: boolean;
}

// Devuelve null cuando el item no trae precio (fallback degradado del proxy):
// en ese caso no hay que tocar el precio que ya este pintado.
export function precioVista(item: StockItem): PrecioVista | null {
  if (typeof item.price_cents !== 'number') return null;
  const oferta =
    typeof item.offer_price_cents === 'number' && item.offer_price_cents < item.price_cents
      ? item.offer_price_cents
      : null;
  const vigente = oferta ?? item.price_cents;
  return {
    vigente: vigente / 100,
    regular: oferta !== null ? item.price_cents / 100 : null,
    descuentoPct: oferta !== null ? Math.round(100 * (1 - oferta / item.price_cents)) : null,
    comprable: vigente > PRECIO_MINIMO_CENTAVOS,
  };
}

export function stockStatus(available: number): StockStatus {
  if (available <= 0) return 'out';
  if (available <= LOW_STOCK_THRESHOLD) return 'low';
  return 'in-stock';
}

export function stockLabel(available: number): string {
  const status = stockStatus(available);
  if (status === 'out') return 'Agotado';
  if (status === 'low') return `Últimas ${available} disponibles`;
  return 'En stock';
}

async function fetchChunk(skus: string[]): Promise<StockItem[] | null> {
  try {
    const res = await fetch(`${PROXY_URL}/stock?skus=${encodeURIComponent(skus.join(','))}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items as StockItem[];
  } catch {
    return null;
  }
}

export async function fetchStock(skus: string[]): Promise<StockItem[] | null> {
  if (!PROXY_URL || skus.length === 0) return null;
  const trozos: string[][] = [];
  for (let i = 0; i < skus.length; i += MAX_SKUS_POR_CONSULTA) {
    trozos.push(skus.slice(i, i + MAX_SKUS_POR_CONSULTA));
  }
  const resultados = await Promise.all(trozos.map(fetchChunk));
  const items = resultados.filter((r): r is StockItem[] => r !== null).flat();
  return items.length ? items : null;
}
