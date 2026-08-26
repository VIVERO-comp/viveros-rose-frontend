// Catalogo en BUILD: el sitio publica los productos de src/data/products.ts
// que el stock proxy reconoce, con los PRECIOS reales de Odoo inyectados
// (regular y oferta): el HTML estatico sale con el precio correcto y el
// mismo proxy lo refresca luego en el navegador. Un producto archivado en
// Odoo no viene en la respuesta del proxy (filtra por `active`), asi que su
// tarjeta desaparece del catalogo, su pagina deja de generarse (404) y sale
// del sitemap, todo en el siguiente build.
//
// Consecuencia asumida: archivar un producto en Odoo NO lo quita del sitio al
// instante; hace falta un rebuild del frontend (documentado en el README y en
// docs/estado.md de vivero-rose-infra).
//
// Si el proxy no responde durante el build (o falta PUBLIC_STOCK_PROXY_URL),
// se publica el catalogo completo con un aviso: preferimos un build que sale
// con productos de mas a un deploy caido por una dependencia externa.

import { products, type Product } from '../data/products';
import { ventasDe } from '../data/ventas';
import type { StockItem } from './stock';

const PROXY_URL = import.meta.env.PUBLIC_STOCK_PROXY_URL as string | undefined;

// Mismo tope de SKUs por consulta que el servicio (MAX_SKUS del stock proxy).
const MAX_SKUS_POR_CONSULTA = 50;

let promesa: Promise<Product[]> | null = null;

// Items del proxy por SKU (un SKU ausente = producto archivado). Devuelve
// null si CUALQUIER trozo falla: con una respuesta parcial no se puede
// distinguir "archivado" de "no contestó", y tratarla como completa tumbaria
// paginas vivas.
async function itemsDelProxy(): Promise<Map<string, StockItem> | null> {
  if (!PROXY_URL) return null;
  const skus = products.map((p) => p.sku);
  const porSku = new Map<string, StockItem>();
  for (let i = 0; i < skus.length; i += MAX_SKUS_POR_CONSULTA) {
    const trozo = skus.slice(i, i + MAX_SKUS_POR_CONSULTA);
    try {
      const res = await fetch(`${PROXY_URL}/stock?skus=${encodeURIComponent(trozo.join(','))}`);
      if (!res.ok) return null;
      const data = (await res.json()) as { items: StockItem[] };
      for (const item of data.items) porSku.set(item.sku, item);
    } catch {
      return null;
    }
  }
  return porSku;
}

// Precios y stock de Odoo sobre el producto del catalogo. El stock real del
// build alimenta el orden "Destacadas" del catalogo (y los umbrales de las
// colecciones mas-vendidas/recien); el StockBadge lo refresca igual en el
// navegador. Si el proxy no trajo precio (fallback degradado), el producto
// queda con su precio de products.ts, igual que cuando el proxy entero no
// responde.
function conPrecios(producto: Product, item: StockItem): Product {
  const actualizado = {
    ...producto,
    available: item.available,
    // Ventas totales: las manuales (ventas a supers, src/data/ventas.ts)
    // mas las confirmadas en Odoo (tienda en linea). Cuando se empiece a
    // registrar TODO en Odoo, vaciar ventas.ts para no contar doble.
    ventas: ventasDe(producto.sku) + (item.sold_units ?? 0),
  };
  if (typeof item.price_cents !== 'number') return actualizado;
  const oferta =
    typeof item.offer_price_cents === 'number' && item.offer_price_cents < item.price_cents
      ? item.offer_price_cents / 100
      : undefined;
  return { ...actualizado, price: item.price_cents / 100, offerPrice: oferta };
}

/** Catalogo publicado: products.ts menos los archivados en Odoo, con los
 * precios reales (regular y oferta) inyectados. Se consulta el proxy una
 * sola vez por build (promesa compartida entre paginas). */
export function productosPublicados(): Promise<Product[]> {
  promesa ??= (async () => {
    const items = await itemsDelProxy();
    if (items === null) {
      console.warn(
        '[catalogo] Stock proxy no disponible en build: se publica el catálogo completo, archivados incluidos y con los precios de products.ts.',
      );
      return products;
    }
    const archivados = products.filter((p) => !items.has(p.sku));
    if (archivados.length) {
      console.warn(
        `[catalogo] Fuera del sitio por estar archivados en Odoo: ${archivados.map((p) => p.sku).join(', ')}`,
      );
    }
    return products.filter((p) => items.has(p.sku)).map((p) => conPrecios(p, items.get(p.sku)!));
  })();
  return promesa;
}
