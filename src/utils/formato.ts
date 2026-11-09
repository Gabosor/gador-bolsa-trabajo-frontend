const LOCALE = 'es-BO'

/** Interpreta 'AAAA-MM-DD' como fecha local, sin desfase por zona horaria. */
function fechaLocal(valor: string): Date {
  const [anio, mes, dia] = valor.slice(0, 10).split('-').map(Number)
  return new Date(anio!, mes! - 1, dia!)
}

export function fecha(valor: string): string {
  return fechaLocal(valor).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fechaHora(valor: string): string {
  return new Date(valor).toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function diasParaCierre(valor: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((fechaLocal(valor).getTime() - hoy.getTime()) / 86_400_000)
}

export function textoCierre(valor: string): string {
  const dias = diasParaCierre(valor)
  if (dias < 0) return 'Plazo vencido'
  if (dias === 0) return 'Cierra hoy'
  if (dias === 1) return 'Cierra mañana'
  if (dias <= 7) return `Cierra en ${dias} días`
  return `Cierra el ${fechaLocal(valor).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })}`
}

export function monto(valor: number | string): string {
  return Number(valor).toLocaleString(LOCALE, { maximumFractionDigits: 0 })
}

export function salario(o: {
  salarioATratar: boolean
  salarioMin: number | null
  salarioMax: number | null
}): string {
  if (o.salarioATratar || o.salarioMin === null || o.salarioMax === null) return 'Salario a tratar'
  return `Bs ${monto(o.salarioMin)} a ${monto(o.salarioMax)}`
}

export function plural(cantidad: number, singular: string, varios = `${singular}s`): string {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`
}

export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

export function pesoArchivo(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const NIVELES_HABILIDAD = [
  { id: 1, nombre: 'Básico' },
  { id: 2, nombre: 'Intermedio' },
  { id: 3, nombre: 'Avanzado' },
]

export const nombreNivel = (nivel: number) => NIVELES_HABILIDAD.find((n) => n.id === nivel)?.nombre ?? ''

/** Recorrido de una postulación (RF11). RECHAZADO queda fuera: es una salida. */
export const ETAPAS_POSTULACION = ['POSTULADO', 'VISTO', 'PRESELECCIONADO', 'ENTREVISTA', 'FINALISTA', 'CONTRATADO']

/** Recorrido de una oferta (RF08). */
export const ETAPAS_OFERTA = ['BORRADOR', 'EN_REVISION_GADOR', 'PUBLICADA', 'EN_PROCESO_SELECCION', 'CERRADA']
