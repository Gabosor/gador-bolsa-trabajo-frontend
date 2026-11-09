<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mensajeError } from '@/api'
import AccesoMarco from '@/components/AccesoMarco.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import { PANEL_DE_ROL } from '@/router'
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
    const volver = route.query.volver
    await router.push(typeof volver === 'string' ? volver : PANEL_DE_ROL[auth.usuario!.rol])
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
  <AccesoMarco titulo="Ingresar">
    <form class="space-y-4" @submit.prevent="enviar">
      <BaseInput v-model="email" label="Correo electrónico" type="email" inputmode="email" autocomplete="email" />
      <div>
        <BaseInput v-model="password" label="Contraseña" type="password" autocomplete="current-password" />
        <RouterLink to="/olvide" class="enlace inline-flex min-h-11 items-center">Olvidé mi contraseña</RouterLink>
      </div>
      <p v-if="error" role="alert" class="text-error">{{ error }}</p>
      <BaseButton :cargando="cargando" texto-cargando="Ingresando…">Ingresar</BaseButton>
    </form>
    <template #pie>
      <p>¿Aún no tienes cuenta? <RouterLink to="/registro" class="enlace">Regístrate</RouterLink></p>
      <p class="mt-2">¿Representas a una empresa? <RouterLink to="/empresas/registro" class="enlace">Regístrala</RouterLink></p>
    </template>
  </AccesoMarco>
</template>
