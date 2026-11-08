<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, mensajeError } from '@/api'
import type { Paginado, Postulacion } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'

const postulaciones = ref<Postulacion[]>([])
const abierta = ref<number | null>(null)
const error = ref('')
const cargada = ref(false)

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
  if (!confirm(`¿Retirar tu postulación a "${p.oferta.titulo}"?`)) return
  error.value = ''
  try {
    await api(`/postulaciones/${p.id}`, { method: 'DELETE' })
    await cargar()
  } catch (e) {
    error.value = mensajeError(e)
  }
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="mb-4 text-2xl font-semibold text-guinda-900">Mis postulaciones</h1>
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="cargada && postulaciones.length === 0 && !error" class="text-stone-700">
      Aún no postulaste a ninguna oferta.
      <RouterLink to="/ofertas" class="font-medium text-guinda-700 underline">Ver ofertas</RouterLink>
    </p>

    <ul class="space-y-3">
      <li v-for="p in postulaciones" :key="p.id" class="rounded-md border border-stone-200 bg-white p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <h2 class="font-semibold break-words">{{ p.oferta.titulo }}</h2>
            <p class="text-sm text-stone-600">
              {{ p.oferta.empresa.razonSocial }} · {{ new Date(p.createdAt).toLocaleDateString('es-BO') }} ·
              Compatibilidad {{ p.porcentajeMatch }} %
            </p>
          </div>
          <EstadoBadge :estado="p.estado" />
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <AccionBoton @click="abierta = abierta === p.id ? null : p.id">
            {{ abierta === p.id ? 'Ocultar detalle' : 'Ver detalle' }}
          </AccionBoton>
          <AccionBoton v-if="p.estado === 'POSTULADO'" @click="retirar(p)">Retirar</AccionBoton>
        </div>
        <div v-if="abierta === p.id" class="mt-3 space-y-2 text-sm">
          <p class="whitespace-pre-line">{{ p.oferta.descripcion }}</p>
          <p class="whitespace-pre-line"><strong>Requisitos:</strong> {{ p.oferta.requisitosObligatorios }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
