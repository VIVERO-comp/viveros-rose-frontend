// Decision del portal /repartidor cuando "agarrar" responde 409
// not_available: puede ser el reintento de un agarrar que SI entro pero
// cuya respuesta se perdio por la senal. Antes de dar el error generico,
// el portal refresca el detalle (que trae es_mio del order-api) y decide
// con esta funcion, que es pura para poder probarla sin navegador.

export interface DecisionReintento {
  /** El pedido ya esta asignado a quien intento agarrarlo. */
  esMio: boolean;
  /** Lo que se le muestra al repartidor. */
  mensaje: string;
}

export function decidirTrasNoDisponible(
  detalle: { es_mio?: boolean } | null | undefined,
  mensajeServidor?: string | null,
): DecisionReintento {
  if (detalle?.es_mio) {
    return { esMio: true, mensaje: 'Este pedido ya está confirmado a tu nombre.' };
  }
  return {
    esMio: false,
    mensaje: mensajeServidor || 'Este pedido ya no se puede agarrar.',
  };
}
