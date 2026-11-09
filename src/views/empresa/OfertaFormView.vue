<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Building2, CircleAlert, Plus, Trash2 } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Empresa, ItemCatalogo, Oferta } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import Faja from '@/components/Faja.vue'
import SelectorChips from '@/components/SelectorChips.vue'
import { useAvisosStore } from '@/stores/avisos'
import { NIVELES_HABILIDAD, fecha, monto, nombreNivel, plural } from '@/utils/formato'

interface FilaHabilidad {
  habilidadId: number | ''
  obligatoria: boolean
  nivelMinimo: number
}

const PASOS = ['Puesto', 'Requisitos', 'Condiciones', 'Revisar']

const route = useRoute()
const router = useRouter()
const avisos = useAvisosStore()
const id = route.params.id as string | undefined

const paso = ref(0)
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
const empresa = ref<Empresa | null>(null)
const motivoRechazo = ref<string | null>(null)
const lista = ref(false)
const error = ref('')
const cargando = ref(false)

const hoy = new Date().toISOString().slice(0, 10)
const esUltimo = computed(() => paso.value === PASOS.length - 1)
const nombre = (catalogo: ItemCatalogo[], valor: number | '') => catalogo.find((c) => c.id === valor)?.nombre ?? ''
const textoSalario = computed(() =>
  form.salarioATratar ? 'Salario a tratar' : `Bs ${monto(form.salarioMin || 0)} a ${monto(form.salarioMax || 0)}`,
)

