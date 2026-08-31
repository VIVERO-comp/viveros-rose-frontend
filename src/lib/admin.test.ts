// Pruebas del panel /admin: la clave nunca en la URL, y los formatos de
// duracion que pinta la pantalla de inicio. Corren con:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ETIQUETA_ESTADO, agruparPedidos, duracionLegible, minutosDesde, peticionAdmin } from './admin.ts';

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

test('la lista del panel pone primero lo que pide atencion', () => {
  const bloques = agruparPedidos({
    por_validar: [
      { numero: 'VR-N2', estado: 'por_validar', creado_en: '2026-08-28 15:00:00' },
      { numero: 'VR-N1', estado: 'por_validar', creado_en: '2026-08-28 14:00:00' },
    ],
    activos: [
      { numero: 'VR-A2', estado: 'listo', pagado_en: '2026-08-28 12:00:00', con_retraso: false },
      { numero: 'VR-R1', estado: 'en_camino', pagado_en: '2026-08-27 09:00:00', con_retraso: true },
      { numero: 'VR-A1', estado: 'en_camino', pagado_en: '2026-08-28 10:00:00', con_retraso: false },
    ],
    terminados: [
      { numero: 'VR-T1', estado: 'cancelado', terminado_en: '2026-08-26 10:00:00' },
      { numero: 'VR-T2', estado: 'entregado', terminado_en: '2026-08-27 18:00:00' },
    ],
  });
  // Los nuevos: el que lleva mas tiempo esperando, arriba.
  assert.deepEqual(bloques.porValidar.map((p) => p.numero), ['VR-N1', 'VR-N2']);
  assert.deepEqual(bloques.conRetraso.map((p) => p.numero), ['VR-R1']);
  assert.deepEqual(bloques.enProceso.map((p) => p.numero), ['VR-A1', 'VR-A2']);
  // Los terminados: el mas reciente primero.
  assert.deepEqual(bloques.terminados.map((p) => p.numero), ['VR-T2', 'VR-T1']);
});

test('terminados en el mismo segundo se desempatan por numero, como el cursor', () => {
  const bloques = agruparPedidos({
    terminados: [
      { numero: 'VR-A', estado: 'entregado', terminado_en: '2026-08-27 18:00:00' },
      { numero: 'VR-C', estado: 'cancelado', terminado_en: '2026-08-27 18:00:00' },
      { numero: 'VR-B', estado: 'entregado', terminado_en: '2026-08-27 18:00:00' },
    ],
  });
  assert.deepEqual(bloques.terminados.map((p) => p.numero), ['VR-C', 'VR-B', 'VR-A']);
});

test('una respuesta sin alguna lista no rompe la agrupacion', () => {
  const bloques = agruparPedidos({});
  assert.deepEqual(bloques, { porValidar: [], conRetraso: [], enProceso: [], terminados: [] });
  assert.equal(ETIQUETA_ESTADO.por_validar, 'Por validar');
});
