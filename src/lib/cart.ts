// Carrito cliente (localStorage). Suficiente para v1 segun la propuesta:
// la validacion real de stock ocurre en el servidor antes de crear el pago.

export interface CartItem {
  sku: string;
  name: string;
  price: number;
  qty: number;
  slug: string;
  category: string;
  emoji: string;
  // Foto del producto (si existe): los paneles y resumenes la muestran en
  // lugar del emoji. Carritos guardados antes de este campo no la traen.
  image?: string;
}

const STORAGE_KEY = 'pp-cart-v1';

export function getCart(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[];
    // Migracion a Cloudinary: carritos guardados antes traen rutas viejas de
    // /fotos_productos/ que ya no existen; sin imagen la miniatura cae al
    // emoji en vez de quedar rota.
    for (const item of items) {
      if (item.image?.startsWith('/fotos_productos/')) item.image = undefined;
    }
    return items;
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: cartCount() } }));
}

export function addToCart(item: Omit<CartItem, 'qty'>, qty = 1) {
  const items = getCart();
  const existing = items.find((i) => i.sku === item.sku);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ ...item, qty });
  }
  save(items);
  // Ademas de cart:updated (que solo refresca contadores), se avisa que hubo
  // un ALTA: el mini-carrito del layout se abre solo con este evento.
  document.dispatchEvent(new CustomEvent('cart:added', { detail: { sku: item.sku } }));
}

export function setQty(sku: string, qty: number) {
  let items = getCart();
  if (qty <= 0) {
    items = items.filter((i) => i.sku !== sku);
  } else {
    const item = items.find((i) => i.sku === sku);
    if (item) item.qty = qty;
  }
  save(items);
}

export function removeFromCart(sku: string) {
  save(getCart().filter((i) => i.sku !== sku));
}

export function clearCart() {
  save([]);
}

export function cartCount(): number {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

export function cartTotal(): number {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}
