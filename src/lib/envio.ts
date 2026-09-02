// Promocion de envio gratis: espejo de ENVIO_GRATIS_DESDE_CENTAVOS en el
// order-api, que es quien decide el costo real del envio. Aqui solo se
// muestra la misma regla en carrito y checkout para que el resumen coincida
// al centavo con lo que registra el backend: con subtotal de productos (sin
// ITBMS) desde el umbral, la entrega estandar sale gratis; prioritaria y retiro
// no cambian. PUBLIC_ENVIO_GRATIS_DESDE_CENTAVOS vacia apaga la promocion
// (apagarla tambien en el order-api, o los totales dejaran de coincidir).
const crudo = (import.meta.env.PUBLIC_ENVIO_GRATIS_DESDE_CENTAVOS ?? '15000') as string;

export const ENVIO_GRATIS_DESDE_CENTAVOS: number | null =
  crudo.trim() === '' ? null : Number(crudo);

/** Umbral en dolares (150), o null con la promocion apagada. */
export const ENVIO_GRATIS_DESDE: number | null =
  ENVIO_GRATIS_DESDE_CENTAVOS === null ? null : ENVIO_GRATIS_DESDE_CENTAVOS / 100;

/** True si un subtotal en dolares ya gana el envio estandar gratis. */
export function envioGratis(subtotal: number): boolean {
  return ENVIO_GRATIS_DESDE !== null && subtotal >= ENVIO_GRATIS_DESDE;
}

/** Dolares que faltan para el envio gratis (0 si ya se gano o esta apagada). */
export function faltaParaEnvioGratis(subtotal: number): number {
  if (ENVIO_GRATIS_DESDE === null) return 0;
  return Math.max(0, ENVIO_GRATIS_DESDE - subtotal);
}
