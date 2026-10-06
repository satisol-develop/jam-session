# Puesta en producción — Jam Session

Guía concreta, paso a paso, para que la app funcione con los servicios reales
(**sin datos dummy**), desplegada en **GitHub Pages**. El orden es importante:

**Drive → Firebase → Apps Script → GitHub → verificación**

Resumen rápido (detalle en cada sección):

| # | Paso | Dónde |
|---|---|---|
| 1 | Carpeta maestra de repertorio + su ID | Google Drive |
| 2 | Proyecto Firebase: auth, app web, dominios | Firebase Console |
| 3 | Backend: pegar `.gs`, `setup()`, propiedades, deploy Web App | script.google.com |
| 4 | Secrets y `NEXT_PUBLIC_DEMO_MODE=false` | GitHub → Settings → Actions |
| 5 | Bootstrap del admin (fila en hoja `Roles`) + checklist final | Spreadsheet + web |

> Arquitectura: **static export en GitHub Pages** (sin servidor propio). El
> navegador llama **directamente** al Apps Script (`NEXT_PUBLIC_APPS_SCRIPT_URL`),
> que verifica el ID token de Firebase con `accounts:lookup`. No hay Vercel,
> HMAC ni service account.
>
> **Del demo al real no hay migración**: los datos dummy viven en memoria del
> navegador y desaparecen al pasar `NEXT_PUBLIC_DEMO_MODE=false`. Solo hace
> falta que existan Firebase + el Apps Script desplegado con sus datos.

---

## 1. Google Drive — carpeta del repertorio

1. En Drive, crea la carpeta maestra: **`Jam Session — Repertorio`**
   (personal o de equipo; debe ser de la misma cuenta que ejecutará el script).
2. Dentro, crea **una subcarpeta por canción** (el nombre de la carpeta es el
   título de la canción) y mete dentro los archivos: partituras PDF,
   cifrados, guías de audio. Ej.:
   ```
   Jam Session — Repertorio/
     Sultans of Swing/
       Sultans of Swing — cifrado.pdf
       Sultans of Swing — partitura.pdf
   ```
3. Copia el **ID de la carpeta maestra**: ábrela y toma la parte final de la
   URL `https://drive.google.com/drive/folders/**AAAAAAAAAAAAAAAAA**` → guárdalo.
4. `artista` y `tonalidad` se rellenan a mano en la hoja `Repertorio`, desde
   la pestaña Repertorio del panel del Grupo Base/General, o en el propio
   Sheet (no hace falta para que funcione).
5. **Cartel**: desde el panel **Redes → Kit de difusión** se descarga la
   plantilla (`public/plantillas/cartel.svg`), se edita y el cartel final se
   sube con «Subir cartel» (JPG/PNG/WEBP/SVG, máx. 6 MB): va a Drive con
   enlace público y aparece en la portada. Alternativa manual: sube el
   cartel, compártelo con **«Cualquier persona con el enlace»** y guarda la
   URL en `Eventos.cartel_url`.

## 2. Firebase — identidad (login)

Solo hace falta **Authentication**; la web ofrece dos botones (correo y
Google), ambos se configuran aquí.

### 2.1 Proyecto

1. <https://console.firebase.google.com> → **Añadir proyecto** → nombre
   `jam-session` (o el que quieras) → Google Analytics: **no** → **Crear
   proyecto** → Continuar.
2. Si ya tienes proyecto (p. ej. `jam-session`), úsalo: el nombre del proyecto
   es el valor `projectId` de la configuración.

### 2.2 Métodos de inicio de sesión

1. Menú **Authentication → Empezar** (Get started).
2. Pestaña **Métodos de inicio de sesión**:
   - **Correo y contraseña** → **Activar** → Guardar.
   - **Google** → **Activar** → si pide «proyecto de soporte», elige el que te
     proponga → Guardar.
3. Si falta cualquiera de los dos, su botón en la web fallará al iniciar
   sesión.

### 2.3 Dominios autorizados (necesario para Google)

1. **Authentication → Settings (Configuración) → Dominios autorizados →
   Añadir dominio**.
2. Escribe `satisol-develop.github.io` → **Añadir**.
3. `localhost` y `127.0.0.1` ya vienen (para desarrollar en local). Sin el
   dominio de Pages, «Continuar con Google» falla en la web publicada;
   correo/contraseña sí funcionaría.

### 2.4 Registrar la app web — los 6 valores

1. ⚙️ **Project settings → Tus apps → Añadir app → `</>` (Web)**.
2. Nombre `jam-session`, **sin** Hosting → **Registrar app**.
3. Copia la **Configuración de tu app** (si la cierras, luego está en ⚙️
   **Project settings → Tus apps → tu app web**). Cada valor va aquí:

