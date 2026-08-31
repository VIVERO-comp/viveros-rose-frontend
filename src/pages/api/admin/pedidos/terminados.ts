// Pagina siguiente de pedidos terminados ("Ver mas" del panel /admin): el
// cursor (antes_de + numero) es el que devolvio la pagina anterior. Clave
// solo en header. Esta ruta fija gana sobre [numero] en Astro.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../../lib/cuenta';

export const GET: APIRoute = async ({ url, request }) => {
  const consulta = new URLSearchParams();
  for (const parametro of ['antes_de', 'numero']) {
    const valor = url.searchParams.get(parametro);
    if (valor) consulta.set(parametro, valor);
  }
  const respuesta = await llamarOrderApi(`/api/admin/pedidos/terminados?${consulta}`, {
    encabezados: { 'X-Clave-Admin': request.headers.get('x-clave-admin') ?? '' },
  });
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
