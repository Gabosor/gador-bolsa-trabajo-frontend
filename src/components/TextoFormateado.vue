<script setup lang="ts">
import { computed } from 'vue'
import { analizarTexto } from '@/utils/textoFormateado'

/**
 * Muestra un texto con formato ligero (negrita y listas). No usa v-html:
 * todo se pinta con interpolación, que escapa cualquier HTML.
 */
const props = defineProps<{ texto: string | null | undefined }>()
const bloques = computed(() => analizarTexto(props.texto))
</script>

<template>
  <div class="space-y-2 break-words">
    <template v-for="(bloque, i) in bloques" :key="i">
      <!-- Los segmentos van en una sola línea: con pre-line, los saltos del template se verían. -->
      <p v-if="bloque.tipo === 'parrafo'" class="whitespace-pre-line"><template v-for="(s, j) in bloque.segmentos" :key="j"><strong v-if="s.negrita" class="font-bold">{{ s.texto }}</strong><template v-else>{{ s.texto }}</template></template></p>
      <component :is="bloque.ordenada ? 'ol' : 'ul'" v-else :start="bloque.ordenada && bloque.inicio !== 1 ? bloque.inicio : undefined" class="space-y-1 pl-6" :class="bloque.ordenada ? 'list-decimal' : 'list-disc'">
        <li v-for="(item, j) in bloque.items" :key="j" class="whitespace-pre-line pl-1"><template v-for="(s, k) in item" :key="k"><strong v-if="s.negrita" class="font-bold">{{ s.texto }}</strong><template v-else>{{ s.texto }}</template></template></li>
      </component>
    </template>
  </div>
</template>
