// Vistos recientemente y favoritos (localStorage, igual que el carrito).
// Los usan la pagina de producto (registrar visto, corazon de favorito),
// las tarjetas del catalogo (corazon) y el panel de cuenta del header
// (listas "Vistas recientemente" y "Favoritos").

export interface ProductoGuardado {
  sku: string;
  name: string;
  price: number;
  slug: string;
  category: string;
  emoji: string;
  image?: string;
}

const VISTOS_KEY = 'pp-vistos-v1';
const FAVORITOS_KEY = 'pp-favoritos-v1';
const MAX_VISTOS = 8;

function leer(key: string): ProductoGuardado[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as ProductoGuardado[];
  } catch {
    return [];
  }
}

export function getVistos(): ProductoGuardado[] {
  return leer(VISTOS_KEY);
}

// Registra una visita a la pagina de producto: el mas reciente primero,
// sin duplicados y con tope para que la lista no crezca sin fin.
export function recordarVisto(p: ProductoGuardado) {
  const vistos = [p, ...getVistos().filter((v) => v.sku !== p.sku)].slice(0, MAX_VISTOS);
  localStorage.setItem(VISTOS_KEY, JSON.stringify(vistos));
}

export function getFavoritos(): ProductoGuardado[] {
  return leer(FAVORITOS_KEY);
}

export function esFavorito(sku: string): boolean {
  return getFavoritos().some((f) => f.sku === sku);
}

// Alterna el favorito y devuelve el estado final (true = quedo marcado).
export function toggleFavorito(p: ProductoGuardado): boolean {
  const favoritos = getFavoritos();
  const existe = favoritos.some((f) => f.sku === p.sku);
  const nuevos = existe ? favoritos.filter((f) => f.sku !== p.sku) : [p, ...favoritos];
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(nuevos));
  document.dispatchEvent(new CustomEvent('favoritos:updated'));
  return !existe;
}
