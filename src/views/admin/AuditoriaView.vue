<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api, mensajeError } from '@/api'
import type { Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'

interface Registro {
  id: number
  usuario: string | null
  accion: string
  tablaAfectada: string
  registroId: number | null
  datosAnteriores: unknown
  datosNuevos: unknown
  ip: string | null
  fecha: string
}

const ACCIONES = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'CHANGE_STATUS']
const TABLAS = ['users', 'empresas', 'ofertas', 'postulaciones', 'postulante_profiles', 'catalogos', 'habilidades', 'configuraciones']

const registros = ref<Registro[]>([])
const accion = ref('')
const tabla = ref('')
const pagina = ref(1)
const totalPaginas = ref(1)
const error = ref('')

async function cargar() {
  error.value = ''
  try {
    const r = await api<Paginado<Registro>>('/auditoria', {
      query: {
        page: pagina.value,
        limit: 20,
        accion: accion.value || undefined,
        tabla: tabla.value || undefined,
      },
    })
    registros.value = r.data
    totalPaginas.value = Math.max(r.meta.totalPages, 1)
  } catch (e) {
    error.value = mensajeError(e)
  }
}

watch([accion, tabla], () => {
  pagina.value = 1
  cargar()
})

function irA(destino: number) {
  pagina.value = destino
  cargar()
}

onMounted(cargar)
</script>

<template>
  <section>
    <h1 class="mb-4 text-2xl font-semibold text-guinda-900">Auditoría</h1>
    <div class="mb-4 grid gap-3 sm:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm font-medium">Acción</span>
        <select v-model="accion" class="min-h-11 w-full rounded-md border border-stone-400 bg-white px-3">
          <option value="">Todas</option>
          <option v-for="a in ACCIONES" :key="a" :value="a">{{ a }}</option>
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium">Tabla</span>
        <select v-model="tabla" class="min-h-11 w-full rounded-md border border-stone-400 bg-white px-3">
          <option value="">Todas</option>
          <option v-for="t in TABLAS" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
    </div>
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="registros.length === 0 && !error" class="text-stone-700">No hay registros.</p>

    <div v-else class="overflow-x-auto rounded-md border border-stone-200 bg-white">
      <table class="w-full min-w-[820px] text-left text-sm">
        <thead class="bg-stone-100">
          <tr>
            <th class="p-3 font-medium">Fecha</th>
            <th class="p-3 font-medium">Usuario</th>
            <th class="p-3 font-medium">Acción</th>
            <th class="p-3 font-medium">Tabla</th>
            <th class="p-3 font-medium">Registro</th>
            <th class="p-3 font-medium">IP</th>
            <th class="p-3 font-medium">Datos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in registros" :key="r.id" class="border-t border-stone-200 align-top">
            <td class="p-3 whitespace-nowrap">{{ new Date(r.fecha).toLocaleString('es-BO') }}</td>
            <td class="p-3 break-all">{{ r.usuario ?? 'Sistema' }}</td>
            <td class="p-3">{{ r.accion }}</td>
            <td class="p-3">{{ r.tablaAfectada }}</td>
            <td class="p-3">{{ r.registroId ?? '—' }}</td>
            <td class="p-3">{{ r.ip ?? '—' }}</td>
            <td class="p-3">
              <details v-if="r.datosAnteriores || r.datosNuevos">
                <summary class="cursor-pointer font-medium">Ver</summary>
                <p class="mt-1 text-xs font-medium">Anteriores</p>
                <pre class="text-xs break-all whitespace-pre-wrap">{{ r.datosAnteriores ?? '—' }}</pre>
                <p class="mt-1 text-xs font-medium">Nuevos</p>
                <pre class="text-xs break-all whitespace-pre-wrap">{{ r.datosNuevos ?? '—' }}</pre>
              </details>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPaginas > 1" class="mt-4 flex items-center justify-center gap-3">
      <AccionBoton :disabled="pagina === 1" @click="irA(pagina - 1)">Anterior</AccionBoton>
      <span class="text-sm">Página {{ pagina }} de {{ totalPaginas }}</span>
      <AccionBoton :disabled="pagina === totalPaginas" @click="irA(pagina + 1)">Siguiente</AccionBoton>
    </div>
  </section>
</template>
