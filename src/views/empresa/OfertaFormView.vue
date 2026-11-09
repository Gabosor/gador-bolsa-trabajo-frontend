<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Building2, CircleAlert, Plus, Trash2 } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Empresa, ItemCatalogo, Oferta } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import EditorTexto from '@/components/EditorTexto.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import Faja from '@/components/Faja.vue'
import SelectorBuscable from '@/components/SelectorBuscable.vue'
import TextoFormateado from '@/components/TextoFormateado.vue'
import { useAvisosStore } from '@/stores/avisos'
import { agregarInactivas, habilidadesSugeridas, opcionesConArea } from '@/utils/catalogos'
import { NIVELES_HABILIDAD, fecha, monto, nombreNivel, plural } from '@/utils/formato'

interface FilaHabilidad {
  habilidadId: number
  nombre: string
  /** La habilidad se desactivó después de crear la oferta: hay que quitarla. */
  inactiva: boolean
  obligatoria: boolean
  nivelMinimo: number
}

/** Cuántas sugerencias se ven antes de "Ver todas". */
const SUGERENCIAS_VISIBLES = 12

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
const filas = ref<FilaHabilidad[]>([])

const profesiones = ref<ItemCatalogo[]>([])
const tipos = ref<ItemCatalogo[]>([])
const modalidades = ref<ItemCatalogo[]>([])
const municipios = ref<ItemCatalogo[]>([])
const habilidades = ref<ItemCatalogo[]>([])
const areas = ref<ItemCatalogo[]>([])
/** Profesiones guardadas en la oferta, para mostrar las que ya se desactivaron. */
const profesionesDeOferta = ref<ItemCatalogo[]>([])
const habilidadBuscada = ref<number | ''>('')
const verTodasSugeridas = ref(false)
const anuncioHabilidad = ref('')
const contenedorSugeridas = ref<HTMLElement>()
const empresa = ref<Empresa | null>(null)
const motivoRechazo = ref<string | null>(null)
const lista = ref(false)
const error = ref('')
const cargando = ref(false)

// En formato ISO y hora de Bolivia: de noche, UTC ya marca el día siguiente.
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' })
const esUltimo = computed(() => paso.value === PASOS.length - 1)
const nombre = (catalogo: ItemCatalogo[], valor: number | '') => catalogo.find((c) => c.id === valor)?.nombre ?? ''

const opcionesProfesion = computed(() =>
  agregarInactivas(opcionesConArea(profesiones.value, areas.value, 'parentId'), profesionesDeOferta.value),
)
const opcionesHabilidad = computed(() => opcionesConArea(habilidades.value, areas.value, 'areaId'))
const idsElegidos = computed(() => filas.value.map((f) => f.habilidadId))
const sugeridas = computed(() =>
  habilidadesSugeridas(habilidades.value, profesiones.value, profesionIds.value, idsElegidos.value),
)
const sugeridasVisibles = computed(() =>
  verTodasSugeridas.value ? sugeridas.value : sugeridas.value.slice(0, SUGERENCIAS_VISIBLES),
)
const nombreProfesion = (pid: number) => opcionesProfesion.value.find((o) => o.id === pid)?.nombre ?? ''

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
    // Si el backend aún no tiene áreas, el formulario funciona igual, sin grupos.
    areas.value = await catalogo('AREA').catch(() => [])
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
  profesionesDeOferta.value = o.profesiones
  motivoRechazo.value = o.motivoRechazo
  filas.value = o.habilidades.map((h) => ({
    habilidadId: h.habilidad.id,
    nombre: h.habilidad.nombre,
    inactiva: h.habilidad.activo === false,
    obligatoria: h.obligatoria,
    nivelMinimo: h.nivelMinimo,
  }))
}

