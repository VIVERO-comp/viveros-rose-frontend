# Pendientes del frontend

Cosas decididas pero fuera del alcance del rediseño actual. No borrar sin
resolverlas o descartarlas explícitamente.

## Accesorios como productos con SKU

El diseño del carrito sugiere complementos (sustrato para maceta, abono,
matera de barro). Hoy la sección "Va bien con" del carrito muestra plantas
reales del catálogo porque esos accesorios no existen como productos con SKU
en `src/data/products.ts` ni en Odoo. Cuando Abraham decida si vende
accesorios, se crean como productos con su SKU y la sección del carrito se
cambia a los complementos del diseño.

## Flujo de pedido completo (orders-api)

El checkout hoy confirma el pedido por WhatsApp. El flujo completo va aparte
y requiere modo server de Astro (hoy `output: 'static'`):

- Conectar el checkout al orders-api para crear un pedido real con número.
- Página de "pedido confirmado" al aprobarse (hoy existe `checkout/success`
  sin uso real).
- Notificar a Abraham cada pedido nuevo.
- Seguimiento de estados reales en la página de Pedidos y en el panel del
  navbar (hoy consultan `GET /api/orders/{numero}` que aún no existe).

## CORS del stock proxy

`StockBadge` ya llama a `fetchStock()` del stock proxy desde el navegador,
pero el proxy (repo `vivero-rose-stock-proxy`) aún no tiene CORS habilitado
para el dominio de la tienda; sin eso el refresco en producción se bloquea.
Se resuelve en el repo del proxy, no aquí.
