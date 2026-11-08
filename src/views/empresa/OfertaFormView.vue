<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import type { ItemCatalogo, Oferta } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'

interface FilaHabilidad {
  habilidadId: number | ''
  obligatoria: boolean
  nivelMinimo: number
}

const route = useRoute()
const router = useRouter()
const id = route.params.id as string | undefined

const form = reactive({
  titulo: '',
  descripcion: '',
  requisitosObligatorios: '',
  requisitosDeseables: '',
  beneficios: '',
  fechaCierre: '',
  aniosExperiencia: '0',
  numeroPlazas: '1',
  salarioMin: '',
  salarioMax: '',
  salarioATratar: false,
})
const seleccion = reactive({
  tipoContratoId: '' as number | '',
  modalidadId: '' as number | '',
  municipioId: '' as number | '',
})
const profesionIds = ref<number[]>([])
const filas = ref<FilaHabilidad[]>([{ habilidadId: '', obligatoria: true, nivelMinimo: 1 }])

const profesiones = ref<ItemCatalogo[]>([])
const tipos = ref<ItemCatalogo[]>([])
const modalidades = ref<ItemCatalogo[]>([])
const municipios = ref<ItemCatalogo[]>([])
const habilidades = ref<ItemCatalogo[]>([])
const error = ref('')
const cargando = ref(false)

const NIVELES = [
  { id: 1, nombre: 'Básico' },
  { id: 2, nombre: 'Intermedio' },
  { id: 3, nombre: 'Avanzado' },
]

onMounted(async () => {
  try {
    const catalogo = (tipo: string) => api<ItemCatalogo[]>(`/catalogos/${tipo}`)
    ;[profesiones.value, tipos.value, modalidades.value, municipios.value, habilidades.value] =
      await Promise.all([
        catalogo('PROFESION'),
        catalogo('TIPO_CONTRATO'),
        catalogo('MODALIDAD'),
        catalogo('MUNICIPIO'),
        catalogo('habilidades'),
      ])
    if (id) await cargarOferta()
  } catch (e) {
    error.value = mensajeError(e)
  }
})

async function cargarOferta() {
  const o = await api<Oferta>(`/ofertas/mias/${id}`)
  Object.assign(form, {
    titulo: o.titulo,
    descripcion: o.descripcion,
    requisitosObligatorios: o.requisitosObligatorios,
    requisitosDeseables: o.requisitosDeseables ?? '',
    beneficios: o.beneficios ?? '',
    fechaCierre: o.fechaCierre,
    aniosExperiencia: String(o.aniosExperiencia),
    numeroPlazas: String(o.numeroPlazas),
    salarioMin: o.salarioMin ? String(o.salarioMin) : '',
    salarioMax: o.salarioMax ? String(o.salarioMax) : '',
    salarioATratar: o.salarioATratar,
  })
  seleccion.tipoContratoId = o.tipoContrato.id
  seleccion.modalidadId = o.modalidad.id
  seleccion.municipioId = o.municipio.id
  profesionIds.value = o.profesiones.map((p) => p.id)
  filas.value = o.habilidades.map((h) => ({
    habilidadId: h.habilidad.id,
    obligatoria: h.obligatoria,
    nivelMinimo: h.nivelMinimo,
  }))
}

async function guardar() {
  error.value = ''
  if (profesionIds.value.length === 0) {
    error.value = 'Selecciona al menos una profesión'
    return
  }
  cargando.value = true
  try {
    const body = {
      ...form,
      ...seleccion,
      requisitosDeseables: form.requisitosDeseables || undefined,
      beneficios: form.beneficios || undefined,
      aniosExperiencia: Number(form.aniosExperiencia),
      numeroPlazas: Number(form.numeroPlazas),
      salarioMin: form.salarioATratar ? undefined : Number(form.salarioMin),
      salarioMax: form.salarioATratar ? undefined : Number(form.salarioMax),
      profesionIds: profesionIds.value,
      habilidades: filas.value,
    }
    await api(id ? `/ofertas/${id}` : '/ofertas', { method: id ? 'PUT' : 'POST', body })
    await router.push('/empresa/ofertas')
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <h1 class="mb-6 text-2xl font-semibold text-guinda-900">{{ id ? 'Editar oferta' : 'Nueva oferta' }}</h1>
    <form class="space-y-4" @submit.prevent="guardar">
      <BaseInput v-model="form.titulo" label="Título" ayuda="Por ejemplo: Desarrollador Full Stack" />
      <BaseTextarea v-model="form.descripcion" label="Descripción" />
      <BaseTextarea v-model="form.requisitosObligatorios" label="Requisitos obligatorios" />
      <BaseTextarea v-model="form.requisitosDeseables" label="Requisitos deseables" opcional />

      <fieldset>
        <legend class="mb-1 text-sm font-medium">Profesión requerida</legend>
        <label v-for="p in profesiones" :key="p.id" class="flex min-h-11 items-center gap-2 text-sm">
          <input v-model="profesionIds" type="checkbox" :value="p.id" class="size-5" />
          {{ p.nombre }}
        </label>
      </fieldset>

      <fieldset>
        <legend class="mb-1 text-sm font-medium">Habilidades (se usan para calcular el % de compatibilidad)</legend>
        <div v-for="(fila, i) in filas" :key="i" class="mb-3 rounded-md border border-stone-200 bg-white p-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <BaseSelect v-model="fila.habilidadId" label="Habilidad" :opciones="habilidades" />
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Nivel mínimo</span>
              <select v-model="fila.nivelMinimo" class="min-h-11 w-full rounded-md border border-stone-400 bg-white px-3">
                <option v-for="n in NIVELES" :key="n.id" :value="n.id">{{ n.nombre }}</option>
              </select>
            </label>
          </div>
          <div class="mt-2 flex items-center justify-between gap-2">
            <label class="flex min-h-11 items-center gap-2 text-sm">
              <input v-model="fila.obligatoria" type="checkbox" class="size-5" /> Obligatoria
            </label>
            <AccionBoton v-if="filas.length > 1" @click="filas.splice(i, 1)">Quitar</AccionBoton>
          </div>
        </div>
        <AccionBoton @click="filas.push({ habilidadId: '', obligatoria: true, nivelMinimo: 1 })">
          Agregar habilidad
        </AccionBoton>
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-2">
        <BaseInput v-model="form.aniosExperiencia" label="Años de experiencia" type="number" min="0" />
        <BaseInput v-model="form.numeroPlazas" label="Número de plazas" type="number" min="1" />
        <BaseSelect v-model="seleccion.tipoContratoId" label="Tipo de contrato" :opciones="tipos" />
        <BaseSelect v-model="seleccion.modalidadId" label="Modalidad" :opciones="modalidades" />
        <BaseSelect v-model="seleccion.municipioId" label="Municipio" :opciones="municipios" />
        <BaseInput v-model="form.fechaCierre" label="Fecha de cierre" type="date" />
      </div>

      <label class="flex min-h-11 items-center gap-2 text-sm">
        <input v-model="form.salarioATratar" type="checkbox" class="size-5" /> Salario a tratar
      </label>
      <div v-if="!form.salarioATratar" class="grid gap-4 sm:grid-cols-2">
        <BaseInput v-model="form.salarioMin" label="Salario mínimo (Bs)" type="number" min="1" />
        <BaseInput v-model="form.salarioMax" label="Salario máximo (Bs)" type="number" min="1" />
      </div>

      <BaseTextarea v-model="form.beneficios" label="Beneficios" opcional />

      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <BaseButton :cargando="cargando">Guardar borrador</BaseButton>
    </form>
  </section>
</template>
