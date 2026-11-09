/**
 * Operaciones de la barra de formato. Son funciones puras: reciben el texto y
 * la selección y devuelven el texto nuevo con la selección que corresponde.
 * El componente se encarga de aplicarlas al textarea sin perder el deshacer.
 */
import { analizarLinea } from './textoFormateado'

export interface EstadoEditor {
  texto: string
  selStart: number
  selEnd: number
}

const NEGRITA = /\*\*(?=[^\s*])([^\n]*?[^\s])\*\*/g

const inicioDeLinea = (texto: string, pos: number) => texto.lastIndexOf('\n', pos - 1) + 1
const finDeLinea = (texto: string, pos: number) => {
  const fin = texto.indexOf('\n', pos)
  return fin === -1 ? texto.length : fin
}

/** La negrita que contiene la posición, si hay una en esa línea. */
function negritaEn(texto: string, desde: number, hasta: number) {
  const inicio = inicioDeLinea(texto, desde)
  const linea = texto.slice(inicio, finDeLinea(texto, desde))
  for (const m of linea.matchAll(NEGRITA)) {
    const a = inicio + m.index
    const b = a + m[0].length
    if (desde >= a + 2 && hasta <= b - 2) return { a, b }
  }
  return null
}

const envuelta = (t: string) => t.length >= 4 && t.startsWith('**') && t.endsWith('**')

export function alternarNegrita(texto: string, selStart: number, selEnd: number): EstadoEditor {
  if (selStart === selEnd) {
    const actual = negritaEn(texto, selStart, selEnd)
    if (actual) {
      const nuevo = texto.slice(0, actual.a) + texto.slice(actual.a + 2, actual.b - 2) + texto.slice(actual.b)
      return { texto: nuevo, selStart: selStart - 2, selEnd: selStart - 2 }
    }
    const nuevo = `${texto.slice(0, selStart)}****${texto.slice(selStart)}`
    return { texto: nuevo, selStart: selStart + 2, selEnd: selStart + 2 }
  }

  let s = selStart
  let e = selEnd
  while (s < e && /\s/.test(texto[s] ?? '')) s++
  while (e > s && /\s/.test(texto[e - 1] ?? '')) e--
  if (s === e) return { texto, selStart, selEnd }
  const seleccion = texto.slice(s, e)

  if (!seleccion.includes('\n')) {
    if (texto.slice(s - 2, s) === '**' && texto.slice(e, e + 2) === '**') {
      const nuevo = texto.slice(0, s - 2) + seleccion + texto.slice(e + 2)
      return { texto: nuevo, selStart: s - 2, selEnd: e - 2 }
    }
    if (envuelta(seleccion)) {
      const nuevo = texto.slice(0, s) + seleccion.slice(2, -2) + texto.slice(e)
      return { texto: nuevo, selStart: s, selEnd: e - 4 }
    }
    const marcador = s === inicioDeLinea(texto, s) ? analizarLinea(seleccion).largoMarcador : 0
    if (!marcador) {
      const nuevo = `${texto.slice(0, s)}**${seleccion}**${texto.slice(e)}`
      return { texto: nuevo, selStart: s + 2, selEnd: e + 2 }
    }
  }

  // Varias líneas (o una sin negrita): cada línea se marca por separado,
  // dejando fuera la viñeta o el número.
  const empiezaEnLinea = s === inicioDeLinea(texto, s)
  const partes = seleccion.split('\n').map((linea, i) => {
    const marcador = i > 0 || empiezaEnLinea ? analizarLinea(linea).largoMarcador : 0
    const prefijo = linea.slice(0, marcador)
    const resto = linea.slice(marcador)
    const nucleo = resto.trim()
    const antes = resto.slice(0, resto.indexOf(nucleo))
    const despues = resto.slice(antes.length + nucleo.length)
    return { prefijo, antes, nucleo, despues }
  })
  const quitar = partes.filter((p) => p.nucleo).every((p) => envuelta(p.nucleo))
  const nuevaSeleccion = partes
    .map(({ prefijo, antes, nucleo, despues }) => {
      if (!nucleo) return prefijo + antes + despues
      const cuerpo = quitar ? nucleo.slice(2, -2) : `**${nucleo}**`
      return prefijo + antes + cuerpo + despues
    })
    .join('\n')
  return {
    texto: texto.slice(0, s) + nuevaSeleccion + texto.slice(e),
    selStart: s,
    selEnd: s + nuevaSeleccion.length,
  }
}

