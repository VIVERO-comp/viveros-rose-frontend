// Filtro del catalogo en BUILD: el sitio publica los productos de
// src/data/products.ts que el stock proxy reconoce. Un producto archivado en
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

const PROXY_URL = import.meta.env.PUBLIC_STOCK_PROXY_URL as string | undefined;

// Mismo tope de SKUs por consulta que el servicio (MAX_SKUS del stock proxy).
const MAX_SKUS_POR_CONSULTA = 50;

let promesa: Promise<Product[]> | null = null;

// SKUs que el proxy reconoce como producto activo. Devuelve null si CUALQUIER
// trozo falla: con una respuesta parcial no se puede distinguir "archivado"
// de "no contestó", y tratarla como completa tumbaria paginas vivas.
async function skusActivos(): Promise<Set<string> | null> {
  if (!PROXY_URL) return null;
  const skus = products.map((p) => p.sku);
  const activos = new Set<string>();
  for (let i = 0; i < skus.length; i += MAX_SKUS_POR_CONSULTA) {
    const trozo = skus.slice(i, i + MAX_SKUS_POR_CONSULTA);
    try {
      const res = await fetch(`${PROXY_URL}/stock?skus=${encodeURIComponent(trozo.join(','))}`);
      if (!res.ok) return null;
      const data = (await res.json()) as { items: { sku: string }[] };
      for (const item of data.items) activos.add(item.sku);
    } catch {
      return null;
    }
  }
  return activos;
}

/** Catalogo publicado: products.ts menos los archivados en Odoo. Se consulta
 * el proxy una sola vez por build (promesa compartida entre paginas). */
export function productosPublicados(): Promise<Product[]> {
  promesa ??= (async () => {
    const activos = await skusActivos();
    if (activos === null) {
      console.warn(
        '[catalogo] Stock proxy no disponible en build: se publica el catálogo completo, archivados incluidos.',
      );
      return products;
    }
    const archivados = products.filter((p) => !activos.has(p.sku));
    if (archivados.length) {
      console.warn(
        `[catalogo] Fuera del sitio por estar archivados en Odoo: ${archivados.map((p) => p.sku).join(', ')}`,
      );
    }
    return products.filter((p) => activos.has(p.sku));
  })();
  return promesa;
}
