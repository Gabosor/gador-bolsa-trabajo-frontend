import { ofetch } from 'ofetch'

export const TOKEN_KEY = 'gador_token'

/** Cliente HTTP: agrega el JWT y cierra la sesión si el token ya no sirve. */
export const api = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL,
  onRequest({ options }) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) options.headers.set('Authorization', `Bearer ${token}`)
  },
  onResponseError({ response }) {
    if (response.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }
  },
})

/** Convierte el error de la API en un texto para mostrar al usuario. */
export function mensajeError(error: unknown): string {
  const message = (error as { data?: { message?: string | string[] } }).data?.message
  if (Array.isArray(message)) return message.join('. ')
  if (message) return message
  return navigator.onLine
    ? 'No se pudo conectar con el servidor. Intenta de nuevo.'
    : 'No tienes conexión a internet. Revisa tu red e intenta de nuevo.'
}
