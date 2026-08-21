// Historial de pedidos de la cuenta de la sesion (o 401 si no hay sesion).
export const prerender = false;

import type { APIRoute } from 'astro';
import { borrarSesion, llamarOrderApi, sinSesion, tokenDeSesion } from '../../../lib/cuenta';

export const GET: APIRoute = async ({ cookies }) => {
  const token = tokenDeSesion(cookies);
  if (!token) return sinSesion();
  const respuesta = await llamarOrderApi('/api/account/orders', { token });
  if (respuesta.status === 401) borrarSesion(cookies);
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
