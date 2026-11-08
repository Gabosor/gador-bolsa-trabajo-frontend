<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import type { Empresa, EstadoOferta, Oferta, Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'

const router = useRouter()
const empresa = ref<Empresa | null>(null)
const ofertas = ref<Oferta[]>([])
const error = ref('')

async function cargar() {
  error.value = ''
  try {
    const [miEmpresa, lista] = await Promise.all([
      api<Empresa>('/empresas/mi-empresa'),
      api<Paginado<Oferta>>('/ofertas/mias', { query: { limit: 100 } }),
    ])
    empresa.value = miEmpresa
    ofertas.value = lista.data
  } catch (e) {
    error.value = mensajeError(e)
  }
}

async function ejecutar(accion: () => Promise<unknown>) {
  error.value = ''
  try {
    await accion()
    await cargar()
  } catch (e) {
    error.value = mensajeError(e)
  }
}

const cambiar = (o: Oferta, estado: EstadoOferta) =>
  ejecutar(() => api(`/ofertas/${o.id}/estado`, { method: 'PATCH', body: { estado } }))

const duplicar = (o: Oferta) => ejecutar(() => api(`/ofertas/${o.id}/duplicar`, { method: 'POST' }))

function anular(o: Oferta) {
  if (confirm(`¿Anular "${o.titulo}"? Esta acción no se puede deshacer.`)) cambiar(o, 'ANULADA')
}

function eliminar(o: Oferta) {
  if (confirm(`¿Eliminar el borrador "${o.titulo}"?`)) {
    ejecutar(() => api(`/ofertas/${o.id}`, { method: 'DELETE' }))
  }
}

onMounted(cargar)
</script>

<template>
  <section>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-guinda-900">Mis ofertas</h1>
      <RouterLink
        v-if="empresa?.estado === 'APROBADA'"
        to="/empresa/ofertas/nueva"
        class="flex min-h-11 items-center rounded-md bg-guinda-700 px-4 font-medium text-white hover:bg-guinda-800"
      >
        Nueva oferta
      </RouterLink>
    </div>

    <div v-if="empresa && empresa.estado !== 'APROBADA'" class="mb-6 rounded-md bg-amber-50 p-4 text-sm">
      <p class="mb-1 font-medium">
        Estado de tu empresa: <EstadoBadge :estado="empresa.estado" />
      </p>
      <p>Solo las empresas aprobadas por GADOR pueden publicar ofertas.</p>
      <p v-if="empresa.motivoRechazo" class="mt-1">Motivo: {{ empresa.motivoRechazo }}</p>
    </div>

    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="ofertas.length === 0 && !error" class="text-stone-700">Todavía no tienes ofertas.</p>

    <div v-else class="overflow-x-auto rounded-md border border-stone-200 bg-white">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="bg-stone-100">
          <tr>
            <th class="p-3 font-medium">Oferta</th>
            <th class="p-3 font-medium">Estado</th>
            <th class="p-3 text-right font-medium">Vistas</th>
            <th class="p-3 text-right font-medium">Postulantes</th>
            <th class="p-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in ofertas" :key="o.id" class="border-t border-stone-200 align-top">
            <td class="p-3">
              <p class="font-medium">{{ o.titulo }}</p>
              <p class="text-xs text-stone-600">Cierra el {{ o.fechaCierre }}</p>
              <p v-if="o.motivoRechazo" class="mt-1 text-xs text-red-700">GADOR: {{ o.motivoRechazo }}</p>
            </td>
            <td class="p-3"><EstadoBadge :estado="o.estado" /></td>
            <td class="p-3 text-right">{{ o.totalVistas }}</td>
            <td class="p-3 text-right">{{ o.totalPostulantes }}</td>
            <td class="p-3">
              <div class="flex flex-wrap gap-2">
                <template v-if="o.estado === 'BORRADOR'">
                  <AccionBoton @click="router.push(`/empresa/ofertas/${o.id}/editar`)">Editar</AccionBoton>
                  <AccionBoton @click="cambiar(o, 'EN_REVISION_GADOR')">Enviar a revisión</AccionBoton>
                  <AccionBoton @click="eliminar(o)">Eliminar</AccionBoton>
                </template>
                <AccionBoton v-if="o.estado !== 'BORRADOR' && o.estado !== 'EN_REVISION_GADOR'" @click="router.push(`/empresa/ofertas/${o.id}/postulantes`)">
                  Postulantes
                </AccionBoton>
                <AccionBoton v-if="o.estado === 'PUBLICADA'" @click="cambiar(o, 'EN_PROCESO_SELECCION')">
                  Iniciar selección
                </AccionBoton>
                <AccionBoton
                  v-if="o.estado === 'PUBLICADA' || o.estado === 'EN_PROCESO_SELECCION'"
                  @click="cambiar(o, 'CERRADA')"
                >
                  Cerrar
                </AccionBoton>
                <AccionBoton
                  v-if="['EN_REVISION_GADOR', 'PUBLICADA', 'EN_PROCESO_SELECCION'].includes(o.estado)"
                  @click="anular(o)"
                >
                  Anular
                </AccionBoton>
                <AccionBoton v-if="o.estado !== 'BORRADOR'" @click="duplicar(o)">Duplicar</AccionBoton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
