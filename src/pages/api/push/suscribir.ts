// Guarda la suscripcion Web Push del navegador. La clave decide quien es:
// la del enlace personal de un repartidor (validada contra Odoo) o la del
// dueno (PUSH_CLAVE_DUENO en el .env del order-api).
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ request }) => {
  const cuerpo = (await leerJson(request)) as { clave?: string; suscripcion?: unknown } | null;
  if (!cuerpo) return cuerpoIlegible();
  const respuesta = await llamarOrderApi('/api/push/suscribir', {
    metodo: 'POST',
    cuerpo: { clave: cuerpo.clave ?? '', suscripcion: cuerpo.suscripcion },
  });
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
