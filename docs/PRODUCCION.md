# Puesta en producción — Jam Session

Guía concreta, paso a paso, para que la app funcione con los servicios reales
(Firebase + Apps Script + Google Sheets + Google Drive, desplegada en
**GitHub Pages**). El orden es importante:
**Drive → Apps Script → Firebase → GitHub → verificación**.

> Arquitectura: **static export en GitHub Pages** (sin servidor propio). El
> navegador llama **directamente** al Apps Script (`NEXT_PUBLIC_APPS_SCRIPT_URL`),
> que verifica el ID token de Firebase con `accounts:lookup`. No hay Vercel ni
> service account. GitHub Pages arranca en **modo demo**
> (`NEXT_PUBLIC_DEMO_MODE` por defecto `true`); se pasa a real con una variable.

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
4. `artista` y `tonalidad` se rellenan a mano en la hoja `Repertorio` si
   quieres (no hace falta para que funcione).
5. Opcional (cartel público): sube el cartel, compártelo con **«Cualquier
   persona con el enlace»** y guarda la URL; se pega después en
   `Eventos.cartel_url`.

## 2. Apps Script — backend (Sheets + Drive)

El código está en la carpeta local `apps-script/` (no va en el repo).

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
   Propiedades del script.
   - ⚠️ Si el spreadsheet ya existía de una configuración anterior, **no
     vuelvas a ejecutar `setup()`** (crearía otro): ejecuta **`migrate()`**
     (actualiza hojas y columnas conservando los datos).
5. En **Propiedades del script** añade a mano:
   - `DRIVE_ROOT_ID` = el ID de la carpeta de Drive del paso 1.
   - `FIREBASE_API_KEY` = la API key del proyecto Firebase (paso 3.3). El
     backend la usa para verificar los tokens con `accounts:lookup`.
   - `ALLOWED_ORIGINS` *(opcional)* = JSON array de orígenes permitidos,
     p. ej. `["https://satisol-develop.github.io"]`. Sin esta propiedad se
     acepta cualquier origen: la seguridad real es el token + los roles de la
     hoja `Roles`.
6. Ejecuta (editor ▶, una cada vez):
   - `syncCatalogFromDrive()` → rellena la hoja `Repertorio` desde Drive.
   - `scheduleCatalogSync()` → instala el trigger automático cada 6 h.
   - `seedDemoData()` *(opcional)* → crea un evento en borrador y 4 canciones
     de ejemplo.
7. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   - → **Deploy** y copia la URL `.../exec`. Ejecuta `webAppUrl()` para
     verificarla. **Guárdala**: es `NEXT_PUBLIC_APPS_SCRIPT_URL`.

> ⚠️ Cada vez que **reimplementes** la web app puede cambiar la URL: si
> cambia, actualiza `NEXT_PUBLIC_APPS_SCRIPT_URL` en GitHub (paso 4) y
> redespliega la web (Settings → Variables → cambiar valor no rebuilda:
> lanza un redeploy con **Re-run** o pulsa ▶ *Run workflow*).

## 3. Firebase — identidad (login)

1. <https://console.firebase.google.com> → **Añadir proyecto** (p. ej.
   `jam-session`). Google Analytics no hace falta.
2. **Authentication → Get started**:
   - **Email/contraseña** → Enable.
   - **Google** → Enable (el login de la web ofrece ambos).
3. **Project settings → Tus apps → Web app (`</>`)** → registrar la app
   (nombre `jam-session`, sin Hosting) → **Register** → copia la
   **configuración**. Son las 6 variables `NEXT_PUBLIC_FIREBASE_*`. La
   **API key** de esa configuración es la `FIREBASE_API_KEY` del paso 2.5.
4. **Authentication → Settings → Authorized domains** → añade el dominio de
   GitHub Pages (`satisol-develop.github.io`) y el dominio propio si lo
   tienes.
