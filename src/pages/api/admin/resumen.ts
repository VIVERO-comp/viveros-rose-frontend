// Resumen del panel /admin. La clave de admin viaja SOLO en el header
// X-Clave-Admin (nunca en la query) y el order-api la valida contra Odoo.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../lib/cuenta';

export const GET: APIRoute = async ({ url, request }) => {
  const periodo = url.searchParams.get('periodo') ?? 'hoy';
  const respuesta = await llamarOrderApi(
    `/api/admin/resumen?periodo=${encodeURIComponent(periodo)}`,
    { encabezados: { 'X-Clave-Admin': request.headers.get('x-clave-admin') ?? '' } },
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
