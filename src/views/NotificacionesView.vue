<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BellOff, BellRing } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import { activarNotificacionesPush } from '@/api/push'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import { useAvisosStore } from '@/stores/avisos'
import { useNotificacionesStore, type Notificacion } from '@/stores/notificaciones'
import { fechaHora } from '@/utils/formato'

const avisos = useAvisosStore()
const contador = useNotificacionesStore()
const notificaciones = ref<Notificacion[]>([])
const error = ref('')
const cargada = ref(false)

const esHoy = (valor: string) => new Date(valor).toDateString() === new Date().toDateString()
const grupos = computed(() =>
  [
    { titulo: 'Hoy', items: notificaciones.value.filter((n) => esHoy(n.createdAt)) },
    { titulo: 'Anteriores', items: notificaciones.value.filter((n) => !esHoy(n.createdAt)) },
  ].filter((g) => g.items.length),
)

async function cargar() {
  try {
    notificaciones.value = await api<Notificacion[]>('/notificaciones')
    if (notificaciones.value.some((n) => !n.leida)) {
      await api('/notificaciones/leidas', { method: 'PATCH' })
      contador.sinLeer = 0
    }
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

async function activar() {
  try {
    await activarNotificacionesPush()
    avisos.exito('Notificaciones activadas en este dispositivo')
  } catch (e) {
    avisos.error(e instanceof Error && !('data' in e) ? e.message : mensajeError(e))
  }
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h1 class="titulo-pagina">Notificaciones</h1>
      <AccionBoton @click="activar"><BellRing class="size-5" aria-hidden="true" />Activar avisos</AccionBoton>
    </div>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="notificaciones.length === 0 && !error" :icono="BellOff" titulo="No tienes notificaciones" texto="Aquí verás los cambios en tus postulaciones y ofertas." />

    <div v-for="g in grupos" :key="g.titulo" class="mb-4">
      <h2 class="mb-1.5 text-lg font-bold">{{ g.titulo }}</h2>
      <ul class="plano divide-y divide-linea overflow-hidden">
        <li v-for="n in g.items" :key="n.id" class="flex gap-3 p-3" :class="{ 'bg-guinda-50': !n.leida }">
          <span class="mt-2 size-2.5 shrink-0 rounded-full" :class="n.leida ? 'bg-transparent' : 'bg-guinda-700'" />
          <div class="min-w-0">
            <p class="font-semibold">{{ n.titulo }}<span v-if="!n.leida" class="sr-only"> (nueva)</span></p>
            <p class="break-words">{{ n.mensaje }}</p>
            <p class="mt-0.5 text-base text-roca">{{ fechaHora(n.createdAt) }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
