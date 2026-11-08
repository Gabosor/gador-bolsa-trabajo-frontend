<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api, mensajeError } from '@/api'
import type { Empresa, EstadoEmpresa, Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'

const FILTROS: { valor: EstadoEmpresa; texto: string }[] = [
  { valor: 'PENDIENTE_VALIDACION', texto: 'Pendientes' },
  { valor: 'APROBADA', texto: 'Aprobadas' },
  { valor: 'RECHAZADA', texto: 'Rechazadas' },
  { valor: 'SUSPENDIDA', texto: 'Suspendidas' },
]

const filtro = ref<EstadoEmpresa>('PENDIENTE_VALIDACION')
const empresas = ref<Empresa[]>([])
const detalle = ref<Empresa | null>(null)
const motivo = ref('')
const error = ref('')

async function cargar() {
  error.value = ''
  try {
    const r = await api<Paginado<Empresa>>('/empresas', {
      query: { estado: filtro.value, limit: 100 },
    })
    empresas.value = r.data
  } catch (e) {
    error.value = mensajeError(e)
  }
}

async function abrir(e: Empresa) {
  error.value = ''
  motivo.value = ''
  try {
    detalle.value = await api<Empresa>(`/empresas/${e.id}`)
  } catch (err) {
    error.value = mensajeError(err)
  }
}

async function cambiar(estado: EstadoEmpresa) {
  if (!detalle.value) return
  error.value = ''
  try {
    await api(`/empresas/${detalle.value.id}/estado`, {
      method: 'PATCH',
      body: { estado, motivo: motivo.value || undefined },
    })
    detalle.value = null
    await cargar()
  } catch (e) {
    error.value = mensajeError(e)
  }
}

onMounted(cargar)
watch(filtro, () => {
  detalle.value = null
  cargar()
})
</script>

<template>
  <section>
    <h1 class="mb-4 text-2xl font-semibold text-guinda-900">Validación de empresas</h1>
    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="f in FILTROS"
        :key="f.valor"
        class="min-h-11 rounded-md border px-3 text-sm font-medium"
        :class="filtro === f.valor ? 'border-guinda-700 bg-guinda-700 text-white' : 'border-stone-400 bg-white'"
        :aria-pressed="filtro === f.valor"
        @click="filtro = f.valor"
      >
        {{ f.texto }}
      </button>
    </div>

    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>

    <div v-if="detalle" class="mb-6 rounded-md border border-stone-300 bg-white p-4">
      <div class="mb-3 flex items-start justify-between gap-3">
        <h2 class="text-lg font-semibold">{{ detalle.razonSocial }}</h2>
        <EstadoBadge :estado="detalle.estado" />
      </div>
      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div><dt class="text-stone-600">NIT</dt><dd>{{ detalle.nit }}</dd></div>
        <div><dt class="text-stone-600">Rubro</dt><dd>{{ detalle.rubro.nombre }}</dd></div>
        <div><dt class="text-stone-600">Representante</dt><dd>{{ detalle.representanteLegal }} (CI {{ detalle.ciRepresentante }})</dd></div>
        <div><dt class="text-stone-600">Contacto</dt><dd class="break-words">{{ detalle.celular }} · {{ detalle.emailCorporativo }}</dd></div>
        <div class="sm:col-span-2"><dt class="text-stone-600">Dirección</dt><dd>{{ detalle.direccion }}</dd></div>
        <div class="sm:col-span-2"><dt class="text-stone-600">Descripción</dt><dd>{{ detalle.descripcion }}</dd></div>
      </dl>
      <div class="mt-3 flex flex-wrap gap-4 text-sm">
        <a v-if="detalle.documentoNitUrl" :href="detalle.documentoNitUrl" target="_blank" rel="noopener" class="font-medium text-guinda-700 underline">Ver documento NIT</a>
        <a v-if="detalle.documentoLegalUrl" :href="detalle.documentoLegalUrl" target="_blank" rel="noopener" class="font-medium text-guinda-700 underline">Ver respaldo legal</a>
      </div>
      <label class="mt-4 block">
        <span class="mb-1 block text-sm font-medium">Motivo (obligatorio para rechazar o suspender)</span>
        <textarea v-model="motivo" rows="2" class="w-full rounded-md border border-stone-400 p-3" />
      </label>
      <div class="mt-3 flex flex-wrap gap-2">
        <AccionBoton v-if="detalle.estado !== 'APROBADA'" @click="cambiar('APROBADA')">Aprobar</AccionBoton>
        <AccionBoton v-if="detalle.estado === 'PENDIENTE_VALIDACION'" @click="cambiar('RECHAZADA')">Rechazar</AccionBoton>
        <AccionBoton v-if="detalle.estado === 'APROBADA'" @click="cambiar('SUSPENDIDA')">Suspender</AccionBoton>
        <AccionBoton @click="detalle = null">Cerrar</AccionBoton>
      </div>
    </div>

    <p v-if="empresas.length === 0 && !error" class="text-stone-700">No hay empresas en este estado.</p>
    <ul class="space-y-2">
      <li v-for="e in empresas" :key="e.id" class="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white p-3">
        <div class="min-w-0">
          <p class="font-medium break-words">{{ e.razonSocial }}</p>
          <p class="text-xs text-stone-600">NIT {{ e.nit }} · {{ e.rubro.nombre }}</p>
        </div>
        <AccionBoton @click="abrir(e)">Revisar</AccionBoton>
      </li>
    </ul>
  </section>
</template>
