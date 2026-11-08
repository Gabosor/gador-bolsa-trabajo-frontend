<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, mensajeError } from '@/api'
import type { Perfil } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'

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
const NIVELES = ['', 'Básico', 'Intermedio', 'Avanzado']

const route = useRoute()
const id = route.params.id as string
const titulo = ref('')
const fichas = ref<Ficha[]>([])
const detalle = ref<Detalle | null>(null)
const error = ref('')
const cargada = ref(false)

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
  error.value = ''
  try {
    detalle.value = await api<Detalle>(`/postulaciones/${f.id}/perfil`)
    await cargar()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    error.value = mensajeError(e)
  }
}

async function cambiar(estado: string) {
  if (!detalle.value) return
  if (estado === 'RECHAZADO' && !confirm('¿Rechazar a este postulante? No se puede deshacer.')) return
  error.value = ''
  try {
    await api(`/postulaciones/${detalle.value.postulacion.id}/estado`, {
      method: 'PATCH',
      body: { estado },
    })
    detalle.value.postulacion.estado = estado
    await cargar()
  } catch (e) {
    error.value = mensajeError(e)
  }
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <RouterLink to="/empresa/ofertas" class="text-sm font-medium text-guinda-700 underline">Volver a mis ofertas</RouterLink>
    <h1 class="mt-2 mb-1 text-2xl font-semibold break-words text-guinda-900">Postulantes</h1>
    <p class="mb-4 text-stone-700">{{ titulo }}</p>
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>

    <div v-if="detalle" class="mb-6 rounded-md border border-stone-300 bg-white p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="detalle.perfil.fotoUrl" :src="detalle.perfil.fotoUrl" alt="" class="size-16 rounded-full object-cover" />
          <div class="min-w-0">
            <h2 class="text-lg font-semibold break-words">{{ detalle.perfil.user.nombreCompleto }}</h2>
            <p class="text-sm break-words text-stone-600">{{ detalle.perfil.user.celular }} · {{ detalle.perfil.user.email }}</p>
            <p class="text-sm font-medium">Compatibilidad: {{ detalle.postulacion.porcentajeMatch }} %</p>
          </div>
        </div>
        <EstadoBadge :estado="detalle.postulacion.estado" />
      </div>

      <div class="mt-4 space-y-3 text-sm">
        <div>
          <h3 class="font-semibold">Formación</h3>
          <p v-for="f in detalle.perfil.formaciones" :key="f.id">
            {{ f.profesion.nombre }} · {{ f.institucion }} ({{ f.anioTitulacion }}) · Título {{ f.nroTituloNacional }}
          </p>
        </div>
        <div v-if="detalle.perfil.experiencias.length">
          <h3 class="font-semibold">Experiencia</h3>
          <p v-for="x in detalle.perfil.experiencias" :key="x.id">
            {{ x.cargo }} en {{ x.empresa }} · {{ x.anios }} año(s). {{ x.descripcion }}
          </p>
        </div>
        <div>
          <h3 class="font-semibold">Habilidades</h3>
          <p>{{ detalle.perfil.habilidades.map((h) => `${h.habilidad.nombre} (${NIVELES[h.nivel]})`).join(', ') }}</p>
        </div>
        <div v-if="detalle.perfil.idiomas.length">
          <h3 class="font-semibold">Idiomas</h3>
          <p>{{ detalle.perfil.idiomas.map((i) => `${i.nombre} (${i.nivel})`).join(', ') }}</p>
        </div>
        <a v-if="detalle.perfil.cvUrl" :href="detalle.perfil.cvUrl" target="_blank" rel="noopener" class="inline-block font-medium text-guinda-700 underline">
          Descargar CV en PDF
        </a>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <AccionBoton v-if="SIGUIENTE[detalle.postulacion.estado]" @click="cambiar(SIGUIENTE[detalle.postulacion.estado]!.estado)">
          {{ SIGUIENTE[detalle.postulacion.estado]!.texto }}
        </AccionBoton>
        <AccionBoton v-if="SIGUIENTE[detalle.postulacion.estado]" @click="cambiar('RECHAZADO')">Rechazar</AccionBoton>
        <AccionBoton @click="detalle = null">Cerrar</AccionBoton>
      </div>
    </div>

    <p v-if="cargada && fichas.length === 0 && !error" class="text-stone-700">Aún no hay postulantes.</p>
    <ul class="space-y-2">
      <li v-for="f in fichas" :key="f.id" class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-200 bg-white p-3">
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="f.fotoUrl" :src="f.fotoUrl" alt="" class="size-12 rounded-full object-cover" />
          <div class="min-w-0">
            <p class="font-medium break-words">{{ f.nombre }}</p>
            <p class="text-xs text-stone-600">{{ f.profesion ?? 'Sin profesión registrada' }} · {{ f.aniosExperiencia }} año(s) de experiencia</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-semibold">{{ f.porcentajeMatch }} %</span>
          <EstadoBadge :estado="f.estado" />
          <AccionBoton @click="abrir(f)">Ver perfil</AccionBoton>
        </div>
      </li>
    </ul>
  </section>
</template>
