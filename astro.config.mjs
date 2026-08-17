// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://plantaspanama.com',
  output: 'static',
  redirects: {
    // La pagina de paisajismo ahora vive en /servicios (diseno "Servicios").
    '/paisajismo': '/servicios',
  },
});
