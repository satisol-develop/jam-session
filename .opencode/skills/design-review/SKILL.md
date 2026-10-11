---
name: design-review
description: Revisión de diseño, UI/UX y experiencia móvil del proyecto jam-session (landing pública, paneles, formularios, tema claro/oscuro, i18n visual). Usar cuando el usuario pida revisar el diseño, la UI/UX, el móvil, que "no quede nada incompleto", el tema oscuro o la coherencia visual.
---

# Revisión de diseño/UI-UX de jam-session

Auditoría visual del código (no hay navegador: se revisa el código fuente y
se verifican reglas con grep). Devolver un informe con hallazgos
CRÍTICO/MEDIO/BAJO y, si el usuario lo pide, aplicarlos.

## Convenciones del proyecto

- **Público = siempre claro** (landing, login, registro, legales): NO
  llevar clases `dark:`; el efecto de tema en `site-header.tsx` solo aplica
  `dark` en rutas privadas (`/panel`, `/mi`, `/partituras`).
- **Paneles `/panel`**: fondo oscuro propio con clases `db-*`
  (`globals.css`), amarillo #FFE600, rojo #ef4444; textos de admin en
  castellano sin i18n.
- **Parte pública + /mi**: i18n ES/EU vía `useDict()`/`useLocale()` de
  `src/i18n/use-locale.ts`; nunca texto visible hardcodeado. Los títulos
  de canciones/artistas NO se traducen.
- Placeholders de `fmt()`: `{q}`, `{nombre}`, `{i}`, `{n}`, `{t}`, `{x}`…
  deben conservarse idénticos en ES y EU.

## Checklist móvil (prioridad máxima del usuario)

- Objetivos táctiles ≥ 40px: `min-h-10`/`min-w-10`/`size-10` en botones,
  enlaces-as-botón, checkboxes (`size-5`), cerrar (✕), selects (`min-h-10`).
- Sin `text-[9px]`/`text-[10px]`/`text-[11px]` en texto legible (mínimo
  `text-xs`=12px); excepción: badges numéricos puntuales.
- Selects/inputs en móvil con `text-base` (16px, evita zoom iOS) +
  `sm:text-sm|text-xs`.
- Cabecera con wrap seguro a 320px (flex-wrap, sin alturas fijas rígidas).
- Gaps de filas ≥ `gap-2`; nada de `gap-0.5`/`gap-1` en controles seguidos.
- Foco visible: existe regla `:focus-visible` en `globals.css` que vence a
  `outline-none`.

Grep de verificación rápida:

```
Select-String -Path <fichero> -Pattern "text-\[9px\]|text-\[10px\]|text-\[11px\]|gap-0\.5|size-4 |min-h-9"
```

## Checklist completitud

- Cero `console.log` de debug y cero `TODO`/`FIXME` en `src/`.
- Todo texto visible de `src/app` y `src/components` (excepto `/panel`)
  pasa por `d.*` del diccionario; revisar con grep strings entre `>`…`<`.
- Estados de carga: ningún `catch` que deje `null` eterno (skeleton
  infinito); todo fetch con `catch` que ponga `[]` + estado de error.
- Estados vacío ≠ error ≠ sin-datos: textos distintos.
- Páginas boundary existen: `not-found.tsx`, `error.tsx` (cliente, sin
  `cookies()` — Pages es estático), `loading.tsx` con `PantallaCargando`.
- `aria-label` en selects/iconos sin texto; `role="alert"` en errores.

## Checklist tema y consistencia

- Tema oscuro solo en zona privada; el inline script de
  `src/app/layout.tsx` (jam-theme) solo debe encender `dark` con sesión.
- Colores: rojo `red-500`/`#ef4444`, amarillo `#FFE600`, neutros
  `neutral-*`; nada de colores fuera de esta paleta.
- Tipografía: `Barlow`/`Barlow Condensed` (display en títulos uppercase).

## Salida

Informe por severidad con `fichero:línea`; aplicar arreglos solo si se
pide; verificar después con `tsc` + `lint` (ver skill testing-qa).
