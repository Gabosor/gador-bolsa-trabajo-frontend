<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, TriangleAlert } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import type { EstadoOferta, Oferta } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoBadge from '@/components/EstadoBadge.vue'
import LogoEmpresa from '@/components/LogoEmpresa.vue'
import TextoFormateado from '@/components/TextoFormateado.vue'
import { useAvisosStore } from '@/stores/avisos'
import { pedirTexto } from '@/utils/confirmar'
import { fecha, fechaHora, nombreNivel, plural, salario, textoCierre } from '@/utils/formato'
import { volverALista } from '@/utils/revision'

const route = useRoute()
const router = useRouter()
const avisos = useAvisosStore()
const oferta = ref<Oferta | null>(null)
const error = ref('')
const enviando = ref(false)

async function cargar() {
  error.value = ''
  try {
    oferta.value = await api<Oferta>(`/ofertas/revision/${route.params.id}`)
  } catch (e) {
    error.value = mensajeError(e)
  }
}

async function decidir(estado: EstadoOferta, mensaje: string, motivo?: string) {
  const actual = oferta.value
  if (!actual || enviando.value) return
  enviando.value = true
  try {
    await api(`/ofertas/${actual.id}/estado`, { method: 'PATCH', body: { estado, motivo } })
    avisos.exito(mensaje)
    volverALista(router, 'admin-ofertas')
  } catch (e) {
    avisos.error(mensajeError(e))
    await cargar()
  } finally {
    enviando.value = false
  }
}

async function devolver() {
  if (!oferta.value) return
  const motivo = await pedirTexto({
    titulo: 'Devolver a la empresa',
    mensaje: oferta.value.titulo,
    accion: 'Devolver',
    peligro: true,
    campo: { etiqueta: 'Qué debe corregir', multilinea: true },
  })
  if (motivo !== null) await decidir('BORRADOR', 'Oferta devuelta a la empresa', motivo)
}

onMounted(cargar)
</script>

