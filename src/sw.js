import { clientsClaim } from 'workbox-core'
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

// Guarda los archivos de la app para que abra rápido y se pueda instalar.
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.skipWaiting()
clientsClaim()

// RF12: muestra en el celular los avisos enviados por el backend.
self.addEventListener('push', (evento) => {
  const datos = evento.data ? evento.data.json() : {}
  evento.waitUntil(
    self.registration.showNotification(datos.titulo ?? 'Bolsa de Trabajo GADOR', {
      body: datos.mensaje,
      icon: '/icons/icon-192.png',
    }),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  evento.waitUntil(self.clients.openWindow('/notificaciones'))
})
