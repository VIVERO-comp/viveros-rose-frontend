// Pedidos activos y por validar para el panel /admin. Clave solo en header.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../lib/cuenta';

export const GET: APIRoute = async ({ request }) => {
  const respuesta = await llamarOrderApi('/api/admin/pedidos', {
    encabezados: { 'X-Clave-Admin': request.headers.get('x-clave-admin') ?? '' },
  });
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
