// Detalle de un pedido para la pantalla del repartidor (direccion, telefono,
// lineas con SKU para pintar la foto del catalogo).
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../../../lib/cuenta';

export const GET: APIRoute = async ({ params, url }) => {
  const clave = url.searchParams.get('clave') ?? '';
  const numero = params.numero ?? '';
  const respuesta = await llamarOrderApi(
    `/api/repartidor/pedidos/${encodeURIComponent(numero)}?clave=${encodeURIComponent(clave)}`,
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
