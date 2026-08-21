// Registro con el enlace de un solo uso del correo de confirmacion del
// pedido: la cuenta nace verificada y con sesion abierta (cookie httpOnly).
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi, responderConSesion } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ request, cookies }) => {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) return cuerpoIlegible();
  const respuesta = await llamarOrderApi('/api/auth/register-from-token', { metodo: 'POST', cuerpo });
  return responderConSesion(respuesta, cookies);
};
