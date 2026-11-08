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
    {
      path: '/empresas/registro',
      name: 'registro-empresa',
      component: () => import('@/views/publico/RegistroEmpresaView.vue'),
      meta: { soloInvitados: true },
    },
    {
      path: '/empresa/ofertas',
      name: 'mis-ofertas',
      component: () => import('@/views/empresa/MisOfertasView.vue'),
      meta: { roles: ['EMPRESA'] },
    },
    {
      path: '/empresa/ofertas/nueva',
      component: () => import('@/views/empresa/OfertaFormView.vue'),
      meta: { roles: ['EMPRESA'] },
    },
    {
      path: '/empresa/ofertas/:id/editar',
      component: () => import('@/views/empresa/OfertaFormView.vue'),
      meta: { roles: ['EMPRESA'] },
    },
    {
      path: '/admin/empresas',
      name: 'admin-empresas',
      component: () => import('@/views/admin/EmpresasView.vue'),
      meta: { roles: ['SUPERADMIN'] },
    },
    {
      path: '/admin/ofertas',
      name: 'admin-ofertas',
      component: () => import('@/views/admin/OfertasRevisionView.vue'),
      meta: { roles: ['SUPERADMIN'] },
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
