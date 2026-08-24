// "Agarrar" el pedido: el candado atomico vive en Odoo (accion_agarrar); si
// otro repartidor llego primero el order-api responde 409 ya_agarrado.
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi } from '../../../../../lib/cuenta';

export const POST: APIRoute = async ({ params, request }) => {
  const cuerpo = (await leerJson(request)) as { clave?: string } | null;
  if (!cuerpo) return cuerpoIlegible();
  const numero = params.numero ?? '';
  const respuesta = await llamarOrderApi(
    `/api/repartidor/pedidos/${encodeURIComponent(numero)}/agarrar`,
    { metodo: 'POST', cuerpo: { clave: cuerpo.clave ?? '' } },
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
