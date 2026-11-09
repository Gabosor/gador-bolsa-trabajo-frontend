<script setup lang="ts">
const modelo = defineModel<string>({ default: '' })
withDefaults(defineProps<{ label: string; opcional?: boolean; ayuda?: string; filas?: number }>(), {
  ayuda: undefined,
  filas: 4,
})
</script>

<template>
  <label class="block">
    <span class="mb-1 block text-base font-semibold">
      {{ label }}<span v-if="opcional" class="font-normal text-roca"> (opcional)</span>
    </span>
    <textarea v-model="modelo" :required="!opcional" :rows="filas" class="campo py-3" />
    <span v-if="ayuda" class="mt-1 block text-sm text-roca">{{ ayuda }}</span>
  </label>
</template>
