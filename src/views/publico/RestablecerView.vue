<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const route = useRoute()
const router = useRouter()
const password = ref('')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  cargando.value = true
  try {
    await api('/auth/restablecer-password', {
      method: 'POST',
      body: { email: route.query.email, token: route.query.token, password: password.value },
    })
    await router.push({ name: 'login' })
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold text-guinda-900">Nueva contraseña</h1>
    <form class="space-y-4" @submit.prevent="enviar">
      <BaseInput
        v-model="password"
        label="Nueva contraseña"
        type="password"
        autocomplete="new-password"
        ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número"
      />
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <BaseButton :cargando="cargando">Guardar</BaseButton>
    </form>
  </section>
</template>
