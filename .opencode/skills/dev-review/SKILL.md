---
name: dev-review
description: Revisión de código y arquitectura del proyecto jam-session (Next 16, React 19, Tailwind v4, Firebase, Apps Script). Usar cuando el usuario pida revisar el código, el rendimiento, la arquitectura, refactorizar, o "verificar que está bien construido".
---

# Revisión de código/desarrollo de jam-session

Auditoría técnica del frontend. Devolver hallazgos con `fichero:línea`,
severidad y propuesta; aplicar solo lo que se pida y verificar con la
batería de la skill `testing-qa` después de tocar código.

## Stack y particularidades

- Next.js **16** con `[locale]` dinámico y `proxy.ts` (middleware):
  leer `node_modules/next/dist/docs/` antes de APIs nuevas de Next.
- React 19 + React Compiler (lint `react-hooks/*`): nada de `setState`
  síncrono dentro de `useEffect` (usar patrón de estado con sello
  `intento`, ver `audit-panel.tsx`).
- Backend: Google Apps Script (`src/lib/api/client.ts` → POST text/plain,
  sin servidor propio; GitHub Pages = export estático, **nunca** APIs de
  servidor como `cookies()`/`dynamic` en rutas prerenderizadas).
- Demo: `DEMO_MODE` con `demoApi` espejo; al añadir una ruta de backend hay
  que mantener paridad → `npm.cmd run check:routes`.
- i18n: `src/i18n/es.ts` (Dict maestro) + `eu.ts`; paridad con
  `node scripts/check-dicts.mjs`. Datos de Sheets en castellano,
  `traducirInstrumento()` al presentar.
- Auth: Firebase cliente + `roles-cache.ts` (localStorage) y gate
  (`session-gate.tsx`); cookies `jam_auth`/`jam_role` para el SSR/estático.

## Rendimiento (reglas acordadas)

- Toda lectura pasa por `api()` con dedupe en vuelo + TTL 30 s
  (`RUTAS_LECTURA` en `client.ts`); mutaciones invalidan el caché.
  Añadir rutas nuevas al Set si son de solo lectura.
- Cambiar de pestaña NO recarga datos (los paneles tienen su refresh).
- `/mi` y pantallas con varios fetches: `Promise.all` en paralelo.
- `user.me` solo dedupe sin TTL.

## Estilo

- Comentarios escasos y en español; convenciones existentes del fichero.
- Componentes cliente marcan `"use client"`; server components solo si aportan.
- Sin dependencias nuevas sin comprobar que ya no existe en package.json.

## Checklist de revisión

1. Tipos: `tsc --noEmit` sin errores; sin `any` nuevos ni casts peligrosos.
2. Lint: 0 errores (warning TanStack conocido).
3. Estado: todo fetch con carga/error/vacío; `catch` no deja skeletons eternos.
4. Hooks: deps correctas; sin setState síncrono en effects; limpieza de
   listeners/timers.
5. Seguridad: sin secretos en cliente (`.env.local` solo NEXT_PUBLIC_*);
   `/apps-script/` jamás se sube (gitignore); tokens solo por body.
6. i18n: textos visibles en diccionario (excepto `/panel`); paridad ES/EU.
7. Rutas nuevas: paridad demo/docs/check:routes.
8. Accesibilidad básica: labels, aria en iconos, foco, roles de error.

## Salida

Informe priorizado + parches aplicados + batería `testing-qa` en verde.
