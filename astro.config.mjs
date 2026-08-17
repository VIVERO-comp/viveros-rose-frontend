// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://plantaspanama.com',
  output: 'static',
  redirects: {
    // La antigua pagina de paisajismo vive ahora en su mini pagina de servicio.
    '/paisajismo': '/servicios/paisajismo',
  },
});
