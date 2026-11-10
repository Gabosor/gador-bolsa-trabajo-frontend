import { describe, expect, it } from 'vitest'
import {
  alternarLista,
  alternarNegrita,
  calcularReemplazo,
  continuarLista,
  formatoActivo,
} from '../editorTexto'

/** Marca la selección con [ ] para leer los casos con facilidad. */
function con(marcado: string) {
  const selStart = marcado.indexOf('[')
  const selEnd = marcado.indexOf(']') - 1
  return { texto: marcado.replace('[', '').replace(']', ''), selStart, selEnd }
}
function ver({ texto, selStart, selEnd }: { texto: string; selStart: number; selEnd: number }) {
  return texto.slice(0, selStart) + '[' + texto.slice(selStart, selEnd) + ']' + texto.slice(selEnd)
}
const aplicar = (f: (t: string, a: number, b: number) => ReturnType<typeof alternarNegrita>, marcado: string) => {
  const e = con(marcado)
  return ver(f(e.texto, e.selStart, e.selEnd))
}

describe('alternarNegrita', () => {
  const negrita = (t: string, a: number, b: number) => alternarNegrita(t, a, b)

  it('envuelve la selección', () => {
    expect(aplicar(negrita, 'Título [en Civil] ok')).toBe('Título **[en Civil]** ok')
  })

  it('deja fuera los espacios de los bordes', () => {
    expect(aplicar(negrita, 'a[ hola ]b')).toBe('a **[hola]** b')
  })

  it('quita la negrita si la selección ya la tiene', () => {
    expect(aplicar(negrita, 'a **[hola]** b')).toBe('a [hola] b')
    expect(aplicar(negrita, 'a [**hola**] b')).toBe('a [hola] b')
  })

  it('sin selección inserta las marcas con el cursor al medio', () => {
    expect(aplicar(negrita, 'a []b')).toBe('a **[]**b')
  })

  it('sin selección dentro de una negrita, la quita', () => {
    expect(aplicar(negrita, 'a **ho[]la** b')).toBe('a ho[]la b')
  })

  it('en varias líneas, marca cada línea sin tocar las viñetas', () => {
    expect(aplicar(negrita, '[- uno\n- dos]')).toBe('[- **uno**\n- **dos**]')
  })
})

describe('alternarLista', () => {
  const vinetas = (t: string, a: number, b: number) => alternarLista(t, a, b, 'vinetas')
  const numerada = (t: string, a: number, b: number) => alternarLista(t, a, b, 'numerada')

  it('agrega viñetas a las líneas seleccionadas', () => {
    expect(aplicar(vinetas, '[uno\ndos]')).toBe('[- uno\n- dos]')
  })

  it('las quita si todas ya las tienen', () => {
    expect(aplicar(vinetas, '[- uno\n- dos]')).toBe('[uno\ndos]')
  })

  it('convierte viñetas de Word', () => {
    expect(aplicar(vinetas, '[• uno]')).toBe('[- uno]')
  })

  it('numera y continúa la numeración de la línea anterior', () => {
    expect(aplicar(numerada, '[a\nb]')).toBe('[1. a\n2. b]')
    expect(aplicar(numerada, '1. a\n[b]')).toBe('1. a\n[2. b]')
  })

  it('cambia viñetas por números', () => {
    expect(aplicar(numerada, '[- a\n- b]')).toBe('[1. a\n2. b]')
  })

  it('en una línea vacía deja el cursor después de la marca', () => {
    expect(aplicar(vinetas, 'x\n[]')).toBe('x\n- []')
  })

  it('no toma la línea siguiente si la selección termina al inicio de ella', () => {
    expect(aplicar(vinetas, '[uno\n]dos')).toBe('[- uno\n]dos')
  })
})

describe('continuarLista', () => {
  it('agrega una viñeta nueva al presionar Enter', () => {
    const r = continuarLista('- uno', 5)!
    expect(ver(r)).toBe('- uno\n- []')
  })

  it('sigue con el número siguiente', () => {
    expect(ver(continuarLista('2) dos', 6)!)).toBe('2) dos\n3) []')
  })

  it('en un ítem vacío termina la lista', () => {
    expect(ver(continuarLista('- uno\n- ', 8)!)).toBe('- uno\n[]')
  })

  it('no hace nada fuera de una lista ni dentro de la marca', () => {
    expect(continuarLista('hola', 4)).toBeNull()
    expect(continuarLista('- uno', 1)).toBeNull()
  })

  it('una viñeta de Word continúa como guion', () => {
    expect(ver(continuarLista('• uno', 5)!)).toBe('• uno\n- []')
  })
})

describe('formatoActivo', () => {
  it('detecta negrita y listas en la posición del cursor', () => {
    expect(formatoActivo('a **hola** b', 5, 5)).toEqual({ negrita: true, vinetas: false, numerada: false })
    expect(formatoActivo('- uno', 3, 3)).toEqual({ negrita: false, vinetas: true, numerada: false })
    expect(formatoActivo('1. uno', 3, 3)).toEqual({ negrita: false, vinetas: false, numerada: true })
  })
})

describe('calcularReemplazo', () => {
  it('encuentra el cambio mínimo', () => {
    expect(calcularReemplazo('abc', 'aXc')).toEqual({ desde: 1, hasta: 2, insertar: 'X' })
    expect(calcularReemplazo('aa', 'aaa')).toEqual({ desde: 2, hasta: 2, insertar: 'a' })
    expect(calcularReemplazo('hola', 'hola')).toEqual({ desde: 4, hasta: 4, insertar: '' })
    expect(calcularReemplazo('**a**', 'a')).toEqual({ desde: 0, hasta: 5, insertar: 'a' })
  })
})
