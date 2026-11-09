import type { Component } from 'vue'
import {
  Bell,
  Building2,
  ClipboardCheck,
  FileChartColumn,
  FileText,
  Heart,
  LayoutDashboard,
  ListChecks,
  Plus,
  ScrollText,
  Search,
  Send,
  Settings2,
  UserRound,
} from 'lucide-vue-next'
import type { Rol } from '@/stores/auth'

export interface Destino {
  a: string
  texto: string
  icono: Component
}

/** Máximo cinco destinos: es lo que cabe cómodo en la barra inferior. */
export const PRINCIPALES: Record<Rol, Destino[]> = {
  POSTULANTE: [
    { a: '/ofertas', texto: 'Ofertas', icono: Search },
    { a: '/favoritos', texto: 'Guardadas', icono: Heart },
    { a: '/postulaciones', texto: 'Postulaciones', icono: Send },
    { a: '/perfil', texto: 'Perfil', icono: FileText },
  ],
  EMPRESA: [
    { a: '/empresa/ofertas', texto: 'Mis ofertas', icono: ListChecks },
    { a: '/empresa/ofertas/nueva', texto: 'Nueva', icono: Plus },
    { a: '/notificaciones', texto: 'Avisos', icono: Bell },
    { a: '/cuenta', texto: 'Cuenta', icono: UserRound },
  ],
  SUPERADMIN: [
    { a: '/admin/panel', texto: 'Panel', icono: LayoutDashboard },
    { a: '/admin/empresas', texto: 'Empresas', icono: Building2 },
    { a: '/admin/ofertas', texto: 'Revisión', icono: ClipboardCheck },
  ],
}

/** Destinos de administración que no caben en la barra inferior. */
export const SECUNDARIOS_ADMIN: Destino[] = [
  { a: '/admin/reportes', texto: 'Reportes', icono: FileChartColumn },
  { a: '/admin/catalogos', texto: 'Catálogos', icono: Settings2 },
  { a: '/admin/auditoria', texto: 'Auditoría', icono: ScrollText },
]
