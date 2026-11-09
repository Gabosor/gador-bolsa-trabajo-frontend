<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import AccesoMarco from '@/components/AccesoMarco.vue'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import CampoOtp from '@/components/CampoOtp.vue'
import { useAvisosStore } from '@/stores/avisos'

const ESPERA_REENVIO_S = 30

const route = useRoute()
const router = useRouter()
const avisos = useAvisosStore()

const email = computed(() => String(route.query.email ?? ''))
const otpDemo = ref<string | undefined>(history.state?.otpDemo)
const codigo = ref('')
const error = ref('')
const cargando = ref(false)
const restante = ref(ESPERA_REENVIO_S)

let temporizador: ReturnType<typeof setInterval> | undefined

function iniciarEspera() {
  restante.value = ESPERA_REENVIO_S
  clearInterval(temporizador)
  temporizador = setInterval(() => {
    restante.value -= 1
    if (restante.value <= 0) clearInterval(temporizador)
  }, 1000)
}

onMounted(iniciarEspera)
onUnmounted(() => clearInterval(temporizador))

async function verificar() {
  error.value = ''
  cargando.value = true
  try {
    await api('/auth/otp/verificar', { method: 'POST', body: { email: email.value, codigo: codigo.value } })
    avisos.exito('Celular verificado. Ya puedes ingresar.')
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
    const r = await api<{ otpDemo?: string }>('/auth/otp/reenviar', { method: 'POST', body: { email: email.value } })
    otpDemo.value = r.otpDemo
    codigo.value = ''
    iniciarEspera()
    avisos.exito('Generamos un código nuevo')
  } catch (e) {
    error.value = mensajeError(e)
  }
}
</script>

<template>
  <AccesoMarco titulo="Verifica tu celular" texto="Ingresa el código de 6 dígitos. Vence en 10 minutos.">
    <p v-if="otpDemo" class="mb-4 rounded-campo bg-lago-50 p-3">Modo demostración. Tu código es <strong>{{ otpDemo }}</strong></p>
    <form class="space-y-4" @submit.prevent="verificar">
      <CampoOtp v-model="codigo" />
      <p v-if="error" role="alert" class="text-error">{{ error }}</p>
      <BaseButton :cargando="cargando" texto-cargando="Verificando…">Verificar</BaseButton>
    </form>
    <AccionBoton variante="texto" class="mt-3 w-full" :disabled="restante > 0" @click="reenviar">
      {{ restante > 0 ? `Pedir otro código en ${restante} s` : 'Generar un código nuevo' }}
    </AccionBoton>
  </AccesoMarco>
</template>
