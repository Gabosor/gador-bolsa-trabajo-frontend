<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mensajeError } from '@/api'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  cargando.value = true
  try {
    await auth.login(email.value, password.value)
    const paneles = { SUPERADMIN: '/admin/empresas', EMPRESA: '/empresa/ofertas', POSTULANTE: '/' }
    const volver = route.query.volver
    await router.push(typeof volver === 'string' ? volver : paneles[auth.usuario!.rol])
  } catch (e) {
    const mensaje = mensajeError(e)
    if (mensaje === 'Debes verificar tu celular') {
      await router.push({ name: 'verificar', query: { email: email.value } })
      return
    }
    error.value = mensaje
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold text-guinda-900">Ingresar</h1>
    <form class="space-y-4" @submit.prevent="enviar">
      <BaseInput v-model="email" label="Correo electrónico" type="email" autocomplete="email" />
      <BaseInput v-model="password" label="Contraseña" type="password" autocomplete="current-password" />
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
      <BaseButton :cargando="cargando">Ingresar</BaseButton>
    </form>
    <p class="mt-4 text-sm">
      ¿Aún no tienes cuenta?
      <RouterLink to="/registro" class="font-medium text-guinda-700 underline">Regístrate</RouterLink>
    </p>
  </section>
</template>
