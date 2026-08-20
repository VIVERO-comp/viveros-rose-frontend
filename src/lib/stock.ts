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
}

export type StockStatus = 'in-stock' | 'low' | 'out';

// Umbral de "pocas unidades": con 1..LOW_STOCK_THRESHOLD se muestra
// "Últimas N disponibles". Configurable aqui, no regado por el codigo.
export const LOW_STOCK_THRESHOLD = 5;

// El proxy rechaza consultas de mas de 50 SKUs (MAX_SKUS del servicio);
// fetchStock trocea la lista para que paginas como /plantas (147 SKUs)
// puedan refrescar todas sus tarjetas.
const MAX_SKUS_POR_CONSULTA = 50;

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
