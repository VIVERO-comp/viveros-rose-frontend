// Pedir el codigo de recuperacion. Responde 202 exista o no la cuenta.
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ request }) => {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) return cuerpoIlegible();
  return llamarOrderApi('/api/auth/recover', { metodo: 'POST', cuerpo });
};
