<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const router = useRouter()
const form = reactive({ ci: '', nombreCompleto: '', celular: '', email: '', password: '' })
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  cargando.value = true
  try {
    const r = await api<{ otpDemo?: string }>('/auth/registro', { method: 'POST', body: form })
    await router.push({
      name: 'verificar',
      query: { email: form.email },
      state: { otpDemo: r.otpDemo },
    })
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold text-guinda-900">Crear cuenta de postulante</h1>
    <form class="space-y-4" @submit.prevent="enviar">
      <BaseInput v-model="form.ci" label="Carnet de identidad" />
      <BaseInput v-model="form.nombreCompleto" label="Nombre completo" autocomplete="name" />
      <BaseInput v-model="form.celular" label="Celular" type="tel" autocomplete="tel" ayuda="8 dígitos, por ejemplo 71234567" />
      <BaseInput v-model="form.email" label="Correo electrónico" type="email" autocomplete="email" />
      <BaseInput
        v-model="form.password"
        label="Contraseña"
        type="password"
        autocomplete="new-password"
        ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número"
      />
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <BaseButton :cargando="cargando">Continuar</BaseButton>
    </form>
  </section>
</template>
