// Verificacion del correo con el codigo de 6 digitos. Si es correcto, el
// order-api abre sesion: el token queda en la cookie httpOnly y nunca llega
// al JavaScript del navegador.
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi, responderConSesion } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ request, cookies }) => {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) return cuerpoIlegible();
  const respuesta = await llamarOrderApi('/api/auth/verify', { metodo: 'POST', cuerpo });
  return responderConSesion(respuesta, cookies);
};