| Valor en Firebase | Variable / destino |
|---|---|
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` **y** propiedad `FIREBASE_API_KEY` del Apps Script (paso 3.5) |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

4. Las 6 van como **secrets** en GitHub (paso 4.2): una por nombre
   (`NEXT_PUBLIC_FIREBASE_API_KEY`, …).

> No configures Firestore, Storage, Functions, Hosting ni reglas: los datos
> viven en Google Sheets/Drive. `storageBucket` aparece en la config aunque
> no se use.

### 2.5 Bootstrap del Admin

1. En la web desplegada, regístrate con tu cuenta (email/contraseña o
   Google). Aún en modo demo: da igual, el usuario se crea en Firebase.
2. **Authentication → Users** → tu usuario → copia el **UID**.
3. El spreadsheet aún no existe: la fila va en el paso 3.4 (hoja `Roles`),
   tras ejecutar `setup()`.

> Los roles se leen de la hoja `Roles` en cada `user.me`: **no hay claims ni
> service account**. Tras una rotación, los permisos valen al instante.

## 3. Apps Script — backend (Sheets + Drive)

El código está en la carpeta local `apps-script/` (**no va en el repo**:
está en `.gitignore`; cópialo desde tu equipo).

1. Ve a <https://script.google.com> → **Nuevo proyecto** → nómbralo `Jam Session API`.
2. **Project Settings (engranaje) → ☐ Show "appsscript.json"** → sustituye su
   contenido por el de `apps-script/appsscript.json`.
3. Crea un archivo por cada `.gs` de la carpeta y pega su contenido
   (`main`, `sheets`, `routes`, `musicians`, `roles`, `eventos`, `caja`,
   `escaleta`, `drive`, `files`, `seed`). Alternativa rápida con `clasp`:
   `npm i -g @google/clasp && clasp login && clasp create --type sheets && clasp push`
   (desde dentro de `apps-script/`).
4. **Primera vez solamente**: ejecuta `setup()` (menú ▶). Crea el
   spreadsheet **Jam Session — Datos** y guarda `SPREADSHEET_ID` en
   Propiedades del script. Después, en la hoja **`Roles`**, añade la fila del
   bootstrap del admin (paso 2.5):
   | mes | rol | uid | tipo |
   |---|---|---|---|
   | `2026-10` | `admin` | `TU-UID` | `titular` |
   - ⚠️ Si el spreadsheet ya existía de una configuración anterior, **no
     vuelvas a ejecutar `setup()`** (crearía otro): ejecuta **`migrate()`**
     (actualiza hojas y columnas conservando los datos).
5. En **Propiedades del script** añade a mano:
   - `DRIVE_ROOT_ID` = el ID de la carpeta de Drive del paso 1.
   - `FIREBASE_API_KEY` = la API key del proyecto Firebase (paso 2.3). El
     backend la usa para verificar los tokens con `accounts:lookup`; **sin
     esta propiedad el login real falla**.
   - `ALLOWED_ORIGINS` *(opcional)* = JSON array de orígenes permitidos,
     p. ej. `["https://satisol-develop.github.io"]`. Sin esta propiedad se
     acepta cualquier origen: la seguridad real es el token + los roles de la
     hoja `Roles`.
6. Ejecuta (editor ▶, una cada vez):
   - `syncCatalogFromDrive()` → rellena la hoja `Repertorio` desde Drive.
   - `scheduleCatalogSync()` → instala el trigger automático cada 6 h.
   - `seedDemoData()` *(opcional pero recomendado la primera vez)* → crea un
     evento en borrador y 4 canciones de ejemplo **en el spreadsheet real**
     (es un primer relleno; los datos dummy de la web no tienen nada que ver
     aquí).
7. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   - → **Deploy** y copia la URL `.../exec`. Ejecuta `webAppUrl()` para
     verificarla. **Guárdala**: es `NEXT_PUBLIC_APPS_SCRIPT_URL`.

> ⚠️ Cada vez que **reimplementes** la web app puede cambiar la URL: si
> cambia, actualiza el secret `NEXT_PUBLIC_APPS_SCRIPT_URL` en GitHub (paso
> 4) y lanza un build nuevo (▶ *Run workflow* en Actions): cambiar solo una
> variable/secret **no** redespliega solo.

## 4. Variables de entorno y GitHub Pages

1. En local (opcional, para desarrollar contra lo real): `cp .env.example
   .env.local` y rellena:

   ```env
   NEXT_PUBLIC_DEMO_MODE=false
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
   NEXT_PUBLIC_BASE_PATH=
   ```

2. GitHub → `satisol-develop/jam-session` → **Settings → Secrets and
   variables → Actions**:

   - **Secrets** (7): las 6 `NEXT_PUBLIC_FIREBASE_*` (`_API_KEY`,
     `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`,
     `_MESSAGING_SENDER_ID`, `_APP_ID`) y `NEXT_PUBLIC_APPS_SCRIPT_URL`.
   - **Variables**: `NEXT_PUBLIC_DEMO_MODE` = `false`. Este es el interruptor
     que **apaga los datos dummy**: sin la variable (o con `true`) el build
     sigue en demo.

3. El deploy es automático: **push a `main`** → el workflow
   `Deploy GitHub Pages` construye el static export y publica `out/` en
   <https://satisol-develop.github.io/jam-session/>. Si solo has cambiado
   secrets/variables, fuerza el build con **Actions → Deploy GitHub Pages →
   Run workflow**.

4. Todas las `NEXT_PUBLIC_*` son **públicas** (viajan al navegador). La
   seguridad no depende de que se oculten: verifica tokens y roles el backend
   Apps Script.

## 5. Verificación en producción

Con la web de GitHub Pages abierta (tras el deploy con `NEXT_PUBLIC_DEMO_MODE=false`),
comprueba en este orden:

1. **¿Sigue en demo?** En la cabecera **no debe aparecer la etiqueta
   «Demo»**. Si aparece, vuelve al paso 4 (variable) y fuerza el workflow.
2. **Home**: carga con el evento vigente y el repertorio (viene de
   `public.event` en Sheets; si está vacío, revisa `setup()`/`seedDemoData()`
   y `DRIVE_ROOT_ID`).
3. **Login** con correo/contraseña y con Google (si Google falla, revisa los
   Authorized domains del paso 2.4). Verifica en **Firebase Console →
   Authentication → Users** que el usuario aparece.
4. **Tu cuenta admin**: con la fila de `Roles` del paso 3.4, entra en
   `/panel/admin` y comprueba que la matriz carga (`admin.users`).
5. **Rotación**: asigna titulares en la matriz → **Guardar rotación** → cada
   titular recibe su rol en la hoja `Roles` (y puede entrar en su panel tras
   refrescar).
6. **General** (`/panel/general`): edita datos (`event.update`), aprueba la
   sesión (`general.approve` → tareas con subtareas), elige el Grupo Base
   (`gb.set`), valida propuestas en bloque y, en «Auditoría», cierra la caja
   con el modal de aviso (`cash.close`).
7. **Grupo Base** (`/panel/grupo-base`): pestaña **Repertorio** — añade un
   tema (`repertoire.add`; también desde el General) y comprueba que aparece
   en la web pública y en `/partituras`; inscripciones
   (`event.inscripciones`, `musician.setEstado`), ensayo y cierre de
   inscripciones (`event.setEnsayo`, `event.setInscripciones`).
8. **Músico** (`/mi`): inscribirse (`musician.subscribe`), proponer una
   canción (`musician.propose`) y ver mis propuestas.
9. **Caja** (`/panel/caja`): registrar consumos/gastos (`cash.add`) y cerrar.
10. **Cierre de evento**: General → `event.close` (exige caja cerrada) →
    en `/panel/admin` aparece la sesión en **Historial** (`admin.history`).
11. **Siguiente ciclo**: General → «Crear la siguiente sesión»
    (`event.create`) → nuevo borrador con las tareas personales pendientes
    arrastradas.
12. **Partituras** (`/partituras`): abre una canción y sus archivos
    (`material.list` / `material.file`, desde Drive).

Si algo falla, el error se muestra en la UI; los detalles del backend están en
la hoja **`LogActividad`** del spreadsheet.

### Checklist «ya funciona sin dummy»

- [ ] Cabecera **sin etiqueta «Demo»**.
- [ ] Home muestra evento y repertorio del spreadsheet (no los de ejemplo).
- [ ] Registrarte crea el usuario en **Firebase Console → Authentication**.
- [ ] `/panel/admin` carga la matriz real (`admin.users`).
- [ ] Añadir un tema en la pestaña Repertorio (GB) lo publica en la web.
- [ ] El cartel subido desde el panel Redes (Kit de difusión) aparece en la
      portada pública.
- [ ] Si falta cualquier config, la UI muestra un error claro (p. ej.
      «Falta NEXT_PUBLIC_APPS_SCRIPT_URL en el entorno del build» o
      «FIREBASE_API_KEY no configurado»).

## 6. Mantenimiento

- **Rotación mensual** (recomendado antes del día 25): Admin → matriz →
  Guardar. Los apoyos los elige cada titular en su panel; el Grupo Base, el
  General.
- **Repertorio**: el Grupo Base lo define desde su panel; el sync de Drive
  (`syncCatalogFromDrive`) solo toca los temas con origen `drive` (nunca los
  añadidos a mano o por propuesta).
- **Triggers**: revisa de vez en cuando que el trigger de
  `syncCatalogFromDrive` sigue activo (editor → ⏰ triggers).
- **Actualizar el backend (`.gs`)**: edita → reimplementa la versión web app
  → si cambia la URL, actualiza el secret de GitHub y fuerza el workflow.
- **Actualizar la web**: push a `main` → el workflow publica solo.
- **Borrado/limpieza**: la hoja `Historial` es autocontenida (JSON por
  sesión); puedes consultarla tal cual sin tocar nada.
