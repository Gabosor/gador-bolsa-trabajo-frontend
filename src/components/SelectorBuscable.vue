<script setup lang="ts" generic="T extends number | '' | number[]">
import { computed, nextTick, ref, useId, watch, watchEffect } from 'vue'
import { Check, ChevronDown, X } from 'lucide-vue-next'
import { agrupar, filtrarOpciones, type OpcionBuscable } from '@/utils/catalogos'

/**
 * Lista con buscador para catálogos largos (profesiones, habilidades).
 * Con un arreglo en v-model elige varias; con un número, una sola.
 * Patrón combobox de ARIA 1.2; la lista va dentro del flujo de la página
 * (no flotante) para que no la corte un dialog ni la tape el teclado.
 */
const modelo = defineModel<T>({ required: true })

const props = withDefaults(
  defineProps<{
    label: string
    opciones: OpcionBuscable[]
    opcional?: boolean
    ayuda?: string
    error?: string
    placeholder?: string
    /** Título del grupo de opciones sin área. */
    textoSinGrupo?: string
    /** Ids que no se ofrecen (por ejemplo, las habilidades ya agregadas). */
    excluir?: number[]
    /** Para "agregar": tras elegir, el campo vuelve a quedar vacío. */
    limpiarAlElegir?: boolean
    maxVisibles?: number
  }>(),
  {
    ayuda: undefined,
    error: undefined,
    placeholder: 'Escribe para buscar',
    textoSinGrupo: 'Otras',
    excluir: () => [],
    maxVisibles: 60,
  },
)

const emit = defineEmits<{ elegir: [id: number] }>()

const id = useId()
const idLista = `${id}-lista`
const raiz = ref<HTMLElement>()
const entrada = ref<HTMLInputElement>()
const consulta = ref('')
const abierta = ref(false)
const activa = ref(-1)
const anuncio = ref('')

const multiple = computed(() => Array.isArray(modelo.value))
const elegidos = computed<number[]>(() => {
  const valor = modelo.value
  if (Array.isArray(valor)) return valor
  return valor === '' ? [] : [valor as number]
})
const porId = computed(() => new Map(props.opciones.map((o) => [o.id, o])))
const opcionesElegidas = computed(() =>
  elegidos.value.map((i) => porId.value.get(i) ?? { id: i, nombre: `#${i}`, inactiva: true }),
)
const inactivas = computed(() => opcionesElegidas.value.filter((o) => o.inactiva))
const unica = computed(() => (multiple.value ? undefined : opcionesElegidas.value[0]))

const disponibles = computed(() =>
  props.opciones.filter((o) => !o.inactiva && !props.excluir.includes(o.id)),
)
const filtradas = computed(() => filtrarOpciones(disponibles.value, consulta.value))
const buscando = computed(() => consulta.value.trim() !== '')
// Sin búsqueda se muestra todo agrupado por área; buscando, por relevancia.
const limite = computed(() => (buscando.value ? props.maxVisibles : 400))
const visibles = computed(() => filtradas.value.slice(0, limite.value))
const grupos = computed(() =>
  buscando.value ? [{ grupo: '', opciones: visibles.value }] : agrupar(visibles.value, props.textoSinGrupo),
)
const planas = computed(() => grupos.value.flatMap((g) => g.opciones))
const idOpcion = (o: OpcionBuscable) => `${id}-op-${o.id}`

const describe = computed(() => (props.error || props.ayuda || inactivas.value.length ? `${id}-nota` : undefined))
const textoEntrada = computed(() => (abierta.value || multiple.value ? consulta.value : (unica.value?.nombre ?? '')))

