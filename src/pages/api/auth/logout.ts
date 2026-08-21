// Cierre de sesion: revoca el token en el order-api y borra la cookie.
// Siempre responde ok — cerrar una sesion ya cerrada no es un error.
export const prerender = false;

import type { APIRoute } from 'astro';
import { borrarSesion, llamarOrderApi, tokenDeSesion } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ cookies }) => {
  const token = tokenDeSesion(cookies);
  if (token) await llamarOrderApi('/api/auth/logout', { metodo: 'POST', token });
  borrarSesion(cookies);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
