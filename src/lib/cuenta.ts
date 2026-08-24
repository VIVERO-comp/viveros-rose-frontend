// Puente de servidor hacia los endpoints de cuentas del order-api.
//
// Corre solo en las funciones de Vercel (src/pages/api/*): la ORDER_API_KEY
// nunca llega al navegador, y el token de sesion del order-api vive en una
// cookie httpOnly que este modulo administra — el JavaScript del navegador
// no puede leerlo, solo llamar a nuestras rutas /api/* que lo reenvian.
import type { AstroCookies } from 'astro';

export const SESION_COOKIE = 'pp_sesion';

function config() {
  const base = import.meta.env.ORDER_API_URL ?? process.env.ORDER_API_URL;
  const clave = import.meta.env.ORDER_API_KEY ?? process.env.ORDER_API_KEY;
  if (!base || !clave) return null;
  return { base: (base as string).replace(/\/$/, ''), clave: clave as string };
}

const sinConfigurar = () =>
  new Response(
    JSON.stringify({ error: 'not_configured', message: 'El backend de pedidos no está configurado.' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  );

const inalcanzable = () =>
  new Response(
    JSON.stringify({ error: 'upstream_unreachable', message: 'No pudimos completar la operación. Intenta de nuevo.' }),
    { status: 502, headers: { 'Content-Type': 'application/json' } },
  );

/** Reenvia una llamada al order-api con la API key (y la sesion, si hay). */
export async function llamarOrderApi(
  ruta: string,
  opciones: { metodo?: 'GET' | 'POST'; cuerpo?: unknown; token?: string } = {},
): Promise<Response> {
  const conf = config();
  if (!conf) return sinConfigurar();
  const headers: Record<string, string> = { 'X-API-Key': conf.clave };
  if (opciones.token) headers['X-Session-Token'] = opciones.token;
  if (opciones.cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  try {
    return await fetch(`${conf.base}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    });
  } catch {
    return inalcanzable();
  }
}

/**
 * Reenvia un formulario multipart al order-api (la foto de entrega del
 * repartidor): el JSON de llamarOrderApi no sirve para archivos.
 */
export async function llamarOrderApiForm(ruta: string, form: FormData): Promise<Response> {
  const conf = config();
  if (!conf) return sinConfigurar();
  try {
    return await fetch(`${conf.base}${ruta}`, {
      method: 'POST',
      headers: { 'X-API-Key': conf.clave },
      body: form,
    });
  } catch {
    return inalcanzable();
  }
}

export function tokenDeSesion(cookies: AstroCookies): string | undefined {
  return cookies.get(SESION_COOKIE)?.value;
}

export function guardarSesion(cookies: AstroCookies, token: string, dias: number): void {
  cookies.set(SESION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: dias * 24 * 60 * 60,
  });
}

export function borrarSesion(cookies: AstroCookies): void {
  cookies.delete(SESION_COOKIE, { path: '/' });
}

/**
 * Respuesta de un endpoint que abre sesion (verify, login, register-token):
 * guarda el token en la cookie y lo QUITA del cuerpo que ve el navegador.
 */
export async function responderConSesion(respuesta: Response, cookies: AstroCookies): Promise<Response> {
  const texto = await respuesta.text();
  if (!respuesta.ok) {
    return new Response(texto, { status: respuesta.status, headers: { 'Content-Type': 'application/json' } });
  }
  const datos = JSON.parse(texto) as { token: string; email: string; nombre: string; dias_sesion: number };
  guardarSesion(cookies, datos.token, datos.dias_sesion);
  return new Response(JSON.stringify({ ok: true, email: datos.email, nombre: datos.nombre }), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Lee el JSON del navegador; null si es ilegible (la ruta responde 400). */
export async function leerJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const cuerpoIlegible = () =>
  new Response(JSON.stringify({ error: 'invalid_json', message: 'Cuerpo ilegible.' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });

export const sinSesion = () =>
  new Response(JSON.stringify({ error: 'no_session', message: 'No has iniciado sesión.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
