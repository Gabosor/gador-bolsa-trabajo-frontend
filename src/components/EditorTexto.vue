<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { Bold, List, ListOrdered } from 'lucide-vue-next'
import TextoFormateado from '@/components/TextoFormateado.vue'
import {
  alternarLista,
  alternarNegrita,
  calcularReemplazo,
  continuarLista,
  formatoActivo,
  type EstadoEditor,
} from '@/utils/editorTexto'

/**
 * Campo de texto largo que crece con el contenido y admite formato ligero:
 * **negrita**, viñetas y listas numeradas. Se guarda como texto plano con
 * marcas, así que lo ya guardado sigue viéndose igual.
 */
const modelo = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    label: string
    opcional?: boolean
    ayuda?: string
    error?: string
    /** Alto mínimo en líneas. */
    filas?: number
    maxlength?: number
    minlength?: number
    placeholder?: string
  }>(),
  {
    ayuda: undefined,
    error: undefined,
    filas: 4,
    maxlength: undefined,
    minlength: undefined,
    placeholder: undefined,
  },
)

const id = useId()
const campo = ref<HTMLTextAreaElement>()
const modo = ref<'escribir' | 'previa'>('escribir')
const aviso = ref('')
const seleccion = ref({ inicio: 0, fin: 0 })

const esApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
const atajo = esApple ? '⌘B' : 'Ctrl+B'

const largo = computed(() => modelo.value.length)
const cercaDelLimite = computed(() => !!props.maxlength && largo.value >= props.maxlength * 0.9)
const nota = computed(() => (props.error || props.ayuda || aviso.value ? `${id}-nota` : undefined))
const describe = computed(() => [nota.value, props.maxlength ? `${id}-contador` : undefined].filter(Boolean).join(' ') || undefined)
const activo = computed(() => formatoActivo(modelo.value, seleccion.value.inicio, seleccion.value.fin))

function guardarSeleccion() {
  const el = campo.value
  if (el) seleccion.value = { inicio: el.selectionStart, fin: el.selectionEnd }
}

/** Selección actual; si el foco está en la barra, la última conocida. */
function seleccionActual() {
  const el = campo.value
  if (el && document.activeElement === el) return { inicio: el.selectionStart, fin: el.selectionEnd }
  return seleccion.value
}

/**
 * Aplica el resultado reemplazando solo lo que cambió. execCommand conserva
 * Ctrl+Z del navegador; si no está disponible, setRangeText + evento input.
 */
