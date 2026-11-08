<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, mensajeError } from '@/api'
import { activarNotificacionesPush } from '@/api/push'
import AccionBoton from '@/components/AccionBoton.vue'

interface Notificacion {
  id: number
  titulo: string
  mensaje: string
  leida: boolean
  createdAt: string
}

const notificaciones = ref<Notificacion[]>([])
const error = ref('')
const aviso = ref('')
const cargada = ref(false)

async function cargar() {
  try {
    notificaciones.value = await api<Notificacion[]>('/notificaciones')
    if (notificaciones.value.some((n) => !n.leida)) {
      await api('/notificaciones/leidas', { method: 'PATCH' })
    }
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

async function activar() {
  error.value = ''
  aviso.value = ''
  try {
    await activarNotificacionesPush()
    aviso.value = 'Notificaciones activadas en este dispositivo'
  } catch (e) {
    error.value = e instanceof Error && !('data' in e) ? e.message : mensajeError(e)
  }
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-guinda-900">Notificaciones</h1>
      <AccionBoton @click="activar">Activar en este dispositivo</AccionBoton>
    </div>
    <p v-if="aviso" role="status" class="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-900">{{ aviso }}</p>
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="cargada && notificaciones.length === 0 && !error" class="text-stone-700">No tienes notificaciones.</p>
    <ul class="space-y-2">
      <li v-for="n in notificaciones" :key="n.id" class="rounded-md border border-stone-200 bg-white p-3" :class="{ 'border-l-4 border-l-guinda-700': !n.leida }">
        <p class="font-medium">
          {{ n.titulo }}
          <span v-if="!n.leida" class="ml-1 text-xs font-normal text-guinda-700">Nueva</span>
        </p>
        <p class="text-sm break-words">{{ n.mensaje }}</p>
        <p class="mt-1 text-xs text-stone-600">{{ new Date(n.createdAt).toLocaleString('es-BO') }}</p>
      </li>
    </ul>
  </section>
</template>
