<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Building2, Search } from 'lucide-vue-next'
import { api } from '@/api'
import type { Oferta, Paginado } from '@/api/tipos'
import TarjetaOferta from '@/components/TarjetaOferta.vue'

const PASOS = [
  { titulo: 'GADOR valida a la empresa', texto: 'Revisa su NIT y su respaldo legal antes de darle acceso.' },
  { titulo: 'GADOR aprueba cada oferta', texto: 'Ninguna oferta se publica sin esa revisión.' },
  { titulo: 'Postulas con tu hoja de vida', texto: 'Con el perfil completo, postular toma un toque y ves cada avance.' },
]

const router = useRouter()
const q = ref('')
const recientes = ref<Oferta[]>([])

function buscar() {
  const texto = q.value.trim()
  router.push({ path: '/ofertas', query: texto ? { q: texto } : {} })
}

onMounted(async () => {
  try {
    const r = await api<Paginado<Oferta>>('/ofertas', { query: { limit: 4 } })
    recientes.value = r.data
  } catch {
    // Sin ofertas recientes la portada sigue siendo útil.
  }
})
</script>

<template>
  <div class="space-y-8">
    <section class="-mx-4 -mt-5 bg-guinda-800 px-4 py-8 text-white lg:mx-0 lg:mt-0 lg:rounded-hoja lg:p-12">
      <div class="flex items-center gap-10">
        <div class="min-w-0 flex-1">
          <h1 class="max-w-2xl text-[2.25rem] leading-[1.08] font-bold lg:text-[3.25rem]">
            Empleo en Oruro, con empresas validadas por la Gobernación
          </h1>
          <p class="mt-3 max-w-xl text-lg text-guinda-100">
            Crea tu hoja de vida digital y postula a ofertas revisadas una por una.
          </p>
          <form class="mt-6 flex max-w-xl gap-2" role="search" @submit.prevent="buscar">
            <div class="relative min-w-0 flex-1">
              <Search class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-roca" aria-hidden="true" />
              <input v-model="q" type="search" enterkeyhint="search" aria-label="Buscar empleo" placeholder="Cargo o tema" class="campo pl-10" />
            </div>
            <button class="min-h-12 rounded-campo bg-white px-5 font-semibold text-guinda-800 hover:bg-guinda-50">Buscar</button>
          </form>
          <RouterLink to="/registro" class="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-2">Crear mi cuenta de postulante</RouterLink>
        </div>
        <img src="/img/logo2.svg" alt="Gobierno Autónomo Departamental de Oruro" class="hidden size-48 shrink-0 rounded-hoja bg-white p-3 lg:block" />
      </div>
    </section>

    <section v-if="recientes.length">
      <div class="mb-2 flex items-baseline justify-between gap-3">
        <h2 class="text-2xl font-bold text-guinda-900">Ofertas recientes</h2>
        <RouterLink to="/ofertas" class="enlace inline-flex min-h-11 items-center whitespace-nowrap">Ver todas</RouterLink>
      </div>
      <ul class="plano divide-y divide-linea overflow-hidden">
        <li v-for="o in recientes" :key="o.id"><TarjetaOferta :oferta="o" /></li>
      </ul>
    </section>

    <section>
      <h2 class="mb-3 text-2xl font-bold text-guinda-900">Así se cuida cada oferta</h2>
      <ol class="grid gap-4 md:grid-cols-3">
        <li v-for="(p, i) in PASOS" :key="p.titulo" class="flex gap-3 md:block">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-guinda-700 font-titulo font-bold text-white md:mb-2">{{ i + 1 }}</span>
          <div>
            <h3 class="text-lg font-bold">{{ p.titulo }}</h3>
            <p class="text-roca">{{ p.texto }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="plano flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-3">
        <Building2 class="mt-0.5 size-7 shrink-0 text-lago" aria-hidden="true" />
        <div>
          <h2 class="text-xl font-bold">¿Tu empresa busca personal?</h2>
          <p class="text-roca">Regístrala con tu NIT y publica ofertas cuando GADOR la apruebe.</p>
        </div>
      </div>
      <RouterLink to="/empresas/registro" class="flex min-h-12 shrink-0 items-center justify-center rounded-campo border border-guinda-700 px-4 font-semibold text-guinda-700 hover:bg-guinda-50">Registrar empresa</RouterLink>
    </section>
  </div>
</template>
