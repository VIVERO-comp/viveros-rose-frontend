// Pruebas del reintento de "agarrar" (409 not_available). Corren con el
// runner de Node, sin dependencias:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { decidirTrasNoDisponible } from './repartidor.ts';

test('el reintento con el pedido ya asignado a mi dice que es mio', () => {
  // El agarrar anterior SI entro (la respuesta se perdio por la senal): el
  // detalle refrescado dice es_mio y el mensaje no es el error de senal.
  const decision = decidirTrasNoDisponible(
    { es_mio: true },
    'Solo se puede agarrar un pedido pagado que aun no salio.',
  );
  assert.equal(decision.esMio, true);
  assert.equal(decision.mensaje, 'Este pedido ya está confirmado a tu nombre.');
});

test('si el pedido no es mio se muestra el motivo del servidor', () => {
  const decision = decidirTrasNoDisponible(
    { es_mio: false },
    'Solo se puede agarrar un pedido pagado que aun no salio.',
  );
  assert.equal(decision.esMio, false);
  assert.equal(decision.mensaje, 'Solo se puede agarrar un pedido pagado que aun no salio.');
});

test('sin detalle ni motivo queda el mensaje generico de no disponible', () => {
  const decision = decidirTrasNoDisponible(null, undefined);
  assert.equal(decision.esMio, false);
  assert.equal(decision.mensaje, 'Este pedido ya no se puede confirmar.');
});
