// Calificacion de la entrega: GET pinta /calificar (entregado?, ya
// calificado?, quien lo llevo) y POST la guarda. El numero VR-... es la
// credencial, igual que en el rastreo.
export const prerender = false;

import type { APIRoute } from 'astro';
import { cuerpoIlegible, leerJson, llamarOrderApi } from '../../../lib/cuenta';

const NUMERO_VALIDO = /^VR-\d{8}-[A-Z2-9]{4,12}$/;

const numeroInvalido = () =>
  new Response(
    JSON.stringify({ error: 'order_not_found', message: 'Número de pedido inválido.' }),
    { status: 404, headers: { 'Content-Type': 'application/json' } },
  );

export const GET: APIRoute = async ({ params }) => {
  const numero = params.numero ?? '';
  if (!NUMERO_VALIDO.test(numero)) return numeroInvalido();
  const respuesta = await llamarOrderApi(`/api/calificaciones/${encodeURIComponent(numero)}`);
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  const numero = params.numero ?? '';
  if (!NUMERO_VALIDO.test(numero)) return numeroInvalido();
  const cuerpo = (await leerJson(request)) as {
    estrellas?: number;
    propina_centavos?: number;
    metodo_propina?: string;
  } | null;
  if (!cuerpo) return cuerpoIlegible();
  const respuesta = await llamarOrderApi(`/api/calificaciones/${encodeURIComponent(numero)}`, {
    metodo: 'POST',
    cuerpo: {
      estrellas: cuerpo.estrellas,
      propina_centavos: cuerpo.propina_centavos ?? 0,
      metodo_propina: cuerpo.metodo_propina ?? 'ninguno',
    },
  });
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
