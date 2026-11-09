<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ScrollText } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import { fechaHora } from '@/utils/formato'

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
const cargada = ref(false)
const abierto = ref<Registro | null>(null)

const hojaAbierta = computed({
  get: () => abierto.value !== null,
  set: (valor) => {
    if (!valor) abierto.value = null
  },
})

const json = (valor: unknown) => (valor ? JSON.stringify(valor, null, 2) : 'Sin datos')

async function cargar() {
  error.value = ''
  try {
    const r = await api<Paginado<Registro>>('/auditoria', {
      query: { page: pagina.value, limit: 20, accion: accion.value || undefined, tabla: tabla.value || undefined },
    })
    registros.value = r.data
    totalPaginas.value = Math.max(r.meta.totalPages, 1)
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
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
    <h1 class="titulo-pagina mb-3">Auditoría</h1>
    <div class="mb-3 grid gap-3 sm:grid-cols-2">
      <label class="block">
        <span class="mb-1 block font-semibold">Acción</span>
        <select v-model="accion" class="campo">
          <option value="">Todas</option>
          <option v-for="a in ACCIONES" :key="a" :value="a">{{ a }}</option>
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block font-semibold">Tabla</span>
        <select v-model="tabla" class="campo">
          <option value="">Todas</option>
          <option v-for="t in TABLAS" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
    </div>

    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="registros.length === 0 && !error" :icono="ScrollText" titulo="No hay registros con esos filtros" />

    <template v-else>
      <ul class="plano divide-y divide-linea overflow-hidden lg:hidden">
        <li v-for="r in registros" :key="r.id">
          <button type="button" class="w-full p-3 text-left" @click="abierto = r">
            <span class="flex justify-between gap-2 font-semibold"><span>{{ r.accion }}</span><span class="font-normal text-roca">{{ fechaHora(r.fecha) }}</span></span>
            <span class="block break-all">{{ r.tablaAfectada }}<template v-if="r.registroId"> #{{ r.registroId }}</template></span>
            <span class="block text-base break-all text-roca">{{ r.usuario ?? 'Sistema' }}</span>
          </button>
        </li>
      </ul>

      <div class="plano hidden overflow-hidden lg:block">
        <table class="w-full text-left">
          <thead class="bg-salar">
            <tr>
              <th class="p-3 font-semibold">Fecha</th>
              <th class="p-3 font-semibold">Usuario</th>
              <th class="p-3 font-semibold">Acción</th>
              <th class="p-3 font-semibold">Tabla</th>
              <th class="p-3 font-semibold">Registro</th>
              <th class="p-3 font-semibold">IP</th>
              <th class="p-3 font-semibold"><span class="sr-only">Detalle</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in registros" :key="r.id" class="border-t border-linea align-middle">
              <td class="p-3 whitespace-nowrap">{{ fechaHora(r.fecha) }}</td>
              <td class="p-3 break-all">{{ r.usuario ?? 'Sistema' }}</td>
              <td class="p-3">{{ r.accion }}</td>
              <td class="p-3">{{ r.tablaAfectada }}</td>
              <td class="p-3">{{ r.registroId ?? 'Sin dato' }}</td>
              <td class="p-3">{{ r.ip ?? 'Sin dato' }}</td>
              <td class="p-3 text-right"><AccionBoton variante="texto" @click="abierto = r">Ver datos</AccionBoton></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <nav v-if="totalPaginas > 1" aria-label="Páginas" class="mt-4 flex items-center justify-between gap-3">
      <AccionBoton :disabled="pagina === 1" @click="irA(pagina - 1)">Anterior</AccionBoton>
      <span>Página {{ pagina }} de {{ totalPaginas }}</span>
      <AccionBoton :disabled="pagina === totalPaginas" @click="irA(pagina + 1)">Siguiente</AccionBoton>
    </nav>

    <HojaInferior v-model="hojaAbierta" titulo="Detalle del registro">
      <div v-if="abierto" class="space-y-3">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
          <div><dt class="text-base text-roca">Fecha</dt><dd>{{ fechaHora(abierto.fecha) }}</dd></div>
          <div><dt class="text-base text-roca">Acción</dt><dd>{{ abierto.accion }}</dd></div>
          <div class="col-span-2"><dt class="text-base text-roca">Usuario</dt><dd class="break-all">{{ abierto.usuario ?? 'Sistema' }}</dd></div>
          <div><dt class="text-base text-roca">Tabla</dt><dd class="break-all">{{ abierto.tablaAfectada }}</dd></div>
          <div><dt class="text-base text-roca">IP</dt><dd>{{ abierto.ip ?? 'Sin dato' }}</dd></div>
        </dl>
        <div><h3 class="mb-1 font-bold">Datos anteriores</h3><pre class="overflow-x-auto rounded-campo bg-salar p-3 text-sm">{{ json(abierto.datosAnteriores) }}</pre></div>
        <div><h3 class="mb-1 font-bold">Datos nuevos</h3><pre class="overflow-x-auto rounded-campo bg-salar p-3 text-sm">{{ json(abierto.datosNuevos) }}</pre></div>
      </div>
    </HojaInferior>
  </section>
</template>
