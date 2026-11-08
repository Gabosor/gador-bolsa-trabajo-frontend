import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore, type Rol } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Si se define, la ruta exige sesión con uno de estos roles. */
    roles?: Rol[]
    soloInvitados?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'inicio', component: () => import('@/views/publico/InicioView.vue') },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/publico/LoginView.vue'),
      meta: { soloInvitados: true },
    },
    {
      path: '/registro',
      name: 'registro',
      component: () => import('@/views/publico/RegistroView.vue'),
      meta: { soloInvitados: true },
    },
    {
      path: '/verificar',
      name: 'verificar',
      component: () => import('@/views/publico/VerificarView.vue'),
      meta: { soloInvitados: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.iniciar()
  if (to.meta.soloInvitados && auth.autenticado) return { name: 'inicio' }
  if (to.meta.roles) {
    if (!auth.usuario) return { name: 'login', query: { volver: to.fullPath } }
    if (!to.meta.roles.includes(auth.usuario.rol)) return { name: 'inicio' }
  }
})

export default router
