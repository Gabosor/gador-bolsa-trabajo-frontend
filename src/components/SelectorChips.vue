<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import type { ItemCatalogo } from '@/api/tipos'

const seleccion = defineModel<number[]>({ default: () => [] })
const props = defineProps<{ etiqueta: string; opciones: ItemCatalogo[]; ayuda?: string }>()

const busqueda = ref('')
const LIMITE_SIN_BUSCADOR = 8

const visibles = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return texto ? props.opciones.filter((o) => o.nombre.toLowerCase().includes(texto)) : props.opciones
})

function alternar(id: number) {
  seleccion.value = seleccion.value.includes(id) ? seleccion.value.filter((x) => x !== id) : [...seleccion.value, id]
}
</script>

<template>
  <fieldset>
    <legend class="mb-1 font-semibold">{{ etiqueta }}</legend>
    <p v-if="ayuda" class="mb-2 text-sm text-roca">{{ ayuda }}</p>
    <input
      v-if="opciones.length > LIMITE_SIN_BUSCADOR"
      v-model="busqueda"
      type="search"
      class="campo mb-2"
      :aria-label="`Buscar en ${etiqueta}`"
      placeholder="Escribe para buscar"
    />
    <div class="flex flex-wrap gap-2">
      <button
        v-for="o in visibles"
        :key="o.id"
        type="button"
        :aria-pressed="seleccion.includes(o.id)"
        class="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-base"
        :class="seleccion.includes(o.id) ? 'border-guinda-700 bg-guinda-700 font-semibold text-white' : 'border-roca bg-white'"
        @click="alternar(o.id)"
      >
        <Check v-if="seleccion.includes(o.id)" class="size-4" aria-hidden="true" />
        {{ o.nombre }}
      </button>
    </div>
    <p v-if="visibles.length === 0" class="mt-2 text-sm text-roca">No hay opciones con ese texto.</p>
  </fieldset>
</template>
