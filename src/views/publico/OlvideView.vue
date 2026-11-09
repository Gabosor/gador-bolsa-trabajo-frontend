<script setup lang="ts">
import { ref } from 'vue'
import { api, mensajeError } from '@/api'
import AccesoMarco from '@/components/AccesoMarco.vue'
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
    const r = await api<{ mensaje: string }>('/auth/olvide-password', { method: 'POST', body: { email: email.value } })
    mensaje.value = r.mensaje
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <AccesoMarco titulo="Recuperar contraseña" texto="Te enviaremos un enlace para crear una nueva.">
    <p v-if="mensaje" role="status" class="rounded-campo bg-exito-50 p-3 text-exito">{{ mensaje }}</p>
    <form v-else class="space-y-4" @submit.prevent="enviar">
      <BaseInput v-model="email" label="Correo electrónico" type="email" inputmode="email" autocomplete="email" />
      <p v-if="error" role="alert" class="text-error">{{ error }}</p>
      <BaseButton :cargando="cargando" texto-cargando="Enviando…">Enviar enlace</BaseButton>
    </form>
    <template #pie><RouterLink to="/login" class="enlace">Volver a ingresar</RouterLink></template>
  </AccesoMarco>
</template>