async function agregarHabilidad(habilidadId: number, desdeSugerida = -1) {
  if (idsElegidos.value.includes(habilidadId)) return
  const habilidad = habilidades.value.find((h) => h.id === habilidadId)
  if (!habilidad) return
  filas.value.push({ habilidadId, nombre: habilidad.nombre, inactiva: false, obligatoria: true, nivelMinimo: 1 })
  anuncioHabilidad.value = `Agregaste ${habilidad.nombre}`
  if (desdeSugerida < 0) return
  // El foco pasa a la siguiente sugerencia, para agregar varias seguidas.
  await nextTick()
  const botones = contenedorSugeridas.value?.querySelectorAll<HTMLButtonElement>('button[data-sugerida]')
  if (botones?.length) botones[Math.min(desdeSugerida, botones.length - 1)]?.focus()
}

function quitarHabilidad(i: number) {
  const [quitada] = filas.value.splice(i, 1)
  if (quitada) anuncioHabilidad.value = `Quitaste ${quitada.nombre}`
}

/** Reglas que el navegador no puede comprobar con los atributos del campo. */
function errorDelPaso(): string {
  if (paso.value === 1) {
    if (profesionIds.value.length === 0) return 'Selecciona al menos una profesión.'
    const profesionesInactivas = opcionesProfesion.value.filter((o) => o.inactiva && profesionIds.value.includes(o.id))
    if (profesionesInactivas.length) {
      return `Quita las profesiones que ya no están disponibles: ${profesionesInactivas.map((p) => p.nombre).join(', ')}.`
    }
    if (filas.value.length === 0) return 'Agrega al menos una habilidad.'
    const habilidadesInactivas = filas.value.filter((f) => f.inactiva)
    if (habilidadesInactivas.length) {
      return `Quita las habilidades que ya no están disponibles: ${habilidadesInactivas.map((f) => f.nombre).join(', ')}.`
    }
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
      // Solo lo que espera el backend: rechaza campos desconocidos.
      habilidades: filas.value.map(({ habilidadId, obligatoria, nivelMinimo }) => ({ habilidadId, obligatoria, nivelMinimo })),
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
        <EditorTexto v-model="form.descripcion" label="Descripción" :filas="6" :minlength="10" :maxlength="10000" ayuda="Qué hará la persona y en qué equipo." />
        <div class="grid gap-4 sm:grid-cols-2">
          <BaseSelect v-model="seleccion.tipoContratoId" label="Tipo de contrato" :opciones="tipos" />
          <BaseSelect v-model="seleccion.modalidadId" label="Modalidad" :opciones="modalidades" />
          <BaseSelect v-model="seleccion.municipioId" label="Municipio" :opciones="municipios" />
          <BaseInput v-model="form.numeroPlazas" label="Número de plazas" type="number" inputmode="numeric" min="1" />
        </div>
      </template>

      <template v-else-if="paso === 1">
        <EditorTexto v-model="form.requisitosObligatorios" label="Requisitos obligatorios" :minlength="3" :maxlength="5000" ayuda="Usa viñetas para que se lean de un vistazo." />
        <EditorTexto v-model="form.requisitosDeseables" label="Requisitos deseables" opcional :filas="3" :maxlength="5000" />
        <BaseInput v-model="form.aniosExperiencia" label="Años de experiencia" type="number" inputmode="numeric" min="0" />
        <SelectorBuscable
          v-model="profesionIds"
          label="Profesiones requeridas"
          :opciones="opcionesProfesion"
          texto-sin-grupo="Otras profesiones"
          ayuda="Escribe para buscar; puedes elegir varias."
        />

        <fieldset class="space-y-3">
          <legend class="font-semibold">Habilidades</legend>
          <p class="text-base text-roca">Con ellas se calcula la compatibilidad de cada postulante.</p>

          <div v-if="sugeridas.length" ref="contenedorSugeridas">
            <p class="mb-2 text-base font-semibold">{{ profesionIds.length ? 'Sugeridas para las profesiones elegidas' : 'Habilidades generales' }}</p>
            <ul class="flex flex-wrap gap-2">
              <li v-for="(h, i) in sugeridasVisibles" :key="h.id">
                <button
                  type="button"
                  data-sugerida
                  class="inline-flex min-h-11 items-center gap-1 rounded-full border border-roca bg-white px-3.5 hover:border-guinda-700 hover:bg-guinda-50"
                  :aria-label="`Agregar ${h.nombre}`"
                  @click="agregarHabilidad(h.id, i)"
                >
                  <Plus class="size-4" aria-hidden="true" />{{ h.nombre }}
                </button>
              </li>
            </ul>
            <button
              v-if="sugeridas.length > SUGERENCIAS_VISIBLES"
              type="button"
              class="enlace mt-1 min-h-11"
              :aria-expanded="verTodasSugeridas"
              @click="verTodasSugeridas = !verTodasSugeridas"
            >
              {{ verTodasSugeridas ? 'Ver menos' : `Ver todas (${sugeridas.length})` }}
            </button>
          </div>

          <SelectorBuscable
            v-model="habilidadBuscada"
            label="Buscar otra habilidad"
            :opciones="opcionesHabilidad"
            :excluir="idsElegidos"
            texto-sin-grupo="Generales"
            opcional
            limpiar-al-elegir
            @elegir="agregarHabilidad"
          />

          <p v-if="!filas.length" class="rounded-campo border border-dashed border-roca p-3 text-roca">Aún no agregaste habilidades.</p>
          <ul v-else class="space-y-2" aria-label="Habilidades agregadas">
            <li
              v-for="(fila, i) in filas"
              :key="fila.habilidadId"
              class="rounded-campo border p-3"
              :class="fila.inactiva ? 'border-error bg-error-50' : 'border-linea'"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="min-w-0 pt-2 font-semibold break-words">
                  {{ fila.nombre }}
                  <span v-if="fila.inactiva" class="block text-sm font-normal text-error">Ya no está disponible. Quítala para continuar.</span>
                </p>
                <AccionBoton variante="texto" :aria-label="`Quitar ${fila.nombre}`" @click="quitarHabilidad(i)"><Trash2 class="size-5" aria-hidden="true" /></AccionBoton>
              </div>
              <div class="mt-2 grid gap-3 sm:grid-cols-2 sm:items-end">
                <label class="block">
                  <span class="mb-1 block text-base">Nivel mínimo</span>
                  <select v-model="fila.nivelMinimo" class="campo" :aria-label="`Nivel mínimo de ${fila.nombre}`">
                    <option v-for="n in NIVELES_HABILIDAD" :key="n.id" :value="n.id">{{ n.nombre }}</option>
                  </select>
                </label>
                <label class="flex min-h-12 items-center gap-2">
                  <input v-model="fila.obligatoria" type="checkbox" class="size-5 accent-guinda-700" :aria-label="`${fila.nombre} es obligatoria`" /> Obligatoria
                </label>
              </div>
            </li>
          </ul>
          <p class="sr-only" aria-live="polite">{{ anuncioHabilidad }}</p>
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
        <EditorTexto v-model="form.beneficios" label="Beneficios" opcional :filas="3" :maxlength="3000" ayuda="Por ejemplo: seguro de salud, capacitación, horario flexible." />
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
        <div><h3 class="mb-1 font-bold">Descripción</h3><TextoFormateado :texto="form.descripcion" /></div>
        <div><h3 class="mb-1 font-bold">Requisitos obligatorios</h3><TextoFormateado :texto="form.requisitosObligatorios" /></div>
        <div v-if="form.requisitosDeseables"><h3 class="mb-1 font-bold">Requisitos deseables</h3><TextoFormateado :texto="form.requisitosDeseables" /></div>
        <div><h3 class="font-bold">Profesiones</h3><p>{{ profesionIds.map(nombreProfesion).join(', ') }}</p></div>
        <div>
          <h3 class="font-bold">Habilidades</h3>
          <ul><li v-for="f in filas" :key="f.habilidadId">{{ f.nombre }}: {{ nombreNivel(f.nivelMinimo) }}, {{ f.obligatoria ? 'obligatoria' : 'deseable' }}</li></ul>
        </div>
        <div v-if="form.beneficios"><h3 class="mb-1 font-bold">Beneficios</h3><TextoFormateado :texto="form.beneficios" /></div>
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
