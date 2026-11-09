<script setup lang="ts">
import { ref, watch } from 'vue'
import { iniciales } from '@/utils/formato'

/** Logo de la empresa; si no tiene o no carga, sus iniciales. */
const props = withDefaults(defineProps<{ nombre: string; url?: string | null; tamano?: 'sm' | 'lg' }>(), {
  url: null,
  tamano: 'sm',
})

const fallo = ref(false)
watch(
  () => props.url,
  () => (fallo.value = false),
)
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-campo border border-linea bg-white"
    :class="tamano === 'lg' ? 'size-20' : 'size-12'"
  >
    <img
      v-if="url && !fallo"
      :src="url"
      :alt="`Logo de ${nombre}`"
      class="size-full object-contain p-1"
      loading="lazy"
      decoding="async"
      @error="fallo = true"
    />
    <span
      v-else
      class="flex size-full items-center justify-center bg-guinda-50 font-bold text-guinda-700"
      :class="tamano === 'lg' ? 'text-2xl' : 'text-base'"
      aria-hidden="true"
    >
      {{ iniciales(nombre) }}
    </span>
  </span>
</template>
