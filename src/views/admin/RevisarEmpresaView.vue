<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { Empresa, EstadoEmpresa } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'
import LogoEmpresa from '@/components/LogoEmpresa.vue'
import TextoFormateado from '@/components/TextoFormateado.vue'
import VistaDocumento from '@/components/VistaDocumento.vue'
import { useAvisosStore } from '@/stores/avisos'
import { pedirTexto } from '@/utils/confirmar'
import { fechaHora } from '@/utils/formato'
import { volverALista } from '@/utils/revision'

const route = useRoute()
const router = useRouter()
const avisos = useAvisosStore()
const empresa = ref<Empresa | null>(null)
const error = ref('')
const enviando = ref(false)

async function cargar() {
  error.value = ''
  try {
    empresa.value = await api<Empresa>(`/empresas/${route.params.id}`)
  } catch (e) {
    error.value = mensajeError(e)
  }
}

async function cambiar(estado: EstadoEmpresa, mensaje: string, motivo?: string) {
  const actual = empresa.value
  if (!actual || enviando.value) return
  enviando.value = true
  try {
    await api(`/empresas/${actual.id}/estado`, { method: 'PATCH', body: { estado, motivo } })
    avisos.exito(mensaje)
    volverALista(router, 'admin-empresas', actual.estado)
  } catch (e) {
    // Otro administrador pudo decidir antes: se muestra el estado real.
    avisos.error(mensajeError(e))
    await cargar()
  } finally {
    enviando.value = false
  }
}

async function conMotivo(estado: EstadoEmpresa, titulo: string, accion: string, mensaje: string) {
  if (!empresa.value) return
  const motivo = await pedirTexto({
    titulo,
    mensaje: empresa.value.razonSocial,
    accion,
    peligro: true,
    campo: { etiqueta: 'Motivo para la empresa', multilinea: true },
  })
  if (motivo !== null) await cambiar(estado, mensaje, motivo)
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-6xl pb-24 lg:pb-0">
    <RouterLink :to="{ name: 'admin-empresas', query: empresa ? { estado: empresa.estado } : undefined }" class="mb-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-guinda-700">
      <ArrowLeft class="size-5" aria-hidden="true" />Empresas
    </RouterLink>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!empresa && !error" />

    <div v-else-if="empresa" class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="min-w-0 space-y-4">
        <header class="plano flex items-center gap-4 p-4">
          <LogoEmpresa :nombre="empresa.razonSocial" :url="empresa.logoUrl" tamano="lg" />
          <div class="min-w-0">
            <h1 class="titulo-pagina break-words">{{ empresa.razonSocial }}</h1>
            <p class="text-roca">NIT {{ empresa.nit }} · {{ empresa.rubro.nombre }}</p>
          </div>
        </header>

        <div class="plano p-4">
          <h2 class="mb-3 text-lg font-bold">Datos de la empresa</h2>
          <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div><dt class="text-base text-roca">Representante legal</dt><dd class="break-words">{{ empresa.representanteLegal }}</dd></div>
            <div><dt class="text-base text-roca">CI del representante</dt><dd>{{ empresa.ciRepresentante }}</dd></div>
            <div><dt class="text-base text-roca">Celular</dt><dd><a :href="`tel:${empresa.celular}`" class="text-guinda-700 underline">{{ empresa.celular }}</a></dd></div>
            <div><dt class="text-base text-roca">Correo</dt><dd class="break-all"><a :href="`mailto:${empresa.emailCorporativo}`" class="text-guinda-700 underline">{{ empresa.emailCorporativo }}</a></dd></div>
            <div class="sm:col-span-2"><dt class="text-base text-roca">Dirección</dt><dd class="break-words">{{ empresa.direccion }}</dd></div>
            <div v-if="empresa.createdAt"><dt class="text-base text-roca">Registrada</dt><dd>{{ fechaHora(empresa.createdAt) }}</dd></div>
          </dl>
          <h3 class="mt-4 mb-1 font-bold">Descripción</h3>
          <TextoFormateado :texto="empresa.descripcion" />
        </div>

        <VistaDocumento titulo="Documento NIT" :url="empresa.documentoNitUrl" @recargar="cargar" />
        <VistaDocumento titulo="Respaldo legal" :url="empresa.documentoLegalUrl" @recargar="cargar" />
      </div>

      <aside class="plano space-y-3 p-4 lg:sticky lg:top-8" aria-label="Decisión">
        <div class="flex items-center gap-3">
          <LogoEmpresa :nombre="empresa.razonSocial" :url="empresa.logoUrl" />
          <p class="min-w-0 font-semibold break-words">{{ empresa.razonSocial }}</p>
        </div>
        <EstadoBadge :estado="empresa.estado" />
        <p v-if="empresa.motivoRechazo" class="rounded-campo bg-error-50 p-3 text-error"><strong>Motivo:</strong> {{ empresa.motivoRechazo }}</p>
        <p v-if="empresa.estado === 'PENDIENTE_VALIDACION'" class="text-base text-roca">Revisa los datos y los documentos antes de decidir.</p>
        <div class="barra-accion flex gap-2 lg:flex-col">
          <AccionBoton v-if="empresa.estado !== 'APROBADA'" variante="primario" class="flex-1 lg:w-full" :disabled="enviando" @click="cambiar('APROBADA', 'Empresa aprobada')">Aprobar</AccionBoton>
          <AccionBoton v-if="empresa.estado === 'PENDIENTE_VALIDACION'" variante="peligro" class="lg:w-full" :disabled="enviando" @click="conMotivo('RECHAZADA', 'Rechazar empresa', 'Rechazar', 'Empresa rechazada')">Rechazar</AccionBoton>
          <AccionBoton v-if="empresa.estado === 'APROBADA'" variante="peligro" class="flex-1 lg:w-full" :disabled="enviando" @click="conMotivo('SUSPENDIDA', 'Suspender empresa', 'Suspender', 'Empresa suspendida')">Suspender</AccionBoton>
        </div>
      </aside>
    </div>
  </section>
</template>
