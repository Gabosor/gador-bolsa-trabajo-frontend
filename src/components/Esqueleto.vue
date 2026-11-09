<script setup lang="ts">
withDefaults(defineProps<{ filas?: number }>(), { filas: 4 })
</script>

<template>
  <div class="space-y-3" role="status" aria-label="Cargando">
    <div v-for="n in filas" :key="n" class="plano space-y-2 p-4 motion-safe:animate-pulse">
      <div class="h-5 w-2/3 rounded bg-linea" />
      <div class="h-4 w-1/2 rounded bg-salar" />
    </div>
  </div>
</template>
