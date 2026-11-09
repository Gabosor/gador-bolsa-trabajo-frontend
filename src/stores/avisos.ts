import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Aviso {
  id: number
  tipo: 'exito' | 'error'
  texto: string
}

const DURACION_MS = 4500

export const useAvisosStore = defineStore('avisos', () => {
  const lista = ref<Aviso[]>([])
  let siguiente = 1

  function quitar(id: number) {
    lista.value = lista.value.filter((a) => a.id !== id)
  }

  function agregar(tipo: Aviso['tipo'], texto: string) {
    const id = siguiente++
    lista.value = [...lista.value.slice(-2), { id, tipo, texto }]
    setTimeout(() => quitar(id), DURACION_MS)
  }

  return {
    lista,
    quitar,
    exito: (texto: string) => agregar('exito', texto),
    error: (texto: string) => agregar('error', texto),
  }
})
