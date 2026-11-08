<script setup lang="ts">
import { ref } from 'vue'
import { api, mensajeError } from '@/api'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const email = ref('')
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  cargando.value = true
  try {
    const r = await api<{ mensaje: string }>('/auth/olvide-password', {
      method: 'POST',
      body: { email: email.value },
    })
    mensaje.value = r.mensaje
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold text-guinda-900">Recuperar contraseña</h1>
    <p v-if="mensaje" role="status" class="rounded-md bg-green-100 p-3 text-sm text-green-900">{{ mensaje }}</p>
    <form v-else class="space-y-4" @submit.prevent="enviar">
      <BaseInput v-model="email" label="Correo electrónico" type="email" autocomplete="email" />
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <BaseButton :cargando="cargando">Enviar enlace</BaseButton>
    </form>
  </section>
</template>
