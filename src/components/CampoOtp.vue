<script setup lang="ts">
import { computed } from 'vue'

const modelo = defineModel<string>({ default: '' })
const LARGO = 6

const digitos = computed(() => Array.from({ length: LARGO }, (_, i) => modelo.value[i] ?? ''))

function alEscribir(evento: Event) {
  const entrada = evento.target as HTMLInputElement
  entrada.value = entrada.value.replace(/\D/g, '').slice(0, LARGO)
  modelo.value = entrada.value
}
</script>

<template>
  <label class="block">
    <span class="mb-2 block font-semibold">Código de verificación</span>
    <span class="relative block">
      <input
        :value="modelo"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        :maxlength="LARGO"
        pattern="[0-9]{6}"
        required
        title="Ingresa los 6 dígitos del código"
        class="peer absolute inset-0 h-full w-full opacity-0"
        @input="alEscribir"
      />
      <span class="grid grid-cols-6 gap-2 rounded-campo peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lago" aria-hidden="true">
        <span
          v-for="(d, i) in digitos"
          :key="i"
          class="flex h-14 items-center justify-center rounded-campo border bg-white font-titulo text-2xl font-bold"
          :class="d ? 'border-guinda-700' : 'border-roca'"
        >
          {{ d }}
        </span>
      </span>
    </span>
  </label>
</template>
