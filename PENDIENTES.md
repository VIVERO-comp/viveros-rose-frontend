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

## Notificar a Abraham cada pedido nuevo — resuelto el 24/08/2026

El order-api manda el correo de aviso a `CORREO_ADMIN` en cada pedido nuevo
y en cada entrega con foto, y con las claves VAPID configuradas también el
Web Push del dueño (se activa abriendo `/repartidor?clave=<clave del dueño>`
y tocando "Activar avisos"). Queda aquí hasta verificarlo con pedidos
reales.

(El pendiente de CORS del stock proxy se resolvió en ese repo: la lectura de
stock es pública, con CORS para los dominios de la tienda y límite por IP.)
