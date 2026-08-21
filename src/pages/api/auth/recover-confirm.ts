// Confirmar la recuperacion: codigo + contrasena nueva. El order-api revoca
// todas las sesiones, asi que la pagina lleva al login despues del 200.
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ request }) => {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) return cuerpoIlegible();
  return llamarOrderApi('/api/auth/recover/confirm', { metodo: 'POST', cuerpo });
};
