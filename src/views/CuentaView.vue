<script setup lang="ts">
import { ref } from 'vue'
import { api, mensajeError } from '@/api'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import RequisitosPassword, { passwordValida } from '@/components/RequisitosPassword.vue'
import { useAuthStore } from '@/stores/auth'
import { useAvisosStore } from '@/stores/avisos'

const auth = useAuthStore()
const avisos = useAvisosStore()
const actual = ref('')
const nueva = ref('')
const error = ref('')
const cargando = ref(false)

async function cambiar() {
  error.value = ''
  if (!passwordValida(nueva.value)) {
    error.value = 'La nueva contraseña todavía no cumple los requisitos.'
    return
  }
  cargando.value = true
  try {
    await api('/auth/cambiar-password', { method: 'POST', body: { actual: actual.value, nueva: nueva.value } })
    actual.value = ''
    nueva.value = ''
    avisos.exito('Contraseña actualizada')
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <h1 class="titulo-pagina">Mi cuenta</h1>
    <p class="mb-3 break-all text-roca">{{ auth.usuario?.email }}</p>
    <form class="plano space-y-4 p-4" @submit.prevent="cambiar">
      <h2 class="text-xl font-bold">Cambiar contraseña</h2>
      <BaseInput v-model="actual" label="Contraseña actual" type="password" autocomplete="current-password" />
      <div>
        <BaseInput v-model="nueva" label="Nueva contraseña" type="password" autocomplete="new-password" />
        <RequisitosPassword :valor="nueva" />
      </div>
      <p v-if="error" role="alert" class="text-error">{{ error }}</p>
      <BaseButton :cargando="cargando" texto-cargando="Guardando…">Guardar contraseña</BaseButton>
    </form>
  </section>
</template>
