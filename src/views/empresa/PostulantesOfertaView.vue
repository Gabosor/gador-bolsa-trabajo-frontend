<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Download, Mail, Phone, UserRound, UsersRound } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Perfil } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import Faja from '@/components/Faja.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import TextoFormateado from '@/components/TextoFormateado.vue'
import { useAvisosStore } from '@/stores/avisos'
import { confirmar } from '@/utils/confirmar'
import { ETAPAS_POSTULACION, nombreNivel, plural } from '@/utils/formato'

interface Ficha {
  id: number
  estado: string
  porcentajeMatch: number
  nombre: string
  fotoUrl: string | null
  profesion: string | null
  aniosExperiencia: number
}

interface Detalle {
  postulacion: { id: number; estado: string; porcentajeMatch: number }
  perfil: Perfil
}

/** Siguiente etapa de cada estado; RECHAZADO se ofrece aparte. */
const SIGUIENTE: Record<string, { estado: string; texto: string }> = {
  VISTO: { estado: 'PRESELECCIONADO', texto: 'Preseleccionar' },
  PRESELECCIONADO: { estado: 'ENTREVISTA', texto: 'Pasar a entrevista' },
  ENTREVISTA: { estado: 'FINALISTA', texto: 'Marcar finalista' },
  FINALISTA: { estado: 'CONTRATADO', texto: 'Contratar' },
}
const ETIQUETAS: Record<string, string> = {
  POSTULADO: 'Nuevos',
  VISTO: 'Vistos',
  PRESELECCIONADO: 'Preseleccionados',
  ENTREVISTA: 'Entrevista',
  FINALISTA: 'Finalistas',
  CONTRATADO: 'Contratados',
  RECHAZADO: 'No seleccionados',
}

const route = useRoute()
const avisos = useAvisosStore()
const id = route.params.id as string
const titulo = ref('')
const fichas = ref<Ficha[]>([])
const detalle = ref<Detalle | null>(null)
const filtro = ref('')
const error = ref('')
const cargada = ref(false)

const hojaAbierta = computed({
  get: () => detalle.value !== null,
  set: (valor) => {
    if (!valor) detalle.value = null
  },
})
const estadosPresentes = computed(() => Object.keys(ETIQUETAS).filter((e) => fichas.value.some((f) => f.estado === e)))
const visibles = computed(() => (filtro.value ? fichas.value.filter((f) => f.estado === filtro.value) : fichas.value))
const siguiente = computed(() => (detalle.value ? SIGUIENTE[detalle.value.postulacion.estado] : undefined))
const etapa = (estado: string) => ETAPAS_POSTULACION.indexOf(estado) + 1

