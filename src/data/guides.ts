// Guias de cuidado (contenido SEO). Ejemplos iniciales.

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  body: string[]; // parrafos
}

export const guides: Guide[] = [
  {
    slug: 'riego-en-clima-panameno',
    title: 'Como regar tus plantas en el clima de Panama',
    excerpt:
      'La humedad y la temporada de lluvias cambian todo. Aprende a ajustar el riego segun la epoca del ano.',
    body: [
      'En Panama tenemos dos estaciones que definen el riego: la temporada seca (diciembre a abril) y la lluviosa (mayo a noviembre). La mayoria de las plantas que mueren en casa mueren por exceso de agua, no por falta.',
      'Durante la temporada lluviosa, las plantas de exterior practicamente no necesitan riego adicional. Revisa el drenaje de las macetas: si el agua se acumula mas de un dia, agrega piedra o cambia el sustrato.',
      'En temporada seca, riega temprano en la manana. Las plantas de interior mantienen un ritmo mas estable: toca la tierra a dos dedos de profundidad y riega solo si esta seca.',
    ],
  },
  {
    slug: 'plantas-para-apartamento',
    title: 'Las mejores plantas para apartamentos en la ciudad',
    excerpt:
      'Poca luz, aire acondicionado y espacio limitado: estas especies prosperan igual.',
    body: [
      'Los apartamentos de la ciudad de Panama suelen tener luz filtrada por vidrios polarizados y aire acondicionado constante. No todas las plantas toleran esas condiciones, pero varias prosperan.',
      'Aglaonema, zamioculca y potos son practicamente indestructibles en interiores con luz baja. Si tienes un balcon con sol de manana, puedes sumar veraneras compactas o hierbas de cocina.',
      'Evita colocar plantas directamente bajo la salida del aire acondicionado: el flujo constante deshidrata las hojas aunque riegues bien.',
    ],
  },
  {
    slug: 'preparar-jardin-temporada-lluviosa',
    title: 'Prepara tu jardin para la temporada lluviosa',
    excerpt:
      'Drenaje, poda y fertilizacion: el checklist antes de que empiecen los aguaceros.',
    body: [
      'Las primeras lluvias de mayo son el mejor momento del ano para sembrar en Panama. La tierra se ablanda y las plantas nuevas se establecen sin estres hidrico.',
      'Antes de sembrar, revisa el drenaje del terreno. Los encharcamientos prolongados pudren las raices de la mayoria de ornamentales. Canales sencillos o camas elevadas resuelven la mayoria de los casos.',
      'Poda los arbustos establecidos al inicio de la temporada para estimular crecimiento nuevo, y fertiliza una vez al mes mientras dure la lluvia.',
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
