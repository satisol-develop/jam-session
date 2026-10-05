# Jam Session — Web App

Aplicación responsive para coordinar, ejecutar y hacer seguimiento de las Jam
Sessions periódicas: vista pública del evento, inscripción de músicos, material
de estudio protegido, paneles por rol con ciclo de tareas, escaleta en directo
y módulo de Caja y Barra.

## Stack

| Capa | Tecnología |
|---|---|
| Front-end | Next.js 16 (App Router, TypeScript, Tailwind CSS, React 19) |
| Auth | Firebase Auth (cliente) + firebase-admin (verificación de ID tokens y custom claims) |
| Datos | Google Sheets vía **Google Apps Script Web App** (API firmada con HMAC-SHA256) |
| Archivos | Google Drive (catálogo maestro: partituras, cifrados, guías de audio) |
| Despliegue | Vercel (web) + Apps Script (backend operativo) |

## Puesta en marcha

> **Guía completa de producción, paso a paso: [docs/PRODUCCION.md](docs/PRODUCCION.md)**
> (Drive → Apps Script → Firebase → Vercel → verificación).

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
3. Registra una app web y copia la configuración.
4. Genera una **cuenta de servicio** (Configuración del proyecto → Cuentas de
   servicio → Generar nueva clave privada) para `firebase-admin`.

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena las claves de Firebase, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET` (que
vive en Propiedades del script) y `FIREBASE_SERVICE_ACCOUNT` (JSON de la cuenta
de servicio, en base64 o en una línea).

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

La matriz de roles vive en la hoja `Roles` (titular / apoyo por mes) y se
refleja en custom claims (`jam_roles`) para la UI. La autorización real se
resuelve **siempre en Apps Script** contra la hoja:

- **Titular**: lectura/escritura de su panel, creación de tareas propias y
  marcado de checks.
- **Apoyo**: solo lectura del panel de su rol.
- **Admin**: **vista global en solo lectura** de todos los paneles (estado,
  tareas, escaleta, inscripciones, propuestas, instrumentos y caja); su
  **única edición** es la rotación mensual (actualiza claims vía
  `/api/admin/rotate`).
- **General**: aprueba la sesión → genera automáticamente las tareas
  predeterminadas de cada rol; resuelve propuestas y audita la caja.
- **Grupo Base / Stage Manager**: operan la escaleta (polling 4 s) y, el
  Grupo Base, las inscripciones.
- **Técnico / Redes**: instrumentos confirmados y kit de difusión.
- **Caja y Barra** (opcional por evento): cobros y cuadre de caja.

Cada panel incluye su **guía de proceso** desplegable con los pasos a seguir.

## Arquitectura de seguridad

```
Navegador ──(ID token Firebase)──▶ Next.js (Vercel)
                                      │  verifica token con firebase-admin
                                      │  firma payload: HMAC(route|uid|ts|body)
                                      ▼
                              Apps Script Web App
                                      │  valida firma (±5 min) y resuelve
                                      │  rol real en la hoja Roles
                                      ▼
                              Google Sheets / Google Drive
```

- El secreto HMAC nunca llega al navegador.
- Drive solo sirve archivos dentro de la carpeta raíz del catálogo
  (`DRIVE_ROOT_ID`); las subidas externas se bloquean con los permisos de
  compartir de la carpeta (solo cuentas del equipo).
- Auditoría básica en la hoja `LogActividad`.

## Estructura

```
src/
  app/
    page.tsx                  # Vista pública (cartel, fecha, repertorio)
    (auth)/login|registro     # Firebase Auth
    (musician)/mi             # Inscripción, propuestas, asistentes
    (musician)/partituras     # Visor protegido de material (Drive)
    panel/                    # Hub de paneles + /panel/[rol]
    panel/stage-manager/escaleta  # Escaleta en directo (polling)
    api/gs                    # BFF firmado hacia Apps Script
    api/admin/rotate          # Rotación de roles + custom claims
  components/                 # UI por dominio (musician, panel, admin)
  lib/                        # firebase, api (signer/client/server), auth, demo
  proxy.ts                    # Guard de UX para rutas privadas (Next 16)
```

El backend `apps-script/` existe solo en local (excluido del repo con
`.gitignore`); los datos dummy no lo necesitan.

## Despliegue en GitHub Pages (modo demo)

`.github/workflows/deploy-pages.yml` construye el export estático en cada push
a `main` y publica el resultado en GitHub Pages
(`https://<usuario>.github.io/jam-session/`):

1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. El workflow fija `NEXT_PUBLIC_DEMO_MODE=true` y `NEXT_PUBLIC_BASE_PATH`
   según el nombre del repo (automático).
3. Los secrets opcionales `NEXT_PUBLIC_FIREBASE_*` (Settings → Secrets and
   variables → Actions) se inyectan en el build; si no existen, la web queda
   en modo demo con datos dummy.

Limitación: GitHub Pages es estático, así que no hay BFF (`/api/gs`),
rotación real ni backend; todo usa el modo demo.

## Despliegue en Vercel (producción real)

1. Importa el repositorio y define las variables de entorno del paso 3
   (incluida `FIREBASE_SERVICE_ACCOUNT` en base64).
2. `NEXT_PUBLIC_*` son públicas (configuración del cliente Firebase, no son
   secretos); el resto solo se usa en el servidor.
3. Tras el primer despliegue, comprueba que `/api/gs` responde y que la
   vista pública muestra el evento.

## Fases implementadas

- **F0** Scaffold, auth, BFF con HMAC, Apps Script base y tipos.
- **F1** Vista pública + sincronización de catálogo desde Drive.
- **F2** Inscripción de músicos, asistentes y propuestas.
- **F3** Visor de partituras/cifrados/guías protegido.
- **F4** Rotación de roles, paneles por rol y ciclo de tareas.
- **F5** Escaleta en directo con polling.
- **F6** Módulo Caja y Barra.
- **F7** Manifest PWA, seed de datos y documentación.