function abrir() {
  if (abierta.value) return
  abierta.value = true
  activa.value = -1
  // En pantallas angostas sube el campo para que la lista quede sobre el teclado.
  if (window.matchMedia?.('(max-width: 63.99rem)').matches) {
    nextTick(() => raiz.value?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }
}

function cerrar() {
  abierta.value = false
  activa.value = -1
  consulta.value = ''
}

function elegir(opcion: OpcionBuscable) {
  if (multiple.value) {
    const actuales = elegidos.value
    const ya = actuales.includes(opcion.id)
    modelo.value = (ya ? actuales.filter((x) => x !== opcion.id) : [...actuales, opcion.id]) as T
    anuncio.value = `${ya ? 'Quitaste' : 'Agregaste'} ${opcion.nombre}`
    consulta.value = ''
    activa.value = -1
  } else {
    modelo.value = (props.limpiarAlElegir ? '' : opcion.id) as T
    anuncio.value = props.limpiarAlElegir ? `Agregaste ${opcion.nombre}` : `Elegiste ${opcion.nombre}`
    if (props.limpiarAlElegir) {
      consulta.value = ''
      activa.value = -1
    } else {
      cerrar()
    }
  }
  emit('elegir', opcion.id)
}

function quitar(opcion: OpcionBuscable) {
  modelo.value = (multiple.value ? elegidos.value.filter((x) => x !== opcion.id) : '') as T
  anuncio.value = `Quitaste ${opcion.nombre}`
  entrada.value?.focus()
}

function escribir(evento: Event) {
  consulta.value = (evento.target as HTMLInputElement).value
  abrir()
  activa.value = -1
}

function mover(paso: number) {
  abrir()
  const total = planas.value.length
  if (!total) return
  activa.value = Math.min(total - 1, Math.max(0, activa.value + paso))
}

function teclado(evento: KeyboardEvent) {
  switch (evento.key) {
    case 'ArrowDown':
      evento.preventDefault()
      if (evento.altKey) abrir()
      else mover(1)
      break
    case 'ArrowUp':
      evento.preventDefault()
      mover(-1)
      break
    case 'PageDown':
      evento.preventDefault()
      mover(10)
      break
    case 'PageUp':
      evento.preventDefault()
      mover(-10)
      break
    case 'Enter':
      if (!abierta.value) return
      // Con la lista abierta, Enter elige; nunca envía el formulario.
      evento.preventDefault()
      if (activa.value >= 0) {
        const opcion = planas.value[activa.value]
        if (opcion) elegir(opcion)
      } else if (planas.value.length === 1 && buscando.value) {
        elegir(planas.value[0]!)
      }
      break
    case 'Escape':
      if (abierta.value || consulta.value) {
        // Que no cierre también el dialog que contiene al campo.
        evento.preventDefault()
        evento.stopPropagation()
        if (abierta.value) cerrar()
        else consulta.value = ''
      }
      break
    case 'Tab':
      cerrar()
      break
    case 'Backspace':
      if (multiple.value && !consulta.value && opcionesElegidas.value.length) {
        quitar(opcionesElegidas.value.at(-1)!)
      }
      break
  }
}

function salir(evento: FocusEvent) {
  if (!raiz.value?.contains(evento.relatedTarget as Node | null)) cerrar()
}

watch(activa, async (i) => {
  if (i < 0) return
  await nextTick()
  document.getElementById(idOpcion(planas.value[i]!))?.scrollIntoView({ block: 'nearest' })
})

// Cuántos resultados hay, para lectores de pantalla (sin anunciar cada tecla).
let espera: ReturnType<typeof setTimeout> | undefined
watch([consulta, abierta], () => {
  clearTimeout(espera)
  if (!abierta.value) return
  espera = setTimeout(() => {
    const n = filtradas.value.length
    anuncio.value = n === 0 ? 'Sin resultados' : `${n} ${n === 1 ? 'resultado' : 'resultados'}`
  }, 300)
})

// La validación nativa del formulario también revisa este campo.
watchEffect(() => {
  const el = entrada.value
  if (!el) return
  // En un campo opcional (un filtro), un valor que ya no existe no bloquea el envío.
  el.setCustomValidity(
    inactivas.value.length && !props.opcional
      ? 'Quita las opciones que ya no están disponibles'
      : !props.opcional && elegidos.value.length === 0
        ? 'Selecciona una opción de la lista'
        : '',
  )
})
</script>

<template>
  <div ref="raiz" class="scroll-mt-20" @focusout="salir">
    <label :for="id" class="mb-1 block text-base font-semibold">
      {{ label }}<span v-if="opcional && !limpiarAlElegir" class="font-normal text-roca"> (opcional)</span>
    </label>

    <ul v-if="multiple && opcionesElegidas.length" class="mb-2 flex flex-wrap gap-2" :aria-label="`${label}: seleccionadas`">
      <li
        v-for="o in opcionesElegidas"
        :key="o.id"
        class="inline-flex min-h-11 items-center gap-1 rounded-full border py-1 pl-3.5 pr-1 text-base"
        :class="o.inactiva ? 'border-error bg-error-50 text-error' : 'border-guinda-700 bg-guinda-50 text-guinda-900'"
      >
        <span class="font-semibold">{{ o.nombre }}</span>
        <span v-if="o.inactiva" class="text-sm">(inactiva)</span>
        <button type="button" class="flex size-9 items-center justify-center rounded-full hover:bg-white" :aria-label="`Quitar ${o.nombre}`" @click="quitar(o)">
          <X class="size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <div class="relative">
      <input
        :id="id"
        ref="entrada"
        :value="textoEntrada"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="abierta"
        :aria-controls="idLista"
        :aria-activedescendant="abierta && activa >= 0 && planas[activa] ? idOpcion(planas[activa]!) : undefined"
        :aria-invalid="error || inactivas.length ? 'true' : undefined"
        :aria-describedby="describe"
        :placeholder="abierta && unica ? unica.nombre : placeholder"
        class="campo pr-20"
        @input="escribir"
        @focus="abrir"
        @click="abrir"
        @keydown="teclado"
      />
      <div class="absolute inset-y-0 right-0 flex items-center pr-1">
        <button
          v-if="!multiple && unica && opcional && !limpiarAlElegir"
          type="button"
          class="flex size-10 items-center justify-center rounded-full text-roca hover:bg-salar"
          aria-label="Quitar selección"
          @click="quitar(unica)"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
        <ChevronDown class="pointer-events-none mx-2 size-5 text-roca transition-transform" :class="{ 'rotate-180': abierta }" aria-hidden="true" />
      </div>
    </div>

    <div v-show="abierta">
      <ul
        v-if="planas.length"
        :id="idLista"
        role="listbox"
        :aria-label="label"
        :aria-multiselectable="multiple || undefined"
        class="mt-1 max-h-72 overflow-y-auto rounded-campo border border-roca bg-white pb-1"
      >
        <li v-for="(g, n) in grupos" :key="g.grupo" role="presentation">
          <ul role="group" :aria-labelledby="g.grupo ? `${id}-g-${n}` : undefined" :aria-label="g.grupo ? undefined : 'Resultados'">
            <li
              v-if="g.grupo"
              :id="`${id}-g-${n}`"
              role="presentation"
              class="sticky top-0 z-10 border-b border-linea bg-salar px-3 py-1.5 text-sm font-semibold text-roca"
            >
              {{ g.grupo }}
            </li>
            <li
              v-for="o in g.opciones"
              :id="idOpcion(o)"
              :key="o.id"
              role="option"
              :aria-selected="elegidos.includes(o.id)"
              class="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-1.5"
              :class="planas[activa]?.id === o.id ? 'bg-lago-50 outline-2 -outline-offset-2 outline-lago' : 'hover:bg-salar'"
              @mousedown.prevent
              @click="elegir(o)"
            >
              <Check class="size-4 shrink-0" :class="elegidos.includes(o.id) ? 'text-guinda-700' : 'invisible'" aria-hidden="true" />
              <span class="min-w-0 flex-1">
                <span :class="{ 'font-semibold': elegidos.includes(o.id) }">{{ o.nombre }}</span>
                <span v-if="buscando && o.grupo" class="block text-sm text-roca">{{ o.grupo }}</span>
              </span>
            </li>
          </ul>
        </li>
      </ul>
      <p v-else class="mt-1 rounded-campo border border-linea bg-white px-3 py-2 text-roca">
        {{ buscando ? `Sin resultados para «${consulta.trim()}».` : 'No hay más opciones.' }}
      </p>
      <p v-if="filtradas.length > visibles.length" class="mt-1 text-sm text-roca">
        Se muestran {{ visibles.length }} de {{ filtradas.length }}. Sigue escribiendo para afinar.
      </p>
    </div>

    <p v-if="inactivas.length" :id="`${id}-nota`" class="mt-1 text-sm text-error">
      {{ inactivas.map((o) => o.nombre).join(', ') }} ya no {{ inactivas.length === 1 ? 'está disponible' : 'están disponibles' }}. {{ multiple ? `Quítala${inactivas.length === 1 ? '' : 's'} para continuar.` : 'Elige otra para continuar.' }}
    </p>
    <p v-else-if="error" :id="`${id}-nota`" class="mt-1 text-sm text-error">{{ error }}</p>
    <p v-else-if="ayuda" :id="`${id}-nota`" class="mt-1 text-sm text-roca">{{ ayuda }}</p>
    <p class="sr-only" aria-live="polite">{{ anuncio }}</p>
  </div>
</template>
