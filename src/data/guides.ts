// Guias de cuidado (contenido SEO), escritas como guias reales: con
// secciones, listas y una foto propia por guia.

export interface GuideSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[]; // viñetas
  tip?: string; // caja destacada "Consejo del vivero"
}

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  photo: string; // foto del encabezado (corte diagonal en la pagina)
  photoAlt: string;
  intro: string[]; // parrafos de apertura
  sections: GuideSection[];
  // CTA opcional ademas del "Ver catalogo" (p. ej. el quiz).
  cta?: { label: string; href: string; note: string };
}

export const guides: Guide[] = [
  {
    slug: 'riego-en-clima-panameno',
    title: 'Cómo regar tus plantas en el clima de Panamá',
    excerpt:
      'La humedad y la temporada de lluvias cambian todo. Aprende a ajustar el riego según la época del año.',
    photo: '/fotos_homepage/guia_de_cuidado.jpg',
    photoAlt: 'Riego de plantas en el vivero',
    intro: [
      'En Panamá tenemos dos estaciones que definen el riego: la temporada seca (diciembre a abril) y la lluviosa (mayo a noviembre). La mayoría de las plantas que mueren en casa mueren por exceso de agua, no por falta.',
    ],
    sections: [
      {
        heading: 'Temporada lluviosa (mayo a noviembre)',
        paragraphs: [
          'Las plantas de exterior prácticamente no necesitan riego adicional. Tu trabajo es cuidar el drenaje, no la regadera.',
        ],
        list: [
          'Revisa que las macetas boten el agua: si se acumula más de un día, agrega piedra al fondo o cambia el sustrato.',
          'Mueve las macetas pequeñas bajo techo durante los aguaceros más fuertes.',
          'Las plantas de interior siguen su propio ritmo: el aire acondicionado seca el ambiente aunque afuera llueva.',
        ],
      },
      {
        heading: 'Temporada seca (diciembre a abril)',
        paragraphs: [
          'El sol y la brisa de verano secan la tierra mucho más rápido. Riega temprano en la mañana para que el agua llegue a la raíz antes de evaporarse.',
        ],
        list: [
          'Exterior: riega 2 o 3 veces por semana según el tamaño de la maceta; a diario solo en plantas recién sembradas.',
          'Interior: una vez por semana suele bastar. Más plantas mueren ahogadas que sedientas.',
          'Evita regar al mediodía: el agua sobre las hojas con sol fuerte las quema.',
        ],
        tip: 'La prueba de los dos dedos nunca falla: entierra el dedo a dos nudillos de profundidad. Si la tierra está húmeda, no riegues todavía.',
      },
    ],
  },
  {
    slug: 'mejores-plantas-panama',
    title: 'Las mejores plantas para comprar en Panamá',
    excerpt:
      'Qué comprar según tu espacio y tu tiempo, y cómo encontrar tu planta ideal paso a paso.',
    photo: '/fotos_homepage/top_plantas.webp',
    photoAlt: 'Plantas de interior del vivero listas para la venta',
    intro: [
      'No existe "la mejor planta": existe la mejor planta para tu espacio. El clima de Panamá es generoso, pero un apartamento con aire acondicionado y un patio a pleno sol son mundos distintos.',
      'Esta guía te lleva por los mismos pasos que usamos en el vivero cuando un cliente nos pregunta qué llevarse.',
    ],
    sections: [
      {
        heading: 'Cómo encontrar tu planta ideal en 4 pasos',
        list: [
          '1. Mide la luz del espacio. Sol directo varias horas, luz brillante sin sol directo, o luz baja lejos de la ventana: esto descarta más opciones que cualquier otro factor.',
          '2. Sé honesto con tu tiempo. Si viajas o se te olvida regar, busca plantas que aguanten descuido; si disfrutas el cuido diario, puedes ir por especies más delicadas.',
          '3. Piensa en el espacio real. Una palma que hoy mide 50 cm puede triplicar su tamaño en un año. Revisa cuánto crece la especie antes de comprarla.',
          '4. Considera a los de la casa. Con mascotas o niños pequeños, pregúntanos por especies no tóxicas antes de decidir.',
        ],
      },
      {
        heading: 'Para interiores con poca luz',
        paragraphs: [
          'Los apartamentos de la ciudad suelen tener luz filtrada por vidrios polarizados y aire acondicionado constante. Estas especies prosperan igual:',
        ],
        list: [
          'Aglaonema: follaje de colores y aguante casi indestructible.',
          'Zamioculca: tolera semanas sin riego; ideal si viajas seguido.',
          'Potos: crece rápido y perdona casi cualquier descuido.',
          'Sansevieria (lengua de suegra): la más resistente de todas para esquinas oscuras.',
        ],
        tip: 'No coloques plantas directamente bajo la salida del aire acondicionado: el flujo constante deshidrata las hojas aunque riegues bien.',
      },
      {
        heading: 'Para balcones y terrazas con sol',
        paragraphs: [
          'Si tu balcón recibe sol de mañana o de tarde, aprovecha las especies que florecen con esa luz:',
        ],
        list: [
          'Veraneras compactas: flor abundante todo el año con poco riego.',
          'Crotos: follaje rojo, amarillo y verde que se intensifica con el sol.',
          'Hierbas de cocina: albahaca, orégano y culantro en macetas cerca de la cocina.',
        ],
      },
      {
        heading: 'Para jardines y patios',
        paragraphs: [
          'En tierra y con espacio, el clima panameño hace la mitad del trabajo:',
        ],
        list: [
          'Ixoras y cayenas: setos con flor permanente, resistentes al sol fuerte.',
          'Palmas: estructura y sombra con muy poco mantenimiento.',
          'Duranta: crece rápido y sirve como cerca viva.',
        ],
      },
    ],
    cta: {
      label: 'Hacer el quiz',
      href: '/quiz',
      note: '¿Aún con dudas? Responde 4 preguntas y te recomendamos plantas de nuestro catálogo.',
    },
  },
  {
    slug: 'preparar-jardin-temporada-lluviosa',
    title: 'Prepara tu jardín para la temporada lluviosa',
    excerpt:
      'Drenaje, poda, abono y control de hongos: el checklist completo antes de que empiecen los aguaceros.',
    photo: '/fotos_homepage/cuidar_de_lluvia.jpeg',
    photoAlt: 'Jardín tropical bajo la lluvia',
    intro: [
      'Las primeras lluvias de mayo son el mejor momento del año para sembrar en Panamá. La tierra se ablanda y las plantas nuevas se establecen sin estrés hídrico. Pero un jardín que no se prepara antes de los aguaceros paga la cuenta en junio: raíces podridas, hongos y plantas ahogadas.',
      'Este es el checklist que seguimos en el vivero cada año, en orden.',
    ],
    sections: [
      {
        heading: '1. Revisa el drenaje antes que nada',
        paragraphs: [
          'Los encharcamientos prolongados pudren las raíces de la mayoría de las ornamentales. Es el problema número uno de la temporada.',
        ],
        list: [
          'Haz la prueba del hoyo: cava unos 30 cm, llénalo de agua y si después de una hora sigue llena, ese punto necesita drenaje.',
          'Abre canales sencillos para dirigir el agua fuera de las camas de siembra.',
          'En zonas que siempre se empozan, siembra en camas elevadas en lugar de pelear contra el terreno.',
          'En macetas: verifica que los huecos de drenaje no estén tapados y agrega una capa de piedra al fondo.',
        ],
      },
      {
        heading: '2. Poda y limpia al inicio de la temporada',
        list: [
          'Poda los arbustos establecidos: la lluvia empuja el crecimiento nuevo justo después del corte.',
          'Retira hojas secas o enfermas del suelo; con humedad se convierten en criadero de hongos.',
          'Corta las ramas que quedaron débiles en verano antes de que el viento de los aguaceros las quiebre.',
        ],
      },
      {
        heading: '3. Abona una vez al mes',
        paragraphs: [
          'La lluvia constante lava los nutrientes del suelo más rápido que en verano. Fertiliza una vez al mes mientras dure la temporada, en poca cantidad: es mejor poco y seguido que mucho de golpe.',
        ],
      },
      {
        heading: '4. Vigila hongos y plagas de humedad',
        list: [
          'Manchas oscuras o polvo blanco en las hojas son señal de hongos: retira las hojas afectadas apenas aparezcan.',
          'Deja espacio entre plantas para que circule el aire; el follaje amontonado y mojado es donde empiezan los problemas.',
          'Caracoles y babosas llegan con la humedad: revisa de noche, que es cuando salen.',
        ],
        tip: 'Si riegas algo bajo techo, hazlo de día: el follaje que pasa la noche mojado es la vía rápida hacia los hongos.',
      },
      {
        heading: '5. Aprovecha para sembrar',
        paragraphs: [
          'Con el drenaje resuelto, mayo y junio son los meses ideales para establecer setos, ornamentales de sol y árboles jóvenes: la lluvia hace el riego por ti mientras la raíz se afianza.',
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
