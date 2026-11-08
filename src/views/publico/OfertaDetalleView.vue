<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, mensajeError } from '@/api'
import type { Oferta } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id as string

const oferta = ref<Oferta | null>(null)
const error = ref('')
const exito = ref('')
const favorito = ref(false)
const cargando = ref(false)

const esPostulante = computed(() => auth.usuario?.rol === 'POSTULANTE')
const NIVELES = ['', 'Básico', 'Intermedio', 'Avanzado']

onMounted(async () => {
  try {
    oferta.value = await api<Oferta>(`/ofertas/${id}`)
    if (esPostulante.value) {
      const lista = await api<{ oferta: { id: number } }[]>('/postulaciones/favoritos')
      favorito.value = lista.some((f) => f.oferta.id === Number(id))
    }
  } catch (e) {
    error.value = mensajeError(e)
  }
})

async function postular() {
  if (!auth.usuario) {
    await router.push({ name: 'login', query: { volver: route.fullPath } })
    return
  }
  error.value = ''
  cargando.value = true
  try {
    const r = await api<{ porcentajeMatch: number }>(`/postulaciones/oferta/${id}`, { method: 'POST' })
    exito.value = `Postulación enviada. Tu compatibilidad es de ${r.porcentajeMatch} %.`
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}

async function alternarFavorito() {
  error.value = ''
  try {
    await api(`/postulaciones/favoritos/${id}`, { method: favorito.value ? 'DELETE' : 'POST' })
    favorito.value = !favorito.value
  } catch (e) {
    error.value = mensajeError(e)
  }
}
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <p v-if="error && !oferta" role="alert" class="text-red-700">{{ error }}</p>

    <template v-if="oferta">
      <h1 class="text-2xl font-semibold break-words text-guinda-900">{{ oferta.titulo }}</h1>
      <p class="mt-1">{{ oferta.empresa?.razonSocial }}</p>
      <p class="mt-1 text-sm text-stone-600">
        {{ oferta.municipio.nombre }} · {{ oferta.modalidad.nombre }} · {{ oferta.tipoContrato.nombre }} ·
        {{ oferta.salarioATratar ? 'Salario a tratar' : `Bs ${oferta.salarioMin} – ${oferta.salarioMax}` }}
      </p>
      <p class="mt-1 text-sm text-stone-600">
        {{ oferta.numeroPlazas }} plaza(s) · {{ oferta.aniosExperiencia }} año(s) de experiencia · Cierra el {{ oferta.fechaCierre }}
      </p>

      <div v-if="!auth.usuario || esPostulante" class="mt-5 flex flex-col gap-2 sm:flex-row">
        <div class="sm:w-48"><BaseButton v-if="!exito" type="button" :cargando="cargando" @click="postular">Postular</BaseButton></div>
        <AccionBoton v-if="esPostulante" @click="alternarFavorito">
          {{ favorito ? 'Quitar de favoritos' : 'Guardar en favoritos' }}
        </AccionBoton>
      </div>
      <p v-if="exito" role="status" class="mt-3 rounded-md bg-green-100 p-3 text-sm text-green-900">{{ exito }}</p>
      <p v-if="error" role="alert" class="mt-3 text-sm text-red-700">
        {{ error }}
        <RouterLink v-if="error.includes('perfil')" to="/perfil" class="font-medium underline">Completar mi perfil</RouterLink>
      </p>

      <div class="mt-6 space-y-5">
        <div><h2 class="mb-1 font-semibold">Descripción</h2><p class="whitespace-pre-line">{{ oferta.descripcion }}</p></div>
        <div><h2 class="mb-1 font-semibold">Requisitos obligatorios</h2><p class="whitespace-pre-line">{{ oferta.requisitosObligatorios }}</p></div>
        <div v-if="oferta.requisitosDeseables"><h2 class="mb-1 font-semibold">Requisitos deseables</h2><p class="whitespace-pre-line">{{ oferta.requisitosDeseables }}</p></div>
        <div>
          <h2 class="mb-1 font-semibold">Habilidades</h2>
          <ul class="list-disc pl-5">
            <li v-for="h in oferta.habilidades" :key="h.habilidad.id">
              {{ h.habilidad.nombre }}: {{ NIVELES[h.nivelMinimo] }} ({{ h.obligatoria ? 'obligatoria' : 'deseable' }})
            </li>
          </ul>
        </div>
        <div><h2 class="mb-1 font-semibold">Profesiones</h2><p>{{ oferta.profesiones.map((p) => p.nombre).join(', ') }}</p></div>
        <div v-if="oferta.beneficios"><h2 class="mb-1 font-semibold">Beneficios</h2><p class="whitespace-pre-line">{{ oferta.beneficios }}</p></div>
        <div v-if="oferta.empresa"><h2 class="mb-1 font-semibold">Sobre la empresa</h2><p class="whitespace-pre-line">{{ oferta.empresa.descripcion }}</p></div>
      </div>
    </template>
  </section>
</template>
