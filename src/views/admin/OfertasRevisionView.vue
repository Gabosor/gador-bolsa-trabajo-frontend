<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, mensajeError } from '@/api'
import type { EstadoOferta, Oferta, Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'

const ofertas = ref<Oferta[]>([])
const abierta = ref<number | null>(null)
const motivo = ref('')
const error = ref('')

async function cargar() {
  error.value = ''
  try {
    const r = await api<Paginado<Oferta>>('/ofertas/revision', { query: { limit: 100 } })
    ofertas.value = r.data
  } catch (e) {
    error.value = mensajeError(e)
  }
}

function salario(o: Oferta) {
  return o.salarioATratar ? 'A tratar' : `Bs ${o.salarioMin} – ${o.salarioMax}`
}

async function decidir(o: Oferta, estado: EstadoOferta) {
  error.value = ''
  try {
    await api(`/ofertas/${o.id}/estado`, {
      method: 'PATCH',
      body: { estado, motivo: motivo.value || undefined },
    })
    abierta.value = null
    motivo.value = ''
    await cargar()
  } catch (e) {
    error.value = mensajeError(e)
  }
}

onMounted(cargar)
</script>

<template>
  <section>
    <h1 class="mb-4 text-2xl font-semibold text-guinda-900">Revisión de ofertas</h1>
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="ofertas.length === 0 && !error" class="text-stone-700">No hay ofertas por revisar.</p>

    <ul class="space-y-3">
      <li v-for="o in ofertas" :key="o.id" class="rounded-md border border-stone-200 bg-white p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-semibold break-words">{{ o.titulo }}</h2>
            <p class="text-sm text-stone-600">{{ o.empresa?.razonSocial }} · Cierra el {{ o.fechaCierre }}</p>
          </div>
          <AccionBoton @click="abierta = abierta === o.id ? null : o.id">
            {{ abierta === o.id ? 'Ocultar' : 'Revisar' }}
          </AccionBoton>
        </div>

        <div v-if="abierta === o.id" class="mt-3 space-y-3 text-sm">
          <p class="whitespace-pre-line">{{ o.descripcion }}</p>
          <p class="whitespace-pre-line"><strong>Requisitos:</strong> {{ o.requisitosObligatorios }}</p>
          <p>
            <strong>Condiciones:</strong> {{ o.tipoContrato.nombre }} · {{ o.modalidad.nombre }} ·
            {{ o.municipio.nombre }} · {{ salario(o) }} · {{ o.numeroPlazas }} plaza(s)
          </p>
          <p><strong>Profesiones:</strong> {{ o.profesiones.map((p) => p.nombre).join(', ') }}</p>
          <p><strong>Habilidades:</strong> {{ o.habilidades.map((h) => h.habilidad.nombre).join(', ') }}</p>
          <label class="block">
            <span class="mb-1 block font-medium">Motivo (obligatorio para rechazar)</span>
            <textarea v-model="motivo" rows="2" class="w-full rounded-md border border-stone-400 p-3" />
          </label>
          <div class="flex flex-wrap gap-2">
            <AccionBoton @click="decidir(o, 'PUBLICADA')">Aprobar y publicar</AccionBoton>
            <AccionBoton @click="decidir(o, 'BORRADOR')">Rechazar</AccionBoton>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
