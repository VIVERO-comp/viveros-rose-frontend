// Fotos de productos servidas desde Cloudinary.
//
// src/data/fotos.json lo genera scripts/fotos.py: SKU -> lista ordenada de
// hashes (la primera es la principal, la segunda el hover de la tarjeta).
// Cada foto vive en Cloudinary como productos/{SKU}/{hash}, un nombre
// inmutable: cambiar la principal o el orden solo regenera el JSON, nunca
// re-sube ni deja caches con la version vieja.
//
// f_auto,q_auto delega en Cloudinary el formato (WebP/AVIF segun navegador)
// y la compresion; c_fill,g_auto recorta al ratio pedido centrando en la
// planta detectada, no en el centro geometrico (una foto horizontal pierde
// los costados pero no parte la planta).

import datos from '../data/fotos.json';

const porSku = datos.porSku as Record<string, string[]>;
const manoPorSku = ((datos as { manoPorSku?: unknown }).manoPorSku ?? {}) as Record<string, string>;
const recortesPorHash = ((datos as { recortesPorHash?: unknown }).recortesPorHash ?? {}) as Record<
  string,
  [number, number, number, number]
>;

// Recorte decidido en la pagina de revision (fracciones 0..1 del original):
// se antepone como transformacion c_crop a TODA URL de esa foto, asi la
// tarjeta, la galeria y el circulo ven la misma foto ya recortada.
function segmentoRecorte(hash: string): string {
  const rec = recortesPorHash[hash];
  if (!rec) return '';
  const [x, y, w, h] = rec;
  return `c_crop,x_${x},y_${y},w_${w},h_${h}/`;
}
const macetasPorSku = ((datos as { macetasPorSku?: unknown }).macetasPorSku ?? {}) as Record<
  string,
  Partial<Record<ColorMaceta, string>>
>;
const BASE = `https://res.cloudinary.com/${datos.cloud}/image/upload`;

// Colores de maceta con foto (scripts/fotos.py, archivos "maceta-<color>-<slug>").
// Este orden fijo es el de la galeria y el del selector de colores.
export const COLORES_MACETA = ['beige', 'gris', 'marron'] as const;
export type ColorMaceta = (typeof COLORES_MACETA)[number];

// Hashes de las fotos de un producto, en el orden publicado. Las fotos de
// maceta NO vienen aqui (van en macetasDe): nunca son principal ni hover.
export function fotosDe(sku: string): string[] {
  return porSku[sku] ?? [];
}

// color -> hash de la foto de la planta en la maceta de ese color.
export function macetasDe(sku: string): Partial<Record<ColorMaceta, string>> {
  return macetasPorSku[sku] ?? {};
}

// Hash de la foto donde la mano sostiene la planta (scripts/fotos.py la
// marca con "mano"). El circulo de "Cuidado de X" la prefiere.
export function manoDe(sku: string): string | undefined {
  return manoPorSku[sku];
}

export function urlFoto(
  sku: string,
  hash: string,
  opciones: { ancho: number; ratio?: '4:5' | '1:1'; completa?: boolean },
): string {
  const recorte = segmentoRecorte(hash);
  if (opciones.completa) {
    // Foto entera (tras el recorte manual, si lo hay): encaja dentro de un
    // cuadro ancho x ancho conservando la proporcion (el visor usa cover).
    return `${BASE}/${recorte}f_auto,q_auto,c_fit,w_${opciones.ancho},h_${opciones.ancho}/productos/${sku}/${hash}`;
  }
  const ratio = opciones.ratio ?? '4:5';
  return `${BASE}/${recorte}f_auto,q_auto,c_fill,g_auto,ar_${ratio},w_${opciones.ancho}/productos/${sku}/${hash}`;
}
