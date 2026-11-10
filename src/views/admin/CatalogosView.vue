<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { api, mensajeError } from '@/api'
import type { ItemCatalogo } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import { useAvisosStore } from '@/stores/avisos'
import { normalizar } from '@/utils/catalogos'
import { pedirTexto } from '@/utils/confirmar'

interface Item {
  id: number
  nombre: string
  activo: boolean
  /** Municipio: su departamento. Profesión: su área. */
  parent?: { id: number; nombre: string } | null
  /** Habilidad: su área (null = general). */
  area?: { id: number; nombre: string } | null
}

const TIPOS = [
  { valor: 'RUBRO', texto: 'Rubros de empresa' },
  { valor: 'AREA', texto: 'Áreas profesionales' },
  { valor: 'PROFESION', texto: 'Profesiones' },
  { valor: 'HABILIDAD', texto: 'Habilidades' },
  { valor: 'TIPO_CONTRATO', texto: 'Tipos de contrato' },
  { valor: 'MODALIDAD', texto: 'Modalidades' },
  { valor: 'DEPARTAMENTO', texto: 'Departamentos' },
  { valor: 'MUNICIPIO', texto: 'Municipios' },
]
/** Valor del filtro para los que no tienen área. */
const SIN_AREA = -1

const tipo = ref('RUBRO')
const items = ref<Item[]>([])
const departamentos = ref<ItemCatalogo[]>([])
const areas = ref<ItemCatalogo[]>([])
const nombre = ref('')
const parentId = ref<number | ''>('')
const areaNueva = ref<number | ''>('')
const limite = ref('5')
const busqueda = ref('')
const filtroArea = ref<number | ''>('')
const avisos = useAvisosStore()

const esHabilidad = computed(() => tipo.value === 'HABILIDAD')
const esMunicipio = computed(() => tipo.value === 'MUNICIPIO')
/** Profesiones y habilidades se agrupan por área. */
const usaArea = computed(() => tipo.value === 'PROFESION' || esHabilidad.value)
const textoSinArea = computed(() => (esHabilidad.value ? 'General (todas las áreas)' : 'Sin área'))
const opcionesFiltro = computed(() => [{ id: SIN_AREA, nombre: textoSinArea.value }, ...areas.value])

const areaDe = (i: Item) => (esHabilidad.value ? i.area : i.parent) ?? null

const visibles = computed(() => {
  const palabras = normalizar(busqueda.value).split(/\s+/).filter(Boolean)
  return items.value.filter((i) => {
    if (usaArea.value && filtroArea.value !== '') {
      const area = areaDe(i)?.id ?? SIN_AREA
      if (area !== filtroArea.value) return false
    }
    const texto = normalizar(i.nombre)
    return palabras.every((p) => texto.includes(p))
  })
})

/** Ejecuta una acción y muestra su error, sin repetir el try/catch. */
async function ejecutar(accion: () => Promise<unknown>, mensaje = '') {
  try {
    await accion()
    if (mensaje) avisos.exito(mensaje)
  } catch (e) {
    avisos.error(mensajeError(e))
  }
}

async function cargar() {
  items.value = esHabilidad.value
    ? await api<Item[]>('/admin/habilidades')
    : await api<Item[]>('/admin/catalogos', { query: { tipo: tipo.value } })
}

async function cargarAreas() {
  areas.value = await api<ItemCatalogo[]>('/catalogos/AREA')
}

const ruta = (id: number) => `/admin/${esHabilidad.value ? 'habilidades' : 'catalogos'}/${id}`
const campoArea = () => (esHabilidad.value ? 'areaId' : 'parentId')

function agregar() {
  ejecutar(async () => {
    const area = areaNueva.value === '' ? undefined : areaNueva.value
    if (esHabilidad.value) {
      await api('/admin/habilidades', { method: 'POST', body: { nombre: nombre.value, areaId: area } })
    } else {
      await api('/admin/catalogos', {
        method: 'POST',
        body: {
          tipo: tipo.value,
          nombre: nombre.value,
          parentId: esMunicipio.value ? parentId.value : usaArea.value ? area : undefined,
        },
      })
    }
    nombre.value = ''
    await Promise.all([cargar(), tipo.value === 'AREA' ? cargarAreas() : null])
  }, 'Registro agregado')
}

async function renombrar(item: Item) {
  const nuevo = await pedirTexto({
    titulo: 'Renombrar',
    accion: 'Guardar',
    campo: { etiqueta: 'Nuevo nombre', valor: item.nombre },
  })
  if (!nuevo || nuevo === item.nombre) return
  ejecutar(async () => {
    await api(ruta(item.id), { method: 'PATCH', body: { nombre: nuevo } })
    await Promise.all([cargar(), tipo.value === 'AREA' ? cargarAreas() : null])
  }, 'Registro actualizado')
}

function alternar(item: Item) {
  ejecutar(async () => {
    await api(ruta(item.id), { method: 'PATCH', body: { activo: !item.activo } })
    await Promise.all([cargar(), tipo.value === 'AREA' ? cargarAreas() : null])
  })
}

/* Cambiar el área de una profesión o habilidad. */
const editando = ref<Item | null>(null)
const areaElegida = ref<number | ''>('')
const hojaArea = computed({
  get: () => editando.value !== null,
  set: (valor) => {
    if (!valor) editando.value = null
  },
})

