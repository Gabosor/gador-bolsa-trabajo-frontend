<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import AccesoMarco from '@/components/AccesoMarco.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import RequisitosPassword, { passwordValida } from '@/components/RequisitosPassword.vue'

const router = useRouter()
const form = reactive({ ci: '', nombreCompleto: '', celular: '', email: '', password: '' })
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  if (!passwordValida(form.password)) {
    error.value = 'La contraseña todavía no cumple los requisitos.'
    return
  }
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
  <AccesoMarco titulo="Crear cuenta" texto="Para postular a las ofertas de la Bolsa de Trabajo.">
    <form class="space-y-4" @submit.prevent="enviar">
      <BaseInput v-model="form.nombreCompleto" label="Nombre completo" autocomplete="name" />
      <BaseInput v-model="form.ci" label="Carnet de identidad" inputmode="numeric" />
      <BaseInput v-model="form.celular" label="Celular" type="tel" inputmode="tel" autocomplete="tel" :maxlength="8" pattern="[67][0-9]{7}" titulo="8 dígitos, empieza con 6 o 7" ayuda="Te enviaremos un código a este número." />
      <BaseInput v-model="form.email" label="Correo electrónico" type="email" inputmode="email" autocomplete="email" />
      <div>
        <BaseInput v-model="form.password" label="Contraseña" type="password" autocomplete="new-password" />
        <RequisitosPassword :valor="form.password" />
      </div>
      <p v-if="error" role="alert" class="text-error">{{ error }}</p>
      <BaseButton :cargando="cargando">Continuar</BaseButton>
    </form>
    <template #pie>
      <p>¿Ya tienes cuenta? <RouterLink to="/login" class="enlace">Ingresa</RouterLink></p>
    </template>
  </AccesoMarco>
</template>
