<script setup lang="ts">
import { ref } from 'vue'
import { api, mensajeError } from '@/api'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseInput from '@/components/BaseInput.vue'

const REPORTES = [
  { tipo: 'empresas', titulo: 'Empresas', detalle: 'NIT, razón social, rubro y estado' },
  { tipo: 'postulantes', titulo: 'Postulantes', detalle: 'CI, nombre, profesión y celular' },
  { tipo: 'ofertas', titulo: 'Ofertas por fecha', detalle: 'Filtrable por fecha de creación' },
  { tipo: 'contrataciones', titulo: 'Contrataciones por empresa', detalle: 'Postulaciones y contratados' },
]

const desde = ref('')
const hasta = ref('')
const error = ref('')
const generando = ref('')

async function descargar(tipo: string, formato: 'excel' | 'pdf') {
  error.value = ''
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
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    generando.value = ''
  }
}
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="mb-4 text-2xl font-semibold text-guinda-900">Reportes</h1>
    <p v-if="error" role="alert" class="mb-4 text-sm text-red-700">{{ error }}</p>
    <ul class="space-y-3">
      <li v-for="r in REPORTES" :key="r.tipo" class="rounded-md border border-stone-200 bg-white p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold">{{ r.titulo }}</h2>
            <p class="text-sm text-stone-600">{{ r.detalle }}</p>
          </div>
          <div class="flex gap-2">
            <AccionBoton :disabled="generando !== ''" @click="descargar(r.tipo, 'excel')">
              {{ generando === `${r.tipo}-excel` ? 'Generando…' : 'Excel' }}
            </AccionBoton>
            <AccionBoton :disabled="generando !== ''" @click="descargar(r.tipo, 'pdf')">
              {{ generando === `${r.tipo}-pdf` ? 'Generando…' : 'PDF' }}
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
