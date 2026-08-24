// Historial de avisos para la pantalla de notificaciones del portal: los
// mismos eventos que disparan los Web Push (pedido listo, agarrado,
// retraso), pero consultables despues.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../lib/cuenta';

export const GET: APIRoute = async ({ url }) => {
  const clave = url.searchParams.get('clave') ?? '';
  const respuesta = await llamarOrderApi(
    `/api/repartidor/avisos?clave=${encodeURIComponent(clave)}`,
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
