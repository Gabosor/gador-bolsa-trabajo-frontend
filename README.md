# Bolsa de Trabajo Departamental Digital: PWA

Aplicación web instalable de la Gobernación de Oruro para postulantes, empresas y administradores.

**Stack:** Vue 3, TypeScript, Vite, Tailwind CSS, Pinia, Vue Router, `vite-plugin-pwa`.
**API:** repositorio aparte (`backend`), que también contiene la documentación completa del sistema.

## Requisitos

Node.js 22.18 o superior, y la API en ejecución.

## Instalación

```bash
npm install
cp .env.example .env
npm run dev      # http://localhost:5173
```

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de la API, terminada en `/api` |
| `VITE_VAPID_PUBLIC_KEY` | Clave pública para notificaciones push |

Todo `VITE_*` llega al navegador: aquí solo van valores públicos.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Desarrollo |
| `npm run build` | Comprueba tipos y compila en `dist/` |
| `npm run preview` | Sirve la compilación; el service worker solo funciona aquí o en producción |

## Estructura

```
src/
  api/          cliente HTTP, tipos y notificaciones push
  stores/       sesión (Pinia)
  router/       rutas protegidas por rol
  components/   componentes reutilizables
  views/        publico, postulante, empresa, admin
  sw.js         service worker: caché y notificaciones
```

## Producción

El `Dockerfile` compila la app y la sirve con nginx. `VITE_API_URL` y `VITE_VAPID_PUBLIC_KEY` se pasan como argumentos de construcción, porque Vite los escribe en el código al compilar.
