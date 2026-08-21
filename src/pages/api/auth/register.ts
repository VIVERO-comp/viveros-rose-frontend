// Registro con codigo de verificacion al correo. Pasa la respuesta tal cual:
// 201 (codigo enviado), 409 (correo con cuenta), 400 (datos invalidos).
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ request }) => {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) return cuerpoIlegible();
  return llamarOrderApi('/api/auth/register', { metodo: 'POST', cuerpo });
};
