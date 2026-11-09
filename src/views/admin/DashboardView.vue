<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'
import { ChevronRight } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import Esqueleto from '@/components/Esqueleto.vue'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip)
ChartJS.defaults.font.family = "'Atkinson Hyperlegible Next Variable', sans-serif"
ChartJS.defaults.font.size = 14
ChartJS.defaults.color = '#5c6670'

interface Conteo {
  nombre: string
  total: number
}

interface Resumen {
  totalPostulantes: number
  empresasValidadas: number
  empresasPendientes: number
  ofertasActivas: number
  ofertasPublicadasMes: number
  ofertasCerradasMes: number
  totalPostulaciones: number
  totalContratados: number
  tasaContratacion: number
  postulacionesPorMes: { mes: string; total: number }[]
  postulantesPorProfesion: Conteo[]
  empresasPorRubro: Conteo[]
}

const ACTUALIZAR_CADA_MS = 30_000
const GUINDA = '#73141f'
/** Orden fijo, validado para daltonismo. Desde la novena categoría se agrupa. */
const COLORES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']

const resumen = ref<Resumen | null>(null)
const error = ref('')
let temporizador: ReturnType<typeof setInterval> | undefined

async function cargar() {
  try {
    resumen.value = await api<Resumen>('/dashboard')
    error.value = ''
  } catch (e) {
    error.value = mensajeError(e)
  }
}

onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, ACTUALIZAR_CADA_MS)
})
onUnmounted(() => clearInterval(temporizador))

const tarjetas = computed(() => {
  const r = resumen.value
  if (!r) return []
  return [
    { texto: 'Postulantes registrados', valor: r.totalPostulantes },
    { texto: 'Empresas validadas', valor: r.empresasValidadas },
    { texto: 'Empresas pendientes', valor: r.empresasPendientes },
    { texto: 'Ofertas activas', valor: r.ofertasActivas },
    { texto: 'Publicadas este mes', valor: r.ofertasPublicadasMes },
    { texto: 'Cerradas este mes', valor: r.ofertasCerradasMes },
    { texto: 'Tasa de contratación', valor: `${r.tasaContratacion} %`, ayuda: `${r.totalContratados} de ${r.totalPostulaciones} postulaciones` },
  ]
})

function nombreMes(mes: string) {
  const [anio, numero] = mes.split('-').map(Number)
  return new Date(anio!, numero! - 1).toLocaleDateString('es-BO', { month: 'short', year: '2-digit' })
}

/** Una torta legible admite 8 porciones; el resto va a "Otras". */
const profesiones = computed<Conteo[]>(() => {
  const lista = resumen.value?.postulantesPorProfesion ?? []
  if (lista.length <= COLORES.length) return lista
  const principales = lista.slice(0, COLORES.length - 1)
  const total = lista.slice(COLORES.length - 1).reduce((s, p) => s + p.total, 0)
  return [...principales, { nombre: 'Otras', total }]
})

const datosMes = computed(() => ({
  labels: (resumen.value?.postulacionesPorMes ?? []).map((m) => nombreMes(m.mes)),
  datasets: [
    {
      label: 'Postulaciones',
      data: (resumen.value?.postulacionesPorMes ?? []).map((m) => m.total),
      backgroundColor: GUINDA,
      borderRadius: 4,
      maxBarThickness: 28,
    },
  ],
}))

const datosProfesion = computed(() => ({
  labels: profesiones.value.map((p) => p.nombre),
  datasets: [
    {
      data: profesiones.value.map((p) => p.total),
      backgroundColor: COLORES,
      borderColor: '#ffffff',
      borderWidth: 2,
    },
  ],
}))

const datosRubro = computed(() => ({
  labels: (resumen.value?.empresasPorRubro ?? []).map((r) => r.nombre),
  datasets: [
    {
      label: 'Empresas',
      data: (resumen.value?.empresasPorRubro ?? []).map((r) => r.total),
      backgroundColor: GUINDA,
      borderRadius: 4,
      maxBarThickness: 24,
    },
  ],
}))

