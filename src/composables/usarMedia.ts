import { onBeforeUnmount, ref } from 'vue'

/** Si la consulta de medios se cumple; se actualiza al girar o redimensionar. */
export function usarMedia(consulta: string) {
  const lista = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(consulta) : null
  const coincide = ref(lista?.matches ?? false)
  const cambio = (e: MediaQueryListEvent) => (coincide.value = e.matches)
  lista?.addEventListener?.('change', cambio)
  onBeforeUnmount(() => lista?.removeEventListener?.('change', cambio))
  return coincide
}
