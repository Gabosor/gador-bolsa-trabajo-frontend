<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CircleAlert,
  FileSearch,
  Heart,
  MapPin,
  Minus,
  Monitor,
  Share2,
  Users,
} from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Compatibilidad, Oferta } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import LogoEmpresa from '@/components/LogoEmpresa.vue'
import TarjetaOferta from '@/components/TarjetaOferta.vue'
import TextoFormateado from '@/components/TextoFormateado.vue'
import { useAuthStore } from '@/stores/auth'
import { useAvisosStore } from '@/stores/avisos'
import { useInteraccionesStore } from '@/stores/interacciones'
import { nombreNivel, plural, salario, textoCierre } from '@/utils/formato'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const avisos = useAvisosStore()
const interacciones = useInteraccionesStore()
const id = Number(route.params.id)

const oferta = ref<Oferta | null>(null)
const compatibilidad = ref<Compatibilidad | null>(null)
const similares = ref<Oferta[]>([])
const errorCarga = ref('')
const errorPostular = ref('')
const cargando = ref(false)

const esPostulante = computed(() => auth.usuario?.rol === 'POSTULANTE')
const esInvitado = computed(() => !auth.usuario)
const guardada = computed(() => interacciones.favoritos.has(id))
const estadoPostulacion = computed(() => interacciones.postulaciones.get(id))

const cumple = (habilidadId: number) => compatibilidad.value?.habilidades.find((h) => h.habilidadId === habilidadId)

onMounted(async () => {
  try {
    oferta.value = await api<Oferta>(`/ofertas/${id}`)
  } catch (e) {
    errorCarga.value = mensajeError(e)
    return
  }
  api<Oferta[]>(`/ofertas/${id}/similares`).then((r) => (similares.value = r)).catch(() => undefined)
  if (esPostulante.value) {
    api<Compatibilidad>(`/postulaciones/compatibilidad/${id}`).then((r) => (compatibilidad.value = r)).catch(() => undefined)
  }
})

async function postular() {
  if (!auth.usuario) {
    await router.push({ name: 'login', query: { volver: route.fullPath } })
    return
  }
  errorPostular.value = ''
  cargando.value = true
  try {
    const r = await api<{ porcentajeMatch: number; estado: string }>(`/postulaciones/oferta/${id}`, { method: 'POST' })
    interacciones.registrarPostulacion(id, r.estado)
    avisos.exito(`Postulación enviada. Tu compatibilidad es de ${r.porcentajeMatch} %.`)
  } catch (e) {
    errorPostular.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}

async function compartir() {
  if (!oferta.value) return
  const texto = `${oferta.value.titulo}, en la Bolsa de Trabajo de la Gobernación de Oruro`
  const url = window.location.href
  if (navigator.share) {
    await navigator.share({ title: oferta.value.titulo, text: texto, url }).catch(() => undefined)
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texto}: ${url}`)}`, '_blank', 'noopener')
  }
}
</script>

