# Jam Session — Web App

Aplicación responsive para coordinar, ejecutar y hacer seguimiento de las Jam
Sessions periódicas: vista pública del evento, inscripción de músicos, material
de estudio protegido, paneles por rol con ciclo de tareas, escaleta en directo
y módulo de Caja y Barra.

## Stack

| Capa | Tecnología |
|---|---|
| Front-end | Next.js 16 (App Router, TypeScript, Tailwind CSS, React 19) |
| Auth | Firebase Auth (cliente); el ID token lo verifica Apps Script con `accounts:lookup` |
| Datos | Google Sheets vía **Google Apps Script Web App** (API JSON directa desde el navegador) |
| Archivos | Google Drive (catálogo maestro: partituras, cifrados, guías de audio) |
| Despliegue | GitHub Pages (static export) + Apps Script (backend operativo) |

## Puesta en marcha

> **Guía completa de producción, paso a paso: [docs/PRODUCCION.md](docs/PRODUCCION.md)**
> (Drive → Apps Script → Firebase → GitHub → verificación).

### 0. Modo demo (sin servicios)

La app arranca en **modo demo por defecto**: datos dummy en memoria (evento,
repertorio, roles, tareas, escaleta, caja, material de partituras) y sesión
simulada con **cualquier email/contraseña** en login/registro. No hace falta
Firebase ni Apps Script.

- Se reconoce por la etiqueta «Demo» de la cabecera.
- Los datos viven en `src/lib/demo/` y se reinician al recargar la página.
- **Cuentas dummy por rol** (selector en `/login`, contraseña libre): `admin@`,
  `general@`, `grupo@`, `sm@`, `tecnico@`, `caja@`, `redes@jam.session` (cada
  una solo ve su panel; admin es vista global en solo lectura) y
  `demo@jam.session` (músico sin roles). Cualquier otro email crea un músico
  sin roles.
- Para usar los servicios reales: `NEXT_PUBLIC_DEMO_MODE=false` en `.env.local`
  (y variables reales del paso siguiente).

### 1. Apps Script (backend, solo local)

> **Nota:** el código del backend (`apps-script/`) **no se publica en este
> repositorio** (está en `.gitignore`); vive solo en local y no participa en
> el modo demo. Si necesitas el backend real, copia la carpeta `apps-script/`
> desde tu copia local y sigue su `README.md`: crear proyecto, ejecutar
> `setup()`, desplegar Web App y (opcional) `seedDemoData()`.

### 2. Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com).
2. Activa **Authentication → Sign-in method**: `Correo/contraseña` y `Google`.
3. Registra una app web y copia la configuración (las 6 `NEXT_PUBLIC_FIREBASE_*`).
4. En **Authentication → Settings → Authorized domains** añade el dominio de
   GitHub Pages (`satisol-develop.github.io`).

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena las claves de Firebase y `NEXT_PUBLIC_APPS_SCRIPT_URL` (Web App URL
del Apps Script). No hay secretos de servidor: el navegador llama directo a
Apps Script, que verifica el token con `FIREBASE_API_KEY` (Propiedades del
script).

### 4. Desarrollo

```bash
npm install
npm run dev
```

Comandos: `npm run lint` (ESLint), `npx tsc --noEmit` (tipos),
`npm run build` (build de producción), `npm run build:export` (build estático
para GitHub Pages; retira `src/app/api` y `src/proxy.ts` durante el build y los
restaura al terminar).

## Roles y permisos

La matriz de roles vive en la hoja `Roles` (titular / apoyo por mes) y llega
al cliente con `user.me` en cada inicio de sesión. La autorización real se
resuelve **siempre en Apps Script** contra la hoja:

- **Titular**: lectura/escritura de su panel, creación de tareas propias y
  marcado de checks.
- **Apoyo**: solo lectura del panel de su rol.
- **Admin**: **vista global en solo lectura** de todos los paneles (estado,
  tareas, escaleta, inscripciones, propuestas, instrumentos y caja); su
  **única edición** es la rotación mensual (actualiza la hoja `Roles` vía
  `admin.rotate`; los permisos valen al instante).
- **General**: aprueba la sesión → genera automáticamente las tareas
  predeterminadas de cada rol; resuelve propuestas y audita la caja.
