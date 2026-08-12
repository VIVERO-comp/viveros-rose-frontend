// Cliente del stock proxy (seccion 6 de la propuesta).
// El frontend nunca habla con Odoo directamente: toda la disponibilidad
// visible al cliente sale del proxy. Mientras el proxy no exista, las
// funciones devuelven null y la UI usa el stock de ejemplo del catalogo.

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

const LOW_STOCK_THRESHOLD = 5;

export function stockStatus(available: number): StockStatus {
  if (available <= 0) return 'out';
  if (available <= LOW_STOCK_THRESHOLD) return 'low';
  return 'in-stock';
}

export function stockLabel(available: number): string {
  const status = stockStatus(available);
  if (status === 'out') return 'Agotado';
  if (status === 'low') return 'Pocas unidades';
  return 'En stock';
}

export async function fetchStock(skus: string[]): Promise<StockItem[] | null> {
  if (!PROXY_URL || skus.length === 0) return null;
  try {
    const res = await fetch(`${PROXY_URL}/stock?skus=${encodeURIComponent(skus.join(','))}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items as StockItem[];
  } catch {
    return null;
  }
}
