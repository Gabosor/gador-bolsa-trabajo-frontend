<script setup lang="ts">
defineProps<{ cargando?: boolean }>()
</script>

<template>
  <button
    :disabled="cargando"
    class="min-h-11 w-full rounded-md bg-guinda-700 px-4 font-medium text-white hover:bg-guinda-800 disabled:opacity-60"
  >
    {{ cargando ? 'Procesando…' : '' }}
    <slot v-if="!cargando" />
  </button>
</template>