onMounted(async () => {
  try {
    const catalogo = (tipo: string) => api<ItemCatalogo[]>(`/catalogos/${tipo}`)
    ;[profesiones.value, tipos.value, modalidades.value, municipios.value, habilidades.value, empresa.value] = await Promise.all([
      catalogo('PROFESION'),
      catalogo('TIPO_CONTRATO'),
      catalogo('MODALIDAD'),
      catalogo('MUNICIPIO'),
      catalogo('habilidades'),
      api<Empresa>('/empresas/mi-empresa'),
    ])
    if (id) await cargarOferta()
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    lista.value = true
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
  motivoRechazo.value = o.motivoRechazo
  filas.value = o.habilidades.map((h) => ({
    habilidadId: h.habilidad.id,
    obligatoria: h.obligatoria,
    nivelMinimo: h.nivelMinimo,
  }))
}

/** Reglas que el navegador no puede comprobar con los atributos del campo. */
function errorDelPaso(): string {
  if (paso.value === 1) {
    if (profesionIds.value.length === 0) return 'Selecciona al menos una profesión.'
    const ids = filas.value.map((f) => f.habilidadId)
    if (new Set(ids).size !== ids.length) return 'Hay habilidades repetidas.'
  }
  if (paso.value === 2 && !form.salarioATratar && Number(form.salarioMin) > Number(form.salarioMax)) {
    return 'El salario mínimo no puede superar al máximo.'
  }
  return ''
}

function avanzar() {
  error.value = errorDelPaso()
  if (error.value) return
  paso.value += 1
  window.scrollTo({ top: 0 })
}

function retroceder() {
  error.value = ''
  paso.value -= 1
  window.scrollTo({ top: 0 })
}

async function guardar(enviarARevision: boolean) {
  error.value = ''
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
    const guardada = await api<{ id: number }>(id ? `/ofertas/${id}` : '/ofertas', { method: id ? 'PUT' : 'POST', body })
    if (enviarARevision) {
      await api(`/ofertas/${guardada.id}/estado`, { method: 'PATCH', body: { estado: 'EN_REVISION_GADOR' } })
    }
    avisos.exito(enviarARevision ? 'Oferta enviada a revisión de GADOR' : 'Borrador guardado')
    await router.push('/empresa/ofertas')
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div v-if="!lista" class="mx-auto max-w-2xl"><Esqueleto :filas="3" /></div>

  <EstadoVacio
    v-else-if="empresa && empresa.estado !== 'APROBADA'"
    :icono="Building2"
    titulo="Tu empresa aún no puede publicar"
    texto="Solo las empresas aprobadas por GADOR pueden crear ofertas."
  >
    <RouterLink to="/empresa/ofertas"><AccionBoton variante="primario">Ver el estado de mi empresa</AccionBoton></RouterLink>
  </EstadoVacio>

  <section v-else class="mx-auto max-w-2xl">
    <RouterLink to="/empresa/ofertas" class="enlace mb-2 inline-flex min-h-11 items-center gap-1 no-underline"><ArrowLeft class="size-5" aria-hidden="true" />Mis ofertas</RouterLink>
    <h1 class="titulo-pagina">{{ id ? 'Editar oferta' : 'Nueva oferta' }}</h1>

    <div class="mt-3 mb-4">
      <p class="mb-1.5 font-semibold">Paso {{ paso + 1 }} de {{ PASOS.length }}: {{ PASOS[paso] }}</p>
      <Faja :total="PASOS.length" :completos="paso + 1" :etiqueta="`Paso ${paso + 1} de ${PASOS.length}`" />
    </div>

    <p v-if="motivoRechazo" class="mb-3 flex items-start gap-2 rounded-campo bg-error-50 p-3 text-error">
      <CircleAlert class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span><strong>GADOR pidió corregir:</strong> {{ motivoRechazo }}</span>
    </p>

    <form class="plano space-y-4 p-4" @submit.prevent="esUltimo ? guardar(true) : avanzar()">
      <template v-if="paso === 0">
        <BaseInput v-model="form.titulo" label="Título del puesto" placeholder="Por ejemplo: Desarrollador Full Stack" />
        <BaseTextarea v-model="form.descripcion" label="Descripción" :filas="6" ayuda="Qué hará la persona y en qué equipo." />
        <div class="grid gap-4 sm:grid-cols-2">
          <BaseSelect v-model="seleccion.tipoContratoId" label="Tipo de contrato" :opciones="tipos" />
          <BaseSelect v-model="seleccion.modalidadId" label="Modalidad" :opciones="modalidades" />
          <BaseSelect v-model="seleccion.municipioId" label="Municipio" :opciones="municipios" />
          <BaseInput v-model="form.numeroPlazas" label="Número de plazas" type="number" inputmode="numeric" min="1" />
        </div>
      </template>

      <template v-else-if="paso === 1">
        <BaseTextarea v-model="form.requisitosObligatorios" label="Requisitos obligatorios" />
        <BaseTextarea v-model="form.requisitosDeseables" label="Requisitos deseables" opcional />
        <BaseInput v-model="form.aniosExperiencia" label="Años de experiencia" type="number" inputmode="numeric" min="0" />
        <SelectorChips v-model="profesionIds" etiqueta="Profesión requerida" :opciones="profesiones" ayuda="Puedes elegir varias." />

        <fieldset>
          <legend class="font-semibold">Habilidades</legend>
          <p class="mb-2 text-base text-roca">Con ellas se calcula la compatibilidad de cada postulante.</p>
          <div v-for="(fila, i) in filas" :key="i" class="mb-3 rounded-campo border border-linea p-3">
            <div class="grid gap-3 sm:grid-cols-2">
              <BaseSelect v-model="fila.habilidadId" label="Habilidad" :opciones="habilidades" />
              <label class="block">
                <span class="mb-1 block font-semibold">Nivel mínimo</span>
                <select v-model="fila.nivelMinimo" class="campo">
                  <option v-for="n in NIVELES_HABILIDAD" :key="n.id" :value="n.id">{{ n.nombre }}</option>
                </select>
              </label>
            </div>
            <div class="mt-2 flex items-center justify-between gap-2">
              <label class="flex min-h-11 items-center gap-2">
                <input v-model="fila.obligatoria" type="checkbox" class="size-5 accent-guinda-700" /> Obligatoria
              </label>
              <AccionBoton v-if="filas.length > 1" variante="texto" aria-label="Quitar habilidad" @click="filas.splice(i, 1)"><Trash2 class="size-5" aria-hidden="true" /></AccionBoton>
            </div>
          </div>
          <AccionBoton class="w-full" @click="filas.push({ habilidadId: '', obligatoria: true, nivelMinimo: 1 })"><Plus class="size-5" aria-hidden="true" />Agregar habilidad</AccionBoton>
        </fieldset>
      </template>

      <template v-else-if="paso === 2">
        <label class="flex min-h-11 items-center gap-2">
          <input v-model="form.salarioATratar" type="checkbox" class="size-5 accent-guinda-700" /> Salario a tratar
        </label>
        <div v-if="!form.salarioATratar" class="grid gap-4 sm:grid-cols-2">
          <BaseInput v-model="form.salarioMin" label="Salario mínimo (Bs)" type="number" inputmode="numeric" min="1" />
          <BaseInput v-model="form.salarioMax" label="Salario máximo (Bs)" type="number" inputmode="numeric" min="1" />
        </div>
        <BaseTextarea v-model="form.beneficios" label="Beneficios" opcional />
        <BaseInput v-model="form.fechaCierre" label="Fecha de cierre" type="date" :min="hoy" />
      </template>

      <template v-else>
        <p class="text-roca">Así verán tu oferta los postulantes.</p>
        <div>
          <h2 class="text-2xl font-bold break-words text-guinda-900">{{ form.titulo }}</h2>
          <p class="mt-1">{{ empresa?.razonSocial }}</p>
        </div>
        <dl class="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          <div><dt class="text-base text-roca">Salario</dt><dd>{{ textoSalario }}</dd></div>
          <div><dt class="text-base text-roca">Contrato</dt><dd>{{ nombre(tipos, seleccion.tipoContratoId) }}</dd></div>
          <div><dt class="text-base text-roca">Modalidad</dt><dd>{{ nombre(modalidades, seleccion.modalidadId) }}</dd></div>
          <div><dt class="text-base text-roca">Municipio</dt><dd>{{ nombre(municipios, seleccion.municipioId) }}</dd></div>
          <div><dt class="text-base text-roca">Plazas</dt><dd>{{ form.numeroPlazas }}</dd></div>
          <div><dt class="text-base text-roca">Experiencia</dt><dd>{{ plural(Number(form.aniosExperiencia), 'año') }}</dd></div>
          <div><dt class="text-base text-roca">Cierre</dt><dd>{{ fecha(form.fechaCierre) }}</dd></div>
        </dl>
        <div><h3 class="font-bold">Descripción</h3><p class="break-words whitespace-pre-line">{{ form.descripcion }}</p></div>
        <div><h3 class="font-bold">Requisitos obligatorios</h3><p class="break-words whitespace-pre-line">{{ form.requisitosObligatorios }}</p></div>
        <div v-if="form.requisitosDeseables"><h3 class="font-bold">Requisitos deseables</h3><p class="break-words whitespace-pre-line">{{ form.requisitosDeseables }}</p></div>
        <div><h3 class="font-bold">Profesiones</h3><p>{{ profesionIds.map((p) => nombre(profesiones, p)).join(', ') }}</p></div>
        <div>
          <h3 class="font-bold">Habilidades</h3>
          <ul><li v-for="f in filas" :key="f.habilidadId">{{ nombre(habilidades, f.habilidadId) }}: {{ nombreNivel(f.nivelMinimo) }}, {{ f.obligatoria ? 'obligatoria' : 'deseable' }}</li></ul>
        </div>
        <div v-if="form.beneficios"><h3 class="font-bold">Beneficios</h3><p class="break-words whitespace-pre-line">{{ form.beneficios }}</p></div>
      </template>

      <p v-if="error" role="alert" class="text-error">{{ error }}</p>

      <div class="flex flex-col-reverse gap-2 border-t border-linea pt-4 sm:flex-row sm:justify-between">
        <AccionBoton v-if="paso > 0" class="min-h-12!" @click="retroceder">Anterior</AccionBoton>
        <span v-else class="hidden sm:block" />
        <div class="flex flex-col gap-2 sm:flex-row">
          <AccionBoton v-if="esUltimo" class="min-h-12!" :disabled="cargando" @click="guardar(false)">Guardar borrador</AccionBoton>
          <div class="sm:min-w-44">
            <BaseButton :cargando="cargando" texto-cargando="Guardando…">{{ esUltimo ? 'Enviar a revisión' : 'Siguiente' }}</BaseButton>
          </div>
        </div>
      </div>
    </form>
  </section>
</template>
