<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api, mensajeError } from '@/api'
import type { ItemCatalogo } from '@/api/tipos'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'

const form = reactive({
  nit: '',
  razonSocial: '',
  representanteLegal: '',
  ciRepresentante: '',
  celular: '',
  emailCorporativo: '',
  direccion: '',
  descripcion: '',
  password: '',
})
const rubroId = ref<number | ''>('')
const rubros = ref<ItemCatalogo[]>([])
const archivos: Record<string, File | undefined> = {}
const error = ref('')
const cargando = ref(false)
const enviado = ref(false)

onMounted(async () => {
  try {
    rubros.value = await api<ItemCatalogo[]>('/catalogos/RUBRO')
  } catch (e) {
    error.value = mensajeError(e)
  }
})

function elegirArchivo(campo: string, evento: Event) {
  archivos[campo] = (evento.target as HTMLInputElement).files?.[0]
}

async function enviar() {
  error.value = ''
  cargando.value = true
  try {
    const datos = new FormData()
    Object.entries(form).forEach(([clave, valor]) => datos.append(clave, valor))
    datos.append('rubroId', String(rubroId.value))
    Object.entries(archivos).forEach(([campo, archivo]) => {
      if (archivo) datos.append(campo, archivo)
    })
    await api('/empresas/registro', { method: 'POST', body: datos })
    enviado.value = true
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-xl">
    <div v-if="enviado">
      <h1 class="mb-2 text-2xl font-semibold text-guinda-900">Solicitud enviada</h1>
      <p class="text-stone-700">
        GADOR revisará los datos de tu empresa. Podrás ingresar con tu correo y consultar el estado
        de la validación desde tu panel.
      </p>
      <RouterLink to="/login" class="mt-4 inline-block font-medium text-guinda-700 underline">
        Ir a ingresar
      </RouterLink>
    </div>

    <template v-else>
      <h1 class="mb-6 text-2xl font-semibold text-guinda-900">Registrar empresa</h1>
      <form class="space-y-4" @submit.prevent="enviar">
        <BaseInput v-model="form.nit" label="NIT" />
        <BaseInput v-model="form.razonSocial" label="Razón social" />
        <BaseSelect v-model="rubroId" label="Rubro" :opciones="rubros" />
        <BaseInput v-model="form.representanteLegal" label="Representante legal" />
        <BaseInput v-model="form.ciRepresentante" label="CI del representante" />
        <BaseInput v-model="form.celular" label="Celular" type="tel" ayuda="8 dígitos, por ejemplo 71234567" />
        <BaseInput v-model="form.emailCorporativo" label="Correo corporativo" type="email" ayuda="Lo usarás para ingresar" />
        <BaseInput v-model="form.direccion" label="Dirección" />
        <BaseTextarea v-model="form.descripcion" label="Descripción de la empresa" />
        <BaseInput
          v-model="form.password"
          label="Contraseña"
          type="password"
          autocomplete="new-password"
          ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número"
        />

        <label class="block">
          <span class="mb-1 block text-sm font-medium">Documento NIT (PDF, máx. 5 MB)</span>
          <input type="file" accept="application/pdf" required class="block w-full text-sm" @change="elegirArchivo('documentoNit', $event)" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Respaldo legal (PDF, máx. 5 MB)</span>
          <input type="file" accept="application/pdf" required class="block w-full text-sm" @change="elegirArchivo('documentoLegal', $event)" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Logo (PNG o JPG, máx. 2 MB; opcional)</span>
          <input type="file" accept="image/png,image/jpeg" class="block w-full text-sm" @change="elegirArchivo('logo', $event)" />
        </label>

        <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
        <BaseButton :cargando="cargando">Enviar solicitud</BaseButton>
      </form>
    </template>
  </section>
</template>
