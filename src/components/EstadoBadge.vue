<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Ban, CheckCircle2, Circle, Clock3, Eye, Star } from 'lucide-vue-next'

const props = defineProps<{ estado: string }>()

type Tono = 'neutro' | 'proceso' | 'alerta' | 'exito' | 'error'

const ESTADOS: Record<string, { texto: string; tono: Tono; icono: Component }> = {
  PENDIENTE_VALIDACION: { texto: 'Pendiente', tono: 'alerta', icono: Clock3 },
  APROBADA: { texto: 'Aprobada', tono: 'exito', icono: CheckCircle2 },
  RECHAZADA: { texto: 'Rechazada', tono: 'error', icono: Ban },
  SUSPENDIDA: { texto: 'Suspendida', tono: 'error', icono: Ban },
  BORRADOR: { texto: 'Borrador', tono: 'neutro', icono: Circle },
  EN_REVISION_GADOR: { texto: 'En revisión', tono: 'alerta', icono: Clock3 },
  PUBLICADA: { texto: 'Publicada', tono: 'exito', icono: CheckCircle2 },
  EN_PROCESO_SELECCION: { texto: 'En selección', tono: 'proceso', icono: Clock3 },
  CERRADA: { texto: 'Cerrada', tono: 'neutro', icono: Circle },
  ANULADA: { texto: 'Anulada', tono: 'error', icono: Ban },
  POSTULADO: { texto: 'Postulado', tono: 'neutro', icono: Circle },
  VISTO: { texto: 'Visto por la empresa', tono: 'proceso', icono: Eye },
  PRESELECCIONADO: { texto: 'Preseleccionado', tono: 'proceso', icono: Star },
  ENTREVISTA: { texto: 'Entrevista', tono: 'alerta', icono: Clock3 },
  FINALISTA: { texto: 'Finalista', tono: 'alerta', icono: Star },
  CONTRATADO: { texto: 'Contratado', tono: 'exito', icono: CheckCircle2 },
  RECHAZADO: { texto: 'No seleccionado', tono: 'error', icono: Ban },
}

const TONOS: Record<Tono, string> = {
  neutro: 'bg-salar text-noche',
  proceso: 'bg-lago-50 text-lago',
  alerta: 'bg-alerta-50 text-alerta',
  exito: 'bg-exito-50 text-exito',
  error: 'bg-error-50 text-error',
}

const actual = computed(() => ESTADOS[props.estado] ?? { texto: props.estado, tono: 'neutro' as Tono, icono: Circle })
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold whitespace-nowrap"
    :class="TONOS[actual.tono]"
  >
    <component :is="actual.icono" class="size-3.5" aria-hidden="true" />
    {{ actual.texto }}
  </span>
</template>
