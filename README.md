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
| `/entrega` | Zonas y tarifas de entrega |
| `/vivero` | Historia del vivero fisico |
| `/paisajismo` | Servicios de paisajismo |
| `/mayorista` | Venta al por mayor (B2B) |
| `/guia` y `/guia/[slug]` | Guias de cuidado (SEO) |
| `/contacto` | Contacto (WhatsApp primero) |
| `/carrito` | Carrito (cliente, localStorage) |
| `/checkout` | Checkout de invitado |
| `/checkout/success` | Confirmacion post-pago |
| `/pedido` | Rastreo publico de pedido por numero |

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

## Estado y pendientes (backend)

Este repositorio es **solo el frontend**. El catalogo usa datos de ejemplo en `src/data/products.ts` con la forma final (SKU como llave hacia Odoo). Quedan fuera y se integran despues:

- **Stock proxy** (`src/lib/stock.ts` ya es el cliente): badges se actualizan con datos reales cuando `PUBLIC_STOCK_PROXY_URL` este activo.
- **Pagos Wompi**: el checkout valida el formulario y hoy dirige a WhatsApp; el `POST /api/checkout/create-intent` se conecta cuando exista el backend.
- **Rastreo de pedidos**: `/pedido` consulta `GET /api/orders/{orderNumber}` y degrada a WhatsApp mientras no exista.

El frontend **nunca** habla con Odoo directamente ni escribe stock.
