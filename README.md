# viveros-rose-frontend

Frontend en [Astro](https://astro.build) de **Plantas Panama** (`plantaspanama.com`), la tienda online de Vivero Rose.

Implementa la arquitectura de informacion y el sistema visual de la propuesta de diseno (v0.1): tienda de plantas con inventario real, entrega a domicilio y WhatsApp como canal principal de soporte.

## Rutas

| Ruta | Contenido |
|------|-----------|
| `/` | Home: comercio + prueba local |
| `/plantas` | Catalogo con badges de stock |
| `/plantas/[category]` | Listado por categoria |
| `/plantas/[category]/[slug]` | Detalle de producto + agregar al carrito |
| `/colecciones` | Colecciones curadas del catalogo |
| `/quiz` | Quiz "Encuentra tu planta ideal" |
| `/entrega` | Zonas y tarifas de entrega |
| `/vivero` | Historia del vivero fisico |
| `/servicios` y `/servicios/[slug]` | Servicios del vivero (paisajismo, mantenimiento) |
| `/eventos` y `/eventos/[slug]` | Eventos y talleres |
| `/mayorista` | Venta al por mayor (B2B) |
| `/guia` y `/guia/[slug]` | Guias de cuidado (SEO) |
| `/contacto` | Contacto (WhatsApp primero) |
| `/carrito` | Carrito (cliente, localStorage) |
| `/checkout` | Checkout de invitado |
| `/checkout/success` | Confirmacion del pedido creado |
| `/pedido` | Rastreo publico de pedido por numero |
| `/cuenta` | Cuenta del cliente: historial de pedidos; `entrar`, `registro`, `verificar` y `recuperar` |
| `/repartidor` | Portal del repartidor (instalable como app; la clave del enlace personal es la credencial; noindex) |
| `/calificar` | Calificacion de la entrega con propina opcional (se llega por WhatsApp; noindex) |
| `/privacidad` y `/terminos` | Paginas legales |

## Desarrollo

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
npm run preview
```

## Configuracion

Copia `.env.example` a `.env`:

- `PUBLIC_STOCK_PROXY_URL` — URL del stock proxy (disponibilidad real desde Odoo).
- `PUBLIC_WHATSAPP_NUMBER` — numero de WhatsApp del negocio.
- `ORDER_API_URL` y `ORDER_API_KEY` — order-api (`vivero-rose-order-api`). Solo las
  funciones de servidor las usan; la key nunca llega al navegador. En produccion se
  cargan en el panel de Vercel.

En produccion el sitio se despliega en **Vercel** (adaptador `@astrojs/vercel`), no
en el droplet.

## Integraciones (backend)

Este repositorio es **solo el frontend**; los backends viven en sus propios repos y
ya estan conectados:

- **Catalogo**: `src/data/products.ts` es el export real de Odoo (18/08/2026). El SKU
  (referencia interna de Odoo) es la llave hacia el stock proxy y el order-api.
  Descripcion, cuidados y parte de los precios siguen como placeholder hasta
  completarlos en Odoo.
- **Productos archivados en Odoo**: en el build, `src/lib/catalogo-build.ts` consulta
  el stock proxy y publica solo los productos que este reconoce (el proxy filtra por
  `active`). Un archivado sale del catalogo, del buscador y del sitemap, y su pagina
  deja de generarse (404). **Archivar un producto en Odoo NO lo quita del sitio al
  instante: hace falta un rebuild/redeploy del frontend en Vercel.** Si el proxy no
  responde durante el build, se publica el catalogo completo (con un aviso en el log
  del build) antes que tumbar el deploy.
- **Stock** (`vivero-rose-stock-proxy`): `src/lib/stock.ts` es el cliente; los badges
  muestran disponibilidad real via `PUBLIC_STOCK_PROXY_URL`.
- **Pedidos y cuentas** (`vivero-rose-order-api`): las funciones de servidor en
  `src/pages/api/` son el unico puente. El checkout crea el pedido real (numero
  `VR-...`) y el pago se coordina por WhatsApp (Yappy, transferencia o efectivo);
  `/pedido` consulta el estado publico y `/cuenta` maneja registro, sesion e
  historial. Wompi (pago online) queda disenado pero sin conectar.

El frontend **nunca** habla con Odoo directamente ni escribe stock.
