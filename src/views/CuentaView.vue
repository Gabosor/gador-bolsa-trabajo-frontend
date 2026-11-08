<script setup lang="ts">
import { ref } from 'vue'
import { api, mensajeError } from '@/api'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const actual = ref('')
const nueva = ref('')
const error = ref('')
const aviso = ref('')
const cargando = ref(false)

async function cambiar() {
  error.value = ''
  aviso.value = ''
  cargando.value = true
  try {
    await api('/auth/cambiar-password', {
      method: 'POST',
      body: { actual: actual.value, nueva: nueva.value },
    })
    actual.value = ''
    nueva.value = ''
    aviso.value = 'Contraseña actualizada'
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold text-guinda-900">Cambiar contraseña</h1>
    <form class="space-y-4" @submit.prevent="cambiar">
      <BaseInput v-model="actual" label="Contraseña actual" type="password" autocomplete="current-password" />
      <BaseInput
        v-model="nueva"
        label="Nueva contraseña"
        type="password"
        autocomplete="new-password"
        ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número"
      />
      <p v-if="aviso" role="status" class="text-sm text-green-800">{{ aviso }}</p>
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <BaseButton :cargando="cargando">Guardar</BaseButton>
    </form>
  </section>
</template>
