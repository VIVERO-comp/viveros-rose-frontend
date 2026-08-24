// La foto de entrega ES el "Entregado": el order-api valida la imagen y
// llama accion_entregado en Odoo (la regla "sin foto no hay entregado" vive
// alla). El navegador ya comprimio la foto (~1600 px, JPEG) porque las
// funciones de Vercel cortan cerca de 4.5 MB.
//
// La foto llega como binario crudo (image/*) con la clave en un header, no
// como multipart: detras del proxy de Vercel el chequeo CSRF de Astro
// rechaza con 403 todo POST con content-type de formulario (el Origin nunca
// cuadra con el host interno). El multipart hacia el order-api se arma aqui,
// entre servidores, donde ese chequeo no aplica.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApiForm } from '../../../../../lib/cuenta';

const error = (estado: number, codigo: string, mensaje: string) =>
  new Response(JSON.stringify({ error: codigo, message: mensaje }), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ params, request }) => {
  const tipo = request.headers.get('content-type') ?? '';
  if (!tipo.startsWith('image/')) {
    return error(400, 'invalid_photo', 'Se esperaba la foto como imagen (image/*).');
  }
  const datos = await request.arrayBuffer();
  if (!datos.byteLength) {
    return error(400, 'invalid_photo', 'Falta la foto de entrega.');
  }
  const clave = request.headers.get('x-clave-repartidor') ?? '';
  const form = new FormData();
  form.set('clave', clave);
  form.set('foto', new File([datos], 'entrega.jpg', { type: tipo }), 'entrega.jpg');
  const numero = params.numero ?? '';
  const respuesta = await llamarOrderApiForm(
    `/api/repartidor/pedidos/${encodeURIComponent(numero)}/foto`,
    form,
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
