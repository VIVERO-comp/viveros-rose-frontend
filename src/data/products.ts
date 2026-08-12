// Catalogo de ejemplo. La forma de estos datos sigue la propuesta de diseno:
// el SKU es la llave que conecta con el stock proxy y con Odoo.
// Cuando exista el export real de Odoo, este archivo se reemplaza por esa fuente.

export interface Category {
  slug: string;
  name: string;
  description: string;
  emoji: string;
}

export interface Product {
  sku: string;
  slug: string;
  category: string; // Category.slug
  name: string;
  scientificName: string;
  price: number; // USD
  description: string;
  care: {
    light: string;
    water: string;
    difficulty: 'Facil' | 'Media' | 'Exigente';
  };
  // Stock de ejemplo. En produccion `available` viene del stock proxy.
  available: number;
  emoji: string;
}

export const categories: Category[] = [
  {
    slug: 'interior',
    name: 'Plantas de interior',
    description: 'Follaje para casa y oficina, adaptado al clima de Panama.',
    emoji: '🪴',
  },
  {
    slug: 'exterior',
    name: 'Plantas de exterior',
    description: 'Jardin, terraza y balcon. Sol pleno o sombra parcial.',
    emoji: '🌳',
  },
  {
    slug: 'florales',
    name: 'Florales',
    description: 'Color para jardines y arreglos. Rosas, veraneras y mas.',
    emoji: '🌺',
  },
  {
    slug: 'frutales',
    name: 'Frutales',
    description: 'Arboles y arbustos frutales para patio y finca.',
    emoji: '🥭',
  },
];

export const products: Product[] = [
  {
    sku: 'ROSA-ROJA-01',
    slug: 'rosa-roja',
    category: 'florales',
    name: 'Rosa roja',
    scientificName: 'Rosa spp.',
    price: 8.5,
    description:
      'Rosal clasico de flor roja, producido en nuestro vivero. Ideal para jardineras y borduras con sol directo de manana.',
    care: { light: 'Sol directo (4-6 h)', water: '3 veces por semana', difficulty: 'Media' },
    available: 47,
    emoji: '🌹',
  },
  {
    sku: 'FICUS-LYRATA-M',
    slug: 'ficus-lyrata',
    category: 'interior',
    name: 'Ficus lyrata (mediano)',
    scientificName: 'Ficus lyrata',
    price: 35,
    description:
      'El clasico "fiddle leaf fig" en tamano mediano (80-100 cm). Hojas grandes y esculturales para interiores luminosos.',
    care: { light: 'Luz indirecta brillante', water: '1 vez por semana', difficulty: 'Exigente' },
    available: 4,
    emoji: '🌿',
  },
  {
    sku: 'AGLAO-SILVER',
    slug: 'aglaonema-silver-bay',
    category: 'interior',
    name: 'Aglaonema Silver Bay',
    scientificName: 'Aglaonema commutatum',
    price: 18,
    description:
      'Follaje plateado que tolera poca luz. Una de las plantas de interior mas nobles para oficinas y apartamentos.',
    care: { light: 'Luz baja a media', water: 'Cada 7-10 dias', difficulty: 'Facil' },
    available: 22,
    emoji: '🍃',
  },
  {
    sku: 'MONSTERA-DEL-G',
    slug: 'monstera-deliciosa',
    category: 'interior',
    name: 'Monstera deliciosa (grande)',
    scientificName: 'Monstera deliciosa',
    price: 42,
    description:
      'Ejemplar grande con hojas fenestradas. Crece rapido en el clima humedo de Panama con luz indirecta.',
    care: { light: 'Luz indirecta', water: '1-2 veces por semana', difficulty: 'Facil' },
    available: 9,
    emoji: '🌱',
  },
  {
    sku: 'VERANERA-FUCSIA',
    slug: 'veranera-fucsia',
    category: 'florales',
    name: 'Veranera fucsia',
    scientificName: 'Bougainvillea glabra',
    price: 12,
    description:
      'Buganvilla de floracion intensa, resistente al sol pleno. La reina de los jardines panamenos.',
    care: { light: 'Sol pleno', water: '2 veces por semana', difficulty: 'Facil' },
    available: 60,
    emoji: '🌺',
  },
  {
    sku: 'PALMA-ARECA-M',
    slug: 'palma-areca',
    category: 'exterior',
    name: 'Palma areca (mediana)',
    scientificName: 'Dypsis lutescens',
    price: 25,
    description:
      'Palma multiplicadora ideal para cercas vivas y esquinas de terraza. Tolera sol y sombra parcial.',
    care: { light: 'Sol o sombra parcial', water: '2-3 veces por semana', difficulty: 'Facil' },
    available: 15,
    emoji: '🌴',
  },
  {
    sku: 'IXORA-ROJA',
    slug: 'ixora-roja',
    category: 'exterior',
    name: 'Ixora roja',
    scientificName: 'Ixora coccinea',
    price: 6,
    description:
      'Arbusto compacto de flor roja continua. El estandar para borduras y setos bajos en Panama.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 120,
    emoji: '🔥',
  },
  {
    sku: 'MANGO-CALIDAD',
    slug: 'mango-calidad',
    category: 'frutales',
    name: 'Mango injertado "Calidad"',
    scientificName: 'Mangifera indica',
    price: 20,
    description:
      'Arbol de mango injertado que produce en 2-3 anos. Fruta dulce de tamano medio, ideal para patio.',
    care: { light: 'Sol pleno', water: '2 veces por semana el primer ano', difficulty: 'Facil' },
    available: 0,
    emoji: '🥭',
  },
  {
    sku: 'LIMON-PERSA',
    slug: 'limon-persa',
    category: 'frutales',
    name: 'Limon persa injertado',
    scientificName: 'Citrus latifolia',
    price: 18,
    description:
      'Limonero injertado de produccion temprana. Perfecto para macetas grandes o directo al suelo.',
    care: { light: 'Sol pleno', water: '2-3 veces por semana', difficulty: 'Media' },
    available: 3,
    emoji: '🍋',
  },
  {
    sku: 'CROTO-PETRA',
    slug: 'croto-petra',
    category: 'exterior',
    name: 'Croto Petra',
    scientificName: 'Codiaeum variegatum',
    price: 7.5,
    description:
      'Follaje multicolor de bajo mantenimiento. Da estructura y color permanente a cualquier jardin.',
    care: { light: 'Sol pleno o parcial', water: '2 veces por semana', difficulty: 'Facil' },
    available: 80,
    emoji: '🍂',
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

export function getProduct(category: string, slug: string): Product | undefined {
  return products.find((p) => p.category === category && p.slug === slug);
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
