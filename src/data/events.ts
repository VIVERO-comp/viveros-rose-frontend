// Eventos de Vivero Rose (Eventos.dc.html del handoff: las variantes
// ?e=bodas|ferias|alquiler traducidas a rutas propias). Las tres mini
// paginas comparten layout (src/pages/eventos/[slug].astro) y solo cambia
// este contenido, igual que los servicios.

export interface EventType {
  slug: string;
  name: string; // etiqueta corta (tarjetas, pestañas, footer)
  heroKicker: string;
  heroTitle: string;
  heroSub: string;
  // Linea unica de la tarjeta del indice /eventos.
  cardLine: string;
  blockKicker: string;
  blockTitle: string;
  description: string[];
  // Tres checks del bloque principal.
  incluye: string[];
  // Opcion preseleccionada del select "Tipo de evento" del formulario.
  formType?: string;
  whatsappMessage: string;
  metaTitle: string;
  metaDescription: string;
}

export const events: EventType[] = [
  {
    slug: 'bodas',
    name: 'Bodas y sociales',
    heroKicker: 'Bodas · Cumpleaños · Bautizos',
    heroTitle: 'Plantas que decoran tu evento',
    heroSub: 'Montamos el verde de la ceremonia y la recepción, y lo retiramos al día siguiente.',
    cardLine: 'Montamos el verde de la ceremonia y la recepción, y lo retiramos al día siguiente.',
    blockKicker: 'Bodas y eventos sociales',
    blockTitle: 'Verde en vez de flores cortadas',
    description: [
      'Palmas, follaje y florales en maceta para entradas, altar, mesas y áreas de fotos. Las plantas duran todo el evento sin marchitarse y, si quieres, se quedan contigo después.',
    ],
    incluye: [
      'Diseño del montaje según el salón',
      'Entrega, colocación y retiro incluidos',
      'Opción de llevarte las plantas al final',
    ],
    formType: 'Boda',
    whatsappMessage: 'Hola, quiero cotizar plantas para un evento (bodas y sociales).',
    metaTitle: 'Plantas para bodas y eventos sociales',
    metaDescription:
      'Montaje de plantas para bodas, cumpleaños y bautizos en Panamá: ceremonia, recepción y áreas de fotos, con entrega, colocación y retiro incluidos.',
  },
  {
    slug: 'ferias',
    name: 'Ferias y activaciones',
    heroKicker: 'Ferias · Activaciones · Stands',
    heroTitle: 'Ambientación verde para marcas',
    heroSub: 'Stands, lanzamientos y activaciones con plantas de nuestro vivero.',
    cardLine: 'Stands, lanzamientos y activaciones con plantas de nuestro vivero.',
    blockKicker: 'Ferias y activaciones',
    blockTitle: 'Un stand que se ve vivo',
    description: [
      'Trabajamos con agencias y equipos de mercadeo en la ambientación de stands, ferias y lanzamientos: material uniforme, montaje a la hora que indique la producción y retiro al cierre.',
    ],
    incluye: [
      'Coordinación con el cronograma de producción',
      'Material uniforme del mismo lote',
      'Factura a nombre de la empresa',
    ],
    formType: 'Feria o activación',
    whatsappMessage: 'Hola, quiero cotizar plantas para una feria o activación.',
    metaTitle: 'Ambientación para ferias y activaciones',
    metaDescription:
      'Ambientación con plantas para stands, ferias y activaciones de marca en Panamá: material uniforme, montaje coordinado con producción y retiro al cierre.',
  },
  {
    slug: 'alquiler',
    name: 'Alquiler de plantas',
    heroKicker: 'Por día · Por fin de semana · Por temporada',
    heroTitle: 'Alquila el verde que necesitas',
    heroSub: 'Desde una entrada hasta el salón completo, por el tiempo que dure el evento.',
    cardLine: 'Desde una entrada hasta el salón completo, por el tiempo que dure el evento.',
    blockKicker: 'Alquiler de plantas',
    blockTitle: 'Sin comprar, sin guardar, sin cuidar',
    description: [
      'Te llevamos las plantas al lugar, las colocamos y las recogemos cuando termina. Ideal para eventos de un día, sesiones de fotos y espacios que solo necesitan verde por una temporada.',
    ],
    incluye: [
      'Tarifas por día, fin de semana o mes',
      'Cambio de material si el alquiler es largo',
      'Macetas decorativas incluidas',
    ],
    whatsappMessage: 'Hola, quiero cotizar un alquiler de plantas.',
    metaTitle: 'Alquiler de plantas para eventos',
    metaDescription:
      'Alquiler de plantas por día, fin de semana o temporada en Panamá: entrega, colocación y retiro incluidos, con macetas decorativas.',
  },
];

// Tarjetas informativas compartidas por las tres mini paginas (handoff).
export const eventCards = [
  {
    icon: 'calendar-check',
    title: 'Reserva con 2 semanas',
    body: 'Confirmamos disponibilidad del material y agendamos el montaje según tu fecha.',
  },
  {
    icon: 'truck',
    title: 'Montaje y retiro',
    body: 'Llevamos, colocamos y retiramos todo el día siguiente al evento. Tú no mueves nada.',
  },
  {
    icon: 'repeat',
    title: 'Alquiler o compra',
    body: 'Puedes alquilar el montaje o quedarte con las plantas al precio del vivero.',
  },
];

export const eventFormTypes = ['Boda', 'Cumpleaños o social', 'Feria o activación', 'Evento corporativo'];

export function getEvent(slug: string): EventType | undefined {
  return events.find((e) => e.slug === slug);
}
