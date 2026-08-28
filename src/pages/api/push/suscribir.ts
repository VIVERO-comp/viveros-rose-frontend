// Guarda la suscripcion Web Push del navegador. La credencial decide quien
// es: la clave de admin del panel /admin (header X-Clave-Admin, validada
// contra Odoo; rol "dueno"), la del enlace personal de un repartidor
// (validada contra Odoo) o la del dueno (PUSH_CLAVE_DUENO en el .env del
// order-api).
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ request }) => {
  const cuerpo = (await leerJson(request)) as { clave?: string; suscripcion?: unknown } | null;
  if (!cuerpo) return cuerpoIlegible();
  const claveAdmin = request.headers.get('x-clave-admin');
  const respuesta = await llamarOrderApi('/api/push/suscribir', {
    metodo: 'POST',
    cuerpo: { clave: cuerpo.clave ?? '', suscripcion: cuerpo.suscripcion },
    encabezados: claveAdmin ? { 'X-Clave-Admin': claveAdmin } : {},
  });
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