export function alternarLista(
  texto: string,
  selStart: number,
  selEnd: number,
  tipo: 'vinetas' | 'numerada',
): EstadoEditor {
  // Si la selección termina justo al inicio de una línea, esa línea no cuenta.
  const fin = selEnd > selStart && texto[selEnd - 1] === '\n' ? selEnd - 1 : selEnd
  const inicio = inicioDeLinea(texto, selStart)
  const final = finDeLinea(texto, fin)
  const lineas = texto.slice(inicio, final).split('\n')
  const analizadas = lineas.map(analizarLinea)

  const tieneMarca = (l: (typeof analizadas)[number]) =>
    tipo === 'vinetas' ? l.tipo === 'vineta' && l.marcador === '-' : l.tipo === 'numero'
  const conTexto = analizadas.filter((l, i) => (lineas[i] ?? '').trim())
  const quitar = conTexto.length > 0 && conTexto.every(tieneMarca)

  // La numeración sigue a la de la línea anterior, si era numerada.
  const anterior = inicio > 0 ? analizarLinea(texto.slice(inicioDeLinea(texto, inicio - 1), inicio - 1)) : null
  let numero = anterior?.tipo === 'numero' ? (anterior.numero ?? 0) + 1 : 1
  const delimitador = anterior?.tipo === 'numero' ? (anterior.delimitador ?? '.') : '.'

  const nuevas = analizadas.map((l, i) => {
    const original = lineas[i] ?? ''
    const contenido = l.tipo === 'texto' ? original : l.sangria + l.contenido
    if (quitar) return contenido
    if (!original.trim() && lineas.length > 1) return original
    const marca = tipo === 'vinetas' ? '- ' : `${numero++}${delimitador} `
    const sangria = contenido.match(/^[ \t]*/)?.[0] ?? ''
    return sangria + marca + contenido.slice(sangria.length)
  })
  const bloque = nuevas.join('\n')
  const nuevo = texto.slice(0, inicio) + bloque + texto.slice(final)

  if (selStart === selEnd) {
    // El cursor se mueve con el cambio de su propia línea.
    const delta = (nuevas[0]?.length ?? 0) - (lineas[0]?.length ?? 0)
    const cursor = Math.max(inicio, Math.min(selStart + delta, inicio + (nuevas[0]?.length ?? 0)))
    return { texto: nuevo, selStart: cursor, selEnd: cursor }
  }
  return { texto: nuevo, selStart: inicio, selEnd: inicio + bloque.length + (selEnd - fin) }
}

/** Enter dentro de una lista: agrega el siguiente marcador, o la termina. */
export function continuarLista(texto: string, pos: number): EstadoEditor | null {
  const inicio = inicioDeLinea(texto, pos)
  const final = finDeLinea(texto, pos)
  const linea = analizarLinea(texto.slice(inicio, final))
  if (linea.tipo === 'texto' || pos < inicio + linea.largoMarcador) return null
  if (!linea.contenido.trim()) {
    const nuevo = texto.slice(0, inicio) + texto.slice(final)
    return { texto: nuevo, selStart: inicio, selEnd: inicio }
  }
  const marca =
    linea.tipo === 'numero' ? `${(linea.numero ?? 0) + 1}${linea.delimitador ?? '.'} ` : '- '
  const insertar = `\n${linea.sangria}${marca}`
  const nuevo = texto.slice(0, pos) + insertar + texto.slice(pos)
  const cursor = pos + insertar.length
  return { texto: nuevo, selStart: cursor, selEnd: cursor }
}

export function formatoActivo(texto: string, selStart: number, selEnd: number) {
  const linea = analizarLinea(texto.slice(inicioDeLinea(texto, selStart), finDeLinea(texto, selStart)))
  const seleccion = texto.slice(selStart, selEnd)
  const negrita =
    negritaEn(texto, selStart, selEnd) !== null ||
    (selStart !== selEnd && (envuelta(seleccion) || (texto.slice(selStart - 2, selStart) === '**' && texto.slice(selEnd, selEnd + 2) === '**')))
  return { negrita, vinetas: linea.tipo === 'vineta', numerada: linea.tipo === 'numero' }
}

/** El rango mínimo que hay que reemplazar para pasar de un texto al otro. */
export function calcularReemplazo(antes: string, despues: string) {
  const minimo = Math.min(antes.length, despues.length)
  let prefijo = 0
  while (prefijo < minimo && antes[prefijo] === despues[prefijo]) prefijo++
  let sufijo = 0
  while (
    sufijo < minimo - prefijo &&
    antes[antes.length - 1 - sufijo] === despues[despues.length - 1 - sufijo]
  )
    sufijo++
  return {
    desde: prefijo,
    hasta: antes.length - sufijo,
    insertar: despues.slice(prefijo, despues.length - sufijo),
  }
}
