<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ChevronRight, ClipboardCheck } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Oferta, Paginado } from '@/api/tipos'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import LogoEmpresa from '@/components/LogoEmpresa.vue'
import { textoCierre } from '@/utils/formato'

const ofertas = ref<Oferta[]>([])
const error = ref('')
const cargada = ref(false)

async function cargar() {
  error.value = ''
  try {
    const r = await api<Paginado<Oferta>>('/ofertas/revision', { query: { limit: 100 } })
    ofertas.value = r.data
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="titulo-pagina mb-3">Revisión de ofertas</h1>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="ofertas.length === 0 && !error" :icono="ClipboardCheck" titulo="No hay ofertas por revisar" texto="Las ofertas enviadas por las empresas aparecerán aquí." />

    <ul v-else class="plano divide-y divide-linea overflow-hidden">
      <li v-for="o in ofertas" :key="o.id">
        <RouterLink :to="{ name: 'admin-oferta', params: { id: o.id } }" class="flex min-h-16 w-full items-center gap-3 p-3 hover:bg-guinda-50/50">
          <LogoEmpresa :nombre="o.empresa?.razonSocial ?? o.titulo" :url="o.empresa?.logoUrl" />
          <span class="min-w-0 flex-1">
            <span class="block font-semibold break-words">{{ o.titulo }}</span>
            <span class="block text-base text-roca">{{ o.empresa?.razonSocial }}. {{ textoCierre(o.fechaCierre) }}</span>
          </span>
          <ChevronRight class="size-5 shrink-0 text-roca" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
