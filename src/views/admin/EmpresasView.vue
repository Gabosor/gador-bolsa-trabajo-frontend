<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Building2, ChevronRight } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Empresa, EstadoEmpresa, Paginado } from '@/api/tipos'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import LogoEmpresa from '@/components/LogoEmpresa.vue'

const FILTROS: { valor: EstadoEmpresa; texto: string }[] = [
  { valor: 'PENDIENTE_VALIDACION', texto: 'Pendientes' },
  { valor: 'APROBADA', texto: 'Aprobadas' },
  { valor: 'RECHAZADA', texto: 'Rechazadas' },
  { valor: 'SUSPENDIDA', texto: 'Suspendidas' },
]

const route = useRoute()
const router = useRouter()
// El filtro vive en la URL: al volver de una ficha se conserva.
const filtro = computed<EstadoEmpresa>(() => {
  const estado = route.query.estado
  return FILTROS.find((f) => f.valor === estado)?.valor ?? 'PENDIENTE_VALIDACION'
})
const empresas = ref<Empresa[]>([])
const error = ref('')
const cargada = ref(false)

async function cargar() {
  error.value = ''
  cargada.value = false
  try {
    const r = await api<Paginado<Empresa>>('/empresas', { query: { estado: filtro.value, limit: 100 } })
    empresas.value = r.data
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

function elegir(estado: EstadoEmpresa) {
  router.replace({ query: { ...route.query, estado } })
}

watch(filtro, cargar, { immediate: true })
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="titulo-pagina mb-3">Validación de empresas</h1>
    <div class="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
      <button
        v-for="f in FILTROS"
        :key="f.valor"
        type="button"
        class="min-h-11 shrink-0 rounded-full border px-3.5"
        :class="filtro === f.valor ? 'border-guinda-700 bg-guinda-700 font-semibold text-white' : 'border-roca bg-white'"
        :aria-pressed="filtro === f.valor"
        @click="elegir(f.valor)"
      >
        {{ f.texto }}
      </button>
    </div>

    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="empresas.length === 0 && !error" :icono="Building2" titulo="No hay empresas en este estado" />
    <ul v-else class="plano divide-y divide-linea overflow-hidden">
      <li v-for="e in empresas" :key="e.id">
        <RouterLink :to="{ name: 'admin-empresa', params: { id: e.id } }" class="flex min-h-16 w-full items-center gap-3 p-3 hover:bg-guinda-50/50">
          <LogoEmpresa :nombre="e.razonSocial" :url="e.logoUrl" />
          <span class="min-w-0 flex-1">
            <span class="block font-semibold break-words">{{ e.razonSocial }}</span>
            <span class="block text-base text-roca">NIT {{ e.nit }}, {{ e.rubro.nombre }}</span>
          </span>
          <ChevronRight class="size-5 shrink-0 text-roca" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
