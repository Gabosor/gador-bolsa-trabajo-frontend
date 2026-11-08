export interface ItemCatalogo {
  id: number
  nombre: string
}

export interface Paginado<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type EstadoEmpresa = 'PENDIENTE_VALIDACION' | 'APROBADA' | 'RECHAZADA' | 'SUSPENDIDA'

export interface Empresa {
  id: number
  nit: string
  razonSocial: string
  rubro: ItemCatalogo
  representanteLegal: string
  ciRepresentante: string
  celular: string
  emailCorporativo: string
  direccion: string
  descripcion: string
  estado: EstadoEmpresa
  motivoRechazo: string | null
  logoUrl?: string | null
  documentoNitUrl?: string | null
  documentoLegalUrl?: string | null
}

export type EstadoOferta =
  | 'BORRADOR'
  | 'EN_REVISION_GADOR'
  | 'PUBLICADA'
  | 'EN_PROCESO_SELECCION'
  | 'CERRADA'
  | 'ANULADA'

export interface HabilidadOferta {
  habilidad: ItemCatalogo
  obligatoria: boolean
  nivelMinimo: number
}

export interface Oferta {
  id: number
  titulo: string
  descripcion: string
  requisitosObligatorios: string
  requisitosDeseables: string | null
  profesiones: ItemCatalogo[]
  aniosExperiencia: number
  tipoContrato: ItemCatalogo
  modalidad: ItemCatalogo
  municipio: ItemCatalogo
  salarioMin: number | null
  salarioMax: number | null
  salarioATratar: boolean
  beneficios: string | null
  fechaCierre: string
  numeroPlazas: number
  estado: EstadoOferta
  motivoRechazo: string | null
  totalVistas: number
  totalPostulantes?: number
  empresa?: Empresa
  habilidades: HabilidadOferta[]
}
