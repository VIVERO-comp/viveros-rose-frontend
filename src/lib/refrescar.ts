// "Tirar para refrescar" del portal /repartidor y el panel /admin.
//
// Solo tacto (touch*): el mouse no dispara estos eventos, asi que en
// escritorio no interfiere y el boton "Actualizar" sigue siendo el camino.
// El disco indicador baja con el dedo desde el tope, con un arco que se
// llena al acercarse al umbral y gira mientras la pantalla recarga. Las
// animaciones que no siguen al dedo (giro y regreso) viven en CSS y se
// apagan con prefers-reduced-motion; el seguimiento del dedo es
// manipulacion directa y se conserva.

// El jalon crudo se amortigua (friccion) para que se sienta elastico como
// en las apps nativas; estos numeros son px ya amortiguados.
export const UMBRAL_PX = 70;
export const MAX_PX = 110;
const FRICCION = 0.45;

/** Distancia cruda del dedo -> distancia amortiguada del disco. */
export function amortiguar(dy: number): number {
  if (dy <= 0) return 0;
  return Math.min(MAX_PX, dy * FRICCION);
}

/** 0..1: cuanto falta para soltar y refrescar. */
export function progreso(jalado: number): number {
  return Math.min(1, Math.max(0, jalado) / UMBRAL_PX);
}

export function instalarTirarParaRefrescar(opciones: {
  indicador: HTMLElement;
  alRefrescar: () => Promise<void>;
}): void {
  const { indicador, alRefrescar } = opciones;
  const arco = indicador.querySelector<SVGCircleElement>('.ptr-arco')!;
  const svg = indicador.querySelector<SVGElement>('[data-ptr-svg]')!;

  const OCULTO = 'translate(-50%, -48px)';
  let inicioY = 0;
  let armado = false;
  let jalando = false;
  let jalado = 0;
  let refrescando = false;

  function pintar() {
    const avance = progreso(jalado);
    indicador.style.transform = `translate(-50%, ${Math.round(jalado) - 48}px)`;
    indicador.style.opacity = String(Math.min(1, avance * 1.4));
    // El arco se llena hasta 80% jalando; el 100% queda para el giro.
    arco.style.strokeDashoffset = String(1 - 0.8 * avance);
    svg.style.transform = `rotate(${Math.round(140 * avance)}deg)`;
  }

  function esconder() {
    indicador.classList.add('ptr--volviendo');
    indicador.style.transform = OCULTO;
    indicador.style.opacity = '0';
    setTimeout(() => {
      indicador.classList.remove('ptr--volviendo', 'ptr--girando');
      arco.style.strokeDashoffset = '1';
      svg.style.transform = '';
    }, 220);
  }

  document.addEventListener(
    'touchstart',
    (e) => {
      if (refrescando || e.touches.length !== 1) return;
      // Solo se arma con la pagina en el tope: a media lista, esto es un
      // scroll normal.
      armado = window.scrollY <= 0;
      inicioY = e.touches[0].clientY;
      jalando = false;
      jalado = 0;
    },
    { passive: true },
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (!armado || refrescando || e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - inicioY;
      if (!jalando) {
        // 8px de tolerancia antes de decidir que es un jalon y no un toque.
        if (dy > 8 && window.scrollY <= 0) jalando = true;
        else {
          if (dy < 0) armado = false; // scroll hacia arriba: no es un jalon
          return;
        }
      }
      if (dy <= 0) {
        jalando = false;
        jalado = 0;
        esconder();
        return;
      }
      // Mientras se jala, la pagina no scrollea (por eso passive: false).
      e.preventDefault();
      jalado = amortiguar(dy);
      pintar();
    },
    { passive: false },
  );

  async function soltar() {
    if (!jalando) return;
    jalando = false;
    armado = false;
    if (jalado < UMBRAL_PX) {
      jalado = 0;
      esconder();
      return;
    }
    refrescando = true;
    jalado = UMBRAL_PX;
    pintar();
    indicador.classList.add('ptr--girando');
    try {
      await alRefrescar();
    } catch {
      // El cargador de cada pantalla ya pinta su propio error.
    }
    refrescando = false;
    jalado = 0;
    esconder();
  }

  document.addEventListener('touchend', soltar, { passive: true });
  document.addEventListener('touchcancel', soltar, { passive: true });
}
