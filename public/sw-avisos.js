// Service worker de los avisos Web Push (portal /repartidor y panel /admin).
// Sin manejador de fetch a proposito: no cachea ni intercepta nada del
// sitio; solo muestra las notificaciones que manda el order-api, pone el
// globito rojo en el icono de la app instalada y abre la pagina al tocarlas.
// El payload es {titulo, cuerpo, url} (push.py).

// La version nueva del worker entra al siguiente arranque de la pagina, sin
// esperar a que se cierren todas las ventanas.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

// El numero del globito es la cantidad de avisos sin atender: los que siguen
// en el centro de notificaciones de este worker. Sin almacen propio, no se
// desincroniza. En iPhone funciona con la pagina instalada (iOS 16.4+).
function actualizarGlobito() {
  if (!('setAppBadge' in self.navigator)) return Promise.resolve();
  return self.registration
    .getNotifications()
    .then((avisos) =>
      avisos.length
        ? self.navigator.setAppBadge(avisos.length)
        : self.navigator.clearAppBadge(),
    )
    .catch(() => {});
}

self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    // payload ilegible: se muestra el aviso generico
  }
  evento.waitUntil(
    self.registration
      .showNotification(datos.titulo || 'Vivero Rose', {
        body: datos.cuerpo || '',
        icon: '/icono-192.png',
        badge: '/icono-192.png',
        data: { url: datos.url || '/repartidor' },
      })
      .then(actualizarGlobito),
  );
});

// La app a la que pertenece una URL: su primer tramo (/repartidor o /admin).
function appDe(url) {
  return new URL(url, self.location.origin).pathname.split('/')[1] || '';
}

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const url = (evento.notification.data && evento.notification.data.url) || '/repartidor';
  evento.waitUntil(
    Promise.all([
      actualizarGlobito(),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
        // Si esa app (portal o panel) ya esta abierta, se enfoca en vez de
        // abrir otra pestana.
        for (const ventana of ventanas) {
          if (appDe(ventana.url) === appDe(url) && 'focus' in ventana) {
            ventana.navigate(url);
            return ventana.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
    ]),
  );
});