<template>
  <section v-if="oferta" class="mx-auto max-w-3xl pb-24 lg:pb-0">
    <button type="button" class="enlace mb-3 inline-flex min-h-11 items-center gap-1 no-underline" @click="router.back()">
      <ArrowLeft class="size-5" aria-hidden="true" />Volver
    </button>

    <header class="plano p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-start gap-3">
          <LogoEmpresa v-if="oferta.empresa" :nombre="oferta.empresa.razonSocial" :url="oferta.empresa.logoUrl" />
          <div class="min-w-0">
            <h1 class="titulo-pagina break-words">{{ oferta.titulo }}</h1>
            <p class="mt-1 text-lg">{{ oferta.empresa?.razonSocial }}</p>
          </div>
        </div>
        <div class="flex shrink-0">
          <button type="button" class="flex size-11 items-center justify-center rounded-full hover:bg-salar" aria-label="Compartir oferta" @click="compartir">
            <Share2 class="size-5" aria-hidden="true" />
          </button>
          <button v-if="esPostulante" type="button" class="flex size-11 items-center justify-center rounded-full hover:bg-salar" :aria-pressed="guardada" :aria-label="guardada ? 'Quitar de guardadas' : 'Guardar oferta'" @click="interacciones.alternarFavorito(id)">
            <Heart class="size-6" :class="guardada ? 'fill-oro text-oro' : 'text-roca'" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul class="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <li class="flex items-center gap-2"><Banknote class="size-5 shrink-0 text-roca" aria-hidden="true" />{{ salario(oferta) }}</li>
        <li class="flex items-center gap-2"><MapPin class="size-5 shrink-0 text-roca" aria-hidden="true" />{{ oferta.municipio.nombre }}</li>
        <li class="flex items-center gap-2"><Monitor class="size-5 shrink-0 text-roca" aria-hidden="true" />{{ oferta.modalidad.nombre }}</li>
        <li class="flex items-center gap-2"><BriefcaseBusiness class="size-5 shrink-0 text-roca" aria-hidden="true" />{{ oferta.tipoContrato.nombre }}, {{ plural(oferta.aniosExperiencia, 'año') }} de experiencia</li>
        <li class="flex items-center gap-2"><Users class="size-5 shrink-0 text-roca" aria-hidden="true" />{{ plural(oferta.numeroPlazas, 'plaza') }}</li>
        <li class="flex items-center gap-2"><CalendarClock class="size-5 shrink-0 text-roca" aria-hidden="true" />{{ textoCierre(oferta.fechaCierre) }}</li>
      </ul>

      <div v-if="compatibilidad && !estadoPostulacion" class="mt-4 flex items-center justify-between gap-3 border-t border-linea pt-3">
        <p class="font-semibold">Tu compatibilidad con esta oferta</p>
        <p class="font-titulo text-2xl font-bold text-guinda-900 tabular-nums">{{ compatibilidad.porcentaje }} %</p>
      </div>
    </header>

    <div class="plano mt-3 space-y-5 p-4">
      <div><h2 class="mb-1 text-xl font-bold">Descripción</h2><TextoFormateado :texto="oferta.descripcion" /></div>
      <div><h2 class="mb-1 text-xl font-bold">Requisitos obligatorios</h2><TextoFormateado :texto="oferta.requisitosObligatorios" /></div>
      <div v-if="oferta.requisitosDeseables"><h2 class="mb-1 text-xl font-bold">Requisitos deseables</h2><TextoFormateado :texto="oferta.requisitosDeseables" /></div>

      <div v-if="oferta.habilidades.length">
        <h2 class="mb-2 text-xl font-bold">Habilidades</h2>
        <ul class="divide-y divide-linea">
          <li v-for="h in oferta.habilidades" :key="h.habilidad.id" class="flex items-center gap-2 py-2">
            <template v-if="compatibilidad">
              <Check v-if="cumple(h.habilidad.id)?.cumple" class="size-5 shrink-0 text-exito" aria-label="Cumples este nivel" />
              <Minus v-else class="size-5 shrink-0 text-roca" aria-label="No alcanzas este nivel" />
            </template>
            <span class="min-w-0 flex-1 break-words font-semibold">{{ h.habilidad.nombre }}</span>
            <span class="text-right text-base text-roca">{{ nombreNivel(h.nivelMinimo) }}, {{ h.obligatoria ? 'obligatoria' : 'deseable' }}</span>
          </li>
        </ul>
      </div>

      <div><h2 class="mb-1 text-xl font-bold">Profesiones</h2><p>{{ oferta.profesiones.map((p) => p.nombre).join(', ') }}</p></div>
      <div v-if="oferta.beneficios"><h2 class="mb-1 text-xl font-bold">Beneficios</h2><TextoFormateado :texto="oferta.beneficios" /></div>
      <div v-if="oferta.empresa"><h2 class="mb-1 text-xl font-bold">Sobre la empresa</h2><TextoFormateado :texto="oferta.empresa.descripcion" /></div>
    </div>

    <div v-if="similares.length" class="mt-6">
      <h2 class="mb-2 text-xl font-bold">Ofertas parecidas</h2>
      <ul class="plano divide-y divide-linea overflow-hidden">
        <li v-for="o in similares" :key="o.id"><TarjetaOferta :oferta="o" /></li>
      </ul>
    </div>

    <!-- Acción principal según lo que el postulante puede hacer ahora. -->
    <div v-if="esInvitado || esPostulante" class="barra-accion lg:mt-4">
      <div class="mx-auto max-w-3xl">
        <p v-if="errorPostular" role="alert" class="mb-2 flex items-start gap-1 text-error"><CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ errorPostular }}</p>
        <div v-if="estadoPostulacion" class="flex items-center justify-between gap-3">
          <EstadoBadge :estado="estadoPostulacion" />
          <RouterLink to="/postulaciones" class="enlace inline-flex min-h-11 items-center">Ver mis postulaciones</RouterLink>
        </div>
        <div v-else-if="compatibilidad && !compatibilidad.puedePostular">
          <p class="mb-2 text-roca">Tu perfil está al {{ compatibilidad.porcentajePerfil }} %. Necesitas más del 80 % para postular.</p>
          <RouterLink to="/perfil" class="flex min-h-12 items-center justify-center rounded-campo bg-guinda-700 font-semibold text-white hover:bg-guinda-800">Completar mi perfil</RouterLink>
        </div>
        <BaseButton v-else type="button" :cargando="cargando" texto-cargando="Enviando…" @click="postular">
          {{ esInvitado ? 'Ingresar para postular' : 'Postular' }}
        </BaseButton>
      </div>
    </div>
  </section>

  <EstadoVacio v-else-if="errorCarga" :icono="FileSearch" titulo="Esta oferta ya no está disponible" :texto="errorCarga">
    <RouterLink to="/ofertas"><AccionBoton variante="primario">Ver otras ofertas</AccionBoton></RouterLink>
  </EstadoVacio>
  <div v-else class="mx-auto max-w-3xl"><Esqueleto :filas="3" /></div>
</template>
