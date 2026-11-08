<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function salir() {
  auth.logout()
  router.push({ name: 'inicio' })
}
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="border-b-4 border-guinda-600 bg-guinda-800 text-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <RouterLink to="/" class="min-w-0">
          <span class="block text-xs tracking-wide text-guinda-100">Gobernación de Oruro</span>
          <span class="block font-semibold">Bolsa de Trabajo</span>
        </RouterLink>
        <nav class="flex shrink-0 items-center gap-2 text-sm">
          <template v-if="auth.usuario">
            <span class="hidden sm:inline">{{ auth.usuario.nombreCompleto }}</span>
            <button class="min-h-11 rounded-md px-3 hover:bg-guinda-700" @click="salir">Salir</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="flex min-h-11 items-center rounded-md px-3 hover:bg-guinda-700">
              Ingresar
            </RouterLink>
            <RouterLink
              to="/registro"
              class="flex min-h-11 items-center rounded-md bg-white px-3 font-medium text-guinda-800 hover:bg-guinda-50"
            >
              Registrarme
            </RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <nav v-if="auth.usuario && auth.usuario.rol !== 'POSTULANTE'" class="border-b border-stone-200 bg-white">
      <div class="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm font-medium">
        <template v-if="auth.usuario.rol === 'SUPERADMIN'">
          <RouterLink to="/admin/empresas" class="flex min-h-11 items-center px-3 whitespace-nowrap" active-class="text-guinda-700 underline">Empresas</RouterLink>
          <RouterLink to="/admin/ofertas" class="flex min-h-11 items-center px-3 whitespace-nowrap" active-class="text-guinda-700 underline">Revisión de ofertas</RouterLink>
        </template>
        <RouterLink v-else to="/empresa/ofertas" class="flex min-h-11 items-center px-3 whitespace-nowrap" active-class="text-guinda-700 underline">Mis ofertas</RouterLink>
      </div>
    </nav>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <slot />
    </main>

    <footer class="border-t border-stone-200 px-4 py-4 text-center text-xs text-stone-600">
      Gobierno Autónomo Departamental de Oruro · Unidad de Sistemas
    </footer>
  </div>
</template>
