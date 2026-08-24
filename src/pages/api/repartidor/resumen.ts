// Resumen para la pantalla de inicio del portal: ganancias de hoy (pagos
// sellados en Odoo mas propinas registradas), pendientes y entregas
// recientes. La clave del enlace personal viaja como query y el order-api la
// valida contra Odoo; la ORDER_API_KEY nunca llega al navegador.
export const prerender = false;

import type { APIRoute } from 'astro';
import { llamarOrderApi } from '../../../lib/cuenta';

export const GET: APIRoute = async ({ url }) => {
  const clave = url.searchParams.get('clave') ?? '';
  const respuesta = await llamarOrderApi(
    `/api/repartidor/resumen?clave=${encodeURIComponent(clave)}`,
  );
  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
