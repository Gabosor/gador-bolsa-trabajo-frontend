<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const route = useRoute()
const router = useRouter()

const email = computed(() => String(route.query.email ?? ''))
const otpDemo = ref<string | undefined>(history.state?.otpDemo)
const codigo = ref('')
const error = ref('')
const cargando = ref(false)

async function verificar() {
  error.value = ''
  cargando.value = true
  try {
    await api('/auth/otp/verificar', {
      method: 'POST',
      body: { email: email.value, codigo: codigo.value },
    })
    await router.push({ name: 'login' })
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}

async function reenviar() {
  error.value = ''
  try {
    const r = await api<{ otpDemo?: string }>('/auth/otp/reenviar', {
      method: 'POST',
      body: { email: email.value },
    })
    otpDemo.value = r.otpDemo
  } catch (e) {
    error.value = mensajeError(e)
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h1 class="mb-2 text-2xl font-semibold text-guinda-900">Verifica tu celular</h1>
    <p class="mb-6 text-sm text-stone-700">Ingresa el código de 6 dígitos. Vence en 10 minutos.</p>
    <p v-if="otpDemo" class="mb-4 rounded-md bg-guinda-50 p-3 text-sm">
      Modo demostración. Tu código es <strong>{{ otpDemo }}</strong>
    </p>
    <form class="space-y-4" @submit.prevent="verificar">
      <BaseInput v-model="codigo" label="Código" autocomplete="one-time-code" />
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <BaseButton :cargando="cargando">Verificar</BaseButton>
    </form>
    <button class="mt-3 min-h-11 text-sm font-medium text-guinda-700 underline" @click="reenviar">
      Generar un código nuevo
    </button>
  </section>
</template>
