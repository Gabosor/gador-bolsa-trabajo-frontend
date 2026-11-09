<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Building2, ChevronRight, FileText } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Empresa, EstadoEmpresa, Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import { useAvisosStore } from '@/stores/avisos'
import { pedirTexto } from '@/utils/confirmar'

const FILTROS: { valor: EstadoEmpresa; texto: string }[] = [
  { valor: 'PENDIENTE_VALIDACION', texto: 'Pendientes' },
  { valor: 'APROBADA', texto: 'Aprobadas' },
  { valor: 'RECHAZADA', texto: 'Rechazadas' },
  { valor: 'SUSPENDIDA', texto: 'Suspendidas' },
]

const avisos = useAvisosStore()
const filtro = ref<EstadoEmpresa>('PENDIENTE_VALIDACION')
const empresas = ref<Empresa[]>([])
const detalle = ref<Empresa | null>(null)
const error = ref('')
const cargada = ref(false)

const hojaAbierta = computed({
  get: () => detalle.value !== null,
  set: (valor) => {
    if (!valor) detalle.value = null
  },
})

async function cargar() {
  error.value = ''
  cargada.value = false
  try {
    const r = await api<Paginado<Empresa>>('/empresas', { query: { estado: filtro.value, limit: 100 } })
    empresas.value = r.data
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

async function abrir(e: Empresa) {
  try {
    detalle.value = await api<Empresa>(`/empresas/${e.id}`)
  } catch (err) {
    avisos.error(mensajeError(err))
  }
}

async function cambiar(empresa: Empresa, estado: EstadoEmpresa, mensaje: string, motivo?: string) {
  try {
    await api(`/empresas/${empresa.id}/estado`, { method: 'PATCH', body: { estado, motivo } })
    detalle.value = null
    avisos.exito(mensaje)
    await cargar()
  } catch (e) {
    avisos.error(mensajeError(e))
  }
}

async function conMotivo(estado: EstadoEmpresa, titulo: string, accion: string, mensaje: string) {
  const empresa = detalle.value
  if (!empresa) return
  detalle.value = null
  const motivo = await pedirTexto({
    titulo,
    mensaje: empresa.razonSocial,
    accion,
    peligro: true,
    campo: { etiqueta: 'Motivo para la empresa', multilinea: true },
  })
  if (motivo === null) detalle.value = empresa
  else await cambiar(empresa, estado, mensaje, motivo)
}

onMounted(cargar)
watch(filtro, cargar)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="titulo-pagina mb-3">Validación de empresas</h1>
    <div class="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
      <button
        v-for="f in FILTROS"
        :key="f.valor"
        type="button"
        class="min-h-11 shrink-0 rounded-full border px-3.5"
        :class="filtro === f.valor ? 'border-guinda-700 bg-guinda-700 font-semibold text-white' : 'border-roca bg-white'"
        :aria-pressed="filtro === f.valor"
        @click="filtro = f.valor"
      >
        {{ f.texto }}
      </button>
    </div>

    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="empresas.length === 0 && !error" :icono="Building2" titulo="No hay empresas en este estado" />
    <ul v-else class="plano divide-y divide-linea overflow-hidden">
      <li v-for="e in empresas" :key="e.id">
        <button type="button" class="flex min-h-16 w-full items-center gap-3 p-3 text-left hover:bg-guinda-50/50" @click="abrir(e)">
          <span class="min-w-0 flex-1">
            <span class="block font-semibold break-words">{{ e.razonSocial }}</span>
            <span class="block text-base text-roca">NIT {{ e.nit }}, {{ e.rubro.nombre }}</span>
          </span>
          <ChevronRight class="size-5 shrink-0 text-roca" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <HojaInferior v-model="hojaAbierta" :titulo="detalle?.razonSocial ?? 'Empresa'">
      <div v-if="detalle" class="space-y-4">
        <EstadoBadge :estado="detalle.estado" />
        <p v-if="detalle.motivoRechazo" class="rounded-campo bg-error-50 p-3 text-error"><strong>Motivo:</strong> {{ detalle.motivoRechazo }}</p>
        <dl class="space-y-2">
          <div><dt class="text-base text-roca">NIT</dt><dd>{{ detalle.nit }}</dd></div>
          <div><dt class="text-base text-roca">Rubro</dt><dd>{{ detalle.rubro.nombre }}</dd></div>
          <div><dt class="text-base text-roca">Representante legal</dt><dd>{{ detalle.representanteLegal }}, CI {{ detalle.ciRepresentante }}</dd></div>
          <div><dt class="text-base text-roca">Celular</dt><dd>{{ detalle.celular }}</dd></div>
          <div><dt class="text-base text-roca">Correo</dt><dd class="break-all">{{ detalle.emailCorporativo }}</dd></div>
          <div><dt class="text-base text-roca">Dirección</dt><dd>{{ detalle.direccion }}</dd></div>
          <div><dt class="text-base text-roca">Descripción</dt><dd class="break-words whitespace-pre-line">{{ detalle.descripcion }}</dd></div>
        </dl>
        <div class="flex flex-col gap-2">
          <a v-if="detalle.documentoNitUrl" :href="detalle.documentoNitUrl" target="_blank" rel="noopener" class="flex min-h-12 items-center gap-2 rounded-campo border border-roca px-3 font-semibold"><FileText class="size-5" aria-hidden="true" />Ver documento NIT</a>
          <a v-if="detalle.documentoLegalUrl" :href="detalle.documentoLegalUrl" target="_blank" rel="noopener" class="flex min-h-12 items-center gap-2 rounded-campo border border-roca px-3 font-semibold"><FileText class="size-5" aria-hidden="true" />Ver respaldo legal</a>
        </div>
        <div class="sticky bottom-0 -mx-4 flex gap-2 border-t border-linea bg-white px-4 py-3">
          <AccionBoton v-if="detalle.estado === 'PENDIENTE_VALIDACION'" variante="peligro" @click="conMotivo('RECHAZADA', 'Rechazar empresa', 'Rechazar', 'Empresa rechazada')">Rechazar</AccionBoton>
          <AccionBoton v-if="detalle.estado === 'APROBADA'" variante="peligro" class="flex-1" @click="conMotivo('SUSPENDIDA', 'Suspender empresa', 'Suspender', 'Empresa suspendida')">Suspender</AccionBoton>
          <AccionBoton v-if="detalle.estado !== 'APROBADA'" variante="primario" class="flex-1" @click="cambiar(detalle!, 'APROBADA', 'Empresa aprobada')">Aprobar</AccionBoton>
        </div>
      </div>
    </HojaInferior>
  </section>
</template>
