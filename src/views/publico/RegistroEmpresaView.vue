<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { CircleCheck } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { ItemCatalogo } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import CargaArchivo from '@/components/CargaArchivo.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import Faja from '@/components/Faja.vue'
import RequisitosPassword, { passwordValida } from '@/components/RequisitosPassword.vue'

const PASOS = ['Empresa', 'Representante y acceso', 'Documentos']

const paso = ref(0)
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
const archivos = reactive<Record<string, File | undefined>>({})
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

function avanzar() {
  error.value = ''
  if (paso.value === 1 && !passwordValida(form.password)) {
    error.value = 'La contraseña todavía no cumple los requisitos.'
    return
  }
  paso.value += 1
  window.scrollTo({ top: 0 })
}

async function enviar() {
  error.value = ''
  if (!archivos.documentoNit || !archivos.documentoLegal) {
    error.value = 'Adjunta el documento NIT y el respaldo legal.'
    return
  }
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
    <EstadoVacio
      v-if="enviado"
      :icono="CircleCheck"
      titulo="Solicitud enviada"
      texto="GADOR revisará los datos de tu empresa. Ingresa con tu correo para consultar el estado de la validación."
    >
      <RouterLink to="/login"><AccionBoton variante="primario">Ir a ingresar</AccionBoton></RouterLink>
    </EstadoVacio>

    <template v-else>
      <h1 class="titulo-pagina">Registrar empresa</h1>
      <p class="mt-1 text-roca">GADOR valida cada empresa antes de que pueda publicar ofertas.</p>

      <div class="mt-3 mb-4">
        <p class="mb-1.5 font-semibold">Paso {{ paso + 1 }} de {{ PASOS.length }}: {{ PASOS[paso] }}</p>
        <Faja :total="PASOS.length" :completos="paso + 1" :etiqueta="`Paso ${paso + 1} de ${PASOS.length}`" />
      </div>

      <form class="plano space-y-4 p-4" @submit.prevent="paso === PASOS.length - 1 ? enviar() : avanzar()">
        <template v-if="paso === 0">
          <BaseInput v-model="form.nit" label="NIT" inputmode="numeric" pattern="[0-9]{5,20}" titulo="Solo números" />
          <BaseInput v-model="form.razonSocial" label="Razón social" />
          <BaseSelect v-model="rubroId" label="Rubro" :opciones="rubros" />
          <BaseInput v-model="form.direccion" label="Dirección" autocomplete="street-address" />
          <BaseTextarea v-model="form.descripcion" label="Descripción de la empresa" ayuda="Los postulantes la verán en tus ofertas." />
        </template>

        <template v-else-if="paso === 1">
          <BaseInput v-model="form.representanteLegal" label="Representante legal" />
          <BaseInput v-model="form.ciRepresentante" label="CI del representante" inputmode="numeric" />
          <BaseInput v-model="form.celular" label="Celular" type="tel" inputmode="tel" :maxlength="8" pattern="[67][0-9]{7}" titulo="8 dígitos, empieza con 6 o 7" />
          <BaseInput v-model="form.emailCorporativo" label="Correo corporativo" type="email" inputmode="email" autocomplete="email" ayuda="Lo usarás para ingresar." />
          <div>
            <BaseInput v-model="form.password" label="Contraseña" type="password" autocomplete="new-password" />
            <RequisitosPassword :valor="form.password" />
          </div>
        </template>

        <template v-else>
          <CargaArchivo etiqueta="Documento NIT" :tipos="['application/pdf']" :max-mb="5" ayuda="PDF, hasta 5 MB" @elegir="archivos.documentoNit = $event" />
          <CargaArchivo etiqueta="Respaldo legal" :tipos="['application/pdf']" :max-mb="5" ayuda="PDF, hasta 5 MB" @elegir="archivos.documentoLegal = $event" />
          <CargaArchivo etiqueta="Logo (opcional)" :tipos="['image/png', 'image/jpeg']" :max-mb="2" ayuda="PNG o JPG, hasta 2 MB" @elegir="archivos.logo = $event" />
        </template>

        <p v-if="error" role="alert" class="text-error">{{ error }}</p>

        <div class="flex flex-col-reverse gap-2 border-t border-linea pt-4 sm:flex-row sm:justify-between">
          <AccionBoton v-if="paso > 0" class="min-h-12!" @click="paso -= 1">Anterior</AccionBoton>
          <span v-else class="hidden sm:block" />
          <div class="sm:min-w-44">
            <BaseButton :cargando="cargando" texto-cargando="Enviando…">{{ paso === PASOS.length - 1 ? 'Enviar solicitud' : 'Siguiente' }}</BaseButton>
          </div>
        </div>
      </form>
      <p class="mt-4 text-center">¿Ya registraste tu empresa? <RouterLink to="/login" class="enlace">Ingresa</RouterLink></p>
    </template>
  </section>
</template>
