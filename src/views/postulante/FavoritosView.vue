<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BadgeCheck, Clock3, Heart, HeartOff } from 'lucide-vue-next'
import { api, mensajeError } from '@/api'
import AccionBoton from '@/components/AccionBoton.vue'
import Esqueleto from '@/components/Esqueleto.vue'
import EstadoVacio from '@/components/EstadoVacio.vue'
import { useInteraccionesStore } from '@/stores/interacciones'
import { diasParaCierre, textoCierre } from '@/utils/formato'

interface Favorito {
  id: number
  oferta: { id: number; titulo: string; estado: string; fechaCierre: string; empresa: { razonSocial: string } }
}

const interacciones = useInteraccionesStore()
const favoritos = ref<Favorito[]>([])
const error = ref('')
const cargada = ref(false)

const disponible = (f: Favorito) => f.oferta.estado === 'PUBLICADA' && diasParaCierre(f.oferta.fechaCierre) >= 0

/** Primero lo que está por cerrar; lo que ya no admite postulantes va al final. */
const ordenados = computed(() =>
  favoritos.value
    .filter((f) => interacciones.favoritos.has(f.oferta.id))
    .sort((a, b) => Number(disponible(b)) - Number(disponible(a)) || a.oferta.fechaCierre.localeCompare(b.oferta.fechaCierre)),
)

onMounted(async () => {
  try {
    favoritos.value = await api<Favorito[]>('/postulaciones/favoritos')
    await interacciones.cargar()
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargada.value = true
  }
})
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="titulo-pagina mb-3">Ofertas guardadas</h1>
    <p v-if="error" role="alert" class="mb-4 text-error">{{ error }}</p>
    <Esqueleto v-if="!cargada" />
    <EstadoVacio v-else-if="ordenados.length === 0 && !error" :icono="HeartOff" titulo="Todavía no guardaste ofertas" texto="Toca el corazón de una oferta para verla aquí y postular después.">
      <RouterLink to="/ofertas"><AccionBoton variante="primario">Ver ofertas</AccionBoton></RouterLink>
    </EstadoVacio>

    <ul v-else class="plano divide-y divide-linea overflow-hidden">
      <li v-for="f in ordenados" :key="f.id" class="flex items-center gap-2 p-4" :class="{ 'bg-salar/60': !disponible(f) }">
        <RouterLink :to="`/ofertas/${f.oferta.id}`" class="min-w-0 flex-1">
          <span class="block text-lg font-bold break-words text-guinda-900">{{ f.oferta.titulo }}</span>
          <span class="block">{{ f.oferta.empresa.razonSocial }}</span>
          <span class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span class="flex items-center gap-1 text-base" :class="disponible(f) && diasParaCierre(f.oferta.fechaCierre) <= 3 ? 'font-semibold text-alerta' : 'text-roca'">
              <Clock3 class="size-4" aria-hidden="true" />{{ disponible(f) ? textoCierre(f.oferta.fechaCierre) : 'Ya no recibe postulantes' }}
            </span>
            <span v-if="interacciones.postulaciones.has(f.oferta.id)" class="flex items-center gap-1 text-base font-semibold text-exito">
              <BadgeCheck class="size-4" aria-hidden="true" />Ya postulaste
            </span>
          </span>
        </RouterLink>
        <button type="button" class="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-salar" :aria-label="`Quitar ${f.oferta.titulo} de guardadas`" @click="interacciones.alternarFavorito(f.oferta.id)">
          <Heart class="size-6 fill-oro text-oro" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>
</template>
