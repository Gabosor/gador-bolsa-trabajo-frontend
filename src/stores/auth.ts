import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, TOKEN_KEY } from '@/api'

export type Rol = 'SUPERADMIN' | 'EMPRESA' | 'POSTULANTE'

export interface Usuario {
  id: number
  nombreCompleto: string
  email: string
  rol: Rol
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)
  let iniciada = false

  const autenticado = computed(() => usuario.value !== null)

  /** Recupera la sesión guardada; se ejecuta una vez al abrir la app. */
  async function iniciar() {
    if (iniciada) return
    iniciada = true
    if (!localStorage.getItem(TOKEN_KEY)) return
    try {
      usuario.value = await api<Usuario>('/auth/me')
    } catch {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  async function login(email: string, password: string) {
    const r = await api<{ token: string; user: Usuario }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    localStorage.setItem(TOKEN_KEY, r.token)
    usuario.value = r.user
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    usuario.value = null
  }

  return { usuario, autenticado, iniciar, login, logout }
})
