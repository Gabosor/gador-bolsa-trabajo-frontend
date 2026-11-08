<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api, mensajeError } from '@/api'
import type { ItemCatalogo, Oferta, Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'

const filtros = reactive({ q: '', profesionId: '', municipioId: '', modalidadId: '', salarioMin: '' })
const profesiones = ref<ItemCatalogo[]>([])
const municipios = ref<ItemCatalogo[]>([])
const modalidades = ref<ItemCatalogo[]>([])
const ofertas = ref<Oferta[]>([])
const meta = ref({ page: 1, totalPages: 0, total: 0 })
const error = ref('')
const cargando = ref(false)

const claseCampo = 'min-h-11 w-full rounded-md border border-stone-400 bg-white px-3'

async function buscar(page = 1) {
  error.value = ''
  cargando.value = true
  try {
    const query = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
    const r = await api<Paginado<Oferta>>('/ofertas', { query: { ...query, page } })
    ofertas.value = r.data
    meta.value = r.meta
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}

function salario(o: Oferta) {
  return o.salarioATratar ? 'Salario a tratar' : `Bs ${o.salarioMin} – ${o.salarioMax}`
}

onMounted(async () => {
  try {
    const catalogo = (t: string) => api<ItemCatalogo[]>(`/catalogos/${t}`)
    ;[profesiones.value, municipios.value, modalidades.value] = await Promise.all([
      catalogo('PROFESION'),
      catalogo('MUNICIPIO'),
      catalogo('MODALIDAD'),
    ])
  } catch (e) {
    error.value = mensajeError(e)
  }
  await buscar()
})
</script>

<template>
  <section>
    <h1 class="mb-4 text-2xl font-semibold text-guinda-900">Ofertas de empleo</h1>

    <form class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" @submit.prevent="buscar()">
      <input v-model="filtros.q" aria-label="Palabra clave" placeholder="Palabra clave" :class="claseCampo" />
      <select v-model="filtros.profesionId" aria-label="Profesión" :class="claseCampo">
        <option value="">Todas las profesiones</option>
        <option v-for="p in profesiones" :key="p.id" :value="p.id">{{ p.nombre }}</option>
      </select>
      <select v-model="filtros.municipioId" aria-label="Ubicación" :class="claseCampo">
        <option value="">Todos los municipios</option>
        <option v-for="m in municipios" :key="m.id" :value="m.id">{{ m.nombre }}</option>
      </select>
      <select v-model="filtros.modalidadId" aria-label="Modalidad" :class="claseCampo">
        <option value="">Todas las modalidades</option>
        <option v-for="m in modalidades" :key="m.id" :value="m.id">{{ m.nombre }}</option>
      </select>
      <input v-model="filtros.salarioMin" type="number" min="0" aria-label="Salario mínimo" placeholder="Salario desde (Bs)" :class="claseCampo" />
      <button class="min-h-11 rounded-md bg-guinda-700 px-4 font-medium text-white hover:bg-guinda-800">Buscar</button>
    </form>

    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
    <p v-if="!cargando && ofertas.length === 0 && !error" class="text-stone-700">
      No encontramos ofertas con esos filtros.
    </p>

    <ul class="space-y-3">
      <li v-for="o in ofertas" :key="o.id">
        <RouterLink :to="`/ofertas/${o.id}`" class="block rounded-md border border-stone-200 bg-white p-4 hover:border-guinda-600">
          <h2 class="font-semibold break-words text-guinda-900">{{ o.titulo }}</h2>
          <p class="text-sm">{{ o.empresa?.razonSocial }}</p>
          <p class="mt-1 text-sm text-stone-600">
            {{ o.municipio.nombre }} · {{ o.modalidad.nombre }} · {{ o.tipoContrato.nombre }} · {{ salario(o) }}
          </p>
          <p class="mt-1 text-xs text-stone-600">Cierra el {{ o.fechaCierre }}</p>
        </RouterLink>
      </li>
    </ul>

    <div v-if="meta.totalPages > 1" class="mt-6 flex items-center justify-between gap-3">
      <AccionBoton :disabled="meta.page <= 1" @click="buscar(meta.page - 1)">Anterior</AccionBoton>
      <span class="text-sm">Página {{ meta.page }} de {{ meta.totalPages }}</span>
      <AccionBoton :disabled="meta.page >= meta.totalPages" @click="buscar(meta.page + 1)">Siguiente</AccionBoton>
    </div>
  </section>
</template>
