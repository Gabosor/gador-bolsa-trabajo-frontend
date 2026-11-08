<script setup lang="ts">
const modelo = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    label: string
    type?: string
    ayuda?: string
    autocomplete?: string
  }>(),
  { type: 'text', ayuda: undefined, autocomplete: undefined },
)
</script>

<template>
  <label class="block">
    <span class="mb-1 block text-sm font-medium">{{ label }}</span>
    <input
      v-model="modelo"
      :type="type"
      :autocomplete="autocomplete"
      required
      class="min-h-11 w-full rounded-md border border-stone-400 bg-white px-3 focus:border-guinda-700 focus:ring-2 focus:ring-guinda-100 focus:outline-none"
    />
    <span v-if="ayuda" class="mt-1 block text-xs text-stone-600">{{ ayuda }}</span>
  </label>
</template>
