// Clave publica VAPID con la que el navegador crea su suscripcion Web Push.
// Es publica por diseno; el reenvio existe solo para no exponer la URL del
// order-api ni la ORDER_API_KEY.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../lib/cuenta';

export const GET: APIRoute = async () => {
  const respuesta = await llamarOrderApi('/api/push/clave-publica');
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
