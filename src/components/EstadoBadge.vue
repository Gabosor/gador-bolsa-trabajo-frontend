<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ estado: string }>()

const ESTILOS: Record<string, { texto: string; clase: string }> = {
  PENDIENTE_VALIDACION: { texto: 'Pendiente', clase: 'bg-amber-100 text-amber-900' },
  APROBADA: { texto: 'Aprobada', clase: 'bg-green-100 text-green-900' },
  RECHAZADA: { texto: 'Rechazada', clase: 'bg-red-100 text-red-900' },
  SUSPENDIDA: { texto: 'Suspendida', clase: 'bg-red-100 text-red-900' },
  BORRADOR: { texto: 'Borrador', clase: 'bg-stone-200 text-stone-900' },
  EN_REVISION_GADOR: { texto: 'En revisión', clase: 'bg-amber-100 text-amber-900' },
  PUBLICADA: { texto: 'Publicada', clase: 'bg-green-100 text-green-900' },
  EN_PROCESO_SELECCION: { texto: 'En selección', clase: 'bg-blue-100 text-blue-900' },
  CERRADA: { texto: 'Cerrada', clase: 'bg-stone-200 text-stone-900' },
  ANULADA: { texto: 'Anulada', clase: 'bg-red-100 text-red-900' },
}

const estilo = computed(
  () => ESTILOS[props.estado] ?? { texto: props.estado, clase: 'bg-stone-200 text-stone-900' },
)
</script>

<template>
  <span class="inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap" :class="estilo.clase">
    {{ estilo.texto }}
  </span>
</template>
