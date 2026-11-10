<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ChevronRight, CircleCheck, GraduationCap, Pencil, Plus, Trash2, UserRound, Briefcase } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Experiencia, Formacion, ItemCatalogo, Perfil } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import EditorTexto from '@/components/EditorTexto.vue'
import CargaArchivo from '@/components/CargaArchivo.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import Faja from '@/components/Faja.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import SeccionPlegable from '@/components/SeccionPlegable.vue'
import SelectorBuscable from '@/components/SelectorBuscable.vue'
import TextoFormateado from '@/components/TextoFormateado.vue'
import { useAvisosStore } from '@/stores/avisos'
import { confirmar } from '@/utils/confirmar'
import { agregarInactivas, habilidadesSugeridas, opcionesConArea } from '@/utils/catalogos'
import { NIVELES_HABILIDAD, plural } from '@/utils/formato'

const SECCION_DE_PENDIENTE: Record<string, string> = {
  cv: 'archivos',
  foto: 'archivos',
  datos: 'datos',
  idiomas: 'idiomas',
  formacion: 'formacion',
  experiencia: 'experiencia',
  habilidades: 'habilidades',
}
const NIVELES_IDIOMA = ['Básico', 'Intermedio', 'Avanzado', 'Nativo']
const ESPERA_AUTOGUARDADO_MS = 800
const UMBRAL_POSTULAR = 80

const avisos = useAvisosStore()
const perfil = ref<Perfil | null>(null)
const profesiones = ref<ItemCatalogo[]>([])
const catalogoHabilidades = ref<ItemCatalogo[]>([])
const areas = ref<ItemCatalogo[]>([])
/** Cuántas sugerencias de habilidades se muestran. */
const SUGERENCIAS_VISIBLES = 8
const errorCarga = ref('')
const subiendo = ref<'foto' | 'cv' | null>(null)
const seccionAbierta = ref<string | null>(null)
const estadoGuardado = ref<'' | 'guardando' | 'guardado'>('')

const datos = reactive({ direccion: '', fechaNacimiento: '' })
const idiomas = ref<{ nombre: string; nivel: string }[]>([])
/** `inactiva`: GADOR la desactivó; hay que quitarla para poder guardar. */
const habilidades = ref<{ habilidadId: number; nivel: number; nombre: string; inactiva: boolean }[]>([])
const habilidadNueva = ref<number | ''>('')

const hojaFormacion = ref(false)
const formacionId = ref<number | null>(null)
const formacion = reactive({ profesionId: '' as number | '', institucion: '', anioTitulacion: '', nroTituloNacional: '' })

const hojaExperiencia = ref(false)
const experienciaId = ref<number | null>(null)
const experiencia = reactive({ empresa: '', cargo: '', anios: '', descripcion: '' })
const guardandoHoja = ref(false)

const hoy = new Date().toISOString().slice(0, 10)
const anioActual = String(new Date().getFullYear())

const porcentaje = computed(() => perfil.value?.porcentajeCompletitud ?? 0)
const puedePostular = computed(() => porcentaje.value > UMBRAL_POSTULAR)
const pendientes = computed(() => perfil.value?.pendientes ?? [])
const falta = (...claves: string[]) => pendientes.value.some((p) => claves.includes(p.clave))

const idsHabilidades = computed(() => habilidades.value.map((h) => h.habilidadId))
const opcionesHabilidad = computed(() => opcionesConArea(catalogoHabilidades.value, areas.value, 'areaId'))
const opcionesProfesion = computed(() =>
  agregarInactivas(
    opcionesConArea(profesiones.value, areas.value, 'parentId'),
    (perfil.value?.formaciones ?? []).map((f) => f.profesion),
  ),
)
// Primero las habilidades del área de sus títulos y luego las generales.
const sugeridas = computed(() =>
  habilidadesSugeridas(
    catalogoHabilidades.value,
    profesiones.value,
    (perfil.value?.formaciones ?? []).map((f) => f.profesion.id),
    idsHabilidades.value,
  ).slice(0, SUGERENCIAS_VISIBLES),
)
const hayInactivas = computed(() => habilidades.value.some((h) => h.inactiva))
const opcionesNivelIdioma = (actual: string) =>
  actual && !NIVELES_IDIOMA.includes(actual) ? [actual, ...NIVELES_IDIOMA] : NIVELES_IDIOMA

