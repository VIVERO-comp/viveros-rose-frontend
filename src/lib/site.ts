// Datos compartidos del sitio.

export const SITE = {
  name: 'Plantas Panama',
  byline: 'by Vivero Rose',
  domain: 'plantaspanama.com',
  address: 'Calle 11, Juan Díaz, Ciudad Radial, Panamá',
  hours: 'Lunes a viernes, 9:00 a.m. – 5:00 p.m.',
  whatsappNumber: (import.meta.env.PUBLIC_WHATSAPP_NUMBER as string | undefined) ?? '50760000000',
};

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/plantas', label: 'Plantas' },
  { href: '/colecciones', label: 'Colecciones' },
  { href: '/pedido', label: 'Pedidos' },
  { href: '/vivero', label: 'Nuestro Vivero' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/mayorista', label: 'Mayorista' },
  { href: '/contacto', label: 'Contacto' },
];
