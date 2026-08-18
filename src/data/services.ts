// Servicios de Vivero Rose (Servicios.dc.html del handoff: las variantes
// ?s=paisajismo|mantenimiento|proyectos traducidas a rutas propias).
// Las tres mini paginas comparten layout (src/pages/servicios/[slug].astro)
// y solo cambia este contenido.

export interface Service {
  slug: string;
  name: string; // etiqueta corta (tarjetas, menus, select del formulario)
  heroKicker: string;
  heroTitle: string;
  heroSub: string;
  // Linea unica de la tarjeta del indice /servicios.
  cardLine: string;
  // Parrafos de descripcion (copia del handoff).
  description: string[];
  // Tres checks del bloque principal (mismo patron que Eventos).
  incluye: string[];
  // Tres tarjetas informativas (icono de Icon.astro, titulo y texto).
  cards: { icon: string; title: string; body: string }[];
  // Fotos de la galeria "Proyectos recientes" (rutas bajo /public).
  gallery: string[];
  // Fotos de la mini pagina: banda del hero y bloque vertical del detalle.
  heroPhoto?: string;
  blockPhoto?: string;
  whatsappMessage: string;
  metaTitle: string;
  metaDescription: string;
}

export const services: Service[] = [
  {
    slug: 'paisajismo',
    name: 'Diseño de jardines',
    heroKicker: 'Diseño · Siembra · Detalle',
    heroTitle: 'Paisajismo bien hecho',
    heroSub: 'Jardines pensados para el clima de Panamá, desde el trazo hasta la última planta.',
    cardLine: 'Jardines pensados para el clima de Panamá, desde el trazo hasta la última planta.',
    description: [
      'Levantamos el terreno, proponemos un trazo con las especies que rinden en tu suelo y nos encargamos de la siembra y los detalles que hacen que un jardín se sienta como casa.',
      'Todo lo que sembramos sale de nuestro vivero en Juan Díaz: variedades adaptadas al trópico, entregadas frescas y ya establecidas para que arranquen sin estrés.',
    ],
    incluye: [
      'Levantamiento del terreno y propuesta de trazo',
      'Selección de especies que rinden en tu suelo',
      'Siembra con material del propio vivero',
    ],
    cards: [
      {
        icon: 'ruler',
        title: 'Visita y cotización sin costo',
        body: 'Levantamos el terreno y te proponemos trazo, especies y presupuesto.',
      },
      {
        icon: 'sprout',
        title: 'Material del propio vivero',
        body: 'Variedades adaptadas al trópico, entregadas frescas y ya establecidas.',
      },
      {
        icon: 'shovel',
        title: 'Detalles que duran',
        body: 'Bordes de piedra, drenaje resuelto, riego planificado y plan por temporada.',
      },
    ],
    gallery: [
      '/fotos_servicios/proyectos/casa_vista_principal.jpg',
      '/fotos_servicios/proyectos/casa_club.jpg',
      '/fotos_servicios/proyectos/jardin_piedras.jpg',
      '/fotos_servicios/proyectos/jardin_rocas.jpg',
    ],
    whatsappMessage: 'Hola, quiero iniciar un proyecto de diseño de jardín.',
    metaTitle: 'Diseño de jardines',
    metaDescription:
      'Diseño y siembra de jardines residenciales en Panamá, con material de nuestro propio vivero y plan de mantenimiento por temporada.',
  },
  {
    slug: 'mantenimiento',
    heroPhoto: '/fotos_servicios/mantenimiento_trabajo.jpeg',
    blockPhoto: '/fotos_servicios/mantenimiento_trabajo.jpeg',
    name: 'Mantenimiento',
    heroKicker: 'Planes semanales · Quincenales · Mensuales',
    heroTitle: 'Mantenimiento que mantiene todo próspero',
    heroSub: 'Volvemos con regularidad para que el jardín no dependa de la suerte.',
    cardLine: 'Volvemos con regularidad para que el jardín no dependa de la suerte.',
    description: [
      'Regresamos con regularidad, ajustamos según las estaciones y nos aseguramos de que cada planta reciba lo que necesita: poda, riego, abono y control de plagas.',
      'En temporada seca priorizamos riego y sombra; en la lluviosa, drenaje, poda y control de hongos. El plan se ajusta al mes, no al calendario genérico.',
    ],
    incluye: [
      'Poda, riego, abono y control de plagas',
      'Plan distinto para la temporada seca y la lluviosa',
      'Reporte de visita y reposición de material',
    ],
    cards: [
      {
        icon: 'calendar-check',
        title: 'Planes por frecuencia',
        body: 'Semanal, quincenal o mensual, con cuadrilla fija y reporte de cada visita.',
      },
      {
        icon: 'droplets',
        title: 'Ajustado a la temporada',
        body: 'En la seca priorizamos riego y sombra; en la lluviosa, drenaje, poda y control de hongos.',
      },
      {
        icon: 'repeat',
        title: 'Reposición de material',
        body: 'Reponemos plantas cuando hace falta en PH, oficinas y locales comerciales.',
      },
    ],
    gallery: [
      '/fotos_servicios/proyectos/casa_club.jpg',
      '/fotos_servicios/proyectos/entrada_residencial.jpg',
      '/fotos_servicios/proyectos/casa_vista_principal.jpg',
      '/fotos_servicios/proyectos/jardin_rocas.jpg',
    ],
    whatsappMessage: 'Hola, quiero agendar un servicio de mantenimiento de jardín.',
    metaTitle: 'Mantenimiento de jardines',
    metaDescription:
      'Planes de mantenimiento de jardines en Panamá: poda, riego, abono y control de plagas, ajustados a la temporada seca y la lluviosa.',
  },
  {
    slug: 'proyectos',
    name: 'Proyectos comerciales',
    heroKicker: 'Constructoras · Empresas · Revendedores',
    heroTitle: 'Proyectos comerciales a escala',
    heroSub: 'Producción, instalación y mantenimiento para obras y espacios comerciales en todo Panamá.',
    cardLine: 'Producción, instalación y mantenimiento para obras y espacios comerciales.',
    description: [
      'Trabajamos con constructoras y administradores en la siembra de áreas comunes, entradas y linderos, con cronograma atado a la fecha de entrega de la obra.',
      'Cultivamos por lote para constructoras, empresas y revendedores: material uniforme, disponibilidad confirmada y entrega programada a la obra. Cerramos el ciclo con un plan de mantenimiento post-entrega.',
    ],
    incluye: [
      'Siembra de áreas comunes, entradas y linderos',
      'Cronograma atado a la fecha de entrega de la obra',
      'Material uniforme producido por lote',
    ],
    cards: [
      {
        icon: 'sprout',
        title: 'Producción por lote',
        body: 'Material uniforme con disponibilidad confirmada para tu cronograma.',
      },
      {
        icon: 'truck',
        title: 'Entrega a obra',
        body: 'Programada con la fecha de entrega, en la ciudad de Panamá e interior.',
      },
      {
        icon: 'shield-check',
        title: 'Mantenimiento post-entrega',
        body: 'El área verde sigue viéndose como el día de la entrega del proyecto.',
      },
    ],
    gallery: [
      '/fotos_servicios/proyectos/entrada_residencial.jpg',
      '/fotos_servicios/proyectos/casa_club.jpg',
      '/fotos_servicios/proyectos/jardin_piedras.jpg',
      '/fotos_servicios/proyectos/casa_vista_principal.jpg',
    ],
    whatsappMessage: 'Hola, quiero cotizar un proyecto comercial de áreas verdes.',
    metaTitle: 'Proyectos comerciales de áreas verdes',
    metaDescription:
      'Áreas verdes para obras y espacios comerciales en Panamá: producción por lote, instalación con cronograma de obra y mantenimiento post-entrega.',
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