/** Trae el perfil al estado; solo el arranque copia también los formularios. */
async function recargar(copiarFormularios = false) {
  const p = await api<Perfil>('/postulantes/perfil')
  perfil.value = p
  if (!copiarFormularios) return
  datos.direccion = p.direccion ?? ''
  datos.fechaNacimiento = p.fechaNacimiento ?? ''
  idiomas.value = p.idiomas.map((i) => ({ ...i }))
  habilidades.value = p.habilidades.map((h) => ({
    habilidadId: h.habilidad.id,
    nivel: h.nivel,
    nombre: h.habilidad.nombre,
    inactiva: h.habilidad.activo === false,
  }))
}

async function ejecutar(accion: () => Promise<unknown>, mensaje?: string) {
  try {
    await accion()
    await recargar()
    if (mensaje) avisos.exito(mensaje)
    return true
  } catch (e) {
    avisos.error(mensajeError(e))
    return false
  }
}

let temporizador: ReturnType<typeof setTimeout> | undefined

/** Guarda solo cuando los datos obligatorios ya son válidos para el servidor. */
function programarGuardado() {
  clearTimeout(temporizador)
  temporizador = setTimeout(async () => {
    if (datos.direccion.trim().length < 5 || !datos.fechaNacimiento) return
    estadoGuardado.value = 'guardando'
    const completos = idiomas.value.filter((i) => i.nombre.trim().length >= 2 && i.nivel)
    const ok = await ejecutar(() =>
      api('/postulantes/perfil/datos', { method: 'PUT', body: { ...datos, idiomas: completos } }),
    )
    estadoGuardado.value = ok ? 'guardado' : ''
  }, ESPERA_AUTOGUARDADO_MS)
}

function guardarHabilidades() {
  // Con una habilidad desactivada el servidor rechaza toda la lista: se espera a que la quite.
  if (hayInactivas.value) {
    avisos.error('Quita las habilidades que ya no están disponibles para guardar los cambios.')
    return
  }
  const cuerpo = habilidades.value.map(({ habilidadId, nivel }) => ({ habilidadId, nivel }))
  return ejecutar(() => api('/postulantes/perfil/habilidades', { method: 'PUT', body: { habilidades: cuerpo } }))
}

function agregarHabilidad(habilidadId: number) {
  const habilidad = catalogoHabilidades.value.find((h) => h.id === habilidadId)
  if (!habilidad || idsHabilidades.value.includes(habilidadId)) return
  habilidades.value.push({ habilidadId, nivel: 1, nombre: habilidad.nombre, inactiva: false })
  guardarHabilidades()
}

function cambiarNivel(i: number, nivel: number) {
  habilidades.value[i]!.nivel = nivel
  guardarHabilidades()
}

function quitarHabilidad(i: number) {
  habilidades.value.splice(i, 1)
  guardarHabilidades()
}

async function subir(ruta: 'cv' | 'foto', archivo: File) {
  const cuerpo = new FormData()
  cuerpo.append('archivo', archivo)
  subiendo.value = ruta
  await ejecutar(
    () => api(`/postulantes/perfil/${ruta}`, { method: 'POST', body: cuerpo }),
    ruta === 'cv' ? 'CV actualizado' : 'Foto actualizada',
  )
  subiendo.value = null
}

function abrirFormacion(f?: Formacion) {
  formacionId.value = f?.id ?? null
  Object.assign(formacion, {
    profesionId: f?.profesion.id ?? '',
    institucion: f?.institucion ?? '',
    anioTitulacion: f ? String(f.anioTitulacion) : '',
    nroTituloNacional: f?.nroTituloNacional ?? '',
  })
  hojaFormacion.value = true
}