async function cargar() {
  error.value = ''
  try {
    const r = await api<{ oferta: { titulo: string }; postulantes: Ficha[] }>(`/postulaciones/oferta/${id}`)
    titulo.value = r.oferta.titulo
    fichas.value = r.postulantes
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

async function abrir(f: Ficha) {
  try {
    detalle.value = await api<Detalle>(`/postulaciones/${f.id}/perfil`)
    await cargar()
  } catch (e) {
    avisos.error(mensajeError(e))
  }
}

async function cambiar(estado: string, mensaje: string) {
  if (!detalle.value) return
  try {
    await api(`/postulaciones/${detalle.value.postulacion.id}/estado`, { method: 'PATCH', body: { estado } })
    detalle.value.postulacion.estado = estado
    avisos.exito(mensaje)
    await cargar()
  } catch (e) {
    avisos.error(mensajeError(e))
  }
}

async function rechazar() {
  const actual = detalle.value
  if (!actual) return
  detalle.value = null
  const ok = await confirmar({
    titulo: 'Marcar como no seleccionado',
    mensaje: `${actual.perfil.user.nombreCompleto} recibirá el aviso y no se puede deshacer.`,
    accion: 'Confirmar',
    peligro: true,
  })
  detalle.value = actual
  if (ok) await cambiar('RECHAZADO', 'Postulante marcado como no seleccionado')
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <RouterLink to="/empresa/ofertas" class="enlace mb-2 inline-flex min-h-11 items-center gap-1 no-underline"><ArrowLeft class="size-5" aria-hidden="true" />Mis ofertas</RouterLink>
    <h1 class="titulo-pagina">Postulantes</h1>
    <p class="mb-3 break-words text-roca">{{ titulo }}</p>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>

    <div v-if="fichas.length" class="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
      <button type="button" class="min-h-11 shrink-0 rounded-full border px-3.5" :class="filtro === '' ? 'border-guinda-700 bg-guinda-700 font-semibold text-white' : 'border-roca bg-white'" :aria-pressed="filtro === ''" @click="filtro = ''">Todos ({{ fichas.length }})</button>
      <button v-for="e in estadosPresentes" :key="e" type="button" class="min-h-11 shrink-0 rounded-full border px-3.5" :class="filtro === e ? 'border-guinda-700 bg-guinda-700 font-semibold text-white' : 'border-roca bg-white'" :aria-pressed="filtro === e" @click="filtro = e">
        {{ ETIQUETAS[e] }} ({{ fichas.filter((f) => f.estado === e).length }})
      </button>
    </div>

    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="fichas.length === 0 && !error" :icono="UsersRound" titulo="Aún no hay postulantes" texto="Cuando alguien postule, aparecerá aquí ordenado por compatibilidad." />

    <ul v-else class="plano divide-y divide-linea overflow-hidden">
      <li v-for="f in visibles" :key="f.id">
        <button type="button" class="flex w-full items-center gap-3 p-3 text-left hover:bg-guinda-50/50" @click="abrir(f)">
          <img v-if="f.fotoUrl" :src="f.fotoUrl" alt="" class="size-12 shrink-0 rounded-full object-cover" />
          <span v-else class="flex size-12 shrink-0 items-center justify-center rounded-full bg-salar text-roca"><UserRound class="size-6" aria-hidden="true" /></span>
          <span class="min-w-0 flex-1">
            <span class="block font-semibold break-words">{{ f.nombre }}</span>
            <span class="block text-base text-roca">{{ f.profesion ?? 'Sin profesión registrada' }}, {{ plural(f.aniosExperiencia, 'año') }}</span>
            <span class="mt-1 block"><EstadoBadge :estado="f.estado" /></span>
          </span>
          <span class="shrink-0 text-right">
            <span class="block font-titulo text-2xl font-bold text-guinda-900 tabular-nums">{{ f.porcentajeMatch }} %</span>
            <span class="block text-sm text-roca">compatible</span>
          </span>
        </button>
      </li>
    </ul>

    <HojaInferior v-model="hojaAbierta" :titulo="detalle?.perfil.user.nombreCompleto ?? 'Postulante'">
      <div v-if="detalle" class="space-y-4">
        <div class="flex items-center gap-3">
          <img v-if="detalle.perfil.fotoUrl" :src="detalle.perfil.fotoUrl" alt="" class="size-16 shrink-0 rounded-full object-cover" />
          <div class="min-w-0">
            <EstadoBadge :estado="detalle.postulacion.estado" />
            <p class="mt-1 font-semibold">Compatibilidad: {{ detalle.postulacion.porcentajeMatch }} %</p>
          </div>
        </div>
        <Faja v-if="etapa(detalle.postulacion.estado)" :total="ETAPAS_POSTULACION.length" :completos="etapa(detalle.postulacion.estado)" :etiqueta="`Etapa ${etapa(detalle.postulacion.estado)} de ${ETAPAS_POSTULACION.length}`" />

        <div class="flex flex-col gap-1">
          <a :href="`tel:${detalle.perfil.user.celular}`" class="flex min-h-11 items-center gap-2"><Phone class="size-5 text-roca" aria-hidden="true" />{{ detalle.perfil.user.celular }}</a>
          <a :href="`mailto:${detalle.perfil.user.email}`" class="flex min-h-11 items-center gap-2 break-all"><Mail class="size-5 shrink-0 text-roca" aria-hidden="true" />{{ detalle.perfil.user.email }}</a>
        </div>

        <a v-if="detalle.perfil.cvUrl" :href="detalle.perfil.cvUrl" target="_blank" rel="noopener" class="flex min-h-12 items-center justify-center gap-2 rounded-campo border border-guinda-700 font-semibold text-guinda-700">
          <Download class="size-5" aria-hidden="true" />Descargar CV en PDF
        </a>

        <div v-if="detalle.perfil.formaciones.length">
          <h3 class="mb-1 text-lg font-bold">Formación</h3>
          <div v-for="f in detalle.perfil.formaciones" :key="f.id" class="mb-1">
            <p class="font-semibold">{{ f.profesion.nombre }}</p>
            <p class="text-roca">{{ f.institucion }}, {{ f.anioTitulacion }}. Título {{ f.nroTituloNacional }}</p>
          </div>
        </div>
        <div v-if="detalle.perfil.experiencias.length">
          <h3 class="mb-1 text-lg font-bold">Experiencia</h3>
          <div v-for="x in detalle.perfil.experiencias" :key="x.id" class="mb-2">
            <p class="font-semibold">{{ x.cargo }}, {{ x.empresa }}</p>
            <p class="text-roca">{{ plural(x.anios, 'año') }}</p>
            <TextoFormateado :texto="x.descripcion" />
          </div>
        </div>
        <div v-if="detalle.perfil.habilidades.length">
          <h3 class="mb-1 text-lg font-bold">Habilidades</h3>
          <ul class="flex flex-wrap gap-2">
            <li v-for="h in detalle.perfil.habilidades" :key="h.habilidad.id" class="rounded-full bg-salar px-3 py-1">{{ h.habilidad.nombre }}, {{ nombreNivel(h.nivel).toLowerCase() }}</li>
          </ul>
        </div>
        <div v-if="detalle.perfil.idiomas.length">
          <h3 class="mb-1 text-lg font-bold">Idiomas</h3>
          <p>{{ detalle.perfil.idiomas.map((i) => `${i.nombre} (${i.nivel})`).join(', ') }}</p>
        </div>

        <div v-if="siguiente" class="sticky bottom-0 -mx-4 flex gap-2 border-t border-linea bg-white px-4 py-3">
          <AccionBoton variante="peligro" @click="rechazar">No seleccionar</AccionBoton>
          <AccionBoton variante="primario" class="flex-1" @click="cambiar(siguiente!.estado, `Postulante actualizado: ${siguiente!.texto.toLowerCase()}`)">{{ siguiente.texto }}</AccionBoton>
        </div>
      </div>
    </HojaInferior>
  </section>
</template>
