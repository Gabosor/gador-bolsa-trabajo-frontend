<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api, mensajeError } from '@/api'
import type { ItemCatalogo, Perfil } from '@/api/tipos'
import AccionBoton from '@/components/AccionBoton.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'

const perfil = ref<Perfil | null>(null)
const profesiones = ref<ItemCatalogo[]>([])
const catalogoHabilidades = ref<ItemCatalogo[]>([])
const error = ref('')
const aviso = ref('')

const datos = reactive({ direccion: '', fechaNacimiento: '' })
const idiomas = ref<{ nombre: string; nivel: string }[]>([])
const habilidades = ref<{ habilidadId: number | ''; nivel: number }[]>([])
const formacion = reactive({ profesionId: '' as number | '', institucion: '', anioTitulacion: '', nroTituloNacional: '' })
const experiencia = reactive({ empresa: '', cargo: '', anios: '', descripcion: '' })

const NIVELES = [
  { id: 1, nombre: 'Básico' },
  { id: 2, nombre: 'Intermedio' },
  { id: 3, nombre: 'Avanzado' },
]
const claseCampo = 'min-h-11 w-full rounded-md border border-stone-400 bg-white px-3'

async function recargar() {
  const p = await api<Perfil>('/postulantes/perfil')
  perfil.value = p
  datos.direccion = p.direccion ?? ''
  datos.fechaNacimiento = p.fechaNacimiento ?? ''
  idiomas.value = p.idiomas.map((i) => ({ ...i }))
  habilidades.value = p.habilidades.map((h) => ({ habilidadId: h.habilidad.id, nivel: h.nivel }))
}

/** Ejecuta un cambio, avisa el resultado y refresca el perfil. */
async function ejecutar(accion: () => Promise<unknown>, mensaje: string) {
  error.value = ''
  aviso.value = ''
  try {
    await accion()
    await recargar()
    aviso.value = mensaje
    return true
  } catch (e) {
    error.value = mensajeError(e)
    return false
  }
}

const guardarDatos = () =>
  ejecutar(
    () => api('/postulantes/perfil/datos', { method: 'PUT', body: { ...datos, idiomas: idiomas.value } }),
    'Datos guardados',
  )

const guardarHabilidades = () =>
  ejecutar(
    () => api('/postulantes/perfil/habilidades', { method: 'PUT', body: { habilidades: habilidades.value } }),
    'Habilidades guardadas',
  )

function subir(ruta: 'cv' | 'foto', evento: Event) {
  const input = evento.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return
  const cuerpo = new FormData()
  cuerpo.append('archivo', archivo)
  ejecutar(() => api(`/postulantes/perfil/${ruta}`, { method: 'POST', body: cuerpo }), 'Archivo subido')
  input.value = ''
}

async function agregarFormacion() {
  const ok = await ejecutar(
    () =>
      api('/postulantes/perfil/formaciones', {
        method: 'POST',
        body: { ...formacion, anioTitulacion: Number(formacion.anioTitulacion) },
      }),
    'Formación agregada',
  )
  if (ok) Object.assign(formacion, { profesionId: '', institucion: '', anioTitulacion: '', nroTituloNacional: '' })
}

async function agregarExperiencia() {
  const ok = await ejecutar(
    () =>
      api('/postulantes/perfil/experiencias', {
        method: 'POST',
        body: { ...experiencia, anios: Number(experiencia.anios) },
      }),
    'Experiencia agregada',
  )
  if (ok) Object.assign(experiencia, { empresa: '', cargo: '', anios: '', descripcion: '' })
}

const eliminar = (ruta: string, id: number) =>
  ejecutar(() => api(`/postulantes/perfil/${ruta}/${id}`, { method: 'DELETE' }), 'Registro eliminado')

onMounted(async () => {
  try {
    ;[profesiones.value, catalogoHabilidades.value] = await Promise.all([
      api<ItemCatalogo[]>('/catalogos/PROFESION'),
      api<ItemCatalogo[]>('/catalogos/habilidades'),
    ])
    await recargar()
  } catch (e) {
    error.value = mensajeError(e)
  }
})
</script>

