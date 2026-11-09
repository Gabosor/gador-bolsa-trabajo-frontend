<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronRight, ClipboardCheck } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { EstadoOferta, Oferta, Paginado } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import { useAvisosStore } from '@/stores/avisos'
import { pedirTexto } from '@/utils/confirmar'
import { nombreNivel, plural, salario, textoCierre } from '@/utils/formato'

const avisos = useAvisosStore()
const ofertas = ref<Oferta[]>([])
const abierta = ref<Oferta | null>(null)
const error = ref('')
const cargada = ref(false)

const hojaAbierta = computed({
  get: () => abierta.value !== null,
  set: (valor) => {
    if (!valor) abierta.value = null
  },
})

async function cargar() {
  error.value = ''
  try {
    const r = await api<Paginado<Oferta>>('/ofertas/revision', { query: { limit: 100 } })
    ofertas.value = r.data
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
}

async function decidir(o: Oferta, estado: EstadoOferta, mensaje: string, motivo?: string) {
  try {
    await api(`/ofertas/${o.id}/estado`, { method: 'PATCH', body: { estado, motivo } })
    abierta.value = null
    avisos.exito(mensaje)
    await cargar()
  } catch (e) {
    avisos.error(mensajeError(e))
  }
}

async function rechazar() {
  const oferta = abierta.value
  if (!oferta) return
  abierta.value = null
  const motivo = await pedirTexto({
    titulo: 'Devolver a la empresa',
    mensaje: oferta.titulo,
    accion: 'Devolver',
    peligro: true,
    campo: { etiqueta: 'Qué debe corregir', multilinea: true },
  })
  if (motivo === null) abierta.value = oferta
  else await decidir(oferta, 'BORRADOR', 'Oferta devuelta a la empresa', motivo)
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="titulo-pagina mb-3">Revisión de ofertas</h1>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="ofertas.length === 0 && !error" :icono="ClipboardCheck" titulo="No hay ofertas por revisar" texto="Las ofertas enviadas por las empresas aparecerán aquí." />

    <ul v-else class="plano divide-y divide-linea overflow-hidden">
      <li v-for="o in ofertas" :key="o.id">
        <button type="button" class="flex min-h-16 w-full items-center gap-3 p-3 text-left hover:bg-guinda-50/50" @click="abierta = o">
          <span class="min-w-0 flex-1">
            <span class="block font-semibold break-words">{{ o.titulo }}</span>
            <span class="block text-base text-roca">{{ o.empresa?.razonSocial }}. {{ textoCierre(o.fechaCierre) }}</span>
          </span>
          <ChevronRight class="size-5 shrink-0 text-roca" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <HojaInferior v-model="hojaAbierta" :titulo="abierta?.titulo ?? 'Oferta'">
      <div v-if="abierta" class="space-y-4">
        <p class="font-semibold">{{ abierta.empresa?.razonSocial }}</p>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
          <div><dt class="text-base text-roca">Contrato</dt><dd>{{ abierta.tipoContrato.nombre }}</dd></div>
          <div><dt class="text-base text-roca">Modalidad</dt><dd>{{ abierta.modalidad.nombre }}</dd></div>
          <div><dt class="text-base text-roca">Municipio</dt><dd>{{ abierta.municipio.nombre }}</dd></div>
          <div><dt class="text-base text-roca">Salario</dt><dd>{{ salario(abierta) }}</dd></div>
          <div><dt class="text-base text-roca">Plazas</dt><dd>{{ plural(abierta.numeroPlazas, 'plaza') }}</dd></div>
          <div><dt class="text-base text-roca">Cierre</dt><dd>{{ textoCierre(abierta.fechaCierre) }}</dd></div>
        </dl>
        <div><h3 class="font-bold">Descripción</h3><p class="break-words whitespace-pre-line">{{ abierta.descripcion }}</p></div>
        <div><h3 class="font-bold">Requisitos obligatorios</h3><p class="break-words whitespace-pre-line">{{ abierta.requisitosObligatorios }}</p></div>
        <div v-if="abierta.requisitosDeseables"><h3 class="font-bold">Requisitos deseables</h3><p class="break-words whitespace-pre-line">{{ abierta.requisitosDeseables }}</p></div>
        <div><h3 class="font-bold">Profesiones</h3><p>{{ abierta.profesiones.map((p) => p.nombre).join(', ') }}</p></div>
        <div>
          <h3 class="font-bold">Habilidades</h3>
          <ul><li v-for="h in abierta.habilidades" :key="h.habilidad.id">{{ h.habilidad.nombre }}: {{ nombreNivel(h.nivelMinimo) }}, {{ h.obligatoria ? 'obligatoria' : 'deseable' }}</li></ul>
        </div>
        <div v-if="abierta.beneficios"><h3 class="font-bold">Beneficios</h3><p class="break-words whitespace-pre-line">{{ abierta.beneficios }}</p></div>
        <div class="sticky bottom-0 -mx-4 flex gap-2 border-t border-linea bg-white px-4 py-3">
          <AccionBoton variante="peligro" @click="rechazar">Devolver</AccionBoton>
          <AccionBoton variante="primario" class="flex-1" @click="decidir(abierta!, 'PUBLICADA', 'Oferta publicada')">Aprobar y publicar</AccionBoton>
        </div>
      </div>
    </HojaInferior>
  </section>
</template>
