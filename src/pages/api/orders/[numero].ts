// Estado publico de un pedido para /pedido: reenvia al order-api desde el
// mismo origen, asi el navegador no necesita CORS ni conocer el backend.
//
// Dos formatos de numero conviven: el correlativo nuevo (VR-549301), que por
// ser enumerable exige ademas el token del enlace (?t=) o el telefono del
// pedido (?tel=) — la verificacion la hace el order-api —, y el viejo
// (VR-20260812-A7K3), cuyo sufijo aleatorio era la credencial y sigue
// entrando solo.
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, url }) => {
  const base = import.meta.env.ORDER_API_URL ?? process.env.ORDER_API_URL;
  if (!base) {
    return new Response(
      JSON.stringify({ error: 'not_configured', message: 'El rastreo no está configurado.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const numero = params.numero ?? '';
  const formatoViejo = /^VR-\d{8}-[A-Z2-9]{4,12}$/.test(numero);
  const formatoCorrelativo = /^VR-\d{1,12}$/.test(numero);
  if (!formatoViejo && !formatoCorrelativo) {
    return new Response(
      JSON.stringify({ error: 'order_not_found', message: 'Número de pedido inválido.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Solo viajan al backend los parametros de verificacion, nada mas.
  const consulta = new URLSearchParams();
  const token = url.searchParams.get('t');
  const telefono = url.searchParams.get('tel');
  if (token) consulta.set('t', token);
  if (telefono) consulta.set('tel', telefono);
  const sufijo = consulta.size > 0 ? `?${consulta.toString()}` : '';

  try {
    const respuesta = await fetch(
      `${base.replace(/\/$/, '')}/api/orders/${encodeURIComponent(numero)}${sufijo}`,
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
