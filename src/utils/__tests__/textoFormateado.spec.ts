import { describe, expect, it } from 'vitest'
import { analizarEnLinea, analizarTexto } from '../textoFormateado'

const texto = (s: string) => [{ texto: s, negrita: false }]

describe('analizarTexto', () => {
  it('sin texto no hay bloques', () => {
    expect(analizarTexto('')).toEqual([])
    expect(analizarTexto(null)).toEqual([])
    expect(analizarTexto('  \n\n ')).toEqual([])
  })

  it('el texto plano de siempre queda como un solo párrafo, igual que antes', () => {
    expect(analizarTexto('a\nb\n\nc')).toEqual([{ tipo: 'parrafo', segmentos: texto('a\nb\n\nc') }])
  })

  it('unifica los saltos de línea de Windows', () => {
    expect(analizarTexto('a\r\nb')).toEqual([{ tipo: 'parrafo', segmentos: texto('a\nb') }])
  })

  it('reconoce viñetas con guion', () => {
    expect(analizarTexto('- uno\n- dos')).toEqual([
      { tipo: 'lista', ordenada: false, inicio: 1, items: [texto('uno'), texto('dos')] },
    ])
  })

  it('reconoce viñetas pegadas desde Word', () => {
    for (const marca of ['•', '–', '*', '·', '']) {
      const [bloque] = analizarTexto(`${marca}\tuno`)
      expect(bloque).toEqual({ tipo: 'lista', ordenada: false, inicio: 1, items: [texto('uno')] })
    }
  })

  it('reconoce listas numeradas y respeta el número inicial', () => {
    expect(analizarTexto('1. a\n2. b')).toEqual([
      { tipo: 'lista', ordenada: true, inicio: 1, items: [texto('a'), texto('b')] },
    ])
    expect(analizarTexto('3) c')).toEqual([{ tipo: 'lista', ordenada: true, inicio: 3, items: [texto('c')] }])
  })

  it('no confunde un año ni un guion pegado con una lista', () => {
    expect(analizarTexto('2024. año de inicio')[0]?.tipo).toBe('parrafo')
    expect(analizarTexto('-x')[0]?.tipo).toBe('parrafo')
    expect(analizarTexto('**negrita** al inicio')[0]?.tipo).toBe('parrafo')
  })

  it('alterna párrafos y listas', () => {
    const bloques = analizarTexto('Requisitos:\n- uno\n- dos\n\nGracias')
    expect(bloques.map((b) => b.tipo)).toEqual(['parrafo', 'lista', 'parrafo'])
    expect(bloques[0]).toEqual({ tipo: 'parrafo', segmentos: texto('Requisitos:') })
    expect(bloques[2]).toEqual({ tipo: 'parrafo', segmentos: texto('Gracias') })
  })

  it('cambiar de viñetas a números empieza otra lista', () => {
    const bloques = analizarTexto('- a\n1. b')
    expect(bloques).toHaveLength(2)
  })

  it('una línea en blanco corta la lista', () => {
    expect(analizarTexto('- a\n\n- b')).toHaveLength(2)
  })

  it('una línea con sangría continúa el ítem anterior', () => {
    expect(analizarTexto('- uno\n  sigue\n- dos')).toEqual([
      { tipo: 'lista', ordenada: false, inicio: 1, items: [texto('uno\nsigue'), texto('dos')] },
    ])
  })

  it('permite negrita dentro de una lista', () => {
    expect(analizarTexto('- **AutoCAD** avanzado')).toEqual([
      {
        tipo: 'lista',
        ordenada: false,
        inicio: 1,
        items: [
          [
            { texto: 'AutoCAD', negrita: true },
            { texto: ' avanzado', negrita: false },
          ],
        ],
      },
    ])
  })

  it('omite ítems vacíos', () => {
    expect(analizarTexto('- uno\n- \n- dos')).toEqual([
      { tipo: 'lista', ordenada: false, inicio: 1, items: [texto('uno'), texto('dos')] },
    ])
  })

  it('el HTML queda como texto literal', () => {
    expect(analizarTexto('<script>alert(1)</script>')).toEqual([
      { tipo: 'parrafo', segmentos: texto('<script>alert(1)</script>') },
    ])
  })
})

describe('analizarEnLinea', () => {
  it('marca la negrita', () => {
    expect(analizarEnLinea('**hola** mundo')).toEqual([
      { texto: 'hola', negrita: true },
      { texto: ' mundo', negrita: false },
    ])
  })

  it('deja literal lo que no es negrita válida', () => {
    for (const s of ['**sin cierre', 'a ** b ** c', '****', '**a\nb**']) {
      expect(analizarEnLinea(s)).toEqual(texto(s))
    }
  })
})
