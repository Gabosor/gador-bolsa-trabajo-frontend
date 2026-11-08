import { api } from '@/api'

/** Pide permiso al navegador y registra este dispositivo para recibir avisos. */
export async function activarNotificacionesPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Este navegador no admite notificaciones')
  }
  if ((await Notification.requestPermission()) !== 'granted') {
    throw new Error('No se concedió el permiso de notificaciones')
  }
  const registro = await navigator.serviceWorker.ready
  const suscripcion = await registro.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64AArreglo(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })
  const { endpoint, keys } = suscripcion.toJSON()
  await api('/notificaciones/suscripcion', { method: 'POST', body: { endpoint, keys } })
}

function base64AArreglo(base64: string): Uint8Array<ArrayBuffer> {
  const texto = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(texto.length))
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i)
  return bytes
}
