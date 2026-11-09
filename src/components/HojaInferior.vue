<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const abierta = defineModel<boolean>({ default: false })
defineProps<{ titulo: string }>()

const dialogo = ref<HTMLDialogElement>()

watch(
  abierta,
  async (valor) => {
    await nextTick()
    if (!dialogo.value) return
    if (valor && !dialogo.value.open) dialogo.value.showModal()
    if (!valor && dialogo.value.open) dialogo.value.close()
  },
  { immediate: true, flush: 'post' },
)

/** Un clic en el fondo cae sobre el propio dialog, no sobre su contenido. */
function clicFondo(evento: MouseEvent) {
  if (evento.target === dialogo.value) abierta.value = false
}
</script>

<template>
  <dialog ref="dialogo" class="hoja" @close="abierta = false" @click="clicFondo">
    <div class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-linea bg-white px-4 py-2">
      <h2 class="min-w-0 text-xl font-bold text-guinda-900">{{ titulo }}</h2>
      <button type="button" class="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-salar" aria-label="Cerrar" @click="abierta = false">
        <X class="size-5" aria-hidden="true" />
      </button>
    </div>
    <div v-if="abierta" class="p-4">
      <slot />
    </div>
  </dialog>
</template>
