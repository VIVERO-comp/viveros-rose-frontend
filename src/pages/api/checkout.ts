// Puente de servidor entre el checkout del navegador y el order-api.
//
// Existe para que ORDER_API_KEY nunca llegue al navegador: esta funcion corre
// en Vercel, reenvia el pedido con la key y devuelve la respuesta tal cual
// (201 con numero de pedido, 409 si falta stock, 400 si algo es invalido).
export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const base = import.meta.env.ORDER_API_URL ?? process.env.ORDER_API_URL;
  const clave = import.meta.env.ORDER_API_KEY ?? process.env.ORDER_API_KEY;
  if (!base || !clave) {
    return new Response(
      JSON.stringify({ error: 'not_configured', message: 'El backend de pedidos no está configurado.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'invalid_json', message: 'Cuerpo ilegible.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const respuesta = await fetch(`${base.replace(/\/$/, '')}/api/checkout/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': clave },
      body: JSON.stringify(cuerpo),
    });
    return new Response(await respuesta.text(), {
      status: respuesta.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'upstream_unreachable', message: 'No pudimos registrar el pedido. Intenta de nuevo.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
