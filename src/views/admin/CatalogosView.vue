<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { api, mensajeError } from '@/api'
import type { ItemCatalogo } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import { useAvisosStore } from '@/stores/avisos'
import { pedirTexto } from '@/utils/confirmar'

interface Item {
  id: number
  nombre: string
  activo: boolean
  parent?: { nombre: string } | null
}

const TIPOS = [
  { valor: 'RUBRO', texto: 'Rubros de empresa' },
  { valor: 'PROFESION', texto: 'Profesiones' },
  { valor: 'HABILIDAD', texto: 'Habilidades' },
  { valor: 'TIPO_CONTRATO', texto: 'Tipos de contrato' },
  { valor: 'MODALIDAD', texto: 'Modalidades' },
  { valor: 'DEPARTAMENTO', texto: 'Departamentos' },
  { valor: 'MUNICIPIO', texto: 'Municipios' },
]

const tipo = ref('RUBRO')
const items = ref<Item[]>([])
const departamentos = ref<ItemCatalogo[]>([])
const nombre = ref('')
const parentId = ref<number | ''>('')
const limite = ref('5')
const avisos = useAvisosStore()

const esHabilidad = computed(() => tipo.value === 'HABILIDAD')
const esMunicipio = computed(() => tipo.value === 'MUNICIPIO')

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

const ruta = (id: number) => `/admin/${esHabilidad.value ? 'habilidades' : 'catalogos'}/${id}`

function agregar() {
  ejecutar(async () => {
    if (esHabilidad.value) {
      await api('/admin/habilidades', { method: 'POST', body: { nombre: nombre.value } })
    } else {
      await api('/admin/catalogos', {
        method: 'POST',
        body: {
          tipo: tipo.value,
          nombre: nombre.value,
          parentId: esMunicipio.value ? parentId.value : undefined,
        },
      })
    }
    nombre.value = ''
    await cargar()
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
    await cargar()
  }, 'Registro actualizado')
}

function alternar(item: Item) {
  ejecutar(async () => {
    await api(ruta(item.id), { method: 'PATCH', body: { activo: !item.activo } })
    await cargar()
  })
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

watch(tipo, () => ejecutar(cargar))

onMounted(() =>
  ejecutar(async () => {
    const [config, deptos] = await Promise.all([
      api<{ limiteOfertasActivas: number }>('/admin/configuracion'),
      api<ItemCatalogo[]>('/catalogos/DEPARTAMENTO'),
      cargar(),
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
      <div class="min-w-48 flex-1"><BaseInput v-model="nombre" label="Nuevo registro" /></div>
      <div class="w-full sm:w-32"><BaseButton>Agregar</BaseButton></div>
    </form>

    <ul class="plano divide-y divide-linea">
      <li v-for="i in items" :key="i.id" class="flex flex-wrap items-center justify-between gap-2 p-3">
        <div class="min-w-0">
          <span class="break-words" :class="{ 'text-roca line-through': !i.activo }">{{ i.nombre }}</span>
          <span v-if="i.parent" class="ml-2 text-base text-roca">{{ i.parent.nombre }}</span>
          <span v-if="!i.activo" class="ml-2 text-base text-roca">Inactivo</span>
        </div>
        <div class="flex gap-2">
          <AccionBoton @click="renombrar(i)">Renombrar</AccionBoton>
          <AccionBoton @click="alternar(i)">{{ i.activo ? 'Desactivar' : 'Activar' }}</AccionBoton>
        </div>
      </li>
    </ul>
  </section>
</template>