function abrirExperiencia(x?: Experiencia) {
  experienciaId.value = x?.id ?? null
  Object.assign(experiencia, {
    empresa: x?.empresa ?? '',
    cargo: x?.cargo ?? '',
    anios: x ? String(x.anios) : '',
    descripcion: x?.descripcion ?? '',
  })
  hojaExperiencia.value = true
}

async function guardarEnHoja(accion: () => Promise<unknown>, mensaje: string, cerrar: () => void) {
  guardandoHoja.value = true
  if (await ejecutar(accion, mensaje)) cerrar()
  guardandoHoja.value = false
}

function guardarFormacion() {
  const id = formacionId.value
  return guardarEnHoja(
    () =>
      api(`/postulantes/perfil/formaciones${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: { ...formacion, anioTitulacion: Number(formacion.anioTitulacion) },
      }),
    id ? 'Formación actualizada' : 'Formación agregada',
    () => (hojaFormacion.value = false),
  )
}

function guardarExperiencia() {
  const id = experienciaId.value
  return guardarEnHoja(
    () =>
      api(`/postulantes/perfil/experiencias${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: { ...experiencia, anios: Number(experiencia.anios) },
      }),
    id ? 'Experiencia actualizada' : 'Experiencia agregada',
    () => (hojaExperiencia.value = false),
  )
}

async function eliminar(ruta: 'formaciones' | 'experiencias', id: number, nombre: string) {
  const ok = await confirmar({ titulo: `¿Eliminar ${nombre}?`, mensaje: 'Se quitará de tu hoja de vida.', accion: 'Eliminar', peligro: true })
  if (ok) await ejecutar(() => api(`/postulantes/perfil/${ruta}/${id}`, { method: 'DELETE' }), 'Registro eliminado')
}

/** Abre la sección y la lleva a la vista, aunque ya hubiera estado abierta. */
async function irA(clave: string) {
  const seccion = SECCION_DE_PENDIENTE[clave] ?? clave
  seccionAbierta.value = null
  await nextTick()
  seccionAbierta.value = seccion
  await nextTick()
  document.getElementById(seccion)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  try {
    ;[profesiones.value, catalogoHabilidades.value, areas.value] = await Promise.all([
      api<ItemCatalogo[]>('/catalogos/PROFESION'),
      api<ItemCatalogo[]>('/catalogos/habilidades'),
      // Con un backend sin áreas, los selectores funcionan igual, sin grupos.
      api<ItemCatalogo[]>('/catalogos/AREA').catch(() => []),
    ])
    await recargar(true)
    const primero = pendientes.value[0]?.clave
    if (primero) seccionAbierta.value = SECCION_DE_PENDIENTE[primero] ?? null
  } catch (e) {
    errorCarga.value = mensajeError(e)
  }
})
</script>