function aplicar(r: EstadoEditor) {
  const el = campo.value
  if (!el) return
  if (props.maxlength && r.texto.length > props.maxlength) {
    aviso.value = 'No queda espacio para aplicar el formato.'
    return
  }
  aviso.value = ''
  const cambio = calcularReemplazo(el.value, r.texto)
  el.focus({ preventScroll: true })
  el.setSelectionRange(cambio.desde, cambio.hasta)
  let hecho = false
  try {
    hecho = cambio.insertar
      ? document.execCommand('insertText', false, cambio.insertar)
      : cambio.desde === cambio.hasta || document.execCommand('delete')
  } catch {
    hecho = false
  }
  if (!hecho || el.value !== r.texto) {
    el.value = r.texto
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  el.setSelectionRange(r.selStart, r.selEnd)
  guardarSeleccion()
}

function formato(tipo: 'negrita' | 'vinetas' | 'numerada') {
  const { inicio, fin } = seleccionActual()
  const texto = campo.value?.value ?? modelo.value
  aplicar(tipo === 'negrita' ? alternarNegrita(texto, inicio, fin) : alternarLista(texto, inicio, fin, tipo))
}

function teclado(evento: KeyboardEvent) {
  // Mientras se compone texto (IME, Gboard) no se toca nada.
  if (evento.isComposing || evento.keyCode === 229) return
  const el = campo.value
  if (!el) return
  if ((evento.ctrlKey || evento.metaKey) && !evento.altKey && !evento.shiftKey && evento.key.toLowerCase() === 'b') {
    evento.preventDefault()
    formato('negrita')
    return
  }
  if (evento.key === 'Enter' && !evento.shiftKey && !evento.ctrlKey && !evento.metaKey && !evento.altKey && el.selectionStart === el.selectionEnd) {
    const r = continuarLista(el.value, el.selectionStart)
    if (r) {
      evento.preventDefault()
      aplicar(r)
    }
  }
}

/** Un campo oculto (vista previa) no puede mostrar su error: se vuelve a escribir. */
async function invalido() {
  if (modo.value === 'escribir') return
  modo.value = 'escribir'
  await nextTick()
  campo.value?.focus()
  campo.value?.reportValidity()
}

/* Barra con un solo punto de tabulación; las flechas recorren los botones. */
const botones = ref<HTMLButtonElement[]>([])
const enfocado = ref(0)
function moverEnBarra(evento: KeyboardEvent) {
  const total = botones.value.length
  const destino = { ArrowRight: enfocado.value + 1, ArrowLeft: enfocado.value - 1, Home: 0, End: total - 1 }[evento.key]
  if (destino === undefined) return
  evento.preventDefault()
  enfocado.value = (destino + total) % total
  botones.value[enfocado.value]?.focus()
}

/*
 * Crecer con el texto: con field-sizing lo hace el CSS; si el navegador no lo
 * soporta (Firefox, Safari antiguos), se ajusta la altura a mano.
 */
const soportaFieldSizing = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content')
let observador: ResizeObserver | undefined
let anchoPrevio = 0

function ajustarAltura() {
  const el = campo.value
  if (soportaFieldSizing || !el || el.offsetParent === null) return
  const contenedor = el.closest('dialog') ?? document.scrollingElement
  const scroll = contenedor?.scrollTop
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight + 2}px`
  if (contenedor && scroll !== undefined) contenedor.scrollTop = scroll
}

watch(modelo, ajustarAltura, { flush: 'post' })
watch(modo, () => nextTick(ajustarAltura))
onMounted(() => {
  ajustarAltura()
  if (soportaFieldSizing || typeof ResizeObserver === 'undefined' || !campo.value) return
  // Solo reacciona a cambios de ancho, para no entrar en un ciclo con la altura.
  observador = new ResizeObserver(([entrada]) => {
    const ancho = entrada?.contentRect.width ?? 0
    if (ancho !== anchoPrevio) {
      anchoPrevio = ancho
      ajustarAltura()
    }
  })
  observador.observe(campo.value)
})
onBeforeUnmount(() => observador?.disconnect())

defineExpose({ enfocar: () => campo.value?.focus() })
</script>

<template>
  <div>
    <label :for="id" class="mb-1 block text-base font-semibold">
      {{ label }}<span v-if="opcional" class="font-normal text-roca"> (opcional)</span>
    </label>
    <div
      class="rounded-campo border bg-white focus-within:border-guinda-700 focus-within:shadow-[0_0_0_3px_var(--color-guinda-100)]"
      :class="error ? 'border-error' : 'border-roca'"
    >
      <div class="flex flex-wrap items-center justify-between gap-1 border-b border-linea px-1 py-1">
        <div role="toolbar" :aria-label="`Formato de ${label}`" :aria-controls="id" class="flex gap-0.5" @keydown="moverEnBarra">
          <button
            v-for="(b, i) in [
              { tipo: 'negrita', icono: Bold, texto: `Negrita (${atajo})`, activo: activo.negrita },
              { tipo: 'vinetas', icono: List, texto: 'Lista con viñetas', activo: activo.vinetas },
              { tipo: 'numerada', icono: ListOrdered, texto: 'Lista numerada', activo: activo.numerada },
            ] as const"
            :key="b.tipo"
            :ref="(el) => { if (el) botones[i] = el as HTMLButtonElement }"
            type="button"
            class="flex size-11 items-center justify-center rounded-campo hover:bg-salar disabled:opacity-40 aria-pressed:bg-guinda-50 aria-pressed:text-guinda-700"
            :tabindex="i === enfocado ? 0 : -1"
            :aria-pressed="modo === 'escribir' && b.activo"
            :aria-label="b.texto"
            :aria-keyshortcuts="b.tipo === 'negrita' ? 'Control+B Meta+B' : undefined"
            :title="b.texto"
            :disabled="modo === 'previa'"
            @mousedown.prevent
            @click="enfocado = i; formato(b.tipo)"
          >
            <component :is="b.icono" class="size-5" aria-hidden="true" />
          </button>
        </div>
        <div role="group" aria-label="Modo" class="flex rounded-campo bg-salar p-0.5 text-sm font-semibold">
          <button
            v-for="m in [{ valor: 'escribir', texto: 'Escribir' }, { valor: 'previa', texto: 'Vista previa' }] as const"
            :key="m.valor"
            type="button"
            class="min-h-10 rounded-[6px] px-3"
            :class="modo === m.valor ? 'bg-white text-guinda-700 shadow-sm' : 'text-roca'"
            :aria-pressed="modo === m.valor"
            @click="modo = m.valor"
          >
            {{ m.texto }}
          </button>
        </div>
      </div>

      <textarea
        v-show="modo === 'escribir'"
        :id="id"
        ref="campo"
        v-model="modelo"
        class="campo-texto block w-full rounded-b-campo bg-transparent px-3 py-3 text-noche focus:outline-none"
        :style="{ minHeight: `calc(${filas} * 1.5em + 1.5rem)` }"
        :required="!opcional"
        :maxlength="maxlength"
        :minlength="minlength"
        :placeholder="placeholder"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describe"
        @keydown="teclado"
        @select="guardarSeleccion"
        @keyup="guardarSeleccion"
        @mouseup="guardarSeleccion"
        @input="guardarSeleccion"
        @blur="guardarSeleccion"
        @invalid="invalido"
      />
      <div
        v-if="modo === 'previa'"
        role="region"
        :aria-label="`Vista previa de ${label}`"
        class="px-3 py-3"
        :style="{ minHeight: `calc(${filas} * 1.5em + 1.5rem)` }"
      >
        <TextoFormateado v-if="modelo.trim()" :texto="modelo" />
        <p v-else class="text-roca">Nada que mostrar todavía.</p>
      </div>
    </div>

    <div class="mt-1 flex items-start justify-between gap-3 text-sm">
      <p v-if="error || aviso" :id="`${id}-nota`" class="text-error">{{ error || aviso }}</p>
      <p v-else-if="ayuda" :id="`${id}-nota`" class="text-roca">{{ ayuda }}</p>
      <span v-else />
      <span v-if="maxlength" :id="`${id}-contador`" class="shrink-0 tabular-nums" :class="cercaDelLimite ? 'font-semibold text-alerta' : 'text-roca'">
        {{ largo.toLocaleString('es-BO') }} / {{ maxlength.toLocaleString('es-BO') }}
      </span>
    </div>
    <p class="sr-only" aria-live="polite">{{ cercaDelLimite ? `Quedan ${maxlength! - largo} caracteres` : '' }}</p>
  </div>
</template>
