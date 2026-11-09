<script setup lang="ts">
import { ref } from 'vue'
import { FileSpreadsheet, FileText, LoaderCircle } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseInput from '@/components/BaseInput.vue'
import { useAvisosStore } from '@/stores/avisos'

const REPORTES = [
  { tipo: 'empresas', titulo: 'Empresas', detalle: 'NIT, razón social, rubro y estado' },
  { tipo: 'postulantes', titulo: 'Postulantes', detalle: 'CI, nombre, profesión y celular' },
  { tipo: 'ofertas', titulo: 'Ofertas por fecha', detalle: 'Filtrable por fecha de creación' },
  { tipo: 'contrataciones', titulo: 'Contrataciones por empresa', detalle: 'Postulaciones y contratados' },
]

const avisos = useAvisosStore()
const desde = ref('')
const hasta = ref('')
const generando = ref('')

async function descargar(tipo: string, formato: 'excel' | 'pdf') {
  generando.value = `${tipo}-${formato}`
  try {
    const archivo = await api<Blob, 'blob'>(`/reportes/${tipo}`, {
      responseType: 'blob',
      query: {
        formato,
        desde: tipo === 'ofertas' && desde.value ? desde.value : undefined,
        hasta: tipo === 'ofertas' && hasta.value ? hasta.value : undefined,
      },
    })
    const url = URL.createObjectURL(archivo)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `reporte-${tipo}.${formato === 'excel' ? 'xlsx' : 'pdf'}`
    enlace.click()
    URL.revokeObjectURL(url)
    avisos.exito('Reporte descargado')
  } catch (e) {
    avisos.error(mensajeError(e))
  } finally {
    generando.value = ''
  }
}
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="titulo-pagina mb-3">Reportes</h1>
    <ul class="plano divide-y divide-linea">
      <li v-for="r in REPORTES" :key="r.tipo" class="p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold">{{ r.titulo }}</h2>
            <p class="text-roca">{{ r.detalle }}</p>
          </div>
          <div class="flex gap-2">
            <AccionBoton :disabled="generando !== ''" @click="descargar(r.tipo, 'excel')">
              <component :is="generando === `${r.tipo}-excel` ? LoaderCircle : FileSpreadsheet" class="size-5" :class="{ 'animate-spin': generando === `${r.tipo}-excel` }" aria-hidden="true" />Excel
            </AccionBoton>
            <AccionBoton :disabled="generando !== ''" @click="descargar(r.tipo, 'pdf')">
              <component :is="generando === `${r.tipo}-pdf` ? LoaderCircle : FileText" class="size-5" :class="{ 'animate-spin': generando === `${r.tipo}-pdf` }" aria-hidden="true" />PDF
            </AccionBoton>
          </div>
        </div>
        <div v-if="r.tipo === 'ofertas'" class="mt-3 grid gap-3 sm:grid-cols-2">
          <BaseInput v-model="desde" label="Desde" type="date" opcional />
          <BaseInput v-model="hasta" label="Hasta" type="date" opcional />
        </div>
      </li>
    </ul>
  </section>
</template>