<template>
  <section v-if="perfil" class="mx-auto max-w-2xl space-y-8">
    <div>
      <h1 class="text-2xl font-semibold text-guinda-900">Mi hoja de vida</h1>
      <p class="text-sm text-stone-600">{{ perfil.user.nombreCompleto }} · CI {{ perfil.user.ci }}</p>
      <div class="mt-3">
        <p class="mb-1 text-sm font-medium">Perfil completo: {{ perfil.porcentajeCompletitud }} %</p>
        <div
          role="progressbar"
          aria-label="Perfil completo"
          :aria-valuenow="perfil.porcentajeCompletitud"
          aria-valuemin="0"
          aria-valuemax="100"
          class="h-3 overflow-hidden rounded-full bg-stone-200"
        >
          <div class="h-full bg-guinda-700" :style="{ width: `${perfil.porcentajeCompletitud}%` }" />
        </div>
        <p v-if="perfil.porcentajeCompletitud <= 80" class="mt-1 text-xs text-stone-600">
          Necesitas más del 80 % para postular.
        </p>
      </div>
    </div>

    <div class="sticky top-0 z-10" aria-live="polite">
      <p v-if="aviso" class="rounded-md bg-green-100 p-3 text-sm text-green-900">{{ aviso }}</p>
      <p v-if="error" role="alert" class="rounded-md bg-red-100 p-3 text-sm text-red-900">{{ error }}</p>
    </div>

    <div>
      <h2 class="mb-3 text-lg font-semibold">Foto y CV</h2>
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <img v-if="perfil.fotoUrl" :src="perfil.fotoUrl" alt="Tu foto de perfil" class="size-16 rounded-full object-cover" />
          <label class="block min-w-0 flex-1">
            <span class="mb-1 block text-sm font-medium">Foto (PNG o JPG, máx. 2 MB)</span>
            <input type="file" accept="image/png,image/jpeg" class="block w-full text-sm" @change="subir('foto', $event)" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">CV en PDF (obligatorio, máx. 5 MB)</span>
          <input type="file" accept="application/pdf" class="block w-full text-sm" @change="subir('cv', $event)" />
        </label>
        <a v-if="perfil.cvUrl" :href="perfil.cvUrl" target="_blank" rel="noopener" class="inline-block font-medium text-guinda-700 underline">
          Ver mi CV actual
        </a>
      </div>
    </div>

    <form class="space-y-4" @submit.prevent="guardarDatos">
      <h2 class="text-lg font-semibold">Datos personales e idiomas</h2>
      <BaseInput v-model="datos.direccion" label="Dirección" autocomplete="street-address" />
      <BaseInput v-model="datos.fechaNacimiento" label="Fecha de nacimiento" type="date" autocomplete="bday" />
      <div v-for="(idioma, i) in idiomas" :key="i" class="flex items-end gap-2">
        <div class="min-w-0 flex-1"><BaseInput v-model="idioma.nombre" label="Idioma" /></div>
        <div class="min-w-0 flex-1"><BaseInput v-model="idioma.nivel" label="Nivel" /></div>
        <AccionBoton @click="idiomas.splice(i, 1)">Quitar</AccionBoton>
      </div>
      <AccionBoton @click="idiomas.push({ nombre: '', nivel: '' })">Agregar idioma</AccionBoton>
      <BaseButton>Guardar datos</BaseButton>
    </form>

    <form class="space-y-3" @submit.prevent="guardarHabilidades">
      <h2 class="text-lg font-semibold">Habilidades</h2>
      <div v-for="(h, i) in habilidades" :key="i" class="flex items-end gap-2">
        <div class="min-w-0 flex-1"><BaseSelect v-model="h.habilidadId" label="Habilidad" :opciones="catalogoHabilidades" /></div>
        <label class="block min-w-0 flex-1">
          <span class="mb-1 block text-sm font-medium">Nivel</span>
          <select v-model="h.nivel" :class="claseCampo">
            <option v-for="n in NIVELES" :key="n.id" :value="n.id">{{ n.nombre }}</option>
          </select>
        </label>
        <AccionBoton @click="habilidades.splice(i, 1)">Quitar</AccionBoton>
      </div>
      <AccionBoton @click="habilidades.push({ habilidadId: '', nivel: 1 })">Agregar habilidad</AccionBoton>
      <BaseButton>Guardar habilidades</BaseButton>
    </form>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">Formación académica</h2>
      <ul class="space-y-2">
        <li v-for="f in perfil.formaciones" :key="f.id" class="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white p-3 text-sm">
          <span class="min-w-0">
            <strong>{{ f.profesion.nombre }}</strong><br />
            {{ f.institucion }} · {{ f.anioTitulacion }} · Título {{ f.nroTituloNacional }}
          </span>
          <AccionBoton @click="eliminar('formaciones', f.id)">Eliminar</AccionBoton>
        </li>
      </ul>
      <form class="space-y-3" @submit.prevent="agregarFormacion">
        <BaseSelect v-model="formacion.profesionId" label="Título" :opciones="profesiones" />
        <BaseInput v-model="formacion.institucion" label="Universidad o instituto" />
        <BaseInput v-model="formacion.anioTitulacion" label="Año de titulación" type="number" min="1950" />
        <BaseInput v-model="formacion.nroTituloNacional" label="Número de Título Nacional" />
        <BaseButton>Agregar formación</BaseButton>
      </form>
    </div>

    <div class="space-y-3">
      <h2 class="text-lg font-semibold">Experiencia laboral</h2>
      <ul class="space-y-2">
        <li v-for="x in perfil.experiencias" :key="x.id" class="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white p-3 text-sm">
          <span class="min-w-0">
            <strong>{{ x.cargo }}</strong> en {{ x.empresa }} · {{ x.anios }} año(s)<br />
            {{ x.descripcion }}
          </span>
          <AccionBoton @click="eliminar('experiencias', x.id)">Eliminar</AccionBoton>
        </li>
      </ul>
      <form class="space-y-3" @submit.prevent="agregarExperiencia">
        <BaseInput v-model="experiencia.empresa" label="Empresa" />
        <BaseInput v-model="experiencia.cargo" label="Cargo" />
        <BaseInput v-model="experiencia.anios" label="Años" type="number" min="0" />
        <BaseTextarea v-model="experiencia.descripcion" label="Descripción" />
        <BaseButton>Agregar experiencia</BaseButton>
      </form>
    </div>
  </section>
  <p v-else-if="error" role="alert" class="text-red-700">{{ error }}</p>
</template>
