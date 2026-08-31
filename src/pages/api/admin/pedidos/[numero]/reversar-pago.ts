// Reversar la pre-autorizacion de tarjeta de un pedido desde el panel
// /admin (no hay stock): el order-api devuelve la retencion en PagueloFacil,
// cancela el presupuesto en Odoo y deja la constancia en su historial.
// Idempotente. Clave solo en header.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../../../lib/cuenta';

export const POST: APIRoute = async ({ params, request }) => {
  const numero = params.numero ?? '';
  const respuesta = await llamarOrderApi(
    `/api/admin/pedidos/${encodeURIComponent(numero)}/reversar-pago`,
    {
      metodo: 'POST',
      cuerpo: {},
      encabezados: { 'X-Clave-Admin': request.headers.get('x-clave-admin') ?? '' },
    },
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