const ejes = {
  grid: { color: '#d9dee2' },
  border: { display: false },
  beginAtZero: true,
  ticks: { precision: 0 },
}
const sinRejilla = { grid: { display: false }, border: { display: false } }
const base = { responsive: true, maintainAspectRatio: false, animation: false as const }

const opcionesMes = { ...base, plugins: { legend: { display: false } }, scales: { x: sinRejilla, y: ejes } }
const opcionesRubro = { ...base, indexAxis: 'y' as const, plugins: { legend: { display: false } }, scales: { x: ejes, y: sinRejilla } }
const opcionesProfesion = { ...base, plugins: { legend: { position: 'bottom' as const } } }
</script>

<template>
  <section>
    <h1 class="titulo-pagina">Panel GADOR</h1>
    <p class="mb-4 text-roca">Se actualiza cada 30 segundos.</p>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>

    <Esqueleto v-if="!resumen && !error" />
    <div v-if="resumen" class="space-y-6">
      <RouterLink
        v-if="resumen.empresasPendientes"
        to="/admin/empresas"
        class="flex min-h-12 items-center justify-between gap-3 rounded-campo bg-alerta-50 p-3 font-semibold text-alerta"
      >
        {{ resumen.empresasPendientes }} {{ resumen.empresasPendientes === 1 ? 'empresa espera' : 'empresas esperan' }} validación
        <ChevronRight class="size-5 shrink-0" aria-hidden="true" />
      </RouterLink>

      <dl class="plano grid grid-cols-2 gap-px overflow-hidden bg-linea md:grid-cols-4">
        <div v-for="t in tarjetas" :key="t.texto" class="bg-white p-4 last:col-span-2">
          <dt class="text-roca">{{ t.texto }}</dt>
          <dd class="font-titulo text-[2rem] leading-tight font-bold text-guinda-900 tabular-nums">{{ t.valor }}</dd>
          <dd v-if="t.ayuda" class="text-base text-roca">{{ t.ayuda }}</dd>
        </div>
      </dl>

      <div class="plano p-4">
        <h2 class="mb-3 text-xl font-bold">Postulaciones por mes</h2>
        <div class="relative h-64"><Bar :data="datosMes" :options="opcionesMes" aria-label="Gráfico de barras de postulaciones por mes" /></div>
        <details class="mt-3 text-sm">
          <summary class="cursor-pointer font-medium">Ver como tabla</summary>
          <table class="mt-2 w-full">
            <tbody>
              <tr v-for="m in resumen.postulacionesPorMes" :key="m.mes" class="border-t border-linea">
                <td class="py-1">{{ nombreMes(m.mes) }}</td>
                <td class="py-1 text-right tabular-nums">{{ m.total }}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="plano p-4">
          <h2 class="mb-3 text-xl font-bold">Postulantes por profesión</h2>
          <div class="relative h-80"><Pie :data="datosProfesion" :options="opcionesProfesion" aria-label="Gráfico de torta de postulantes por profesión" /></div>
          <details class="mt-3 text-sm">
            <summary class="cursor-pointer font-medium">Ver como tabla</summary>
            <table class="mt-2 w-full">
              <tbody>
                <tr v-for="p in profesiones" :key="p.nombre" class="border-t border-linea">
                  <td class="py-1">{{ p.nombre }}</td>
                  <td class="py-1 text-right tabular-nums">{{ p.total }}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </div>

        <div class="plano p-4">
          <h2 class="mb-3 text-xl font-bold">Empresas por rubro</h2>
          <div class="relative h-80"><Bar :data="datosRubro" :options="opcionesRubro" aria-label="Gráfico de barras de empresas por rubro" /></div>
          <details class="mt-3 text-sm">
            <summary class="cursor-pointer font-medium">Ver como tabla</summary>
            <table class="mt-2 w-full">
              <tbody>
                <tr v-for="r in resumen.empresasPorRubro" :key="r.nombre" class="border-t border-linea">
                  <td class="py-1">{{ r.nombre }}</td>
                  <td class="py-1 text-right tabular-nums">{{ r.total }}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </div>
      </div>
    </div>
  </section>
</template>
