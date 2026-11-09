import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api'

export interface Notificacion {
  id: number
  titulo: string
  mensaje: string
  leida: boolean
  createdAt: string
}

export const useNotificacionesStore = defineStore('notificaciones', () => {
  const sinLeer = ref(0)

  /** Actualiza el contador de la campana; un fallo aquí no debe molestar. */
  async function actualizar() {
    try {
      const lista = await api<Notificacion[]>('/notificaciones')
      sinLeer.value = lista.filter((n) => !n.leida).length
    } catch {
      // El contador se corrige en la siguiente consulta.
    }
  }

  return { sinLeer, actualizar }
})
