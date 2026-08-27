// Disponibilidad de stock para el panel /admin: el order-api consulta el
// stock-proxy (nunca Odoo directo). La busqueda por nombre es local del
// panel; aqui solo viajan los SKUs elegidos. Clave solo en header.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../lib/cuenta';

export const GET: APIRoute = async ({ url, request }) => {
  const skus = url.searchParams.get('skus') ?? '';
  const respuesta = await llamarOrderApi(
    `/api/admin/stock?skus=${encodeURIComponent(skus)}`,
    { encabezados: { 'X-Clave-Admin': request.headers.get('x-clave-admin') ?? '' } },
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
