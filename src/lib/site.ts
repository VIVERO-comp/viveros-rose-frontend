// Datos compartidos del sitio.

export const SITE = {
  name: 'Plantas Panama',
  byline: 'by Vivero Rose',
  domain: 'plantaspanama.com',
  whatsappNumber: (import.meta.env.PUBLIC_WHATSAPP_NUMBER as string | undefined) ?? '50760000000',
};

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/plantas', label: 'Plantas' },
  { href: '/entrega', label: 'Entrega' },
  { href: '/vivero', label: 'Nuestro Vivero' },
  { href: '/paisajismo', label: 'Paisajismo' },
  { href: '/mayorista', label: 'Mayorista' },
  { href: '/contacto', label: 'Contacto' },
];
