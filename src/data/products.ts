// Catalogo real exportado de Odoo (Producto (product.template).xlsx, 2026-08-18).
// El SKU es la referencia interna de Odoo: la llave que conecta con el stock proxy.
// Datos que Odoo aun no tiene y quedan como placeholder hasta completarlos:
// precio ($5 parejo), descripcion, cuidados, nombre cientifico y categoria
// (asignada por heuristica sobre el nombre). Los cuidados (luz, riego,
// dificultad) y el tamano tambien estan asignados por heuristica sobre el
// nombre de la especie: revisarlos con el equipo del vivero.
// `available` queda en 0 porque el
// stock real lo pinta el stock proxy en el navegador via data-sku.

import { PRECIO_MINIMO_CENTAVOS } from '../lib/stock';
import { COLORES_MACETA, fotosDe, macetasDe, urlFoto } from '../lib/fotos';

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
  price: number; // USD (precio REGULAR; el hardcodeado es placeholder y
  // catalogo-build lo reemplaza en cada build con el list_price real de Odoo
  // via el stock proxy)
  // Precio de oferta en USD. Nunca se escribe a mano aqui: lo inyecta
  // catalogo-build cuando el producto tiene la casilla "En oferta" en Odoo
  // con una oferta valida (0 < oferta < regular).
  offerPrice?: number;
  // Unidades vendidas totales (manuales de ventas.ts + confirmadas en Odoo).
  // Nunca se escribe a mano aqui: lo inyecta catalogo-build; sin proxy queda
  // ausente y ventasTotales() cae a las manuales.
  ventas?: number;
  description: string;
  care: {
    light: string;
    water: string;
    difficulty: 'Facil' | 'Media' | 'Exigente';
  };
  // Stock de ejemplo. En produccion `available` viene del stock proxy.
  available: number;
  emoji: string;
  // Apta para hogares con mascotas (aviso del diseno de producto).
  // Opcional a proposito: si falta, la pagina de producto OCULTA la linea de
  // mascotas en vez de mostrar un dato inventado. Solo esta definido en las
  // especies cuya toxicidad es conocida; completar el resto con el equipo.
  petFriendly?: boolean;
  // Foto principal, hover de la tarjeta y galeria. NUNCA se escriben a mano:
  // las pinta el bucle del final de este archivo con las URLs de Cloudinary
  // que scripts/fotos.py deja en src/data/fotos.json. Si el producto no
  // tiene fotos, la tarjeta muestra el emoji.
  image?: string;
  imageHover?: string;
  gallery?: string[];
  // Porte de la planta tal como se vende (filtro "Tamano" del catalogo).
  // Valores iniciales estimados por el nombre/descripcion; revisar con el
  // equipo del vivero. Si falta, el filtro de tamano no muestra el producto.
  size?: 'pequena' | 'mediana' | 'grande';
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
    description: 'Color para jardines y arreglos. Rosas, crisantemos y mas.',
    emoji: '🌺',
  },
  // La categoria "frutales" se quito porque el catalogo de Odoo aun no tiene
  // frutales; reponerla aqui (y en menus/tiles) cuando existan en Odoo.
];

