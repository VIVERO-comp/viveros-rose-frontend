// La matematica del "tirar para refrescar": friccion, tope y umbral.
// Corre con:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAX_PX, UMBRAL_PX, amortiguar, progreso } from './refrescar.ts';

test('la friccion amortigua el jalon y nunca pasa del tope', () => {
  assert.equal(amortiguar(0), 0);
  assert.equal(amortiguar(-30), 0);
  assert.equal(amortiguar(100), 45); // 100px de dedo -> 45px de disco
  assert.equal(amortiguar(10_000), MAX_PX);
  // Monotona: mas dedo nunca es menos disco.
  assert.ok(amortiguar(120) >= amortiguar(80));
});

test('el umbral de soltar exige un jalon real', () => {
  // Para llegar al umbral amortiguado hay que arrastrar ~156px de dedo:
  // un toque corto no refresca por accidente.
  assert.ok(amortiguar(150) < UMBRAL_PX);
  assert.ok(amortiguar(160) >= UMBRAL_PX);
});

test('el progreso va de 0 a 1 y se satura', () => {
  assert.equal(progreso(0), 0);
  assert.equal(progreso(UMBRAL_PX / 2), 0.5);
  assert.equal(progreso(UMBRAL_PX), 1);
  assert.equal(progreso(MAX_PX), 1);
  assert.equal(progreso(-5), 0);
});
