<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, CircleUserRound, KeyRound, LogOut, Menu } from 'lucide-vue-next'
import Avisos from '@/components/Avisos.vue'
import DialogoConfirmar from '@/components/DialogoConfirmar.vue'
import HojaInferior from '@/components/HojaInferior.vue'
import { PRINCIPALES, SECUNDARIOS_ADMIN, type Destino } from '@/components/navegacion'
import { useAuthStore } from '@/stores/auth'
import { useInteraccionesStore } from '@/stores/interacciones'
import { useNotificacionesStore } from '@/stores/notificaciones'

const CONSULTA_AVISOS_MS = 60_000

const auth = useAuthStore()
const interacciones = useInteraccionesStore()
const notificaciones = useNotificacionesStore()
const route = useRoute()
const router = useRouter()

const menu = ref(false)
const principales = computed<Destino[]>(() => (auth.usuario ? PRINCIPALES[auth.usuario.rol] : []))
const esAdmin = computed(() => auth.usuario?.rol === 'SUPERADMIN')
const conNavegacion = computed(() => auth.usuario !== null)

/** Resalta la sección actual sin confundir "Nueva" con "Mis ofertas". */
function activo(destino: string) {
  if (destino === '/empresa/ofertas') {
    return route.path.startsWith(destino) && !route.path.endsWith('/nueva')
  }
  return route.path === destino || route.path.startsWith(`${destino}/`)
}

let temporizador: ReturnType<typeof setInterval> | undefined

watch(
  () => auth.usuario,
  (usuario) => {
    clearInterval(temporizador)
    if (usuario?.rol === 'POSTULANTE') interacciones.cargar().catch(() => undefined)
    else interacciones.limpiar()
    if (usuario) {
      notificaciones.actualizar()
      temporizador = setInterval(notificaciones.actualizar, CONSULTA_AVISOS_MS)
    }
  },
  { immediate: true },
)
onUnmounted(() => clearInterval(temporizador))

watch(() => route.fullPath, () => (menu.value = false))

function salir() {
  menu.value = false
  auth.logout()
  router.push({ name: 'inicio' })
}
</script>

