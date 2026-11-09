<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Cantidad total de tramos. */
    total: number
    /** Tramos cumplidos; es un dato real, nunca decorativo. */
    completos: number
    /** Lectura accesible del avance, por ejemplo "Perfil al 70 %". */
    etiqueta: string
  }>(),
  {},
)
</script>

<template>
  <div
    role="progressbar"
    :aria-label="etiqueta"
    :aria-valuenow="completos"
    aria-valuemin="0"
    :aria-valuemax="total"
    class="flex"
  >
    <span v-for="n in total" :key="n" class="faja-segmento" :data-activo="n <= completos" />
  </div>
</template>
