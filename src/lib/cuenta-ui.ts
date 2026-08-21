// Utilidades de navegador para las paginas de /cuenta/*: llamadas a nuestras
// rutas /api/* y errores EN LINEA junto al campo (nunca alert ni bloques
// sueltos). Cada formulario marca sus huecos de error con
// <p class="field-error" data-error-for="campo" hidden>; "general" es el
// error del formulario completo (credenciales, enlaces vencidos, red caida).

export interface RespuestaCuenta {
  status: number;
  datos: Record<string, unknown>;
}

export async function llamarCuenta(
  url: string,
  cuerpo?: Record<string, unknown>,
): Promise<RespuestaCuenta> {
  try {
    const res = await fetch(url, {
      method: cuerpo === undefined ? 'GET' : 'POST',
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    let datos: Record<string, unknown> = {};
    try {
      datos = await res.json();
    } catch {
      // sin cuerpo JSON: el status alcanza
    }
    return { status: res.status, datos };
  } catch {
    return { status: 0, datos: { error: 'network' } };
  }
}

// Codigo de error del backend -> campo donde se muestra y mensaje en espanol.
const ERRORES: Record<string, { campo: string; mensaje: string }> = {
  network: { campo: 'general', mensaje: 'Sin conexión. Revisa tu internet e intenta de nuevo.' },
  not_configured: { campo: 'general', mensaje: 'El servicio no está disponible en este momento.' },
  upstream_unreachable: { campo: 'general', mensaje: 'No pudimos completar la operación. Intenta de nuevo en un momento.' },
  invalid_credentials: { campo: 'general', mensaje: 'Correo o contraseña incorrectos.' },
  email_registered: { campo: 'email', mensaje: 'Este correo ya tiene una cuenta. Puedes iniciar sesión.' },
  weak_password: { campo: 'contrasena', mensaje: 'La contraseña necesita al menos 8 caracteres.' },
  invalid_code: { campo: 'codigo', mensaje: 'Código incorrecto o vencido. Revisa tu correo.' },
  invalid_token: { campo: 'general', mensaje: 'Este enlace ya se usó o venció. Puedes crear tu cuenta con tu correo.' },
  invalid_request: { campo: 'general', mensaje: 'Faltan datos. Completa los campos e intenta de nuevo.' },
};

export function limpiarErrores(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLElement>('.field-error').forEach((el) => {
    el.hidden = true;
    el.textContent = '';
  });
  form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
}

export function mostrarError(form: HTMLFormElement, campo: string, mensaje: string): void {
  const hueco =
    form.querySelector<HTMLElement>(`[data-error-for="${campo}"]`) ??
    form.querySelector<HTMLElement>('[data-error-for="general"]');
  if (hueco) {
    hueco.textContent = mensaje;
    hueco.hidden = false;
  }
  form.querySelector(`[name="${campo}"]`)?.classList.add('invalid');
}

/** Pinta el error de una respuesta fallida junto al campo que corresponde. */
export function mostrarErrorDeRespuesta(form: HTMLFormElement, respuesta: RespuestaCuenta): void {
  const codigo = String(respuesta.datos.error ?? '');
  const conocido = ERRORES[codigo];
  if (conocido) {
    mostrarError(form, conocido.campo, conocido.mensaje);
    return;
  }
  mostrarError(form, 'general', 'Algo salió mal. Intenta de nuevo en un momento.');
}
