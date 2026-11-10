import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Independiente de vite.config.ts: las pruebas de utilidades puras no
// necesitan los plugins de PWA ni de devtools.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/**/__tests__/**/*.spec.ts'] },
})
