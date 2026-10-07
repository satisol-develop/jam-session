#!/usr/bin/env node
/**
 * Paridad de rutas API. Cuatro fuentes (cuando están disponibles):
 *
 *  1. apps-script/main.gs   → ROUTES_ (backend real)
 *  2. src/lib/demo/api.ts   → cases del conmutador demo
 *  3. apps-script/README.md → documentación de la API
 *  4. src/**                → llamadas api("ruta") del cliente
 *
 * `apps-script/` está en .gitignore: en CI solo existen 2 y 4, y el script
 * valida la paridad demo ↔ cliente (avisándolo). En local valida las 4.
 *
 * Uso: npm run check:routes   (sale con código 1 si hay problemas)
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const raiz = process.cwd();
const leer = (p) => readFileSync(join(raiz, p), "utf8");
const problemas = [];

/* 1) Rutas del backend (y docs), solo donde existe apps-script/ --------- */
const hayAppsScript = existsSync(join(raiz, "apps-script", "main.gs"));
let backend = null;
let readme = "";
if (hayAppsScript) {
  const main = leer("apps-script/main.gs");
  const bloque = /var ROUTES_ = \{([\s\S]*?)\n\};/.exec(main);
  if (!bloque) {
    console.error("✗ No se encontró la tabla ROUTES_ en apps-script/main.gs");
    process.exit(1);
  }
  backend = new Set(
    [...bloque[1].matchAll(/'([^']+)'\s*:/g)].map((m) => m[1]),
  );
  readme = leer("apps-script/README.md");
} else {
  console.log(
    "· apps-script/ no está en este entorno (gitignore): se omite la comprobación backend/docs; se valida demo ↔ cliente.",
  );
}

/* 2) Cases de la demo --------------------------------------------------- */
const demoCases = new Set(
  [...leer("src/lib/demo/api.ts").matchAll(/case "([^"]+)":/g)].map((m) => m[1]),
);

/* 3) Llamadas del cliente ----------------------------------------------- */
const rutasCliente = new Set();
const ignorar = new Set(["node_modules", ".next", "out", ".git"]);
function recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) {
      if (!ignorar.has(nombre)) recorrer(ruta);
    } else if (/\.(ts|tsx)$/.test(nombre)) {
      const txt = readFileSync(ruta, "utf8");
      for (const m of txt.matchAll(/\bapi(?:<[^>]*>)?\(\s*"([^"]+)"/g)) {
        rutasCliente.add(m[1]);
      }
    }
  }
}
recorrer(join(raiz, "src"));

/* Comprobaciones -------------------------------------------------------- */
if (backend) {
  for (const r of [...backend].sort()) {
    if (!demoCases.has(r)) problemas.push(`demo sin case: "${r}"`);
    if (!readme.includes("`" + r + "`")) {
      problemas.push(`sin documentar en apps-script/README.md: "${r}"`);
    }
  }
  for (const r of [...demoCases].sort()) {
    if (!backend.has(r)) problemas.push(`case demo sin ruta en ROUTES_: "${r}"`);
  }
}
for (const r of [...rutasCliente].sort()) {
  if (backend ? !backend.has(r) : !demoCases.has(r)) {
    problemas.push(
      backend
        ? `el cliente llama a una ruta inexistente: "${r}"`
        : `el cliente llama a "${r}" sin case en la demo`,
    );
  }
}

if (problemas.length) {
  console.error("✗ Paridad de rutas rota:");
  for (const p of problemas) console.error("  - " + p);
  process.exit(1);
}
console.log(
  `✓ Paridad de rutas OK: ${backend ? `${backend.size} backend · ` : ""}${demoCases.size} demo · ${rutasCliente.size} usadas por el cliente`,
);
