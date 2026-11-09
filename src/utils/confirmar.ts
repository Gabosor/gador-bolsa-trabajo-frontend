import { shallowRef } from 'vue'

export interface OpcionesDialogo {
  titulo: string
  mensaje?: string
  accion: string
  peligro?: boolean
  /** Si se define, el diálogo pide un texto y lo exige antes de continuar. */
  campo?: { etiqueta: string; valor?: string; multilinea?: boolean; opcional?: boolean }
}

interface Pendiente extends OpcionesDialogo {
  resolver: (respuesta: string | null) => void
}

export const dialogoActual = shallowRef<Pendiente | null>(null)

/** Abre el diálogo y devuelve el texto escrito, '' si no pedía texto, o null si se canceló. */
function abrir(opciones: OpcionesDialogo): Promise<string | null> {
  return new Promise((resolver) => {
    dialogoActual.value = { ...opciones, resolver }
  })
}

export async function confirmar(opciones: Omit<OpcionesDialogo, 'campo'>): Promise<boolean> {
  return (await abrir(opciones)) !== null
}

export function pedirTexto(
  opciones: OpcionesDialogo & { campo: NonNullable<OpcionesDialogo['campo']> },
): Promise<string | null> {
  return abrir(opciones)
}
