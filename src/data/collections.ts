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
  test: (p: ProductFacts) => boolean;
}

export const collections: CollectionDef[] = [
  {
    slug: 'all',
    name: 'Todas las plantas',
    blurb: 'Cultivadas en nuestro vivero. Entrega a domicilio en la ciudad de Panamá.',
    test: () => true,
  },
  {
    slug: 'mas-vendidas',
    name: 'Las más vendidas',
    blurb: 'Lo que más sale del vivero cada semana.',
    test: (p) => p.available >= 40,
  },
  {
    slug: 'recien',
    name: 'Recién del vivero',
    blurb: 'Tandas nuevas, listas para entregar esta semana.',
    test: (p) => p.available >= 15,
  },
  {
    slug: 'interior',
    name: 'Plantas de interior',
    blurb: 'Follaje para apartamentos con luz filtrada y aire acondicionado.',
    test: (p) => p.category === 'interior',
  },
  {
    slug: 'exterior',
    name: 'Plantas de exterior',
    blurb: 'Para jardín, terraza y balcón: aguantan el sol y la lluvia del istmo.',
    test: (p) => p.category === 'exterior',
  },
  {
    slug: 'florales',
    name: 'Florales',
    blurb: 'Color para jardineras, borduras y arreglos.',
    test: (p) => p.category === 'florales',
  },
  {
    slug: 'faciles',
    name: 'Fáciles de cuidar',
    blurb: 'Riego semanal y poca atención: perdonan el olvido.',
    test: (p) => p.care === 'Facil',
  },
  {
    slug: 'poca-luz',
    name: 'Poca luz',
    blurb: 'Para pasillos, baños y oficinas con luz baja o indirecta.',
    test: (p) => /baja|indirecta/i.test(p.light),
  },
  {
    slug: 'jardin',
    name: 'Sol pleno',
    blurb: 'Especies de sol para sembrar directo al suelo.',
    test: (p) => /sol/i.test(p.light),
  },
  {
    slug: 'ultimas',
    name: 'Últimas unidades',
    blurb: 'Quedan pocas: se van por orden de pedido.',
    test: (p) => p.available > 0 && p.available <= 5,
  },
  {
    slug: 'pet-friendly',
    name: 'Aptas para mascotas',
    blurb: 'Especies no tóxicas para perros y gatos.',
    // Solo cuenta el "si" explicito del catalogo; sin dato no se asume nada.
    test: (p) => p.pet === 'si',
  },
  // La coleccion "En oferta" se quito junto con la promo del 15% (los precios
  // actuales son placeholder). Reponerla cuando haya una oferta real.
  // Tipos de planta del diseno (filtros por nombre sobre el catalogo real).
  {
    slug: 'rosales',
    name: 'Rosales',
    blurb: 'Rosales de vivero para jardineras con sol de mañana.',
    test: (p) => /rosa/i.test(p.name),
  },
  {
    slug: 'palmas',
    name: 'Palmas',
    blurb: 'Para cercas vivas, entradas y esquinas de terraza.',
    test: (p) => /palma/i.test(p.name),
  },
  {
    slug: 'crotos',
    name: 'Crotos y follaje',
    blurb: 'Color permanente y bajo mantenimiento.',
    test: (p) => /croto/i.test(p.name),
  },
  {
    slug: 'suculentas',
    name: 'Cactus y suculentas',
    blurb: 'Poca agua y mucho sol: cactus, suculentas, aloe y jade.',
    test: (p) => /cactus|suculenta|haworthia|jade|sabila/i.test(p.name),
  },
  {
    slug: 'hierbas',
    name: 'Hierbas de cocina',
    blurb: 'Albahaca, menta, romero y más, listas para tu huerto casero.',
    test: (p) => /albahaca|menta|oregano|romero|tomillo|hierba|apio|ruda/i.test(p.name),
  },
];

export function getCollection(slug: string | null | undefined): CollectionDef {
  return collections.find((c) => c.slug === slug) ?? collections[0];
}
