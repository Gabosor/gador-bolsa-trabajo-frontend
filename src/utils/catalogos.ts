/**
 * Ayudas para listas largas de catálogos (profesiones y habilidades por área).
 */

export interface OpcionBuscable {
  id: number
  nombre: string
  /** Nombre del área; sin grupo va al final ("Otras" / "Generales"). */
  grupo?: string
  /** Elegida antes, pero hoy desactivada: hay que quitarla para guardar. */
  inactiva?: boolean
}

interface ConArea {
  id: number
  nombre: string
  parentId?: number | null
  areaId?: number | null
}

/** Sin tildes ni mayúsculas, para buscar "ingenieria" y encontrar "Ingeniería". */
export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

export function opcionesConArea(
  items: ConArea[],
  areas: { id: number; nombre: string }[],
  campo: 'parentId' | 'areaId',
): OpcionBuscable[] {
  const nombres = new Map(areas.map((a) => [a.id, a.nombre]))
  return items.map((i) => {
    const grupo = nombres.get(i[campo] ?? -1)
    return grupo ? { id: i.id, nombre: i.nombre, grupo } : { id: i.id, nombre: i.nombre }
  })
}

/**
 * Todas las palabras deben aparecer en el nombre o en el área. Orden: los
 * nombres que empiezan con lo buscado, luego los que contienen todas las
 * palabras y al final los que coinciden solo gracias al área.
 */
export function filtrarOpciones(opciones: OpcionBuscable[], consulta: string): OpcionBuscable[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean)
  if (!palabras.length) return opciones
  const inicio = palabras.join(' ')
  const puntaje = (o: OpcionBuscable) => {
    const nombre = normalizar(o.nombre)
    if (!palabras.every((p) => `${nombre} ${normalizar(o.grupo ?? '')}`.includes(p))) return -1
    if (nombre.startsWith(inicio)) return 0
    return palabras.every((p) => nombre.includes(p)) ? 1 : 2
  }
  return opciones
    .map((o, i) => ({ o, i, p: puntaje(o) }))
    .filter((x) => x.p >= 0)
    .sort((a, b) => a.p - b.p || a.i - b.i)
    .map((x) => x.o)
}

export function agrupar(opciones: OpcionBuscable[], textoSinGrupo: string) {
  const grupos = new Map<string, OpcionBuscable[]>()
  for (const o of opciones) {
    const clave = o.grupo ?? ''
    grupos.set(clave, [...(grupos.get(clave) ?? []), o])
  }
  const orden = (a: string, b: string) => a.localeCompare(b, 'es')
  return [...grupos.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : orden(a, b)))
    .map(([grupo, lista]) => ({
      grupo: grupo || textoSinGrupo,
      opciones: [...lista].sort((a, b) => orden(a.nombre, b.nombre)),
    }))
}

/**
 * Las opciones elegidas que ya no vienen en el catálogo (se desactivaron) se
 * agregan marcadas, para que se vean y se puedan quitar.
 */
export function agregarInactivas(
  opciones: OpcionBuscable[],
  elegidas: { id: number; nombre: string; activo?: boolean }[],
): OpcionBuscable[] {
  const ids = new Set(opciones.map((o) => o.id))
  const faltantes = elegidas
    .filter((e) => !ids.has(e.id))
    .map((e) => ({ id: e.id, nombre: e.nombre, inactiva: true }))
  return [...opciones, ...faltantes]
}

/**
 * Primero las habilidades de las áreas de las profesiones elegidas y después
 * las generales (sin área). Excluye las que ya se agregaron.
 */
export function habilidadesSugeridas<T extends ConArea>(
  habilidades: T[],
  profesiones: ConArea[],
  profesionIds: number[],
  excluir: number[],
): T[] {
  const areas = new Set(
    profesiones.filter((p) => profesionIds.includes(p.id) && p.parentId != null).map((p) => p.parentId),
  )
  const libres = habilidades.filter((h) => !excluir.includes(h.id))
  return [
    ...libres.filter((h) => h.areaId != null && areas.has(h.areaId)),
    ...libres.filter((h) => h.areaId == null),
  ]
}
