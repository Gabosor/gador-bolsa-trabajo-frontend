<script setup lang="ts">
defineProps<{ titulo: string; texto?: string }>()
</script>

<template>
  <section class="mx-auto max-w-md">
    <div class="plano p-5 sm:p-7">
      <img src="/img/logo2.svg" alt="Gobierno Autónomo Departamental de Oruro" class="mx-auto mb-3 size-28" />
      <h1 class="titulo-pagina text-center">{{ titulo }}</h1>
      <p v-if="texto" class="mt-1 text-center text-roca">{{ texto }}</p>
      <div class="mt-5"><slot /></div>
    </div>
    <div v-if="$slots.pie" class="mt-4 text-center"><slot name="pie" /></div>
  </section>
</template>
