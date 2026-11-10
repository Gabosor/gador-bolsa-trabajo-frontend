# Bolsa de Trabajo Departamental Digital: PWA

Aplicación web instalable de la Gobernación de Oruro para postulantes, empresas y administradores.

**Stack:** Vue 3, TypeScript, Vite, Tailwind CSS, Pinia, Vue Router, `vite-plugin-pwa`.
**API:** repositorio aparte (`backend`). La documentación técnica del sistema se entrega por separado.

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
| `npm test` | Pruebas del editor de texto, el texto con formato y los catálogos agrupados (Vitest) |
| `npm run preview` | Sirve la compilación; el service worker solo funciona aquí o en producción |

## Estructura

```
src/
  api/          cliente HTTP, tipos y notificaciones push
  stores/       sesión, avisos, interacciones y notificaciones (Pinia)
  router/       rutas protegidas por rol
  components/   componentes reutilizables
  composables/  lógica reutilizable de Vue (consultas de medios)
  utils/        formato de datos, editor de texto, catálogos agrupados y diálogos
  views/        publico, postulante, empresa, admin
  sw.js         service worker: caché y notificaciones
```

## Producción

El `Dockerfile` compila la app y la sirve con nginx. `VITE_API_URL` y `VITE_VAPID_PUBLIC_KEY` se pasan como argumentos de construcción, porque Vite los escribe en el código al compilar.

## APK para Android

El APK es una Trusted Web Activity: empaqueta esta misma PWA y conserva el service worker y las notificaciones push. Necesita la app publicada en un dominio HTTPS, JDK 17 y Android SDK.

```sh
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://TU-DOMINIO/manifest.webmanifest
bubblewrap build
bubblewrap fingerprint generateAssetLinks
```

Copia el `assetlinks.json` generado a `public/.well-known/` y vuelve a desplegar: sin ese archivo Android muestra la barra del navegador. La llave de firma (`android.keystore`) y sus contraseñas nunca se suben al repositorio.
