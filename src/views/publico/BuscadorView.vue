<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { Heart, Search, SearchX, SlidersHorizontal, X } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { ItemCatalogo, Oferta, Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import FiltrosOfertas, { type Filtros } from '@/components/FiltrosOfertas.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import TarjetaOferta from '@/components/TarjetaOferta.vue'
import { useAuthStore } from '@/stores/auth'
import { useInteraccionesStore } from '@/stores/interacciones'
import { plural } from '@/utils/formato'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const interacciones = useInteraccionesStore()

const q = ref('')
const filtros = reactive<Filtros>({ profesionId: '', municipioId: '', modalidadId: '', salarioMin: '' })
const profesiones = ref<ItemCatalogo[]>([])
const municipios = ref<ItemCatalogo[]>([])
const modalidades = ref<ItemCatalogo[]>([])
const areas = ref<ItemCatalogo[]>([])
const ofertas = ref<Oferta[]>([])
const meta = ref({ page: 1, totalPages: 0, total: 0 })
const error = ref('')
const cargando = ref(true)
const hojaFiltros = ref(false)

const esPostulante = computed(() => auth.usuario?.rol === 'POSTULANTE')

const nombreDe = (lista: ItemCatalogo[], id: number | '') => lista.find((i) => i.id === id)?.nombre ?? ''
const activos = computed(() => {
  const lista: { clave: keyof Filtros; texto: string }[] = []
  if (filtros.profesionId !== '') lista.push({ clave: 'profesionId', texto: nombreDe(profesiones.value, filtros.profesionId) })
  if (filtros.municipioId !== '') lista.push({ clave: 'municipioId', texto: nombreDe(municipios.value, filtros.municipioId) })
  if (filtros.modalidadId !== '') lista.push({ clave: 'modalidadId', texto: nombreDe(modalidades.value, filtros.modalidadId) })
  if (filtros.salarioMin !== '') lista.push({ clave: 'salarioMin', texto: `Desde Bs ${filtros.salarioMin}` })
  return lista
})

const aNumero = (valor: unknown) => (valor ? Number(valor) : ('' as const))

/** La URL es la fuente de verdad: así se comparte y sobrevive al botón atrás. */
function leerUrl() {
  const c = route.query
  q.value = String(c.q ?? '')
  filtros.profesionId = aNumero(c.profesionId)
  filtros.municipioId = aNumero(c.municipioId)
  filtros.modalidadId = aNumero(c.modalidadId)
  filtros.salarioMin = String(c.salarioMin ?? '')
}

function consulta(page = 1): LocationQueryRaw {
  const crudo = { q: q.value.trim(), ...filtros, page: page > 1 ? page : '' }
  return Object.fromEntries(Object.entries(crudo).filter(([, v]) => v !== '')) as LocationQueryRaw
}

function aplicar(page = 1) {
  hojaFiltros.value = false
  router.push({ query: consulta(page) })
}

function quitar(clave: keyof Filtros) {
  ;(filtros[clave] as number | string) = ''
  aplicar()
}

async function cargar() {
  error.value = ''
  cargando.value = true
  leerUrl()
  try {
    const r = await api<Paginado<Oferta>>('/ofertas', { query: { ...route.query } })
    ofertas.value = r.data
    meta.value = r.meta
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}

watch(() => route.query, cargar)

onMounted(async () => {
  leerUrl()
  try {
    const catalogo = (t: string) => api<ItemCatalogo[]>(`/catalogos/${t}`)
    ;[profesiones.value, municipios.value, modalidades.value, areas.value] = await Promise.all([
      catalogo('PROFESION'),
      catalogo('MUNICIPIO'),
      catalogo('MODALIDAD'),
      catalogo('AREA').catch(() => []),
    ])
  } catch (e) {
    error.value = mensajeError(e)
  }
  await cargar()
})
</script>

<template>
  <section>
    <h1 class="titulo-pagina mb-3">Ofertas de empleo</h1>

    <div class="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-4 bg-salar px-4 py-2 lg:static lg:mx-0 lg:p-0">
      <form class="flex gap-2" role="search" @submit.prevent="aplicar()">
        <div class="relative min-w-0 flex-1">
          <Search class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-roca" aria-hidden="true" />
          <input v-model="q" type="search" enterkeyhint="search" aria-label="Buscar por palabra clave" placeholder="Cargo o palabra clave" class="campo pl-10" />
        </div>
        <button type="button" class="relative flex size-12 shrink-0 items-center justify-center rounded-campo border border-roca bg-white lg:hidden" :aria-label="`Filtros, ${activos.length} activos`" @click="hojaFiltros = true">
          <SlidersHorizontal class="size-5" aria-hidden="true" />
          <span v-if="activos.length" class="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-guinda-700 px-1 text-center text-sm leading-5 font-bold text-white">{{ activos.length }}</span>
        </button>
        <button class="hidden min-h-12 rounded-campo bg-guinda-700 px-6 font-semibold text-white hover:bg-guinda-800 lg:block">Buscar</button>
      </form>
    </div>

    <div class="mt-3 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6">
      <aside class="hidden lg:block" aria-label="Filtros">
        <div class="plano sticky top-6 p-4">
          <h2 class="mb-3 text-lg font-bold">Filtros</h2>
          <FiltrosOfertas :filtros="filtros" :profesiones="profesiones" :municipios="municipios" :modalidades="modalidades" :areas="areas" @aplicar="aplicar()" />
        </div>
      </aside>

      <div class="min-w-0">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <p v-if="!cargando && !error" class="mr-auto text-roca" role="status">{{ plural(meta.total, 'oferta encontrada', 'ofertas encontradas') }}</p>
          <RouterLink v-if="esPostulante && interacciones.favoritos.size" to="/favoritos" class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-roca bg-white px-3.5">
            <Heart class="size-4 fill-oro text-oro" aria-hidden="true" />Guardadas ({{ interacciones.favoritos.size }})
          </RouterLink>
          <button v-for="a in activos" :key="a.clave" type="button" class="inline-flex min-h-11 items-center gap-1 rounded-full bg-guinda-50 px-3.5 font-semibold text-guinda-800" :aria-label="`Quitar filtro ${a.texto}`" @click="quitar(a.clave)">
            {{ a.texto }}<X class="size-4" aria-hidden="true" />
          </button>
        </div>

        <p v-if="error" role="alert" class="text-error">{{ error }}</p>
        <Esqueleto v-else-if="cargando" :filas="5" />
        <EstadoVacio v-else-if="ofertas.length === 0" :icono="SearchX" titulo="No hay ofertas con esos filtros" texto="Prueba con menos filtros u otra palabra." />
        <ul v-else class="plano divide-y divide-linea overflow-hidden">
          <li v-for="o in ofertas" :key="o.id"><TarjetaOferta :oferta="o" /></li>
        </ul>

        <nav v-if="meta.totalPages > 1 && !cargando" aria-label="Páginas" class="mt-4 flex items-center justify-between gap-3">
          <AccionBoton :disabled="meta.page <= 1" @click="aplicar(meta.page - 1)">Anterior</AccionBoton>
          <span>Página {{ meta.page }} de {{ meta.totalPages }}</span>
          <AccionBoton :disabled="meta.page >= meta.totalPages" @click="aplicar(meta.page + 1)">Siguiente</AccionBoton>
        </nav>
      </div>
    </div>

    <HojaInferior v-model="hojaFiltros" titulo="Filtros">
      <FiltrosOfertas :filtros="filtros" :profesiones="profesiones" :municipios="municipios" :modalidades="modalidades" :areas="areas" @aplicar="aplicar()" />
    </HojaInferior>
  </section>
</template>