5. **Bootstrap del Admin** (necesario para poder rotar roles y ver /panel/admin):
   1. En la web, regístrate con tu cuenta (email/contraseña o Google).
   2. Firebase Console → **Authentication → Users** → copia el **UID**.
   3. Abre el spreadsheet *Jam Session — Datos* → hoja **`Roles`** → añade la
      fila (mes en curso):
      | mes | rol | uid | tipo |
      |---|---|---|---|
      | `2026-10` | `admin` | `TU-UID` | `titular` |

> Los roles se leen de la hoja `Roles` en cada `user.me`: **no hay claims ni
> service account**. Tras una rotación, los permisos valen al instante.

## 4. Variables de entorno y GitHub Pages

1. En local: `cp .env.example .env.local` y rellena:

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

   - **Secrets** (6): `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`,
     `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`,
     y `NEXT_PUBLIC_APPS_SCRIPT_URL`.
   - **Variables**: `NEXT_PUBLIC_DEMO_MODE` = `false` (para salir del modo
     demo; con la variable ausente el build sigue en demo).

3. El deploy es automático: **push a `main`** → el workflow
   `Deploy GitHub Pages` construye el static export y publica `out/` en
   <https://satisol-develop.github.io/jam-session/>.

4. Todas las `NEXT_PUBLIC_*` son **públicas** (viajan al navegador). La
   seguridad no depende de que se oculten: verifica tokens y roles el backend
   Apps Script.

## 5. Verificación en producción

Con la web de GitHub Pages abierta (tras el deploy), comprueba en este orden:

1. **Home**: carga con el evento vigente y el repertorio (viene de
   `public.event` en Sheets; si está vacío, revisa `setup()`/`seedDemoData()`
   y `DRIVE_ROOT_ID`).
2. **Login** con correo/contraseña y con Google (si Google falla, revisa los
   Authorized domains del paso 3.4).
3. **Tu cuenta admin**: con la fila de `Roles` del paso 3.5, entra en
   `/panel/admin` y comprueba que la matriz carga (`admin.users`).
4. **Rotación**: asigna titulares en la matriz → **Guardar rotación** → cada
   titular recibe su rol en la hoja `Roles` (y puede entrar en su panel tras
   refrescar).
5. **General** (`/panel/general`): edita datos (`event.update`), aprueba la
   sesión (`general.approve` → tareas con subtareas), elige el Grupo Base
   (`gb.set`), valida propuestas en bloque y, en «Auditoría», cierra la caja
   con el modal de aviso (`cash.close`).
6. **Grupo Base**: inscripciones (`event.inscripciones`,
   `musician.setEstado`), ensayo y cierre de inscripciones
   (`event.setEnsayo`, `event.setInscripciones`).
7. **Músico** (`/mi`): inscribirse (`musician.subscribe`), proponer una
   canción (`musician.propose`) y ver mis propuestas.
8. **Caja** (`/panel/caja`): registrar consumos/gastos (`cash.add`) y cerrar.
9. **Cierre de evento**: General → `event.close` (exige caja cerrada) →
   en `/panel/admin` aparece la sesión en **Historial** (`admin.history`).
10. **Siguiente ciclo**: General → «Crear la siguiente sesión»
    (`event.create`) → nuevo borrador con las tareas personales pendientes
    arrastradas.
11. **Partituras** (`/partituras`): abre una canción y sus archivos
    (`material.list` / `material.file`, desde Drive).

Si algo falla, el error se muestra en la UI; los detalles del backend están en
la hoja **`LogActividad`** del spreadsheet.

## 6. Mantenimiento

- **Rotación mensual** (recomendado antes del día 25): Admin → matriz →
  Guardar. Los apoyos los elige cada titular en su panel; el Grupo Base, el
  General.
- **Triggers**: revisa de vez en cuando que el trigger de
  `syncCatalogFromDrive` sigue activo (editor → ⏰ triggers).
- **Actualizar el backend (`.gs`)**: edita → reimplementa la versión web app
  → si cambia la URL, actualiza el secret de GitHub y redespliega la web.
- **Actualizar la web**: push a `main` → el workflow publica solo.
- **Borrado/limpieza**: la hoja `Historial` es autocontenida (JSON por
  sesión); puedes consultarla tal cual sin tocar nada.
