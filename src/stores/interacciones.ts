import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, mensajeError } from '@/api'
import type { Paginado, Postulacion } from '@/api/tipos'
import { useAvisosStore } from './avisos'

/** Lo que el postulante ya hizo con cada oferta: guardarla o postular. */
export const useInteraccionesStore = defineStore('interacciones', () => {
  const favoritos = ref(new Set<number>())
  const postulaciones = ref(new Map<number, string>())

  async function cargar() {
    const [listaFavoritos, listaPostulaciones] = await Promise.all([
      api<{ oferta: { id: number } }[]>('/postulaciones/favoritos'),
      api<Paginado<Postulacion>>('/postulaciones/mias', { query: { limit: 100 } }),
    ])
    favoritos.value = new Set(listaFavoritos.map((f) => f.oferta.id))
    postulaciones.value = new Map(listaPostulaciones.data.map((p) => [p.oferta.id, p.estado]))
  }

  function limpiar() {
    favoritos.value = new Set()
    postulaciones.value = new Map()
  }

  /** Cambia el corazón al instante y lo revierte si el servidor falla. */
  async function alternarFavorito(ofertaId: number) {
    const avisos = useAvisosStore()
    const estaba = favoritos.value.has(ofertaId)
    const fijar = (activo: boolean) => {
      const copia = new Set(favoritos.value)
      if (activo) copia.add(ofertaId)
      else copia.delete(ofertaId)
      favoritos.value = copia
    }
    fijar(!estaba)
    try {
      await api(`/postulaciones/favoritos/${ofertaId}`, { method: estaba ? 'DELETE' : 'POST' })
      avisos.exito(estaba ? 'Oferta quitada de guardadas' : 'Oferta guardada')
    } catch (e) {
      fijar(estaba)
      avisos.error(mensajeError(e))
    }
  }

  function registrarPostulacion(ofertaId: number, estado: string) {
    postulaciones.value = new Map(postulaciones.value).set(ofertaId, estado)
  }

  function olvidarPostulacion(ofertaId: number) {
    const copia = new Map(postulaciones.value)
    copia.delete(ofertaId)
    postulaciones.value = copia
  }

  return {
    favoritos,
    postulaciones,
    cargar,
    limpiar,
    alternarFavorito,
    registrarPostulacion,
    olvidarPostulacion,
  }
})
