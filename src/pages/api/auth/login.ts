// Inicio de sesion. 200 abre la cookie httpOnly; 401 (credenciales) y 403
// (correo sin verificar) pasan tal cual para que la pagina los muestre en
// linea junto al campo.
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi, responderConSesion } from '../../../lib/cuenta';

export const POST: APIRoute = async ({ request, cookies }) => {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) return cuerpoIlegible();
  const respuesta = await llamarOrderApi('/api/auth/login', { metodo: 'POST', cuerpo });
  return responderConSesion(respuesta, cookies);
};
