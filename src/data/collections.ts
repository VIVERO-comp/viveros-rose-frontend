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
}

export function factsOf(p: Product): ProductFacts {
  return {
    name: p.name,
    category: p.category,
    care: p.care.difficulty,
    light: p.care.light,
    available: p.available,
    price: p.price,
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
    slug: 'frutales',
    name: 'Frutales injertados',
    blurb: 'Árboles y arbustos que producen en dos o tres años.',
    test: (p) => p.category === 'frutales',
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
];

export function getCollection(slug: string | null | undefined): CollectionDef {
  return collections.find((c) => c.slug === slug) ?? collections[0];
}
