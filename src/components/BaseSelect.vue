<script setup lang="ts">
import type { ItemCatalogo } from '@/api/tipos'

const modelo = defineModel<number | ''>({ default: '' })
defineProps<{ label: string; opciones: ItemCatalogo[] }>()
</script>

<template>
  <label class="block">
    <span class="mb-1 block text-sm font-medium">{{ label }}</span>
    <select
      v-model="modelo"
      required
      class="min-h-11 w-full rounded-md border border-stone-400 bg-white px-3 focus:border-guinda-700 focus:ring-2 focus:ring-guinda-100 focus:outline-none"
    >
      <option value="" disabled>Selecciona…</option>
      <option v-for="o in opciones" :key="o.id" :value="o.id">{{ o.nombre }}</option>
    </select>
  </label>
</template>