- **Grupo Base / Stage Manager**: operan la escaleta (polling 4 s) y, el
  Grupo Base, las inscripciones.
- **Técnico / Redes**: instrumentos confirmados y kit de difusión.
- **Caja y Barra** (opcional por evento): cobros y cuadre de caja.

Cada panel incluye su **guía de proceso** desplegable con los pasos a seguir.

## Idiomas (es / eu)

La parte pública y Mi zona están localizadas en **castellano y euskera**:

- Rutas con segmento de idioma: `/es/...` y `/eu/...`. Las rutas antiguas
  (`/login`, `/mi`, …) redirigen al idioma adecuado (`IrAIdioma`) y la cookie
  `jam_lang` recuerda la elección (`LangSync` fija además `document.lang`).
- Diccionarios en `src/i18n/es.ts` y `src/i18n/eu.ts` con paridad obligatoria
  (`Dict = typeof es`); conmutador **ES · EU** en la cabecera (`LangSwitcher`).
- El idioma de la URL rige también los mensajes generados fuera de los
  componentes (`auth-provider`, `api/client` vía `localeActual()`).
- **`/panel` y el backend (Apps Script) están en castellano**; las plantillas
  de correo de Firebase (verificación) se gestionan en su consola.

## Arquitectura de seguridad

```
Navegador ──({route, body, token, origin})──▶ Apps Script Web App
      (static export GitHub Pages)                  │  verifica ID token con
                                                    │  accounts:lookup (Google)
                                                    │  resuelve rol real en la
                                                    │  hoja Roles (requireRole_)
                                                    ▼
                                            Google Sheets / Google Drive
```

- El uid lo dicta Google (token verificado), no el cliente; la autorización
  es la hoja `Roles` del mes del evento activo.
- Allowlist de orígenes opcional (`ALLOWED_ORIGINS`) como capa cosmética.
- Drive solo sirve archivos dentro de la carpeta raíz del catálogo
  (`DRIVE_ROOT_ID`); las subidas externas se bloquean con los permisos de
  compartir de la carpeta (solo cuentas del equipo).
- Auditoría básica en la hoja `LogActividad`.

## Estructura

```
src/
  app/
    page.tsx                  # Ruta raíz → redirección al idioma elegido
    [locale]/                 # es|eu: landing, login, registro, mi,
                              # partituras, privacidad, terminos
    panel/                    # Hub de paneles + /panel/[rol] (castellano)
    panel/stage-manager/escaleta  # Escaleta en directo (polling)
    (auth)|(musician)|privacidad|terminos
                              # Rutas antiguas → redirect con IrAIdioma
  i18n/                       # Diccionarios es/eu, hooks, meta, switcher
  components/                 # UI por dominio (marketing, musician, panel…)
  lib/                        # firebase, api/client (directo a GAS), auth, demo
  proxy.ts                    # Guard de UX en dev/build normal (Next 16);
                              # el export estático usa guards de cliente
```

El backend `apps-script/` existe solo en local (excluido del repo con
`.gitignore`); los datos dummy no lo necesitan.

## Despliegue en GitHub Pages (producción)

`.github/workflows/deploy-pages.yml` construye el export estático en cada push
a `main` y publica el resultado en GitHub Pages
(`https://satisol-develop.github.io/jam-session/`):

1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. **Secrets** (Settings → Secrets and variables → Actions): las 6
   `NEXT_PUBLIC_FIREBASE_*` y `NEXT_PUBLIC_APPS_SCRIPT_URL`.
3. **Variables**: `NEXT_PUBLIC_DEMO_MODE=false` para salir del modo demo
   (sin la variable, el build queda en demo con datos dummy).
4. `NEXT_PUBLIC_BASE_PATH` se fija según el nombre del repo (automático).

## Fases implementadas

- **F0** Scaffold, auth, BFF con HMAC, Apps Script base y tipos.
- **F1** Vista pública + sincronización de catálogo desde Drive.
- **F2** Inscripción de músicos, asistentes y propuestas.
- **F3** Visor de partituras/cifrados/guías protegido.
- **F4** Rotación de roles, paneles por rol y ciclo de tareas.
- **F5** Escaleta en directo con polling.
- **F6** Módulo Caja y Barra.
- **F7** Manifest PWA, seed de datos y documentación.
- **F8** Localización es/eu de la parte pública, Mi zona y cabecera.