<template>
  <section class="mx-auto max-w-6xl pb-24 lg:pb-0">
    <RouterLink :to="{ name: 'admin-ofertas' }" class="mb-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-guinda-700">
      <ArrowLeft class="size-5" aria-hidden="true" />Ofertas
    </RouterLink>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!oferta && !error" />

    <div v-else-if="oferta" class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
      <article class="min-w-0 space-y-4">
        <header class="plano p-4">
          <h1 class="titulo-pagina break-words">{{ oferta.titulo }}</h1>
          <p class="mt-1 text-lg">{{ oferta.empresa?.razonSocial }}</p>
          <dl class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <div><dt class="text-base text-roca">Contrato</dt><dd>{{ oferta.tipoContrato.nombre }}</dd></div>
            <div><dt class="text-base text-roca">Modalidad</dt><dd>{{ oferta.modalidad.nombre }}</dd></div>
            <div><dt class="text-base text-roca">Municipio</dt><dd>{{ oferta.municipio.nombre }}</dd></div>
            <div><dt class="text-base text-roca">Salario</dt><dd>{{ salario(oferta) }}</dd></div>
            <div><dt class="text-base text-roca">Plazas</dt><dd>{{ plural(oferta.numeroPlazas, 'plaza') }}</dd></div>
            <div><dt class="text-base text-roca">Experiencia</dt><dd>{{ oferta.aniosExperiencia ? plural(oferta.aniosExperiencia, 'año') : 'Sin experiencia' }}</dd></div>
            <div><dt class="text-base text-roca">Cierre</dt><dd>{{ fecha(oferta.fechaCierre) }} ({{ textoCierre(oferta.fechaCierre) }})</dd></div>
            <div v-if="oferta.updatedAt"><dt class="text-base text-roca">Enviada</dt><dd>{{ fechaHora(oferta.updatedAt) }}</dd></div>
          </dl>
        </header>

        <div class="plano space-y-4 p-4">
          <section><h2 class="mb-1 text-lg font-bold">Descripción</h2><TextoFormateado :texto="oferta.descripcion" /></section>
          <section><h2 class="mb-1 text-lg font-bold">Requisitos obligatorios</h2><TextoFormateado :texto="oferta.requisitosObligatorios" /></section>
          <section v-if="oferta.requisitosDeseables"><h2 class="mb-1 text-lg font-bold">Requisitos deseables</h2><TextoFormateado :texto="oferta.requisitosDeseables" /></section>
          <section v-if="oferta.beneficios"><h2 class="mb-1 text-lg font-bold">Beneficios</h2><TextoFormateado :texto="oferta.beneficios" /></section>
        </div>

        <div class="plano space-y-4 p-4">
          <section>
            <h2 class="mb-2 text-lg font-bold">Profesiones</h2>
            <ul class="flex flex-wrap gap-2">
              <li v-for="p in oferta.profesiones" :key="p.id" class="rounded-full bg-salar px-3 py-1">{{ p.nombre }}</li>
            </ul>
          </section>
          <section>
            <h2 class="mb-2 text-lg font-bold">Habilidades</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead class="text-base text-roca">
                  <tr><th scope="col" class="py-2 pr-4 font-semibold">Habilidad</th><th scope="col" class="py-2 pr-4 font-semibold">Nivel mínimo</th><th scope="col" class="py-2 font-semibold">Tipo</th></tr>
                </thead>
                <tbody class="divide-y divide-linea">
                  <tr v-for="h in oferta.habilidades" :key="h.habilidad.id">
                    <td class="py-2 pr-4 break-words">{{ h.habilidad.nombre }}</td>
                    <td class="py-2 pr-4">{{ nombreNivel(h.nivelMinimo) }}</td>
                    <td class="py-2">{{ h.obligatoria ? 'Obligatoria' : 'Deseable' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section v-if="oferta.empresa" class="plano p-4">
          <h2 class="mb-2 text-lg font-bold">Sobre la empresa</h2>
          <TextoFormateado :texto="oferta.empresa.descripcion" />
          <RouterLink :to="{ name: 'admin-empresa', params: { id: oferta.empresa.id } }" class="mt-3 inline-flex min-h-11 items-center font-semibold text-guinda-700 underline">Ver la ficha de la empresa</RouterLink>
        </section>
      </article>

      <aside class="plano space-y-3 p-4 lg:sticky lg:top-8" aria-label="Decisión">
        <div v-if="oferta.empresa" class="flex items-center gap-3">
          <LogoEmpresa :nombre="oferta.empresa.razonSocial" :url="oferta.empresa.logoUrl" />
          <div class="min-w-0">
            <p class="font-semibold break-words">{{ oferta.empresa.razonSocial }}</p>
            <p class="text-base text-roca">{{ oferta.empresa.rubro?.nombre }}</p>
          </div>
        </div>
        <EstadoBadge :estado="oferta.estado" />
        <p v-if="oferta.empresa && oferta.empresa.estado !== 'APROBADA'" class="flex gap-2 rounded-campo bg-alerta-50 p-3 text-base">
          <TriangleAlert class="size-5 shrink-0 text-alerta" aria-hidden="true" />
          <span>La empresa no está aprobada; la oferta no se podrá publicar hasta que lo esté.</span>
        </p>
        <p v-if="oferta.motivoRechazo" class="rounded-campo bg-error-50 p-3 text-error"><strong>Motivo anterior:</strong> {{ oferta.motivoRechazo }}</p>
        <div v-if="oferta.estado === 'EN_REVISION_GADOR'" class="barra-accion flex gap-2 lg:flex-col">
          <AccionBoton variante="primario" class="flex-1 lg:w-full" :disabled="enviando" @click="decidir('PUBLICADA', 'Oferta publicada')">Aprobar y publicar</AccionBoton>
          <AccionBoton variante="peligro" class="lg:w-full" :disabled="enviando" @click="devolver">Devolver</AccionBoton>
        </div>
        <p v-else class="text-base text-roca">Esta oferta ya no está en revisión.</p>
      </aside>
    </div>
  </section>
</template>