export const products: Product[] = [
  {
    sku: 'PL-AGAVE-GIGANTE',
    slug: 'agave-gigante',
    category: 'exterior',
    name: 'Agave gigante',
    scientificName: '',
    price: 79,
    description:
      'Agave gigante de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'grande',
  },
  {
    sku: 'PL-AGLONEMAS',
    slug: 'aglonemas',
    category: 'interior',
    name: 'Aglonemas',
    scientificName: '',
    price: 5.25,
    description:
      'Aglonemas de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1 vez por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-AJI-BOLITA',
    slug: 'aji-bolita',
    category: 'exterior',
    name: 'Aji bolita',
    scientificName: '',
    price: 7.49,
    description:
      'Aji bolita de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-ALBAHACA-ROJA',
    slug: 'albahaca-roja',
    category: 'exterior',
    name: 'Albahaca roja',
    scientificName: '',
    price: 3,
    description:
      'Albahaca roja de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PL-ALBAHACA-VERDE',
    slug: 'albahaca-verde',
    category: 'exterior',
    name: 'Albahaca verde',
    scientificName: '',
    price: 3,
    description:
      'Albahaca verde de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PL-ALOCASIA-GIGANTE-VARIEGADA',
    slug: 'alocasia-gigante-variegada',
    category: 'interior',
    name: 'Alocasia gigante variegada',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Alocasia gigante variegada de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'grande',
  },
  {
    sku: 'PL-ANTHURIO-FLOR',
    slug: 'anturio',
    category: 'florales',
    name: 'Anturio',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Anturio de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌺',
    size: 'mediana',
  },
  {
    sku: 'PL-ANTORCHA',
    slug: 'antorcha',
    category: 'florales',
    name: 'Antorcha',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Antorcha de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌺',
    size: 'mediana',
  },
  {
    sku: 'PL-APIO',
    slug: 'apio',
    category: 'exterior',
    name: 'Apio',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Apio de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PL-ARALIAS',
    slug: 'aralias',
    category: 'interior',
    name: 'Aralias',
    scientificName: '',
    price: 7,
    description:
      'Aralias de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o luz indirecta brillante', water: '2–3 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-ARBOL-CITRONELA',
    slug: 'arbol-citronela',
    category: 'exterior',
    name: 'Arbol citronela',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Arbol citronela de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PL-BAMBU-ENTRENZAS',
    slug: 'bambu-entrenzas',
    category: 'exterior',
    name: 'Bambu entrenzas',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Bambu entrenzas de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o luz indirecta brillante', water: '2–3 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-BIJAO-TRICOLOR',
    slug: 'bijao-tricolor',
    category: 'interior',
    name: 'Bijao tricolor',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Bijao tricolor de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: 'Riego frecuente, sustrato húmedo', difficulty: 'Exigente' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-BUQUE-COLOMBIANO',
    slug: 'buque-colombiano',
    category: 'florales',
    name: 'Buque colombiano',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Buque colombiano de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'mediana',
  },
  {
    sku: 'PL-CACTUS-GRANDE',
    slug: 'cactus-grande',
    category: 'interior',
    name: 'Cactus grande',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cactus grande de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌵',
    size: 'grande',
  },
  {
    sku: 'PL-CACTUS-HUESO-DE-DRAGON',
    slug: 'cactus-hueso-de-dragon',
    category: 'interior',
    name: 'Cactus hueso de dragon',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cactus hueso de dragon de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌵',
    size: 'pequena',
  },
  {
    sku: 'PL-CACTUS-MEDIANO',
    slug: 'cactus-mediano',
    category: 'interior',
    name: 'Cactus mediano',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cactus mediano de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌵',
    size: 'mediana',
  },
  {
    sku: 'PL-CACTUS-PEQUENO',
    slug: 'cactus-pequeno',
    category: 'interior',
    name: 'Cactus pequeno',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cactus pequeno de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌵',
    size: 'pequena',
  },
  {
    sku: 'PL-CALATHEA-CEBRINA',
    slug: 'calathea-cebrina',
    category: 'interior',
    name: 'Calathea cebrina',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Calathea cebrina de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: 'Riego frecuente, sustrato húmedo', difficulty: 'Exigente' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-CELOCIA',
    slug: 'celocia',
    category: 'florales',
    name: 'Celocia',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Celocia de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PLT-CHAVELITAS-01',
    slug: 'chavelitas',
    // La foto que era del hover paso a ser la principal (la principal no
    // existia en disco y la tarjeta salia vacia en reposo).
    category: 'florales',
    name: 'Chavelitas',
    scientificName: '',
    price: 3,
    description:
      'Chavelitas de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-CIELITO-AZUL',
    slug: 'cielito-azul',
    category: 'florales',
    name: 'Cielito azul',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cielito azul de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-CINTA',
    slug: 'cinta',
    category: 'interior',
    name: 'Cinta',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cinta de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-CINTA-MALA-MADRE',
    slug: 'cinta-mala-madre',
    category: 'interior',
    name: 'Cinta mala madre',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cinta mala madre de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-CIPRE-RASTRERO',
    slug: 'cipre-rastrero',
    category: 'exterior',
    name: 'Cipre rastrero',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cipre rastrero de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PL-PINO-ROMANO',
    slug: 'cipre-thuja',
    category: 'exterior',
    name: 'Cipre thuja',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cipre thuja de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-CLAVEL-CHINO',
    slug: 'clavel-chino',
    category: 'florales',
    name: 'Clavel chino',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Clavel chino de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-CLAVELITO',
    slug: 'clavelito',
    category: 'florales',
    name: 'Clavelito',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Clavelito de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-COLEOS',
    slug: 'coleos',
    category: 'exterior',
    name: 'Coleos',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Coleos de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-CORDILINIA',
    slug: 'cordilinia',
    category: 'interior',
    name: 'Cordilinia',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Cordilinia de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1 vez por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-CORONITA',
    slug: 'coronita',
    category: 'florales',
    name: 'Coronita',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Coronita de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-CRINUM-ASIATICO-VARIEGADO',
    slug: 'crinum-asiatico-variegado',
    category: 'interior',
    name: 'Crinum asiatico variegado',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Crinum asiatico variegado de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PLT-CRISANTEMOS-01',
    slug: 'crisantemos',
    category: 'florales',
    name: 'Crisantemos',
    scientificName: '',
    price: 2.5,
    description:
      'Crisantemos de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-CROTO-MAMY-AMARILLO',
    slug: 'croto-mamy-amarillo',
    category: 'exterior',
    name: 'Croto mamy amarillo',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Croto mamy amarillo de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-DALIA',
    slug: 'dalia',
    category: 'florales',
    name: 'Dalia',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Dalia de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-DRACAENA-REFLEXA',
    slug: 'dracaena-reflexa',
    category: 'interior',
    name: 'Dracaena reflexa',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Dracaena reflexa de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1 vez por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-DRACONTIUM',
    slug: 'dracontium',
    category: 'interior',
    name: 'Dracontium',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Dracontium de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: 'Riego frecuente, sustrato húmedo', difficulty: 'Exigente' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-DURANTA-LIMON',
    slug: 'duranta-limon',
    category: 'exterior',
    name: 'Duranta limon',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Duranta limon de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-DURANTA-MATIZADA',
    slug: 'duranta-matizada',
    category: 'exterior',
    name: 'Duranta matizada',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Duranta matizada de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-EPISCIAS-VR',
    slug: 'episcias-vr',
    category: 'interior',
    name: 'Episcias vr',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Episcias vr de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: 'Riego frecuente, sustrato húmedo', difficulty: 'Exigente' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-ESCUDO-PERSA',
    slug: 'escudo-persa',
    category: 'interior',
    name: 'Escudo persa',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Escudo persa de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: 'Riego frecuente, sustrato húmedo', difficulty: 'Exigente' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-ESPARRAGO-MEYERI',
    slug: 'esparrago-meyeri',
    category: 'interior',
    name: 'Esparrago meyeri',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Esparrago meyeri de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-FICUS-ELASTICA',
    slug: 'ficus-elastica',
    category: 'interior',
    name: 'Ficus elastica',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Ficus elastica de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1 vez por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'grande',
  },
  {
    sku: 'PL-FICUS-LYRATA',
    slug: 'ficus-lyrata',
    category: 'interior',
    name: 'Ficus lyrata',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Ficus lyrata de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1 vez por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'grande',
  },
  {
    sku: 'PL-FICUS-LYRATA-3-RAMAS',
    slug: 'ficus-lyrata-3-ramas-hasta-175cm',
    category: 'interior',
    name: 'Ficus lyrata 3 ramas (hasta 175cm)',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Ficus lyrata 3 ramas (hasta 175cm) de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1 vez por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'grande',
  },
  {
    sku: 'PL-FICUS-TRIANGULAR-GRANDE',
    slug: 'ficus-triangular-grande',
    category: 'interior',
    name: 'Ficus triangular grande',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Ficus triangular grande de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1 vez por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'grande',
  },
  {
    sku: 'PL-FITONIA-ROJA',
    slug: 'fitonia-roja',
    category: 'interior',
    name: 'Fitonia roja',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Fitonia roja de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: 'Riego frecuente, sustrato húmedo', difficulty: 'Exigente' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-FLOR-DE-SAN-JUAN',
    slug: 'flor-de-san-juan',
    category: 'florales',
    name: 'Flor de san juan',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Flor de san juan de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-GINGER',
    slug: 'ginger',
    category: 'florales',
    name: 'Ginger',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Ginger de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-GRONFENA',
    slug: 'gronfena',
    category: 'interior',
    name: 'Gronfena',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Gronfena de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-HELECHOS',
    slug: 'helechos',
    category: 'interior',
    name: 'Helechos',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Helechos de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: 'Riego frecuente, sustrato húmedo', difficulty: 'Exigente' },
    available: 0,
    emoji: '🌿',
    size: 'mediana',
  },
  {
    sku: 'PLT-HIERBABUENA-01',
    slug: 'hierba-buena',
    category: 'exterior',
    name: 'Hierba buena',
    scientificName: '',
    price: 3,
    description:
      'Hierba buena de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PL-HIERBA-CITRONELA',
    slug: 'hierba-citronela',
    category: 'exterior',
    name: 'Hierba citronela',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Hierba citronela de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PL-HIERBA-DE-LIMON',
    slug: 'hierba-de-limon',
    category: 'exterior',
    name: 'Hierba de limon',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Hierba de limon de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PL-HYPOESTES',
    slug: 'hypoestes',
    category: 'interior',
    name: 'Hypoestes',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Hypoestes de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-IXORA',
    slug: 'ixora',
    category: 'florales',
    name: 'Ixora',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Ixora de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PLT-JADE-01',
    slug: 'jade',
    category: 'interior',
    name: 'Jade',
    scientificName: '',
    price: 5.5,
    description:
      'Jade de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-JAZMIN-BLANCO-ENANO',
    slug: 'jazmin-blanco-enano',
    category: 'florales',
    name: 'Jazmin blanco enano',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Jazmin blanco enano de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-KALANCHOE',
    slug: 'kalanchoe',
    category: 'florales',
    name: 'Kalanchoe',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Kalanchoe de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-LENGUA-DE-SUEGRA-ENANA',
    slug: 'lengua-de-suegra-enana',
    category: 'interior',
    name: 'Lengua de suegra enana',
    scientificName: '',
    price: 5.75,
    description:
      'Lengua de suegra enana de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-LENGUA-DE-SUEGRA-MINI',
    slug: 'lengua-de-suegra-mini',
    category: 'interior',
    name: 'Lengua de suegra mini',
    scientificName: '',
    price: 5.75,
    description:
      'Lengua de suegra mini de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-LIRIO',
    slug: 'lirio',
    category: 'florales',
    name: 'Lirio',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Lirio de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-LIRIO-GIGANTE-MORADO',
    slug: 'lirio-gigante-morado',
    category: 'florales',
    name: 'Lirio gigante morado',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Lirio gigante morado de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'grande',
  },
  {
    sku: 'PL-LORITO-GRANDE',
    slug: 'lorito-grande',
    category: 'exterior',
    name: 'Lorito grande',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Lorito grande de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'grande',
  },
  {
    sku: 'PL-LORITO-MEDIANO',
    slug: 'lorito-mediano',
    category: 'exterior',
    name: 'Lorito mediano',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Lorito mediano de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-LORITOS-CHICO',
    slug: 'loritos-chico',
    category: 'exterior',
    name: 'Loritos chico',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Loritos chico de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PL-MARGINATA',
    slug: 'marginata',
    category: 'interior',
    name: 'Marginata',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Marginata de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1 vez por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PLT-MENTA-01',
    slug: 'menta',
    category: 'exterior',
    name: 'Menta',
    scientificName: '',
    price: 3,
    description:
      'Menta de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PL-MILLONARIA-ZAMIOCULCA',
    slug: 'millonaria-zamioculca',
    category: 'interior',
    name: 'Millonaria zamioculca',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Millonaria zamioculca de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-MILLONARIA-ZAMIOCULCA-NEGRA',
    slug: 'millonaria-zamioculca-negra',
    category: 'interior',
    name: 'Millonaria zamioculca negra',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Millonaria zamioculca negra de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-MINI-ARBUSTO',
    slug: 'mini-arbusto',
    category: 'exterior',
    name: 'Mini arbusto',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Mini arbusto de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PL-MINI-CALATHEA',
    slug: 'mini-calathea',
    category: 'interior',
    name: 'Mini calathea',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Mini calathea de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: 'Riego frecuente, sustrato húmedo', difficulty: 'Exigente' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-MINI-JADE',
    slug: 'mini-jade',
    category: 'interior',
    name: 'Mini jade',
    scientificName: '',
    price: 4.5,
    description:
      'Mini jade de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-MOLLEJA',
    slug: 'molleja',
    category: 'interior',
    name: 'Molleja',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Molleja de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-MONSTERA-ADANSONII',
    slug: 'monstera-adansonii',
    category: 'interior',
    name: 'Monstera adansonii',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Monstera adansonii de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-MONSTERA-DELICIOSA',
    slug: 'monstera-deliciosa',
    category: 'interior',
    name: 'Monstera deliciosa',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Monstera deliciosa de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-NOVIO-CHINO',
    slug: 'novio-chino',
    category: 'florales',
    name: 'Novio chino',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Novio chino de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'mediana',
  },
  {
    sku: 'PL-OREGANO',
    slug: 'oregano',
    category: 'exterior',
    name: 'Oregano',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Oregano de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PL-ORTENCIA',
    slug: 'ortencia',
    category: 'florales',
    name: 'Ortencia',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Ortencia de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '3 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌺',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-ABANICO',
    slug: 'palma-abanico',
    category: 'exterior',
    name: 'Palma abanico',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma abanico de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-BISMARKIA-GRANDE',
    slug: 'palma-bismarkia-grande',
    category: 'exterior',
    name: 'Palma bismarkia grande',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma bismarkia grande de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'grande',
  },
  {
    sku: 'PL-PALMA-BISMARKIA-MEDIANA',
    slug: 'palma-bismarkia-mediana',
    category: 'exterior',
    name: 'Palma bismarkia mediana',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma bismarkia mediana de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-BISMARKIA-PEQUENA',
    slug: 'palma-bismarkia-pequena',
    category: 'exterior',
    name: 'Palma bismarkia pequena',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma bismarkia pequena de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'pequena',
  },
  {
    sku: 'PL-PALMA-CUBANA',
    slug: 'palma-cubana',
    category: 'exterior',
    name: 'Palma cubana',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma cubana de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'grande',
  },
  {
    sku: 'PL-DRACAENA-ROJA',
    slug: 'dracaena-roja',
    category: 'interior',
    name: 'Dracaena roja',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Dracaena roja de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-FENIX',
    slug: 'palma-fenix',
    category: 'exterior',
    name: 'Palma fenix',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma fenix de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-MADAGASCAR',
    slug: 'palma-madagascar',
    category: 'exterior',
    name: 'Palma madagascar',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma madagascar de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-MAJESTIC',
    slug: 'palma-majestic',
    category: 'exterior',
    name: 'Palma majestic',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma majestic de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'grande',
  },
  {
    sku: 'PL-PALMA-MULTIPLE',
    slug: 'palma-multiple',
    category: 'exterior',
    name: 'Palma multiple',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma multiple de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'grande',
  },
  {
    sku: 'PL-PALMA-NAVIDAD',
    slug: 'palma-navidad',
    category: 'exterior',
    name: 'Palma navidad',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma navidad de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-PINANGO',
    slug: 'palma-pinango',
    category: 'exterior',
    name: 'Palma pinango',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma pinango de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-REAL-ENANA',
    slug: 'palma-real-enana',
    category: 'exterior',
    name: 'Palma real enana',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma real enana de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'grande',
  },
  {
    sku: 'PL-PALMA-ROJA',
    slug: 'palma-roja',
    category: 'exterior',
    name: 'Palma roja',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma roja de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALMA-ROJA-GRANDE',
    slug: 'palma-roja-grande',
    category: 'exterior',
    name: 'Palma roja grande',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma roja grande de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'grande',
  },
  {
    sku: 'PL-PALMA-WASHINTONIA',
    slug: 'palma-washintonia',
    category: 'exterior',
    name: 'Palma washintonia',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma washintonia de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'grande',
  },
  {
    sku: 'PL-PALMA-ZICA',
    slug: 'palma-zica',
    category: 'exterior',
    name: 'Palma zica',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palma zica de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALO-DE-BRASIL',
    slug: 'palo-de-brasil',
    category: 'interior',
    name: 'Palo de brasil',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palo de brasil de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1 vez por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-PALO-DE-BRAZIL-MEDIANO',
    slug: 'palo-de-brazil-mediano',
    category: 'interior',
    name: 'Palo de brazil mediano',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Palo de brazil mediano de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1 vez por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-PAPIRO',
    slug: 'papiro',
    category: 'interior',
    name: 'Papiro',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Papiro de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o luz indirecta brillante', water: '2–3 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-PAPO',
    slug: 'papo',
    category: 'florales',
    name: 'Papo',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Papo de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'mediana',
  },
  {
    sku: 'PL-PAPO-MATIZADO',
    slug: 'papo-matizado',
    category: 'florales',
    name: 'Papo matizado',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Papo matizado de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'mediana',
  },
  {
    sku: 'PL-PETUNIN',
    slug: 'petunin',
    category: 'florales',
    name: 'Petunin',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Petunin de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-PHILODENDRO-NEON',
    slug: 'philodendro-neon',
    category: 'interior',
    name: 'Philodendro neon',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Philodendro neon de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-PHILOMENDRO-PINK-PRINCESS',
    slug: 'philomendro-pink-princess',
    category: 'interior',
    name: 'Philomendro pink princess',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Philomendro pink princess de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-PHOTOS-MULTI-RAMA',
    slug: 'photos-multi-rama',
    category: 'interior',
    name: 'Photos multi rama',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Photos multi rama de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1 vez por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-PIE-DE-NINO-TRADICIONAL',
    slug: 'pie-de-nino-tradicional',
    category: 'exterior',
    name: 'Pie de nino tradicional',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Pie de nino tradicional de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-PIE-DE-NINO-VERDE',
    slug: 'pie-de-nino-verde',
    category: 'exterior',
    name: 'Pie de nino verde',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Pie de nino verde de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol o media sombra', water: '2–3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-PINO-ENANO',
    slug: 'pino-bonsai',
    category: 'exterior',
    name: 'Pino bonsai',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Pino bonsai de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PL-PINO-ESTRELLA',
    slug: 'pino-estrella',
    category: 'exterior',
    name: 'Pino estrella',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Pino estrella de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-PINO-HINDU',
    slug: 'pino-hindu',
    category: 'exterior',
    name: 'Pino hindu',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Pino hindu de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-PINO-MONTESUMA',
    slug: 'pino-montesuma',
    category: 'exterior',
    name: 'Pino montesuma',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Pino montesuma de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'mediana',
  },
  {
    sku: 'PL-PINO-RASTRERO',
    slug: 'pino-rastrero',
    category: 'exterior',
    name: 'Pino rastrero',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Pino rastrero de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PL-POLCAS',
    slug: 'polcas',
    category: 'interior',
    name: 'Polcas',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Polcas de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-POTHOS',
    slug: 'pothos',
    category: 'interior',
    name: 'Pothos',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Pothos de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: '1 vez por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-PURPLE-LADY-EN-BOLSA',
    slug: 'purple-lady-en-bolsa',
    category: 'interior',
    name: 'Purple lady en bolsa',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Purple lady en bolsa de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-ROMERO',
    slug: 'romero',
    category: 'exterior',
    name: 'Romero',
    scientificName: '',
    price: 3,
    description:
      'Romero de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PL-ROSA',
    slug: 'rosa',
    category: 'florales',
    name: 'Rosa',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Rosa de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌹',
    size: 'pequena',
  },
  {
    sku: 'PL-ROSITA-MINIATURA',
    slug: 'rosita-miniatura',
    category: 'florales',
    name: 'Rosita miniatura',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Rosita miniatura de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '2–3 veces por semana', difficulty: 'Media' },
    available: 0,
    emoji: '🌹',
    size: 'pequena',
  },
  {
    sku: 'PL-ROSSETTA',
    slug: 'rossetta',
    category: 'exterior',
    name: 'Rossetta',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Rossetta de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PLT-RUDA-01',
    slug: 'ruda',
    category: 'exterior',
    name: 'Ruda',
    scientificName: '',
    price: 3,
    description:
      'Ruda de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌳',
    size: 'pequena',
  },
  {
    sku: 'PL-SABILA-ALOE-MEDIANA',
    slug: 'sabila-aloe-mediana',
    category: 'interior',
    name: 'Sabila aloe mediana',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Sabila aloe mediana de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
  {
    sku: 'PL-SABILA-ALOE-PEQUENA',
    slug: 'sabila-aloe-pequena',
    category: 'interior',
    name: 'Sabila aloe pequena',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Sabila aloe pequena de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-SALVIA-ESPLENDA',
    slug: 'salvia-esplenda',
    category: 'florales',
    name: 'Salvia esplenda',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Salvia esplenda de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-SUCULENTA-PEQUENA',
    slug: 'suculenta-pequena',
    category: 'interior',
    name: 'Suculenta pequena',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Suculenta pequena de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌵',
    size: 'pequena',
  },
  {
    sku: 'PL-SUCULENTAS-GRANDE',
    slug: 'suculentas-grande',
    category: 'interior',
    name: 'Suculentas grande',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Suculentas grande de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌵',
    size: 'grande',
  },
  {
    sku: 'PL-SUCULENTAS-MEDIANAS',
    slug: 'suculentas-medianas',
    category: 'interior',
    name: 'Suculentas medianas',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Suculentas medianas de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🌵',
    size: 'mediana',
  },
  {
    sku: 'PL-TOMILLO',
    slug: 'tomillo',
    category: 'exterior',
    name: 'Tomillo',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Tomillo de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: 'Diario o interdiario', difficulty: 'Facil' },
    available: 0,
    emoji: '🌿',
    size: 'pequena',
  },
  {
    sku: 'PLT-TORENIA-01',
    slug: 'torenia',
    category: 'florales',
    name: 'Torenia',
    scientificName: '',
    price: 2.5,
    description:
      'Torenia de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Sol pleno', water: '3 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🌺',
    size: 'pequena',
  },
  {
    sku: 'PL-TRASDESCANTIA',
    slug: 'trasdescantia',
    category: 'interior',
    name: 'Trasdescantia',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Trasdescantia de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz indirecta brillante', water: '1–2 veces por semana', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'pequena',
  },
  {
    sku: 'PL-MILLONARIA-ZAMIOCULCA-BLANCA',
    slug: 'zamiculca-variegada',
    category: 'interior',
    name: 'Zamiculca variegada',
    scientificName: '',
    price: 5, // pendiente de precio en Odoo
    description:
      'Zamiculca variegada de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: { light: 'Luz baja o indirecta', water: 'Cada 10–15 días', difficulty: 'Facil' },
    available: 0,
    emoji: '🪴',
    size: 'mediana',
  },
];

