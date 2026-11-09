<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleAlert, ClipboardList, Ellipsis, Eye, Plus, Users } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Empresa, EstadoOferta, Oferta, Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import Faja from '@/components/Faja.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import { useAvisosStore } from '@/stores/avisos'
import { confirmar } from '@/utils/confirmar'
import { ETAPAS_OFERTA, fecha } from '@/utils/formato'

interface Accion {
  texto: string
  peligro?: boolean
  hacer: () => void
}

const router = useRouter()
const avisos = useAvisosStore()
const empresa = ref<Empresa | null>(null)
const ofertas = ref<Oferta[]>([])
const cupo = ref<{ activas: number; limite: number } | null>(null)
const error = ref('')
const cargada = ref(false)
const menuDe = ref<Oferta | null>(null)

const menuAbierto = computed({
  get: () => menuDe.value !== null,
  set: (valor) => {
    if (!valor) menuDe.value = null
  },
})
const cupoLleno = computed(() => cupo.value !== null && cupo.value.activas >= cupo.value.limite)

async function cargar() {
  error.value = ''
  try {
    const [miEmpresa, lista] = await Promise.all([
      api<Empresa>('/empresas/mi-empresa'),
      api<Paginado<Oferta> & { cupo: { activas: number; limite: number } }>('/ofertas/mias', { query: { limit: 100 } }),
    ])
    empresa.value = miEmpresa
    ofertas.value = lista.data
    cupo.value = lista.cupo
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

async function ejecutar(accion: () => Promise<unknown>, mensaje: string) {
  menuDe.value = null
  try {
    await accion()
    avisos.exito(mensaje)
    await cargar()
  } catch (e) {
    avisos.error(mensajeError(e))
  }
}

const cambiar = (o: Oferta, estado: EstadoOferta, mensaje: string) =>
  ejecutar(() => api(`/ofertas/${o.id}/estado`, { method: 'PATCH', body: { estado } }), mensaje)

async function confirmarYCambiar(o: Oferta, estado: EstadoOferta, titulo: string, detalle: string, accion: string, mensaje: string) {
  menuDe.value = null
  if (await confirmar({ titulo, mensaje: detalle, accion, peligro: true })) cambiar(o, estado, mensaje)
}

async function eliminar(o: Oferta) {
  menuDe.value = null
  const ok = await confirmar({ titulo: 'Eliminar borrador', mensaje: `Se eliminará "${o.titulo}".`, accion: 'Eliminar', peligro: true })
  if (ok) ejecutar(() => api(`/ofertas/${o.id}`, { method: 'DELETE' }), 'Borrador eliminado')
}

/** La primera acción es la principal de cada estado; el resto va en el menú. */
function acciones(o: Oferta): Accion[] {
  const verPostulantes: Accion = { texto: 'Ver postulantes', hacer: () => router.push(`/empresa/ofertas/${o.id}/postulantes`) }
  const duplicar: Accion = { texto: 'Duplicar', hacer: () => ejecutar(() => api(`/ofertas/${o.id}/duplicar`, { method: 'POST' }), 'Oferta duplicada como borrador') }
  const cerrar: Accion = { texto: 'Cerrar oferta', hacer: () => confirmarYCambiar(o, 'CERRADA', 'Cerrar oferta', `"${o.titulo}" dejará de recibir postulantes.`, 'Cerrar', 'Oferta cerrada') }
  const anular: Accion = { texto: 'Anular', peligro: true, hacer: () => confirmarYCambiar(o, 'ANULADA', 'Anular oferta', `"${o.titulo}" se anulará y no se puede deshacer.`, 'Anular', 'Oferta anulada') }

  switch (o.estado) {
    case 'BORRADOR':
      return [
        { texto: 'Enviar a revisión', hacer: () => cambiar(o, 'EN_REVISION_GADOR', 'Oferta enviada a revisión de GADOR') },
        { texto: 'Editar', hacer: () => router.push(`/empresa/ofertas/${o.id}/editar`) },
        { texto: 'Eliminar', peligro: true, hacer: () => eliminar(o) },
      ]
    case 'EN_REVISION_GADOR':
      return [duplicar, anular]
    case 'PUBLICADA':
      return [verPostulantes, { texto: 'Iniciar selección', hacer: () => cambiar(o, 'EN_PROCESO_SELECCION', 'Selección iniciada') }, cerrar, duplicar, anular]
    case 'EN_PROCESO_SELECCION':
      return [verPostulantes, cerrar, duplicar, anular]
    default:
      return [verPostulantes, duplicar]
  }
}

const etapa = (o: Oferta) => ETAPAS_OFERTA.indexOf(o.estado) + 1

onMounted(cargar)
</script>

<template>
  <section>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="titulo-pagina">Mis ofertas</h1>
        <p v-if="cupo" class="text-roca">{{ cupo.activas }} de {{ cupo.limite }} ofertas activas</p>
      </div>
      <RouterLink v-if="empresa?.estado === 'APROBADA' && !cupoLleno" to="/empresa/ofertas/nueva" class="hidden min-h-12 items-center gap-1.5 rounded-campo bg-guinda-700 px-4 font-semibold text-white hover:bg-guinda-800 lg:flex">
        <Plus class="size-5" aria-hidden="true" />Nueva oferta
      </RouterLink>
    </div>

    <div v-if="empresa && empresa.estado !== 'APROBADA'" class="mb-4 rounded-campo bg-alerta-50 p-4">
      <p class="mb-1 flex flex-wrap items-center gap-2 font-semibold">Estado de tu empresa: <EstadoBadge :estado="empresa.estado" /></p>
      <p>Solo las empresas aprobadas por GADOR pueden publicar ofertas.</p>
      <p v-if="empresa.motivoRechazo" class="mt-1"><strong>Motivo:</strong> {{ empresa.motivoRechazo }}</p>
    </div>

    <p v-if="cupoLleno" class="mb-4 rounded-campo bg-alerta-50 p-3 text-alerta">Alcanzaste el límite de ofertas activas. Cierra una para enviar otra a revisión.</p>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>

    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="ofertas.length === 0 && !error" :icono="ClipboardList" titulo="Todavía no tienes ofertas" texto="Crea un borrador y envíalo a revisión de GADOR para publicarlo.">
      <RouterLink v-if="empresa?.estado === 'APROBADA'" to="/empresa/ofertas/nueva"><AccionBoton variante="primario">Crear oferta</AccionBoton></RouterLink>
    </EstadoVacio>

    <!-- Móvil y tableta: filas apiladas, sin deslizar. -->
    <ul class="space-y-3 lg:hidden">
      <li v-for="o in ofertas" :key="o.id" class="plano p-4">
        <div class="flex items-start justify-between gap-2">
          <h2 class="min-w-0 text-lg font-bold break-words text-guinda-900">{{ o.titulo }}</h2>
          <EstadoBadge :estado="o.estado" />
        </div>
        <p class="mt-1 text-roca">Cierra el {{ fecha(o.fechaCierre) }}</p>
        <p v-if="o.motivoRechazo" class="mt-2 flex items-start gap-1 text-error"><CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />GADOR: {{ o.motivoRechazo }}</p>
        <div v-if="etapa(o)" class="mt-3"><Faja :total="ETAPAS_OFERTA.length" :completos="etapa(o)" :etiqueta="`Etapa ${etapa(o)} de ${ETAPAS_OFERTA.length}`" /></div>
        <p class="mt-3 flex gap-5">
          <span class="flex items-center gap-1"><Eye class="size-4 text-roca" aria-hidden="true" />{{ o.totalVistas }} vistas</span>
          <span class="flex items-center gap-1"><Users class="size-4 text-roca" aria-hidden="true" />{{ o.totalPostulantes }} postulantes</span>
        </p>
        <div class="mt-3 flex gap-2">
          <AccionBoton variante="primario" class="flex-1" @click="acciones(o)[0]!.hacer()">{{ acciones(o)[0]!.texto }}</AccionBoton>
          <AccionBoton v-if="acciones(o).length > 1" :aria-label="`Más acciones de ${o.titulo}`" @click="menuDe = o"><Ellipsis class="size-5" aria-hidden="true" /></AccionBoton>
        </div>
      </li>
    </ul>

    <!-- Escritorio: tabla de RF09. -->
    <div v-if="ofertas.length" class="plano hidden overflow-hidden lg:block">
      <table class="w-full text-left">
        <thead class="bg-salar">
          <tr>
            <th class="p-3 font-semibold">Oferta</th>
            <th class="p-3 font-semibold">Estado</th>
            <th class="p-3 text-right font-semibold">Vistas</th>
            <th class="p-3 text-right font-semibold">Postulantes</th>
            <th class="p-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in ofertas" :key="o.id" class="border-t border-linea align-top">
            <td class="p-3">
              <p class="font-semibold">{{ o.titulo }}</p>
              <p class="text-base text-roca">Cierra el {{ fecha(o.fechaCierre) }}</p>
              <p v-if="o.motivoRechazo" class="mt-1 text-base text-error">GADOR: {{ o.motivoRechazo }}</p>
            </td>
            <td class="p-3"><EstadoBadge :estado="o.estado" /></td>
            <td class="p-3 text-right tabular-nums">{{ o.totalVistas }}</td>
            <td class="p-3 text-right tabular-nums">{{ o.totalPostulantes }}</td>
            <td class="p-3">
              <div class="flex justify-end gap-2">
                <AccionBoton @click="acciones(o)[0]!.hacer()">{{ acciones(o)[0]!.texto }}</AccionBoton>
                <AccionBoton v-if="acciones(o).length > 1" :aria-label="`Más acciones de ${o.titulo}`" @click="menuDe = o"><Ellipsis class="size-5" aria-hidden="true" /></AccionBoton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <HojaInferior v-model="menuAbierto" :titulo="menuDe?.titulo ?? ''">
      <div v-if="menuDe" class="space-y-1">
        <button
          v-for="a in acciones(menuDe).slice(1)"
          :key="a.texto"
          type="button"
          class="flex min-h-12 w-full items-center rounded-campo px-3 text-left font-semibold"
          :class="a.peligro ? 'text-error hover:bg-error-50' : 'hover:bg-salar'"
          @click="a.hacer()"
        >
          {{ a.texto }}
        </button>
      </div>
    </HojaInferior>
  </section>
</template>
