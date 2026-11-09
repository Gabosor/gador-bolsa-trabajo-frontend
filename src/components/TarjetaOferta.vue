<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BadgeCheck, Banknote, Clock3, Heart, MapPin, Monitor } from 'lucide-vue-next'
import type { Oferta } from '@/api/tipos'
import { useAuthStore } from '@/stores/auth'
import { useInteraccionesStore } from '@/stores/interacciones'
import { diasParaCierre, iniciales, salario, textoCierre } from '@/utils/formato'

const props = defineProps<{ oferta: Oferta }>()

const auth = useAuthStore()
const interacciones = useInteraccionesStore()
const router = useRouter()

const puedeGuardar = computed(() => !auth.usuario || auth.usuario.rol === 'POSTULANTE')
const guardada = computed(() => interacciones.favoritos.has(props.oferta.id))
const postulada = computed(() => interacciones.postulaciones.has(props.oferta.id))
const urgente = computed(() => diasParaCierre(props.oferta.fechaCierre) <= 3)

function guardar() {
  if (!auth.usuario) {
    router.push({ name: 'login', query: { volver: `/ofertas/${props.oferta.id}` } })
    return
  }
  interacciones.alternarFavorito(props.oferta.id)
}
</script>

<template>
  <article class="relative flex gap-3 bg-white p-4 hover:bg-guinda-50/50">
    <img v-if="oferta.empresa?.logoUrl" :src="oferta.empresa.logoUrl" alt="" class="size-12 shrink-0 rounded-campo border border-linea object-contain" />
    <span v-else class="flex size-12 shrink-0 items-center justify-center rounded-campo bg-salar font-titulo font-bold text-roca" aria-hidden="true">
      {{ iniciales(oferta.empresa?.razonSocial ?? '') }}
    </span>

    <div class="min-w-0 flex-1 pr-9">
      <h2 class="text-lg font-bold break-words text-guinda-900">
        <RouterLink :to="`/ofertas/${oferta.id}`" class="after:absolute after:inset-0">{{ oferta.titulo }}</RouterLink>
      </h2>
      <p class="truncate">{{ oferta.empresa?.razonSocial }}</p>
      <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base text-roca">
        <li class="flex items-center gap-1"><MapPin class="size-4" aria-hidden="true" />{{ oferta.municipio.nombre }}</li>
        <li class="flex items-center gap-1"><Monitor class="size-4" aria-hidden="true" />{{ oferta.modalidad.nombre }}</li>
        <li class="flex items-center gap-1"><Banknote class="size-4" aria-hidden="true" />{{ salario(oferta) }}</li>
      </ul>
      <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span class="flex items-center gap-1 text-base" :class="urgente ? 'font-semibold text-alerta' : 'text-roca'">
          <Clock3 class="size-4" aria-hidden="true" />{{ textoCierre(oferta.fechaCierre) }}
        </span>
        <span v-if="postulada" class="flex items-center gap-1 text-base font-semibold text-exito">
          <BadgeCheck class="size-4" aria-hidden="true" />Ya postulaste
        </span>
      </div>
    </div>

    <button
      v-if="puedeGuardar"
      type="button"
      class="absolute top-2 right-2 z-10 flex size-11 items-center justify-center rounded-full hover:bg-salar"
      :aria-pressed="guardada"
      :aria-label="guardada ? `Quitar ${oferta.titulo} de guardadas` : `Guardar ${oferta.titulo}`"
      @click="guardar"
    >
      <Heart class="size-6" :class="guardada ? 'fill-oro text-oro' : 'text-roca'" aria-hidden="true" />
    </button>
  </article>
</template>
