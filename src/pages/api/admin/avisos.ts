// Avisos del panel a los repartidores: el alcance y el historial (GET) y el
// envio (POST). La clave de admin viaja SOLO en el header X-Clave-Admin
// (nunca en la query) y el order-api la valida contra Odoo.
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi } from '../../../lib/cuenta';

const encabezados = (request: Request) => ({
  'X-Clave-Admin': request.headers.get('x-clave-admin') ?? '',
});

export const GET: APIRoute = async ({ request }) => {
  const respuesta = await llamarOrderApi('/api/admin/avisos', {
    encabezados: encabezados(request),
  });
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const cuerpo = await leerJson(request);
  if (!cuerpo) return cuerpoIlegible();
  const respuesta = await llamarOrderApi('/api/admin/avisos', {
    metodo: 'POST',
    cuerpo,
    encabezados: encabezados(request),
  });
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
