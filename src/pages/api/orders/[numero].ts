// Estado publico de un pedido para /pedido: reenvia al order-api desde el
// mismo origen, asi el navegador no necesita CORS ni conocer el backend.
// El numero de pedido es la unica credencial (sufijo largo, no enumerable).
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const base = import.meta.env.ORDER_API_URL ?? process.env.ORDER_API_URL;
  if (!base) {
    return new Response(
      JSON.stringify({ error: 'not_configured', message: 'El rastreo no está configurado.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const numero = params.numero ?? '';
  if (!/^VR-\d{8}-[A-Z2-9]{4,12}$/.test(numero)) {
    return new Response(
      JSON.stringify({ error: 'order_not_found', message: 'Número de pedido inválido.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const respuesta = await fetch(
      `${base.replace(/\/$/, '')}/api/orders/${encodeURIComponent(numero)}`,
    );
    return new Response(await respuesta.text(), {
      status: respuesta.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'upstream_unreachable', message: 'No pudimos consultar el pedido. Intenta de nuevo.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
