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

## Notificar a Abraham cada pedido nuevo

Del flujo de pedido original solo queda esto. El resto ya está conectado: el
checkout crea el pedido real en el order-api (número `VR-...`),
`checkout/success` es la confirmación real, y `/pedido` y el panel del navbar
consultan `GET /api/orders/{numero}`, que ya existe. El cliente recibe su
correo de confirmación por SES, pero Abraham hoy se entera del pedido por
Odoo o por el WhatsApp del cliente; falta una notificación interna.

(El pendiente de CORS del stock proxy se resolvió en ese repo: la lectura de
stock es pública, con CORS para los dominios de la tienda y límite por IP.)
