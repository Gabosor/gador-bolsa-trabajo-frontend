<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const modelo = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    ayuda?: string
    error?: string
    autocomplete?: string
    opcional?: boolean
    min?: string
    max?: string
    inputmode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal'
    placeholder?: string
    maxlength?: number
    pattern?: string
    titulo?: string
  }>(),
  {
    type: 'text',
    ayuda: undefined,
    error: undefined,
    autocomplete: undefined,
    min: undefined,
    max: undefined,
    inputmode: undefined,
    placeholder: undefined,
    maxlength: undefined,
    pattern: undefined,
    titulo: undefined,
  },
)

const id = useId()
const visible = ref(false)
const esPassword = computed(() => props.type === 'password')
const tipoReal = computed(() => (esPassword.value && visible.value ? 'text' : props.type))
const descripcion = computed(() => (props.error || props.ayuda ? `${id}-nota` : undefined))
</script>

<template>
  <div>
    <label :for="id" class="mb-1 block text-base font-semibold">
      {{ label }}<span v-if="opcional" class="font-normal text-roca"> (opcional)</span>
    </label>
    <div class="relative">
      <input
        :id="id"
        v-model="modelo"
        :type="tipoReal"
        :autocomplete="autocomplete"
        :required="!opcional"
        :min="min"
        :max="max"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :pattern="pattern"
        :title="titulo"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="descripcion"
        class="campo"
        :class="{ 'pr-12': esPassword }"
      />
      <button
        v-if="esPassword"
        type="button"
        class="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-roca"
        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <component :is="visible ? EyeOff : Eye" class="size-5" aria-hidden="true" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-nota`" class="mt-1 text-sm text-error">{{ error }}</p>
    <p v-else-if="ayuda" :id="`${id}-nota`" class="mt-1 text-sm text-roca">{{ ayuda }}</p>
  </div>
</template>
