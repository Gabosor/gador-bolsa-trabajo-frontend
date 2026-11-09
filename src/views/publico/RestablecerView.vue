<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import AccesoMarco from '@/components/AccesoMarco.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import RequisitosPassword, { passwordValida } from '@/components/RequisitosPassword.vue'
import { useAvisosStore } from '@/stores/avisos'

const route = useRoute()
const router = useRouter()
const avisos = useAvisosStore()
const password = ref('')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  if (!passwordValida(password.value)) {
    error.value = 'La contraseña todavía no cumple los requisitos.'
    return
  }
  cargando.value = true
  try {
    await api('/auth/restablecer-password', {
      method: 'POST',
      body: { email: route.query.email, token: route.query.token, password: password.value },
    })
    avisos.exito('Contraseña actualizada. Ya puedes ingresar.')
    await router.push({ name: 'login' })
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <AccesoMarco titulo="Nueva contraseña">
    <form class="space-y-4" @submit.prevent="enviar">
      <div>
        <BaseInput v-model="password" label="Nueva contraseña" type="password" autocomplete="new-password" />
        <RequisitosPassword :valor="password" />
      </div>
      <p v-if="error" role="alert" class="text-error">{{ error }}</p>
      <BaseButton :cargando="cargando" texto-cargando="Guardando…">Guardar contraseña</BaseButton>
    </form>
  </AccesoMarco>
</template>
