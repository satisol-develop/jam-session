---
name: testing-qa
description: Verificación funcional completa del proyecto jam-session (QA). Usar cuando el usuario pida verificar, testear o comprobar que todo funciona, tras cambios antes de subir, o con frases como "comprobar todo", "ejecutar los tests", "verificar que va fluido". Ejecuta build, tipos, lint, paridad de rutas/diccionarios y smoke funcional con curl.
---

# QA de jam-session

Ejecuta esta batería en orden. Cada paso debe dar OK antes de continuar;
si algo falla, arregla y vuelve a ejecutar desde ese paso.

## Entorno (PowerShell en Windows)

- `npx`/`npm` con `.ps1` están bloqueados: usar `npm.cmd run <script>` y
  `node node_modules\typescript\bin\tsc --noEmit`.
- `rg` no existe: usar `Select-String` o el tool Grep.
- Commits en español SIN acentos; mensaje en fichero temp + `git commit -F`.

## 1. Estáticos

```
node scripts/check-dicts.mjs        # paridad ES/EU: claves, orden, placeholders
node node_modules\typescript\bin\tsc --noEmit   # tipos (sin salida = OK)
npm.cmd run lint                    # 0 errores; el warning de TanStack (useReactTable) es conocido
npm.cmd run check:routes            # paridad backend ↔ demo ↔ docs ↔ cliente (51/51/50)
```

## 2. Build de producción estático

```
npm.cmd run build:export
```

Debe terminar con 34/34 páginas. falla si alguna ruta usa APIs dinámicas
de servidor (p. ej. `cookies()`) — Pages no tiene servidor.

## 3. Smoke funcional

Levantar dev en un puerto LIBRE (el 3000 puede estar ocupado por otro
proyecto): `Start-Process npm.cmd -ArgumentList "run","dev","--","-p","3001" -WorkingDirectory <raíz> -WindowStyle Hidden`

Tras ~16 s, comprobar con `curl.exe -s -o NUL -w "%{http_code}"`:

| Ruta | Sin sesión | Con `-H "Cookie: jam_auth=1"` |
|---|---|---|
| `/`, `/es`, `/eu` | 200 | — |
| `/es/login`, `/es/registro`, `/es/privacidad`, `/es/terminos`, `/manifest.webmanifest` | 200 | — |
| `/es/partituras`, `/es/mi`, `/eu/mi`, `/panel`, `/panel/<rol>`, `/panel/stage-manager/escaleta` | **307** → `/login?next=…` (proxy, correcto) | 200 |

- El 404 se verifica en el **export**, no en dev (en dev es una shell JS):
  tras `build:export`, `out/404.html` (lo que Pages sirve) debe contener
  «no encontrada» y «Volver al inicio».
- `Invoke-WebRequest` NO enviola cookies: usar siempre `curl.exe -H`.
- Al terminar, matar el proceso del puerto usado.

## 4. Deploy

Si hay cambios sin subir, avisar al usuario de que subirá (no commitear
sin permiso explícito). Tras el push, verificar el workflow:

```
gh run list --limit 3          # el último debe ser success
gh run view <id> --log-failed  # si falló
```

El deploy de Pages es `build:export` + upload; el fallo típico es un
`cookies()` o `dynamic` en una ruta prerenderizada.

## Criterio de "todo en orden"

1–4 en verde, árbol de git limpio y `main` sincronizado con `origin/main`.
