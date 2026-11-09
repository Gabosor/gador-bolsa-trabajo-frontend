<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

withDefaults(defineProps<{ cargando?: boolean; textoCargando?: string }>(), {
  textoCargando: 'Procesando…',
})
</script>

<template>
  <button
    :disabled="cargando"
    class="flex min-h-12 w-full items-center justify-center gap-2 rounded-campo bg-guinda-700 px-4 font-semibold text-white hover:bg-guinda-800 disabled:opacity-60"
  >
    <template v-if="cargando">
      <LoaderCircle class="size-5 animate-spin" aria-hidden="true" />
      {{ textoCargando }}
    </template>
    <slot v-else />
  </button>
</template>
