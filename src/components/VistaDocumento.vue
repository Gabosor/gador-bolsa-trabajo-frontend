<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink, FileText, RefreshCw } from 'lucide-vue-next'
import { usarMedia } from '@/composables/usarMedia'
import { tipoDocumento } from '@/utils/archivos'

/**
 * Documento adjunto para revisar. En escritorio el PDF se ve incrustado; en
 * móvil solo el enlace, para no descargarlo sin pedirlo. Los enlaces son
 * firmados y vencen: "Recargar" pide unos nuevos.
 */
const props = defineProps<{ titulo: string; url?: string | null }>()
const emit = defineEmits<{ recargar: [] }>()

const escritorio = usarMedia('(min-width: 64rem)')
const tipo = computed(() => tipoDocumento(props.url ?? null))
</script>

<template>
  <figure class="plano overflow-hidden">
    <figcaption class="flex flex-wrap items-center justify-between gap-2 border-b border-linea px-4 py-3">
      <span class="flex items-center gap-2 font-semibold"><FileText class="size-5 text-roca" aria-hidden="true" />{{ titulo }}</span>
      <span v-if="url" class="flex flex-wrap gap-1">
        <a :href="url" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center gap-1.5 rounded-campo px-3 font-semibold text-guinda-700 hover:bg-guinda-50">
          <ExternalLink class="size-4" aria-hidden="true" />Abrir en pestaña nueva
        </a>
        <button type="button" class="inline-flex min-h-11 items-center gap-1.5 rounded-campo px-3 text-roca hover:bg-salar" @click="emit('recargar')">
          <RefreshCw class="size-4" aria-hidden="true" />Recargar
        </button>
      </span>
    </figcaption>
    <p v-if="!url" class="p-4 text-roca">No adjuntó este documento.</p>
    <img v-else-if="tipo === 'imagen'" :src="url" :alt="titulo" class="max-h-[70vh] w-full bg-salar object-contain" loading="lazy" />
    <object v-else-if="tipo === 'pdf' && escritorio" :data="url" type="application/pdf" class="h-[70vh] w-full" :aria-label="titulo">
      <p class="p-4">Tu navegador no muestra el PDF aquí. Usa «Abrir en pestaña nueva».</p>
    </object>
    <p v-else class="p-4 text-base text-roca">Ábrelo en una pestaña nueva para revisarlo. Si el enlace venció, usa «Recargar».</p>
  </figure>
</template>
