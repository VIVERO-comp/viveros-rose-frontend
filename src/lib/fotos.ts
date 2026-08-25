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
const BASE = `https://res.cloudinary.com/${datos.cloud}/image/upload`;

// Hashes de las fotos de un producto, en el orden publicado.
export function fotosDe(sku: string): string[] {
  return porSku[sku] ?? [];
}

export function urlFoto(
  sku: string,
  hash: string,
  opciones: { ancho: number; ratio?: '4:5' | '1:1' },
): string {
  const ratio = opciones.ratio ?? '4:5';
  return `${BASE}/f_auto,q_auto,c_fill,g_auto,ar_${ratio},w_${opciones.ancho}/productos/${sku}/${hash}`;
}
