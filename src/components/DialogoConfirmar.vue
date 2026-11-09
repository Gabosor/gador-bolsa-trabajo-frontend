<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AccionBoton from '@/components/AccionBoton.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import { dialogoActual } from '@/utils/confirmar'

const texto = ref('')
const abierta = computed({
  get: () => dialogoActual.value !== null,
  set: (valor) => {
    if (!valor) responder(null)
  },
})

watch(dialogoActual, (d) => {
  texto.value = d?.campo?.valor ?? ''
})

function responder(respuesta: string | null) {
  const actual = dialogoActual.value
  dialogoActual.value = null
  actual?.resolver(respuesta)
}

function aceptar() {
  responder(texto.value.trim())
}
</script>

<template>
  <HojaInferior v-model="abierta" :titulo="dialogoActual?.titulo ?? ''">
    <form v-if="dialogoActual" class="space-y-4" @submit.prevent="aceptar">
      <p v-if="dialogoActual.mensaje">{{ dialogoActual.mensaje }}</p>
      <label v-if="dialogoActual.campo" class="block">
        <span class="mb-1 block font-semibold">{{ dialogoActual.campo.etiqueta }}</span>
        <textarea v-if="dialogoActual.campo.multilinea" v-model="texto" rows="3" class="campo py-3" :required="!dialogoActual.campo.opcional" />
        <input v-else v-model="texto" class="campo" :required="!dialogoActual.campo.opcional" />
      </label>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AccionBoton @click="responder(null)">Cancelar</AccionBoton>
        <AccionBoton type="submit" :variante="dialogoActual.peligro ? 'peligro' : 'primario'">
          {{ dialogoActual.accion }}
        </AccionBoton>
      </div>
    </form>
  </HojaInferior>
</template>
