import { describe, expect, it } from 'vitest'
import {
  agregarInactivas,
  agrupar,
  filtrarOpciones,
  habilidadesSugeridas,
  normalizar,
  opcionesConArea,
} from '../catalogos'
import { tipoDocumento } from '../archivos'

const areas = [
  { id: 1, nombre: 'Ingeniería civil y construcción' },
  { id: 2, nombre: 'Minería y metalurgia' },
]
const profesiones = [
  { id: 10, nombre: 'Ingeniería Civil', parentId: 1 },
  { id: 11, nombre: 'Ingeniería de Minas', parentId: 2 },
  { id: 12, nombre: 'Arquitectura', parentId: 1 },
  { id: 13, nombre: 'Diseño Gráfico', parentId: null },
]
const habilidades = [
  { id: 20, nombre: 'AutoCAD', areaId: 1 },
  { id: 21, nombre: 'Topografía', areaId: 1 },
  { id: 22, nombre: 'Perforación', areaId: 2 },
  { id: 23, nombre: 'Microsoft Excel', areaId: null },
]

describe('normalizar', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizar(' Ingeniería ')).toBe('ingenieria')
  })
})

describe('opcionesConArea y filtrarOpciones', () => {
  const opciones = opcionesConArea(profesiones, areas, 'parentId')

  it('pone el nombre del área como grupo', () => {
    expect(opciones[0]).toEqual({ id: 10, nombre: 'Ingeniería Civil', grupo: 'Ingeniería civil y construcción' })
    expect(opciones[3]?.grupo).toBeUndefined()
  })

  it('busca sin tildes y con palabras en cualquier orden; por nombre antes que por área', () => {
    expect(filtrarOpciones(opciones, 'civil inge').map((o) => o.id)).toEqual([10, 12])
  })

  it('también encuentra por el nombre del área', () => {
    expect(filtrarOpciones(opciones, 'mineria').map((o) => o.id)).toEqual([11])
  })

  it('primero los nombres que empiezan con lo buscado', () => {
    const lista = [
      { id: 1, nombre: 'Técnico en Arquitectura' },
      { id: 2, nombre: 'Arquitectura' },
    ]
    expect(filtrarOpciones(lista, 'arqui').map((o) => o.id)).toEqual([2, 1])
  })

  it('sin búsqueda devuelve todo', () => {
    expect(filtrarOpciones(opciones, '  ')).toHaveLength(4)
  })
})

describe('agrupar', () => {
  it('ordena los grupos y deja el grupo sin área al final', () => {
    const grupos = agrupar(opcionesConArea(profesiones, areas, 'parentId'), 'Otras profesiones')
    expect(grupos.map((g) => g.grupo)).toEqual([
      'Ingeniería civil y construcción',
      'Minería y metalurgia',
      'Otras profesiones',
    ])
    expect(grupos[0]?.opciones.map((o) => o.nombre)).toEqual(['Arquitectura', 'Ingeniería Civil'])
  })
})

describe('agregarInactivas', () => {
  it('agrega como inactivas las elegidas que ya no están en el catálogo', () => {
    const opciones = agregarInactivas(opcionesConArea(profesiones, areas, 'parentId'), [
      { id: 10, nombre: 'Ingeniería Civil' },
      { id: 99, nombre: 'Ingeniería Textil', activo: false },
    ])
    expect(opciones).toHaveLength(5)
    expect(opciones.at(-1)).toEqual({ id: 99, nombre: 'Ingeniería Textil', inactiva: true })
  })
})

describe('habilidadesSugeridas', () => {
  it('sugiere primero las del área de las profesiones elegidas y luego las generales', () => {
    const sugeridas = habilidadesSugeridas(habilidades, profesiones, [10], [21])
    expect(sugeridas.map((h) => h.id)).toEqual([20, 23])
  })

  it('sin profesiones elegidas solo sugiere las generales', () => {
    expect(habilidadesSugeridas(habilidades, profesiones, [], []).map((h) => h.id)).toEqual([23])
  })

  it('una profesión sin área no suma habilidades de área', () => {
    expect(habilidadesSugeridas(habilidades, profesiones, [13], []).map((h) => h.id)).toEqual([23])
  })
})

describe('tipoDocumento', () => {
  it('reconoce el tipo por la extensión de una URL firmada', () => {
    expect(tipoDocumento('https://r2.example.com/docs/abc.pdf?X-Amz-Signature=1')).toBe('pdf')
    expect(tipoDocumento('https://r2.example.com/logos/abc.PNG?x=1')).toBe('imagen')
    expect(tipoDocumento('https://r2.example.com/logos/abc.jpeg')).toBe('imagen')
    expect(tipoDocumento('https://r2.example.com/a.docx')).toBe('otro')
  })

  it('sin URL o con una URL inválida', () => {
    expect(tipoDocumento(null)).toBeNull()
    expect(tipoDocumento('no es url')).toBe('otro')
  })
})