// Fotos de Cloudinary sobre el catalogo: scripts/fotos.py mantiene
// src/data/fotos.json y aqui se pintan sobre cada producto (la primera foto
// es la principal de la tarjeta, la segunda el hover y el resto la galeria).
// Este bucle va FUERA del array a proposito: generar_catalogo.py regenera el
// array completo y las fotos sobreviven esa regeneracion.
const ANCHO_TARJETA = 640;
for (const p of products) {
  const fotos = fotosDe(p.sku);
  if (fotos.length) {
    p.image = urlFoto(p.sku, fotos[0], { ancho: ANCHO_TARJETA });
    p.imageHover = fotos[1] ? urlFoto(p.sku, fotos[1], { ancho: ANCHO_TARJETA }) : undefined;
    p.gallery = fotos.slice(2).map((h) => urlFoto(p.sku, h, { ancho: ANCHO_TARJETA }));
  }
  // Sin hover propio, el hover de la tarjeta es la foto en maceta (el primer
  // color disponible): los zips de macetas se ven en hover y en la galeria
  // del detalle, nunca como foto principal de la tarjeta.
  if (!p.imageHover) {
    const macetas = macetasDe(p.sku);
    const hash = COLORES_MACETA.map((c) => macetas[c]).find(Boolean);
    if (hash) p.imageHover = urlFoto(p.sku, hash, { ancho: ANCHO_TARJETA });
  }
}

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

// --- Ofertas y piso de compra (estado de BUILD) ---
// Espejo en build de lib/stock.ts (precioVista): el estado inicial de la
// pagina se pinta con estos helpers y el stock proxy lo refresca en el
// navegador con la misma regla. Cambiar la regla = cambiarla en ambos.

/** Lo que se cobra hoy: la oferta si es valida, el regular si no. */
export function precioVigente(product: Product): number {
  return product.offerPrice !== undefined && product.offerPrice < product.price
    ? product.offerPrice
    : product.price;
}

/** Precio regular a tachar junto al de oferta; null si no hay oferta real. */
export function compareAtPrice(product: Product): number | null {
  return product.offerPrice !== undefined && product.offerPrice < product.price
    ? product.price
    : null;
}

/** Comprable = el precio cobrado SUPERA el piso de $1.00 (la regla del
 * order-api). Por debajo la tienda muestra "Proximamente": el producto se ve
 * en su lugar normal del catalogo pero no se puede agregar al carrito. */
export function esComprable(product: Product): boolean {
  return Math.round(precioVigente(product) * 100) > PRECIO_MINIMO_CENTAVOS;
}
