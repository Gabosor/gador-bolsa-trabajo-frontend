<script setup lang="ts">
import type { ItemCatalogo } from '@/api/tipos'

const modelo = defineModel<number | ''>({ default: '' })
withDefaults(defineProps<{ label: string; opciones: ItemCatalogo[]; textoVacio?: string; opcional?: boolean }>(), {
  textoVacio: 'Selecciona…',
})
</script>

<template>
  <label class="block">
    <span class="mb-1 block text-base font-semibold">{{ label }}</span>
    <select v-model="modelo" :required="!opcional" class="campo">
      <option value="" :disabled="!opcional">{{ textoVacio }}</option>
      <option v-for="o in opciones" :key="o.id" :value="o.id">{{ o.nombre }}</option>
    </select>
  </label>
</template>
