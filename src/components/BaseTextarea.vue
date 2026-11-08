<script setup lang="ts">
const modelo = defineModel<string>({ default: '' })
defineProps<{ label: string; opcional?: boolean }>()
</script>

<template>
  <label class="block">
    <span class="mb-1 block text-sm font-medium">
      {{ label }}<span v-if="opcional" class="font-normal text-stone-600"> (opcional)</span>
    </span>
    <textarea
      v-model="modelo"
      :required="!opcional"
      rows="4"
      class="w-full rounded-md border border-stone-400 bg-white p-3 focus:border-guinda-700 focus:ring-2 focus:ring-guinda-100 focus:outline-none"
    />
  </label>
</template>
