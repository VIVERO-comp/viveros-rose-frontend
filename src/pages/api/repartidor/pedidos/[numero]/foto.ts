// La foto de entrega ES el "Entregado": se reenvia el multipart tal cual al
// order-api, que valida la imagen y llama accion_entregado en Odoo (la regla
// "sin foto no hay entregado" vive alla). El navegador ya comprimio la foto
// (~1600 px, JPEG) porque las funciones de Vercel cortan cerca de 4.5 MB.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApiForm } from '../../../../../lib/cuenta';

export const POST: APIRoute = async ({ params, request }) => {
  let entrada: FormData;
  try {
    entrada = await request.formData();
  } catch {
    return new Response(
      JSON.stringify({ error: 'invalid_form', message: 'Se esperaba un formulario con la foto.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const foto = entrada.get('foto');
  if (!(foto instanceof File)) {
    return new Response(
      JSON.stringify({ error: 'invalid_form', message: 'Falta la foto de entrega.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const form = new FormData();
  form.set('clave', String(entrada.get('clave') ?? ''));
  form.set('foto', foto, foto.name || 'entrega.jpg');
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