<template>
  <div
    class="flex min-h-dvh [--ancho-rail:0px] lg:[--ancho-rail:15rem] lg:[--alto-nav:0px]!"
    :style="{ '--alto-nav': conNavegacion ? 'calc(4rem + env(safe-area-inset-bottom))' : '0px' }"
  >
    <a href="#contenido" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-campo focus:bg-white focus:p-3">Saltar al contenido</a>

    <!-- Navegación lateral: solo en pantallas grandes y con sesión. -->
    <aside v-if="auth.usuario" class="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-linea bg-white lg:flex">
      <RouterLink to="/" class="flex items-center gap-2 p-4">
        <img src="/img/escudo.png" alt="" class="h-11 w-auto" />
        <span class="font-titulo leading-tight font-bold text-guinda-900">Bolsa de Trabajo<span class="block font-sans text-sm font-normal text-roca">Gobernación de Oruro</span></span>
      </RouterLink>
      <nav aria-label="Principal" class="flex-1 space-y-1 overflow-y-auto px-2">
        <RouterLink
          v-for="d in [...principales, ...(esAdmin ? SECUNDARIOS_ADMIN : [])]"
          :key="d.a"
          :to="d.a"
          class="flex min-h-11 items-center gap-3 rounded-campo px-3 font-semibold"
          :class="activo(d.a) ? 'bg-guinda-700 text-white' : 'hover:bg-salar'"
          :aria-current="activo(d.a) ? 'page' : undefined"
        >
          <component :is="d.icono" class="size-5" aria-hidden="true" />{{ d.texto }}
        </RouterLink>
        <RouterLink
          v-if="auth.usuario.rol !== 'EMPRESA'"
          to="/notificaciones"
          class="flex min-h-11 items-center gap-3 rounded-campo px-3 font-semibold"
          :class="activo('/notificaciones') ? 'bg-guinda-700 text-white' : 'hover:bg-salar'"
        >
          <Bell class="size-5" aria-hidden="true" />
          <span class="flex-1">Notificaciones</span>
          <span v-if="notificaciones.sinLeer" class="rounded-full bg-oro px-2 text-sm font-bold text-noche">{{ notificaciones.sinLeer }}</span>
        </RouterLink>
      </nav>
      <div class="border-t border-linea p-2">
        <p class="truncate px-3 py-1 text-base text-roca">{{ auth.usuario.nombreCompleto }}</p>
        <RouterLink to="/cuenta" class="flex min-h-11 items-center gap-3 rounded-campo px-3 font-semibold hover:bg-salar">
          <KeyRound class="size-5" aria-hidden="true" />Cambiar contraseña
        </RouterLink>
        <button type="button" class="flex min-h-11 w-full items-center gap-3 rounded-campo px-3 font-semibold hover:bg-salar" @click="salir">
          <LogOut class="size-5" aria-hidden="true" />Salir
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col" :class="{ 'lg:pl-60': auth.usuario }">
      <!-- Barra superior: con sesión desaparece en escritorio. -->
      <header class="sticky top-0 z-20 border-b border-linea bg-white pt-[env(safe-area-inset-top)]" :class="{ 'lg:hidden': auth.usuario }">
        <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <RouterLink to="/" class="flex min-w-0 items-center gap-2">
            <img src="/img/escudo.png" alt="" class="h-9 w-auto" />
            <span class="truncate font-titulo leading-tight font-bold text-guinda-900">Bolsa de Trabajo<span class="block truncate font-sans text-sm font-normal text-roca">Gobernación de Oruro</span></span>
          </RouterLink>
          <nav v-if="auth.usuario" aria-label="Cuenta" class="flex shrink-0 items-center">
            <RouterLink to="/notificaciones" class="relative flex size-11 items-center justify-center rounded-full hover:bg-salar" :aria-label="notificaciones.sinLeer ? `Notificaciones, ${notificaciones.sinLeer} sin leer` : 'Notificaciones'">
              <Bell class="size-6" aria-hidden="true" />
              <span v-if="notificaciones.sinLeer" class="absolute top-1 right-1 min-w-5 rounded-full bg-oro px-1 text-center text-xs leading-5 font-bold text-noche">{{ notificaciones.sinLeer }}</span>
            </RouterLink>
            <button type="button" class="flex size-11 items-center justify-center rounded-full hover:bg-salar" aria-label="Menú de la cuenta" @click="menu = true">
              <CircleUserRound class="size-6" aria-hidden="true" />
            </button>
          </nav>
          <nav v-else aria-label="Acceso" class="flex shrink-0 items-center gap-1">
            <RouterLink to="/ofertas" class="hidden min-h-11 items-center rounded-campo px-3 font-semibold hover:bg-salar sm:flex">Ofertas</RouterLink>
            <RouterLink to="/login" class="flex min-h-11 items-center rounded-campo px-3 font-semibold hover:bg-salar">Ingresar</RouterLink>
            <RouterLink to="/registro" class="hidden min-h-11 items-center rounded-campo bg-guinda-700 px-3 font-semibold text-white hover:bg-guinda-800 sm:flex">Crear cuenta</RouterLink>
          </nav>
        </div>
      </header>

      <main id="contenido" class="mx-auto w-full max-w-6xl flex-1 px-4 py-5 lg:px-8 lg:py-8" :style="{ paddingBottom: 'calc(var(--alto-nav) + 1.5rem)' }">
        <slot />
      </main>

      <footer class="px-4 pt-2 pb-[calc(var(--alto-nav)+1rem)] text-center text-sm text-roca">
        Gobierno Autónomo Departamental de Oruro, Unidad de Sistemas e Informática
      </footer>
    </div>

    <!-- Navegación inferior: móvil y tableta, con sesión. -->
    <nav v-if="auth.usuario" aria-label="Principal" class="fixed inset-x-0 bottom-0 z-30 flex border-t border-linea bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <RouterLink
        v-for="d in principales"
        :key="d.a"
        :to="d.a"
        class="flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[0.8125rem]"
        :class="activo(d.a) ? 'font-bold text-guinda-700' : 'text-roca'"
        :aria-current="activo(d.a) ? 'page' : undefined"
      >
        <component :is="d.icono" class="size-6" aria-hidden="true" />
        <span class="max-w-full truncate px-1">{{ d.texto }}</span>
      </RouterLink>
      <button v-if="esAdmin" type="button" class="flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[0.8125rem] text-roca" @click="menu = true">
        <Menu class="size-6" aria-hidden="true" />Más
      </button>
    </nav>

    <HojaInferior v-model="menu" :titulo="auth.usuario?.nombreCompleto ?? 'Cuenta'">
      <nav aria-label="Más opciones" class="-mx-1 space-y-1">
        <template v-if="esAdmin">
          <RouterLink v-for="d in SECUNDARIOS_ADMIN" :key="d.a" :to="d.a" class="flex min-h-12 items-center gap-3 rounded-campo px-3 font-semibold hover:bg-salar">
            <component :is="d.icono" class="size-5" aria-hidden="true" />{{ d.texto }}
          </RouterLink>
        </template>
        <RouterLink to="/cuenta" class="flex min-h-12 items-center gap-3 rounded-campo px-3 font-semibold hover:bg-salar">
          <KeyRound class="size-5" aria-hidden="true" />Cambiar contraseña
        </RouterLink>
        <button type="button" class="flex min-h-12 w-full items-center gap-3 rounded-campo px-3 font-semibold text-error hover:bg-error-50" @click="salir">
          <LogOut class="size-5" aria-hidden="true" />Salir
        </button>
      </nav>
    </HojaInferior>

    <DialogoConfirmar />
    <Avisos />
  </div>
</template>
