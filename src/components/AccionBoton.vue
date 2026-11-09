<script setup lang="ts">
withDefaults(defineProps<{ variante?: 'normal' | 'primario' | 'peligro' | 'texto' }>(), { variante: 'normal' })

const CLASES = {
  normal: 'border border-roca bg-white text-noche hover:bg-salar',
  primario: 'bg-guinda-700 text-white hover:bg-guinda-800',
  peligro: 'border border-error bg-white text-error hover:bg-error-50',
  texto: 'text-guinda-700 hover:bg-guinda-50',
}
</script>

<template>
  <button
    type="button"
    class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-campo px-3 text-base font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
    :class="CLASES[variante]"
  >
    <slot />
  </button>
</template>
