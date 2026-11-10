/**
 * Formato ligero para los textos largos (descripción, requisitos, beneficios):
 * `**negrita**`, viñetas (`- `) y listas numeradas (`1. `).
 *
 * Solo convierte texto en una estructura de datos; nunca genera HTML, así que
 * el componente que la pinta no necesita `v-html` y no hay riesgo de XSS.
 * Un texto sin marcas queda como un único párrafo, igual que antes.
 */

export interface Segmento {
  texto: string
  negrita: boolean
}

export type Bloque =
  | { tipo: 'parrafo'; segmentos: Segmento[] }
  | { tipo: 'lista'; ordenada: boolean; inicio: number; items: Segmento[][] }

export interface Linea {
  tipo: 'vineta' | 'numero' | 'texto'
  /** Carácter de la viñeta (`-`, `•`…) o número de la lista. */
  marcador?: string
  numero?: number
  delimitador?: '.' | ')'
  /** Espacios antes del marcador. */
  sangria: string
  contenido: string
  /** Caracteres que ocupan la sangría y el marcador con su espacio. */
  largoMarcador: number
}

// Guion, asterisco y las viñetas que llegan al pegar desde Word o Docs
// (U+F0B7 es la viñeta de la fuente Symbol). Siempre seguidas de espacio,
// para que "-x" o "**negrita" al inicio de una línea sigan siendo texto.
const VINETA = /^([ \t]*)([-*•·–—▪◦‣])([ \t]+)(.*)$/
// Hasta tres cifras: "2024. Año de inicio" sigue siendo un párrafo.
const NUMERO = /^([ \t]*)(\d{1,3})([.)])([ \t]+)(.*)$/
const CONTINUACION = /^( {2,}|\t)\S/
const NEGRITA = /\*\*(?=[^\s*])([^\n]*?[^\s])\*\*/g

export function analizarLinea(linea: string): Linea {
  const numero = NUMERO.exec(linea)
  if (numero) {
    const [, sangria = '', cifras = '', delimitador, espacio = '', contenido = ''] = numero
    return {
      tipo: 'numero',
      marcador: cifras,
      numero: Number(cifras),
      delimitador: delimitador as '.' | ')',
      sangria,
      contenido,
      largoMarcador: sangria.length + cifras.length + 1 + espacio.length,
    }
  }
  const vineta = VINETA.exec(linea)
  if (vineta) {
    const [, sangria = '', marcador = '', espacio = '', contenido = ''] = vineta
    return {
      tipo: 'vineta',
      marcador,
      sangria,
      contenido,
      largoMarcador: sangria.length + marcador.length + espacio.length,
    }
  }
  return { tipo: 'texto', sangria: '', contenido: linea, largoMarcador: 0 }
}

/** Separa la negrita del resto; lo que no cierra bien queda literal. */
export function analizarEnLinea(texto: string): Segmento[] {
  const segmentos: Segmento[] = []
  const agregar = (t: string, negrita: boolean) => {
    if (t) segmentos.push({ texto: t, negrita })
  }
  let ultimo = 0
  for (const m of texto.matchAll(NEGRITA)) {
    agregar(texto.slice(ultimo, m.index), false)
    agregar(m[1] ?? '', true)
    ultimo = m.index + m[0].length
  }
  agregar(texto.slice(ultimo), false)
  return segmentos
}

export function analizarTexto(texto: string | null | undefined): Bloque[] {
  if (!texto || !texto.trim()) return []
  const bloques: Bloque[] = []
  let parrafo: string[] = []
  let lista: { ordenada: boolean; inicio: number; items: string[] } | null = null
  // Si la línea anterior fue un ítem, una línea con sangría lo continúa.
  let enItem = false

  const cerrarParrafo = () => {
    while (parrafo.length && !parrafo[0]?.trim()) parrafo.shift()
    while (parrafo.length && !parrafo.at(-1)?.trim()) parrafo.pop()
    if (parrafo.length) bloques.push({ tipo: 'parrafo', segmentos: analizarEnLinea(parrafo.join('\n')) })
    parrafo = []
  }
  const cerrarLista = () => {
    if (lista) {
      const items = lista.items.filter((i) => i.trim()).map(analizarEnLinea)
      if (items.length) bloques.push({ tipo: 'lista', ordenada: lista.ordenada, inicio: lista.inicio, items })
    }
    lista = null
    enItem = false
  }

  for (const linea of texto.replace(/\r\n?/g, '\n').split('\n')) {
    const actual = analizarLinea(linea)
    if (actual.tipo === 'texto') {
      if (lista && enItem && CONTINUACION.test(linea)) {
        const items: string[] = lista.items
        items[items.length - 1] += `\n${linea.trim()}`
        continue
      }
      cerrarLista()
      parrafo.push(linea)
      continue
    }
    const ordenada = actual.tipo === 'numero'
    if (!lista || lista.ordenada !== ordenada) {
      cerrarParrafo()
      cerrarLista()
      lista = { ordenada, inicio: actual.numero ?? 1, items: [] }
    }
    lista.items.push(actual.contenido.trim())
    enItem = true
  }
  cerrarParrafo()
  cerrarLista()
  return bloques
}
