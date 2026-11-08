<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, mensajeError } from '@/api'
import AccionBoton from '@/components/AccionBoton.vue'

interface Favorito {
  id: number
  oferta: { id: number; titulo: string; fechaCierre: string; empresa: { razonSocial: string } }
}

const favoritos = ref<Favorito[]>([])
const error = ref('')
const cargada = ref(false)

async function cargar() {
  error.value = ''
  try {
    favoritos.value = await api<Favorito[]>('/postulaciones/favoritos')
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

async function quitar(f: Favorito) {
  try {
    await api(`/postulaciones/favoritos/${f.oferta.id}`, { method: 'DELETE' })
    await cargar()
  } catch (e) {
    error.value = mensajeError(e)
  }
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="mb-4 text-2xl font-semibold text-guinda-900">Ofertas guardadas</h1>
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="cargada && favoritos.length === 0 && !error" class="text-stone-700">Todavía no guardaste ofertas.</p>
    <ul class="space-y-3">
      <li v-for="f in favoritos" :key="f.id" class="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white p-4">
        <RouterLink :to="`/ofertas/${f.oferta.id}`" class="min-w-0">
          <span class="block font-semibold break-words text-guinda-900">{{ f.oferta.titulo }}</span>
          <span class="block text-sm text-stone-600">{{ f.oferta.empresa.razonSocial }} · Cierra el {{ f.oferta.fechaCierre }}</span>
        </RouterLink>
        <AccionBoton @click="quitar(f)">Quitar</AccionBoton>
      </li>
    </ul>
  </section>
</template>
