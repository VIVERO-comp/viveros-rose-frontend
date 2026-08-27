// Pruebas del panel /admin: la clave nunca en la URL, y los formatos de
// duracion que pinta la pantalla de inicio. Corren con:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { duracionLegible, minutosDesde, peticionAdmin } from './admin.ts';

test('la clave de admin viaja en el header y nunca en la URL', () => {
  const clave = 'clave-secreta-123';
  const peticion = peticionAdmin('/api/admin/pedidos', clave, { method: 'POST' });
  assert.equal(peticion.url, '/api/admin/pedidos');
  assert.ok(!peticion.url.includes(clave));
  assert.equal(new Headers(peticion.init.headers).get('X-Clave-Admin'), clave);
  assert.equal(peticion.init.method, 'POST');
});

test('armar una URL con la clave adentro se rechaza', () => {
  const clave = 'clave-secreta-123';
  assert.throws(
    () => peticionAdmin(`/api/admin/pedidos?clave=${clave}`, clave),
    /nunca viaja en la URL/,
  );
});

test('duraciones legibles para la tarjeta de tiempos', () => {
  assert.equal(duracionLegible(45), '45 min');
  assert.equal(duracionLegible(92), '1 h 32 min');
  assert.equal(duracionLegible(120), '2 h');
  assert.equal(duracionLegible(null), '—');
});

test('minutos desde una fecha UTC de Odoo', () => {
  const ahora = new Date('2026-08-24T16:00:00Z');
  assert.equal(minutosDesde('2026-08-24 15:30:00', ahora), 30);
  // Un reloj adelantado no produce negativos.
  assert.equal(minutosDesde('2026-08-24 16:30:00', ahora), 0);
});
