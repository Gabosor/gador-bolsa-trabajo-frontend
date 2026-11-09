<script setup lang="ts">
import { CircleAlert, CircleCheck, X } from 'lucide-vue-next'
import { useAvisosStore } from '@/stores/avisos'

const avisos = useAvisosStore()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-4 top-3 z-50 flex flex-col items-center gap-2" aria-live="polite">
    <div
      v-for="a in avisos.lista"
      :key="a.id"
      class="pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-campo bg-noche py-2 pr-1 pl-3 text-white"
      :role="a.tipo === 'error' ? 'alert' : 'status'"
    >
      <component :is="a.tipo === 'error' ? CircleAlert : CircleCheck" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p class="min-w-0 flex-1">{{ a.texto }}</p>
      <button type="button" class="flex size-7 shrink-0 items-center justify-center" aria-label="Cerrar aviso" @click="avisos.quitar(a.id)">
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
