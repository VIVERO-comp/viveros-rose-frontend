// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Con www: el apex redirige a www en produccion, y de aqui salen las URLs
  // canonicas y las del sitemap.
  site: 'https://www.plantaspanama.com',
  integrations: [
    sitemap({
      // Paginas transaccionales o privadas (carrito, checkout, rastreo,
      // cuenta): fuera del sitemap porque no queremos que Google las
      // recomiende. Ademas llevan noindex en Base. Entrega y las legales
      // si se indexan: la gente las busca antes de comprar.
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        return ![
          '/carrito',
          '/checkout',
          '/pedido',
          '/cuenta',
          // Portal del repartidor, panel de admin y calificacion de
          // entregas: llevan direcciones y telefonos de clientes, jamas
          // deben indexarse.
          '/repartidor',
          '/admin',
          '/calificar',
        ].some((prefijo) => path === prefijo || path.startsWith(`${prefijo}/`));
      },
      serialize(item) {
        // Sin barra final, igual que las canonicas y los enlaces internos.
        const path = new URL(item.url).pathname;
        if (path !== '/') item.url = item.url.replace(/\/$/, '');
        return item;
      },
    }),
  ],
  // Sigue siendo un sitio estatico; el adaptador existe solo por los dos
  // endpoints de servidor (src/pages/api/*) que hablan con el order-api
  // guardando la API key fuera del navegador.
  output: 'static',
  adapter: vercel(),
  redirects: {
    // La antigua pagina de paisajismo vive ahora en su mini pagina de servicio.
    '/paisajismo': '/servicios/paisajismo',
    // La guia de apartamentos se convirtio en "Las mejores plantas para
    // comprar en Panama" con slug nuevo.
    '/guia/plantas-para-apartamento': '/guia/mejores-plantas-panama',
    // El pothos paso a llamarse "potos" en la URL (nombre en espanol).
    // "photus" fue una grafia de Odoo que estuvo publicada hasta ago-2026.
    '/plantas/interior/pothos': '/plantas/interior/potos',
    '/plantas/interior/photus': '/plantas/interior/potos',
    '/plantas/interior/photos-multi-rama': '/plantas/interior/potos-multi-rama',
  },
});
