// Datos compartidos del sitio.

// Sin fallback: publicar con un numero de WhatsApp falso rompe el checkout
// entero (los pedidos se confirman por WhatsApp), asi que sin la variable el
// build debe fallar aqui mismo.
const whatsappNumber = import.meta.env.PUBLIC_WHATSAPP_NUMBER as string | undefined;
if (!whatsappNumber) {
  throw new Error(
    'Falta PUBLIC_WHATSAPP_NUMBER en el entorno (.env). Es el numero de WhatsApp ' +
      'del negocio en formato internacional sin "+", p. ej. 50765673062. ' +
      'Sin el, todos los enlaces de pedido apuntarian a un numero falso.',
  );
}

export const SITE = {
  name: 'Plantas Panama',
  byline: 'by Vivero Rose',
  domain: 'plantaspanama.com',
  // Solo la ciudad: la direccion exacta no se publica en el sitio.
  address: 'Ciudad de Panamá',
  // La misma direccion en piezas, para el PostalAddress del schema.org.
  addressSchema: {
    addressLocality: 'Ciudad de Panamá',
    addressCountry: 'PA',
  },
  hours: 'Todos los días, 10:00 a.m. – 6:00 p.m.',
  whatsappNumber,
};

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/plantas', label: 'Plantas' },
  { href: '/colecciones', label: 'Colecciones' },
  { href: '/pedido', label: 'Pedidos' },
  // "Nuestro Vivero" apunta al sitio corporativo (externo, pestana nueva).
  { href: 'https://viverorose.com/', label: 'Nuestro Vivero' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/mayorista', label: 'Mayorista' },
  { href: '/contacto', label: 'Contacto' },
];
