<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import { ChevronDown, CircleCheck, CircleDashed } from 'lucide-vue-next'

const props = defineProps<{ id: string; titulo: string; resumen?: string; completa: boolean; abierta?: boolean }>()

const expandida = ref(props.abierta ?? false)
const panelId = useId()

watch(
  () => props.abierta,
  (valor) => {
    if (valor) expandida.value = true
  },
)
</script>

<template>
  <section :id="id" class="plano scroll-mt-20">
    <h2>
      <button
        type="button"
        class="flex min-h-16 w-full items-center gap-3 p-4 text-left"
        :aria-expanded="expandida"
        :aria-controls="panelId"
        @click="expandida = !expandida"
      >
        <CircleCheck v-if="completa" class="size-6 shrink-0 text-exito" aria-label="Completo" />
        <CircleDashed v-else class="size-6 shrink-0 text-roca" aria-label="Pendiente" />
        <span class="min-w-0 flex-1">
          <span class="block text-xl font-bold">{{ titulo }}</span>
          <span v-if="resumen" class="block truncate font-sans text-base font-normal text-roca">{{ resumen }}</span>
        </span>
        <ChevronDown class="size-5 shrink-0 text-roca transition-transform" :class="{ 'rotate-180': expandida }" aria-hidden="true" />
      </button>
    </h2>
    <div v-show="expandida" :id="panelId" class="border-t border-linea p-4">
      <slot />
    </div>
  </section>
</template>
