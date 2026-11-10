import type { Router } from 'vue-router'

/**
 * Tras decidir, vuelve a la lista de la que vino (conserva su filtro y su
 * scroll); si se entró por enlace directo, abre la lista del estado previo.
 */
export function volverALista(router: Router, nombre: 'admin-empresas' | 'admin-ofertas', estado?: string) {
  const ruta = router.resolve({ name: nombre }).path
  const anterior = window.history.state?.back
  if (typeof anterior === 'string' && anterior.split('?')[0] === ruta) router.back()
  else router.replace({ name: nombre, query: estado ? { estado } : undefined })
}
