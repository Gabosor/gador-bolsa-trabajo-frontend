<script setup lang="ts">
import type { ItemCatalogo } from '@/api/tipos'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'

export interface Filtros {
  profesionId: number | ''
  municipioId: number | ''
  modalidadId: number | ''
  salarioMin: string
}

defineProps<{ filtros: Filtros; profesiones: ItemCatalogo[]; municipios: ItemCatalogo[]; modalidades: ItemCatalogo[] }>()
defineEmits<{ aplicar: [] }>()
</script>

<template>
  <form class="space-y-4" @submit.prevent="$emit('aplicar')">
    <BaseSelect v-model="filtros.profesionId" label="Profesión" :opciones="profesiones" texto-vacio="Todas" opcional />
    <BaseSelect v-model="filtros.municipioId" label="Municipio" :opciones="municipios" texto-vacio="Todos" opcional />
    <BaseSelect v-model="filtros.modalidadId" label="Modalidad" :opciones="modalidades" texto-vacio="Todas" opcional />
    <BaseInput v-model="filtros.salarioMin" label="Salario desde (Bs)" type="number" inputmode="numeric" min="0" opcional />
    <BaseButton>Ver resultados</BaseButton>
  </form>
</template>
