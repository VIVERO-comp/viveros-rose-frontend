// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Con www: el apex redirige a www en produccion, y de aqui salen las URLs
  // canonicas y las del sitemap.
  site: 'https://www.plantaspanama.com',
  integrations: [sitemap()],
  // Sigue siendo un sitio estatico; el adaptador existe solo por los dos
  // endpoints de servidor (src/pages/api/*) que hablan con el order-api
  // guardando la API key fuera del navegador.
  output: 'static',
  adapter: vercel(),
  redirects: {
    // La antigua pagina de paisajismo vive ahora en su mini pagina de servicio.
    '/paisajismo': '/servicios/paisajismo',
  },
});
