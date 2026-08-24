// Service worker de los avisos Web Push (portal /repartidor y avisos del
// dueno). Sin manejador de fetch a proposito: no cachea ni intercepta nada
// del sitio; solo muestra las notificaciones que manda el order-api y abre
// la pagina al tocarlas. El payload es {titulo, cuerpo, url} (push.py).

self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    // payload ilegible: se muestra el aviso generico
  }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Vivero Rose', {
      body: datos.cuerpo || '',
      icon: '/icono-192.png',
      badge: '/icono-192.png',
      data: { url: datos.url || '/repartidor' },
    }),
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const url = (evento.notification.data && evento.notification.data.url) || '/repartidor';
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      // Si el portal ya esta abierto, se enfoca en vez de abrir otra pestana.
      for (const ventana of ventanas) {
        if (ventana.url.includes('/repartidor') && 'focus' in ventana) {
          ventana.navigate(url);
          return ventana.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
