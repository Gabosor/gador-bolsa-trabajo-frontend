<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { FileText, LoaderCircle, Upload, X } from 'lucide-vue-next'
import { pesoArchivo } from '@/utils/formato'

const props = defineProps<{
  etiqueta: string
  /** Tipos aceptados, por ejemplo ['application/pdf']. */
  tipos: string[]
  maxMb: number
  ayuda: string
  urlActual?: string | null
  subiendo?: boolean
  error?: string
  /** El archivo aún no se subió (se envía con el formulario): se puede quitar. */
  quitable?: boolean
}>()
const emit = defineEmits<{ elegir: [archivo: File]; quitar: [] }>()
const entrada = ref<HTMLInputElement>()

const archivo = ref<File | null>(null)
const errorLocal = ref('')
const arrastrando = ref(false)
const previa = ref<string | null>(null)

const esImagen = computed(() => props.tipos.every((t) => t.startsWith('image/')))
const imagen = computed(() => (esImagen.value ? (previa.value ?? props.urlActual ?? null) : null))
const mensajeError = computed(() => errorLocal.value || props.error || '')

function revocar() {
  if (previa.value) URL.revokeObjectURL(previa.value)
  previa.value = null
}

function recibir(elegido: File | undefined) {
  if (!elegido) return
  errorLocal.value = ''
  if (!props.tipos.includes(elegido.type)) {
    errorLocal.value = `Ese formato no sirve. ${props.ayuda}`
    return
  }
  if (elegido.size > props.maxMb * 1024 * 1024) {
    errorLocal.value = `El archivo pesa ${pesoArchivo(elegido.size)} y el máximo es ${props.maxMb} MB.`
    return
  }
  archivo.value = elegido
  revocar()
  if (esImagen.value) previa.value = URL.createObjectURL(elegido)
  emit('elegir', elegido)
}

function quitar() {
  archivo.value = null
  errorLocal.value = ''
  revocar()
  emit('quitar')
  // El foco vuelve al selector, para elegir otro con el teclado.
  entrada.value?.focus()
}

function alElegir(evento: Event) {
  const entrada = evento.target as HTMLInputElement
  recibir(entrada.files?.[0])
  entrada.value = ''
}

function alSoltar(evento: DragEvent) {
  arrastrando.value = false
  recibir(evento.dataTransfer?.files[0])
}

onBeforeUnmount(revocar)
</script>

<template>
  <div>
    <p class="mb-1 font-semibold">{{ etiqueta }}</p>
    <label
      class="relative flex min-h-20 items-center gap-3 rounded-campo border border-dashed bg-white p-3 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-lago"
      :class="[arrastrando ? 'border-guinda-700 bg-guinda-50' : 'border-roca', subiendo ? 'cursor-wait' : 'cursor-pointer']"
      @dragover.prevent="arrastrando = true"
      @dragleave="arrastrando = false"
      @drop.prevent="alSoltar"
    >
      <input ref="entrada" type="file" :accept="tipos.join(',')" :disabled="subiendo" class="sr-only" @change="alElegir" />
      <img v-if="imagen" :src="imagen" alt="" class="size-14 shrink-0 rounded-full object-cover" />
      <span v-else class="flex size-14 shrink-0 items-center justify-center rounded-full bg-salar text-roca">
        <LoaderCircle v-if="subiendo" class="size-6 animate-spin" aria-hidden="true" />
        <FileText v-else-if="archivo || urlActual" class="size-6" aria-hidden="true" />
        <Upload v-else class="size-6" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-semibold">
          <template v-if="subiendo">Subiendo archivo…</template>
          <template v-else-if="archivo">{{ archivo.name }}</template>
          <template v-else-if="urlActual">Reemplazar archivo</template>
          <template v-else>Elegir archivo</template>
        </span>
        <span class="block text-sm text-roca">{{ archivo && !subiendo ? pesoArchivo(archivo.size) : ayuda }}</span>
      </span>
      <!-- Está dentro del label: se cancela el clic para que no abra el selector de archivos. -->
      <button
        v-if="quitable && archivo && !subiendo"
        type="button"
        class="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full text-roca hover:bg-error-50 hover:text-error"
        :aria-label="`Quitar ${archivo.name}`"
        title="Quitar"
        @click.prevent.stop="quitar"
      >
        <X class="size-5" aria-hidden="true" />
      </button>
    </label>
    <p v-if="mensajeError" role="alert" class="mt-1 text-sm text-error">{{ mensajeError }}</p>
    <a v-if="urlActual && !esImagen" :href="urlActual" target="_blank" rel="noopener" class="enlace mt-2 inline-block">Ver archivo actual</a>
  </div>
</template>
