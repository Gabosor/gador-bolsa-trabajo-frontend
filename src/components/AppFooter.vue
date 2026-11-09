<script setup lang="ts">
defineProps<{ compacto: boolean }>()

const anio = new Date().getFullYear()
const TELEFONO = { texto: '(+591) 52-50319', href: 'tel:+5915250319' }
const CORREO = 'gador@oruro.gob.bo'
const REDES = [
  { nombre: 'Facebook', url: 'https://www.facebook.com/GobernacionDeOruro' },
  { nombre: 'YouTube', url: 'https://www.youtube.com/@Gobernaci%C3%B3ndeOruro' },
  { nombre: 'Instagram', url: 'https://www.instagram.com/infounicom.gador/' },
]
const INSTITUCION = 'Gobierno Autónomo Departamental de Oruro'
const CREDITO = 'Unidad de Sistemas e Informática'
</script>

<template>
  <!-- Con sesión: solo lo legal y el contacto; la navegación ya está en pantalla. -->
  <footer v-if="compacto" class="pie-compacto border-t border-linea pb-[calc(var(--alto-nav)+1rem)] text-sm text-roca">
    <div class="mx-auto flex max-w-6xl flex-col gap-1 px-4 pt-4 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-6 lg:px-8">
      <p>© {{ anio }} {{ INSTITUCION }}</p>
      <p class="flex flex-wrap gap-x-4">
        <a :href="TELEFONO.href" class="underline-offset-4 hover:underline">{{ TELEFONO.texto }}</a>
        <a :href="`mailto:${CORREO}`" class="underline-offset-4 hover:underline">{{ CORREO }}</a>
      </p>
    </div>
  </footer>

  <footer v-else class="pie mt-8">
    <!-- La arcada del palacio de la Gobernación, recortada sobre el fondo de la página. -->
    <div class="arcada -mb-px h-10 bg-guinda-900 sm:h-14" aria-hidden="true"></div>

    <div class="bg-guinda-900 text-guinda-100">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 pt-8 pb-10 md:grid-cols-[1.2fr_1fr_1.3fr] lg:px-8">
        <div>
          <RouterLink to="/" class="inline-flex items-center gap-3">
            <img src="/img/escudo.png" alt="" class="h-14 w-auto" />
            <span class="font-titulo text-xl leading-tight font-bold text-white">Bolsa de Trabajo</span>
          </RouterLink>
          <p class="mt-3 max-w-xs">
            Un servicio del
            <a href="https://www.oruro.gob.bo/" target="_blank" rel="noopener" class="enlace-pie text-white">{{ INSTITUCION }}</a>
          </p>
        </div>

        <nav aria-label="Enlaces de la Bolsa de Trabajo" class="space-y-6">
          <div>
            <h2 class="titulo-pie">Busco empleo</h2>
            <ul class="mt-1">
              <li><RouterLink to="/ofertas" class="enlace-pie fila-pie">Ver ofertas</RouterLink></li>
              <li><RouterLink to="/registro" class="enlace-pie fila-pie">Crear cuenta</RouterLink></li>
              <li><RouterLink to="/login" class="enlace-pie fila-pie">Ingresar</RouterLink></li>
            </ul>
          </div>
          <div>
            <h2 class="titulo-pie">Tengo una empresa</h2>
            <ul class="mt-1">
              <li><RouterLink to="/empresas/registro" class="enlace-pie fila-pie">Registrar empresa</RouterLink></li>
            </ul>
          </div>
        </nav>

        <div>
          <h2 class="titulo-pie">Visítanos</h2>
          <address class="mt-2 not-italic">
            <p class="max-w-xs">Plaza 10 de Febrero, Calle Presidente Montes entre Bolívar y Adolfo Mier</p>
            <a :href="TELEFONO.href" class="enlace-pie fila-pie mt-1">{{ TELEFONO.texto }}</a>
            <a :href="`mailto:${CORREO}`" class="enlace-pie fila-pie">{{ CORREO }}</a>
          </address>
          <ul class="mt-2 flex flex-wrap gap-x-5" aria-label="Redes sociales de la Gobernación">
            <li v-for="red in REDES" :key="red.nombre">
              <a :href="red.url" target="_blank" rel="noopener" class="enlace-pie fila-pie font-semibold text-white">{{ red.nombre }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-guinda-700">
        <div class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-sm sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-6 lg:px-8">
          <p>© {{ anio }} {{ INSTITUCION }}</p>
          <p>{{ CREDITO }}</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Máscara y no imagen: el color sigue viniendo del token y el arco nunca se deforma. */
.arcada {
  --arco: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='56' viewBox='0 0 48 56'%3E%3Cpath fill-rule='evenodd' d='M0 0H48V56H0ZM8 48V24A16 16 0 0 1 40 24V48Z'/%3E%3C/svg%3E");
  -webkit-mask: var(--arco) left bottom / auto 100% repeat-x;
  mask: var(--arco) left bottom / auto 100% repeat-x;
}

.titulo-pie {
  font-family: var(--font-titulo);
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
}

.fila-pie {
  display: flex;
  width: fit-content;
  min-height: 2.75rem;
  align-items: center;
}

.enlace-pie {
  text-decoration-color: var(--color-oro);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.enlace-pie:hover {
  text-decoration-line: underline;
}

/* El foco lago global no contrasta sobre el guinda. */
.pie :focus-visible {
  outline-color: white;
}
</style>