<template>
  <section v-if="perfil" class="mx-auto max-w-2xl space-y-3">
    <header class="plano p-4">
      <div class="flex items-center gap-3">
        <img v-if="perfil.fotoUrl" :src="perfil.fotoUrl" alt="Tu foto de perfil" class="size-16 shrink-0 rounded-full object-cover" />
        <span v-else class="flex size-16 shrink-0 items-center justify-center rounded-full bg-salar text-roca">
          <UserRound class="size-8" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <h1 class="titulo-pagina">Mi hoja de vida</h1>
          <p class="truncate text-roca">{{ perfil.user.nombreCompleto }}, CI {{ perfil.user.ci }}</p>
        </div>
      </div>

      <div class="mt-4">
        <div class="mb-1.5 flex items-baseline justify-between gap-3">
          <p class="font-semibold">Perfil completo</p>
          <p class="font-titulo text-2xl font-bold text-guinda-900 tabular-nums">{{ porcentaje }} %</p>
        </div>
        <Faja :total="20" :completos="porcentaje / 5" :etiqueta="`Perfil completo al ${porcentaje} %`" />
        <p class="mt-1.5 flex items-center gap-1 text-base" :class="puedePostular ? 'font-semibold text-exito' : 'text-roca'">
          <CircleCheck v-if="puedePostular" class="size-4" aria-hidden="true" />
          {{ puedePostular ? 'Ya puedes postular a las ofertas.' : 'Necesitas más del 80 % para postular.' }}
        </p>
      </div>

      <div v-if="pendientes.length" class="mt-4 border-t border-linea pt-3">
        <h2 class="mb-1 text-lg font-bold">Qué te falta</h2>
        <ul>
          <li v-for="p in pendientes" :key="p.clave">
            <button type="button" class="flex min-h-11 w-full items-center gap-2 text-left" @click="irA(p.clave)">
              <span class="min-w-0 flex-1">{{ p.texto }}</span>
              <span class="text-base font-semibold whitespace-nowrap text-lago">+{{ p.puntos }} %</span>
              <ChevronRight class="size-4 shrink-0 text-roca" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>
    </header>

    <SeccionPlegable
      id="archivos"
      titulo="Foto y CV"
      :completa="!falta('cv', 'foto')"
      :abierta="seccionAbierta === 'archivos'"
      :resumen="perfil.cvUrl ? 'CV cargado' : 'El CV en PDF es obligatorio'"
    >
      <div class="space-y-4">
        <CargaArchivo etiqueta="Curriculum vitae" :tipos="['application/pdf']" :max-mb="5" ayuda="PDF, hasta 5 MB" :url-actual="perfil.cvUrl" :subiendo="subiendo === 'cv'" @elegir="subir('cv', $event)" />
        <CargaArchivo etiqueta="Foto de perfil" :tipos="['image/png', 'image/jpeg']" :max-mb="2" ayuda="PNG o JPG, hasta 2 MB" :url-actual="perfil.fotoUrl" :subiendo="subiendo === 'foto'" @elegir="subir('foto', $event)" />
      </div>
    </SeccionPlegable>

    <SeccionPlegable id="datos" titulo="Datos personales" :completa="!falta('datos')" :abierta="seccionAbierta === 'datos'" :resumen="datos.direccion || 'Dirección y fecha de nacimiento'">
      <form class="space-y-4" @input="programarGuardado" @submit.prevent>
        <BaseInput v-model="datos.direccion" label="Dirección" autocomplete="street-address" placeholder="Calle, número y zona" />
        <BaseInput v-model="datos.fechaNacimiento" label="Fecha de nacimiento" type="date" autocomplete="bday" :max="hoy" />
        <p class="min-h-6 text-base text-roca" aria-live="polite">
          <template v-if="estadoGuardado === 'guardando'">Guardando…</template>
          <template v-else-if="estadoGuardado === 'guardado'">Cambios guardados</template>
          <template v-else>Se guarda solo al escribir.</template>
        </p>
      </form>
    </SeccionPlegable>

    <SeccionPlegable id="formacion" titulo="Formación académica" :completa="!falta('formacion')" :abierta="seccionAbierta === 'formacion'" :resumen="plural(perfil.formaciones.length, 'título registrado', 'títulos registrados')">
      <ul v-if="perfil.formaciones.length" class="mb-3 divide-y divide-linea">
        <li v-for="f in perfil.formaciones" :key="f.id" class="flex items-start gap-2 py-3 first:pt-0">
          <div class="min-w-0 flex-1">
            <p class="font-semibold break-words">{{ f.profesion.nombre }}</p>
            <p class="break-words text-roca">{{ f.institucion }}, {{ f.anioTitulacion }}</p>
            <p class="text-base text-roca">Título Nacional {{ f.nroTituloNacional }}</p>
          </div>
          <AccionBoton variante="texto" :aria-label="`Editar ${f.profesion.nombre}`" @click="abrirFormacion(f)"><Pencil class="size-5" aria-hidden="true" /></AccionBoton>
          <AccionBoton variante="texto" :aria-label="`Eliminar ${f.profesion.nombre}`" @click="eliminar('formaciones', f.id, f.profesion.nombre)"><Trash2 class="size-5" aria-hidden="true" /></AccionBoton>
        </li>
      </ul>
      <EstadoVacio v-else :icono="GraduationCap" titulo="Aún no agregaste títulos" texto="Tu formación vale 20 % del perfil." />
      <AccionBoton class="w-full" @click="abrirFormacion()"><Plus class="size-5" aria-hidden="true" />Agregar formación</AccionBoton>
    </SeccionPlegable>

    <SeccionPlegable id="experiencia" titulo="Experiencia laboral" :completa="!falta('experiencia')" :abierta="seccionAbierta === 'experiencia'" :resumen="plural(perfil.experiencias.length, 'experiencia registrada', 'experiencias registradas')">
      <ul v-if="perfil.experiencias.length" class="mb-3 divide-y divide-linea">
        <li v-for="x in perfil.experiencias" :key="x.id" class="flex items-start gap-2 py-3 first:pt-0">
          <div class="min-w-0 flex-1">
            <p class="font-semibold break-words">{{ x.cargo }}</p>
            <p class="break-words text-roca">{{ x.empresa }}, {{ plural(x.anios, 'año') }}</p>
            <TextoFormateado class="mt-1" :texto="x.descripcion" />
          </div>
          <AccionBoton variante="texto" :aria-label="`Editar ${x.cargo}`" @click="abrirExperiencia(x)"><Pencil class="size-5" aria-hidden="true" /></AccionBoton>
          <AccionBoton variante="texto" :aria-label="`Eliminar ${x.cargo}`" @click="eliminar('experiencias', x.id, x.cargo)"><Trash2 class="size-5" aria-hidden="true" /></AccionBoton>
        </li>
      </ul>
      <EstadoVacio v-else :icono="Briefcase" titulo="Aún no agregaste experiencia" texto="Si recién te titulaste, puedes postular sin ella." />
      <AccionBoton class="w-full" @click="abrirExperiencia()"><Plus class="size-5" aria-hidden="true" />Agregar experiencia</AccionBoton>
    </SeccionPlegable>

    <SeccionPlegable id="habilidades" titulo="Habilidades" :completa="!falta('habilidades')" :abierta="seccionAbierta === 'habilidades'" :resumen="`${plural(habilidades.length, 'habilidad', 'habilidades')}, definen tu compatibilidad`">
      <ul v-if="habilidades.length" class="mb-4 divide-y divide-linea">
        <li v-for="(h, i) in habilidades" :key="h.habilidadId" class="py-3 first:pt-0">
          <div class="mb-2 flex items-center justify-between gap-2">
            <p class="min-w-0 font-semibold break-words">
              {{ h.nombre }}
              <span v-if="h.inactiva" class="block text-sm font-normal text-error">Ya no está disponible. Quítala para poder guardar cambios en tus habilidades.</span>
            </p>
            <AccionBoton variante="texto" :aria-label="`Quitar ${h.nombre}`" @click="quitarHabilidad(i)"><Trash2 class="size-5" aria-hidden="true" /></AccionBoton>
          </div>
          <div v-if="!h.inactiva" class="grid grid-cols-3 overflow-hidden rounded-campo border border-roca" role="radiogroup" :aria-label="`Nivel de ${h.nombre}`">
            <button
              v-for="n in NIVELES_HABILIDAD"
              :key="n.id"
              type="button"
              role="radio"
              :aria-checked="h.nivel === n.id"
              class="min-h-11 border-l border-roca text-base first:border-l-0"
              :class="h.nivel === n.id ? 'bg-guinda-700 font-semibold text-white' : 'bg-white'"
              @click="cambiarNivel(i, n.id)"
            >
              {{ n.nombre }}
            </button>
          </div>
        </li>
      </ul>
      <div v-if="sugeridas.length" class="mb-3">
        <p class="mb-2 text-base font-semibold">{{ perfil.formaciones.length ? 'Sugeridas para tu formación' : 'Habilidades generales' }}</p>
        <ul class="flex flex-wrap gap-2">
          <li v-for="s in sugeridas" :key="s.id">
            <button type="button" class="inline-flex min-h-11 items-center gap-1 rounded-full border border-roca bg-white px-3.5 hover:border-guinda-700 hover:bg-guinda-50" :aria-label="`Agregar ${s.nombre}`" @click="agregarHabilidad(s.id)">
              <Plus class="size-4" aria-hidden="true" />{{ s.nombre }}
            </button>
          </li>
        </ul>
      </div>
      <SelectorBuscable
        v-model="habilidadNueva"
        label="Agregar habilidad"
        :opciones="opcionesHabilidad"
        :excluir="idsHabilidades"
        texto-sin-grupo="Generales"
        opcional
        limpiar-al-elegir
        @elegir="agregarHabilidad"
      />
    </SeccionPlegable>

    <SeccionPlegable id="idiomas" titulo="Idiomas" :completa="!falta('idiomas')" :abierta="seccionAbierta === 'idiomas'" :resumen="idiomas.map((i) => i.nombre).filter(Boolean).join(', ') || 'Castellano, quechua, aimara, inglés…'">
      <form class="space-y-3" @input="programarGuardado" @change="programarGuardado" @submit.prevent>
        <div v-for="(idioma, i) in idiomas" :key="i" class="flex items-end gap-2">
          <div class="min-w-0 flex-1"><BaseInput v-model="idioma.nombre" label="Idioma" /></div>
          <label class="block w-36 shrink-0">
            <span class="mb-1 block font-semibold">Nivel</span>
            <select v-model="idioma.nivel" required class="campo">
              <option value="" disabled>Elige</option>
              <option v-for="n in opcionesNivelIdioma(idioma.nivel)" :key="n">{{ n }}</option>
            </select>
          </label>
          <AccionBoton variante="texto" :aria-label="`Quitar idioma ${idioma.nombre}`" class="min-h-12!" @click="idiomas.splice(i, 1); programarGuardado()"><Trash2 class="size-5" aria-hidden="true" /></AccionBoton>
        </div>
        <AccionBoton class="w-full" @click="idiomas.push({ nombre: '', nivel: '' })"><Plus class="size-5" aria-hidden="true" />Agregar idioma</AccionBoton>
        <p v-if="falta('datos')" class="text-base text-roca">Completa también tus datos personales para que los idiomas se guarden.</p>
      </form>
    </SeccionPlegable>

    <HojaInferior v-model="hojaFormacion" :titulo="formacionId ? 'Editar formación' : 'Agregar formación'">
      <form class="space-y-4" @submit.prevent="guardarFormacion">
        <SelectorBuscable v-model="formacion.profesionId" label="Título" :opciones="opcionesProfesion" texto-sin-grupo="Otras profesiones" />
        <BaseInput v-model="formacion.institucion" label="Universidad o instituto" />
        <BaseInput v-model="formacion.anioTitulacion" label="Año de titulación" type="number" inputmode="numeric" min="1950" :max="anioActual" />
        <BaseInput v-model="formacion.nroTituloNacional" label="Número de Título Nacional" />
        <BaseButton :cargando="guardandoHoja" texto-cargando="Guardando…">Guardar formación</BaseButton>
      </form>
    </HojaInferior>

    <HojaInferior v-model="hojaExperiencia" :titulo="experienciaId ? 'Editar experiencia' : 'Agregar experiencia'">
      <form class="space-y-4" @submit.prevent="guardarExperiencia">
        <BaseInput v-model="experiencia.cargo" label="Cargo" />
        <BaseInput v-model="experiencia.empresa" label="Empresa" />
        <BaseInput v-model="experiencia.anios" label="Años en el cargo" type="number" inputmode="numeric" min="0" max="60" />
        <EditorTexto v-model="experiencia.descripcion" label="Qué hacías" :minlength="5" :maxlength="3000" ayuda="Tus funciones y logros principales." />
        <BaseButton :cargando="guardandoHoja" texto-cargando="Guardando…">Guardar experiencia</BaseButton>
      </form>
    </HojaInferior>
  </section>
  <p v-else-if="errorCarga" role="alert" class="text-error">{{ errorCarga }}</p>
  <div v-else class="mx-auto max-w-2xl"><Esqueleto :filas="5" /></div>
</template>
