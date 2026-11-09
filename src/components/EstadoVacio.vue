<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icono: Component; titulo: string; texto?: string }>()
</script>

<template>
  <div class="flex flex-col items-center px-4 py-10 text-center">
    <component :is="icono" class="mb-3 size-10 text-roca" aria-hidden="true" />
    <p class="font-titulo text-xl font-bold">{{ titulo }}</p>
    <p v-if="texto" class="mt-1 max-w-md text-roca">{{ texto }}</p>
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
