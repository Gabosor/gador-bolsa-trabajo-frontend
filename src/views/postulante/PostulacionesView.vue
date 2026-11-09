<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Send } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Paginado, Postulacion } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import Faja from '@/components/Faja.vue'
import { useAvisosStore } from '@/stores/avisos'
import { useInteraccionesStore } from '@/stores/interacciones'
import { confirmar } from '@/utils/confirmar'
import { ETAPAS_POSTULACION, fechaHora } from '@/utils/formato'

const FINALES = ['CONTRATADO', 'RECHAZADO']

const avisos = useAvisosStore()
const interacciones = useInteraccionesStore()
const postulaciones = ref<Postulacion[]>([])
const abierta = ref<number | null>(null)
const pestana = ref<'activas' | 'finalizadas'>('activas')
const error = ref('')
const cargada = ref(false)

const esFinal = (p: Postulacion) => FINALES.includes(p.estado)
const activas = computed(() => postulaciones.value.filter((p) => !esFinal(p)))
const finalizadas = computed(() => postulaciones.value.filter(esFinal))
const visibles = computed(() => (pestana.value === 'activas' ? activas.value : finalizadas.value))
const etapa = (estado: string) => ETAPAS_POSTULACION.indexOf(estado) + 1

async function cargar() {
  error.value = ''
  try {
    const r = await api<Paginado<Postulacion>>('/postulaciones/mias', { query: { limit: 100 } })
    postulaciones.value = r.data
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

async function retirar(p: Postulacion) {
  const ok = await confirmar({
    titulo: 'Retirar postulación',
    mensaje: `Dejarás de participar en "${p.oferta.titulo}".`,
    accion: 'Retirar',
    peligro: true,
  })
  if (!ok) return
  try {
    await api(`/postulaciones/${p.id}`, { method: 'DELETE' })
    interacciones.olvidarPostulacion(p.oferta.id)
    avisos.exito('Postulación retirada')
    await cargar()
  } catch (e) {
    avisos.error(mensajeError(e))
  }
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="titulo-pagina mb-3">Mis postulaciones</h1>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>

    <div v-if="postulaciones.length" class="mb-3 grid grid-cols-2 rounded-campo bg-linea/60 p-1" role="tablist">
      <button type="button" role="tab" :aria-selected="pestana === 'activas'" class="min-h-11 rounded-md font-semibold" :class="pestana === 'activas' ? 'bg-white' : 'text-roca'" @click="pestana = 'activas'">En curso ({{ activas.length }})</button>
      <button type="button" role="tab" :aria-selected="pestana === 'finalizadas'" class="min-h-11 rounded-md font-semibold" :class="pestana === 'finalizadas' ? 'bg-white' : 'text-roca'" @click="pestana = 'finalizadas'">Finalizadas ({{ finalizadas.length }})</button>
    </div>

    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="postulaciones.length === 0 && !error" :icono="Send" titulo="Aún no postulaste a ninguna oferta" texto="Cuando postules, aquí verás cómo avanza cada proceso.">
      <RouterLink to="/ofertas"><AccionBoton variante="primario">Ver ofertas</AccionBoton></RouterLink>
    </EstadoVacio>
    <p v-else-if="visibles.length === 0" class="py-8 text-center text-roca">No hay postulaciones en esta lista.</p>

    <ul class="space-y-3">
      <li v-for="p in visibles" :key="p.id" class="plano p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <h2 class="text-lg font-bold break-words text-guinda-900">
              <RouterLink :to="`/ofertas/${p.oferta.id}`" class="inline-flex min-h-11 items-center">{{ p.oferta.titulo }}</RouterLink>
            </h2>
            <p>{{ p.oferta.empresa.razonSocial }}</p>
          </div>
          <EstadoBadge :estado="p.estado" />
        </div>
        <div v-if="p.estado !== 'RECHAZADO'" class="mt-3">
          <Faja :total="ETAPAS_POSTULACION.length" :completos="etapa(p.estado)" :etiqueta="`Etapa ${etapa(p.estado)} de ${ETAPAS_POSTULACION.length} del proceso`" />
        </div>
        <p class="mt-2 text-base text-roca">Postulaste el {{ fechaHora(p.createdAt) }}, compatibilidad {{ p.porcentajeMatch }} %</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <AccionBoton @click="abierta = abierta === p.id ? null : p.id">{{ abierta === p.id ? 'Ocultar detalle' : 'Ver detalle' }}</AccionBoton>
          <AccionBoton v-if="p.estado === 'POSTULADO'" variante="peligro" @click="retirar(p)">Retirar</AccionBoton>
        </div>
        <div v-if="abierta === p.id" class="mt-3 space-y-2 border-t border-linea pt-3">
          <p class="break-words whitespace-pre-line">{{ p.oferta.descripcion }}</p>
          <p class="break-words whitespace-pre-line"><strong>Requisitos:</strong> {{ p.oferta.requisitosObligatorios }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