function abrirArea(item: Item) {
  areaElegida.value = areaDe(item)?.id ?? ''
  editando.value = item
}

function guardarArea() {
  const item = editando.value
  if (!item) return
  ejecutar(async () => {
    await api(ruta(item.id), {
      method: 'PATCH',
      body: { [campoArea()]: areaElegida.value === '' ? null : areaElegida.value },
    })
    editando.value = null
    await cargar()
  }, 'Área actualizada')
}

function guardarLimite() {
  ejecutar(
    () =>
      api('/admin/configuracion', {
        method: 'PUT',
        body: { limiteOfertasActivas: Number(limite.value) },
      }),
    'Límite actualizado',
  )
}

watch(tipo, () => {
  busqueda.value = ''
  filtroArea.value = ''
  areaNueva.value = ''
  ejecutar(cargar)
})

onMounted(() =>
  ejecutar(async () => {
    const [config, deptos] = await Promise.all([
      api<{ limiteOfertasActivas: number }>('/admin/configuracion'),
      api<ItemCatalogo[]>('/catalogos/DEPARTAMENTO'),
      cargar(),
      cargarAreas(),
    ])
    limite.value = String(config.limiteOfertasActivas)
    departamentos.value = deptos
  }),
)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="titulo-pagina mb-3">Catálogos y configuración</h1>

    <form class="plano mb-6 flex flex-wrap items-end gap-3 p-4" @submit.prevent="guardarLimite">
      <div class="w-full sm:w-64">
        <BaseInput v-model="limite" label="Límite de ofertas activas por empresa" type="number" min="1" />
      </div>
      <div class="w-full sm:w-32"><BaseButton>Guardar</BaseButton></div>
    </form>

    <label class="mb-4 block">
      <span class="mb-1 block font-semibold">Catálogo</span>
      <select v-model="tipo" class="campo">
        <option v-for="t in TIPOS" :key="t.valor" :value="t.valor">{{ t.texto }}</option>
      </select>
    </label>

    <form class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="agregar">
      <div v-if="esMunicipio" class="w-full sm:w-48">
        <BaseSelect v-model="parentId" label="Departamento" :opciones="departamentos" />
      </div>
      <div v-if="usaArea" class="w-full sm:w-56">
        <BaseSelect v-model="areaNueva" label="Área" :opciones="areas" :texto-vacio="textoSinArea" opcional />
      </div>
      <div class="min-w-48 flex-1"><BaseInput v-model="nombre" label="Nuevo registro" /></div>
      <div class="w-full sm:w-32"><BaseButton>Agregar</BaseButton></div>
    </form>

    <div class="mb-3 flex flex-wrap items-end gap-3">
      <div class="min-w-48 flex-1">
        <BaseInput v-model="busqueda" label="Buscar en la lista" type="search" opcional />
      </div>
      <div v-if="usaArea" class="w-full sm:w-56">
        <BaseSelect v-model="filtroArea" label="Filtrar por área" :opciones="opcionesFiltro" texto-vacio="Todas" opcional />
      </div>
    </div>
    <p class="mb-2 text-base text-roca" aria-live="polite">
      {{ visibles.length === items.length ? `${items.length} registros` : `${visibles.length} de ${items.length} registros` }}
    </p>

    <ul class="plano divide-y divide-linea">
      <li v-for="i in visibles" :key="i.id" class="flex flex-wrap items-center justify-between gap-2 p-3">
        <div class="min-w-0">
          <span class="break-words" :class="{ 'text-roca line-through': !i.activo }">{{ i.nombre }}</span>
          <span v-if="usaArea" class="ml-2 text-base text-roca">{{ areaDe(i)?.nombre ?? textoSinArea }}</span>
          <span v-else-if="i.parent" class="ml-2 text-base text-roca">{{ i.parent.nombre }}</span>
          <span v-if="!i.activo" class="ml-2 text-base text-roca">Inactivo</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <AccionBoton v-if="usaArea" @click="abrirArea(i)">Cambiar área</AccionBoton>
          <AccionBoton @click="renombrar(i)">Renombrar</AccionBoton>
          <AccionBoton @click="alternar(i)">{{ i.activo ? 'Desactivar' : 'Activar' }}</AccionBoton>
        </div>
      </li>
      <li v-if="items.length && !visibles.length" class="p-3 text-roca">Nada coincide con la búsqueda.</li>
    </ul>

    <HojaInferior v-model="hojaArea" variante="centrado" :titulo="editando ? `Área de ${editando.nombre}` : 'Área'">
      <form class="space-y-4" @submit.prevent="guardarArea">
        <BaseSelect v-model="areaElegida" label="Área" :opciones="areas" :texto-vacio="textoSinArea" opcional />
        <p class="text-base text-roca">
          {{ esHabilidad ? 'Se sugiere a las ofertas y perfiles de las profesiones de esta área. Las generales se sugieren a todos.' : 'Agrupa la profesión en los buscadores y define qué habilidades se le sugieren.' }}
        </p>
        <div class="flex justify-end gap-2">
          <AccionBoton type="button" @click="editando = null">Cancelar</AccionBoton>
          <AccionBoton type="submit" variante="primario">Guardar</AccionBoton>
        </div>
      </form>
    </HojaInferior>
  </section>
</template>
