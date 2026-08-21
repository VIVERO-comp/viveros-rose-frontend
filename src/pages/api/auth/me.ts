// Cuenta de la sesion vigente (o 401). Si el order-api rechaza el token
// (sesion vencida o revocada), la cookie muerta se borra de paso.
export const prerender = false;

import type { APIRoute } from 'astro';
import { borrarSesion, llamarOrderApi, sinSesion, tokenDeSesion } from '../../../lib/cuenta';

export const GET: APIRoute = async ({ cookies }) => {
  const token = tokenDeSesion(cookies);
  if (!token) return sinSesion();
  const respuesta = await llamarOrderApi('/api/auth/me', { token });
  if (respuesta.status === 401) borrarSesion(cookies);
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
