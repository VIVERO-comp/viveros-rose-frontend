// Colecciones del diseno "Colecciones / Shop Plantas" (claude.ai/design).
// Cada coleccion es un filtro sobre el catalogo real (src/data/products.ts):
// solo se definen las que los datos actuales pueden responder, para no
// mostrar colecciones vacias o inventadas. Los tests trabajan sobre una
// forma plana (ProductFacts) para poder correr igual en build (sobre
// Product) y en el navegador (sobre data-atributos de las tarjetas).

import type { Product } from './products';

export interface ProductFacts {
  name: string;
  category: string;
  care: string; // Facil | Media | Exigente
  light: string; // texto libre de care.light
  available: number;
  price: number;
  size: string; // pequena | mediana | grande | '' si no esta definido
  pet: string; // 'si' | 'no' | '' si no esta definido (no se inventa)
}

export function factsOf(p: Product): ProductFacts {
  return {
    name: p.name,
    category: p.category,
    care: p.care.difficulty,
    light: p.care.light,
    available: p.available,
    price: p.price,
    size: p.size ?? '',
    pet: p.petFriendly === undefined ? '' : p.petFriendly ? 'si' : 'no',
  };
}

export interface CollectionDef {
  slug: string;
  name: string;
  blurb: string;
  image?: string; // foto del tile (cuadrada); si falta, queda el placeholder
  test: (p: ProductFacts) => boolean;
}

export const collections: CollectionDef[] = [
  {
    slug: 'all',
    image: '/fotos_colecciones/all.jpeg',
    name: 'Todas las plantas',
    blurb: 'Cultivadas en nuestro vivero. Entrega a domicilio en la ciudad de Panamá.',
    test: () => true,
  },
  {
    slug: 'mas-vendidas',
    image: '/fotos_colecciones/mas-vendidas.jpeg',
    name: 'Las más vendidas',
    blurb: 'Lo que más sale del vivero cada semana.',
    test: (p) => p.available >= 40,
  },
  {
    slug: 'recien',
    image: '/fotos_colecciones/recien.jpeg',
    name: 'Recién del vivero',
    blurb: 'Tandas nuevas, listas para entregar esta semana.',
    test: (p) => p.available >= 15,
  },
  {
    slug: 'interior',
    image: '/fotos_colecciones/interior.jpeg',
    name: 'Plantas de interior',
    blurb: 'Follaje para apartamentos con luz filtrada y aire acondicionado.',
    test: (p) => p.category === 'interior',
  },
  {
    slug: 'exterior',
    image: '/fotos_colecciones/exterior.jpeg',
    name: 'Plantas de exterior',
    blurb: 'Para jardín, terraza y balcón: aguantan el sol y la lluvia del istmo.',
    test: (p) => p.category === 'exterior',
  },
  {
    slug: 'florales',
    image: '/fotos_colecciones/florales.jpeg',
    name: 'Florales',
    blurb: 'Color para jardineras, borduras y arreglos.',
    test: (p) => p.category === 'florales',
  },
  {
    slug: 'faciles',
    image: '/fotos_colecciones/faciles.jpeg',
    name: 'Fáciles de cuidar',
    blurb: 'Riego semanal y poca atención: perdonan el olvido.',
    test: (p) => p.care === 'Facil',
  },
  {
    slug: 'poca-luz',
    image: '/fotos_colecciones/poca-luz.jpeg',
    name: 'Poca luz',
    blurb: 'Para pasillos, baños y oficinas con luz baja o indirecta.',
    test: (p) => /baja|indirecta/i.test(p.light),
  },
  {
    slug: 'jardin',
    image: '/fotos_colecciones/jardin.jpeg',
    name: 'Sol pleno',
    blurb: 'Especies de sol para sembrar directo al suelo.',
    test: (p) => /sol/i.test(p.light),
  },
  {
    slug: 'ultimas',
    image: '/fotos_colecciones/ultimas.jpeg',
    name: 'Últimas unidades',
    blurb: 'Quedan pocas: se van por orden de pedido.',
    test: (p) => p.available > 0 && p.available <= 5,
  },
  {
    slug: 'pet-friendly',
    image: '/fotos_colecciones/pet-friendly.jpeg',
    name: 'Aptas para mascotas',
    blurb: 'Especies no tóxicas para perros y gatos.',
    // Solo cuenta el "si" explicito del catalogo; sin dato no se asume nada.
    test: (p) => p.pet === 'si',
  },
  {
    slug: 'regalar',
    image: '/fotos_colecciones/regalar.jpeg',
    name: 'Para regalar',
    blurb: 'Florales y plantas de interior fáciles de cuidar, listas para sorprender.',
    test: (p) => p.care === 'Facil' && (p.category === 'florales' || p.category === 'interior'),
  },
  // La coleccion "En oferta" se quito junto con la promo del 15% (los precios
  // actuales son placeholder). Reponerla cuando haya una oferta real.
  // Tipos de planta del diseno (filtros por nombre sobre el catalogo real).
  {
    slug: 'rosales',
    image: '/fotos_colecciones/rosales.jpeg',
    name: 'Rosales',
    blurb: 'Rosales de vivero para jardineras con sol de mañana.',
    test: (p) => /rosa/i.test(p.name),
  },
  {
    slug: 'palmas',
    image: '/fotos_colecciones/palmas.jpeg',
    name: 'Palmas',
    blurb: 'Para cercas vivas, entradas y esquinas de terraza.',
    test: (p) => /palma/i.test(p.name),
  },
  {
    slug: 'crotos',
    image: '/fotos_colecciones/crotos.jpeg',
    name: 'Crotos y follaje',
    blurb: 'Color permanente y bajo mantenimiento.',
    test: (p) => /croto/i.test(p.name),
  },
  {
    slug: 'suculentas',
    image: '/fotos_colecciones/suculentas.jpeg',
    name: 'Cactus y suculentas',
    blurb: 'Poca agua y mucho sol: cactus, suculentas, aloe y jade.',
    test: (p) => /cactus|suculenta|haworthia|jade|sabila/i.test(p.name),
  },
  {
    slug: 'hierbas',
    image: '/fotos_colecciones/hierbas.jpeg',
    name: 'Hierbas de cocina',
    blurb: 'Albahaca, menta, romero y más, listas para tu huerto casero.',
    test: (p) => /albahaca|menta|oregano|romero|tomillo|hierba|apio|ruda/i.test(p.name),
  },
];

export function getCollection(slug: string | null | undefined): CollectionDef {
  return collections.find((c) => c.slug === slug) ?? collections[0];
}
