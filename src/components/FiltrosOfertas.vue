<script setup lang="ts">
import { computed } from 'vue'
import type { ItemCatalogo } from '@/api/tipos'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import SelectorBuscable from '@/components/SelectorBuscable.vue'
import { opcionesConArea } from '@/utils/catalogos'

export interface Filtros {
  profesionId: number | ''
  municipioId: number | ''
  modalidadId: number | ''
  salarioMin: string
}

const props = withDefaults(
  defineProps<{
    filtros: Filtros
    profesiones: ItemCatalogo[]
    municipios: ItemCatalogo[]
    modalidades: ItemCatalogo[]
    areas?: ItemCatalogo[]
  }>(),
  { areas: () => [] },
)
const opcionesProfesion = computed(() => opcionesConArea(props.profesiones, props.areas, 'parentId'))
defineEmits<{ aplicar: [] }>()
</script>

<template>
  <form class="space-y-4" @submit.prevent="$emit('aplicar')">
    <SelectorBuscable v-model="filtros.profesionId" label="Profesión" :opciones="opcionesProfesion" placeholder="Todas" texto-sin-grupo="Otras profesiones" opcional />
    <BaseSelect v-model="filtros.municipioId" label="Municipio" :opciones="municipios" texto-vacio="Todos" opcional />
    <BaseSelect v-model="filtros.modalidadId" label="Modalidad" :opciones="modalidades" texto-vacio="Todas" opcional />
    <BaseInput v-model="filtros.salarioMin" label="Salario desde (Bs)" type="number" inputmode="numeric" min="0" opcional />
    <BaseButton>Ver resultados</BaseButton>
  </form>
</template>
