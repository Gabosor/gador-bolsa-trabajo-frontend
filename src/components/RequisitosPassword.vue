<script lang="ts">
const REGLAS = [
  { texto: 'Mínimo 8 caracteres', cumple: (v: string) => v.length >= 8 },
  { texto: 'Una mayúscula', cumple: (v: string) => /[A-ZÑÁÉÍÓÚ]/.test(v) },
  { texto: 'Una minúscula', cumple: (v: string) => /[a-zñáéíóú]/.test(v) },
  { texto: 'Un número', cumple: (v: string) => /\d/.test(v) },
]

export const passwordValida = (v: string) => REGLAS.every((r) => r.cumple(v))
</script>

<script setup lang="ts">
import { Check, Circle } from 'lucide-vue-next'

defineProps<{ valor: string }>()
</script>

<template>
  <ul class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-base">
    <li v-for="r in REGLAS" :key="r.texto" class="flex items-center gap-1.5" :class="r.cumple(valor) ? 'text-exito' : 'text-roca'">
      <component :is="r.cumple(valor) ? Check : Circle" class="size-4 shrink-0" aria-hidden="true" />
      {{ r.texto }}
    </li>
  </ul>
</template>
