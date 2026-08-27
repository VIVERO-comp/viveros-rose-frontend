// Ayudas puras del panel /admin, probables sin navegador.
//
// La regla de seguridad del panel vive en peticionAdmin: la clave viaja
// SIEMPRE en el header X-Clave-Admin y nunca en la query string (no queda
// en logs de Vercel ni en historiales). El order-api valida la clave contra
// Odoo en cada peticion.

export interface PeticionAdmin {
  url: string;
  init: RequestInit;
}

export function peticionAdmin(
  ruta: string,
  clave: string,
  init: RequestInit = {},
): PeticionAdmin {
  if (ruta.includes(encodeURIComponent(clave)) || ruta.includes(clave)) {
    // Red de seguridad: si alguien intenta armar la URL con la clave, se
    // frena aqui antes de que salga del navegador.
    throw new Error('La clave de admin nunca viaja en la URL.');
  }
  const encabezados = new Headers(init.headers);
  encabezados.set('X-Clave-Admin', clave);
  return { url: ruta, init: { ...init, headers: encabezados } };
}

/** "92 min" -> "1 h 32 min"; menos de una hora queda en minutos. */
export function duracionLegible(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined) return '—';
  const redondeados = Math.round(minutos);
  if (redondeados < 60) return `${redondeados} min`;
  const horas = Math.floor(redondeados / 60);
  const resto = redondeados % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

/** Cuanto lleva corriendo algo que empezo en `desde` (fecha UTC de Odoo). */
export function minutosDesde(desde: string, ahora: Date): number {
  const inicio = new Date(desde.replace(' ', 'T') + 'Z');
  return Math.max(0, Math.round((ahora.getTime() - inicio.getTime()) / 60000));
}
