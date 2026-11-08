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
    { path: '/ofertas', name: 'ofertas', component: () => import('@/views/publico/BuscadorView.vue') },
    { path: '/ofertas/:id', component: () => import('@/views/publico/OfertaDetalleView.vue') },
    {
      path: '/olvide',
      component: () => import('@/views/publico/OlvideView.vue'),
      meta: { soloInvitados: true },
    },
    {
      path: '/restablecer',
      component: () => import('@/views/publico/RestablecerView.vue'),
      meta: { soloInvitados: true },
    },
    {
      path: '/perfil',
      component: () => import('@/views/postulante/PerfilView.vue'),
      meta: { roles: ['POSTULANTE'] },
    },
    {
      path: '/postulaciones',
      component: () => import('@/views/postulante/PostulacionesView.vue'),
      meta: { roles: ['POSTULANTE'] },
    },
    {
      path: '/favoritos',
      component: () => import('@/views/postulante/FavoritosView.vue'),
      meta: { roles: ['POSTULANTE'] },
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
      path: '/empresa/ofertas/:id/postulantes',
      component: () => import('@/views/empresa/PostulantesOfertaView.vue'),
      meta: { roles: ['EMPRESA'] },
    },
    {
      path: '/notificaciones',
      component: () => import('@/views/NotificacionesView.vue'),
      meta: { roles: ['SUPERADMIN', 'EMPRESA', 'POSTULANTE'] },
    },
    {
      path: '/cuenta',
      component: () => import('@/views/CuentaView.vue'),
      meta: { roles: ['SUPERADMIN', 'EMPRESA', 'POSTULANTE'] },
    },
    {
      path: '/admin/panel',
      component: () => import('@/views/admin/DashboardView.vue'),
      meta: { roles: ['SUPERADMIN'] },
    },
    {
      path: '/admin/reportes',
      component: () => import('@/views/admin/ReportesView.vue'),
      meta: { roles: ['SUPERADMIN'] },
    },
    {
      path: '/admin/catalogos',
      component: () => import('@/views/admin/CatalogosView.vue'),
      meta: { roles: ['SUPERADMIN'] },
    },
    {
      path: '/admin/auditoria',
      component: () => import('@/views/admin/AuditoriaView.vue'),
      meta: { roles: ['SUPERADMIN'] },
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
