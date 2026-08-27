// Detalle de un pedido (con historial) para el panel /admin. Clave solo en
// header.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../../../lib/cuenta';

export const GET: APIRoute = async ({ params, request }) => {
  const numero = params.numero ?? '';
  const respuesta = await llamarOrderApi(
    `/api/admin/pedidos/${encodeURIComponent(numero)}`,
    { encabezados: { 'X-Clave-Admin': request.headers.get('x-clave-admin') ?? '' } },
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
