#!/usr/bin/env node
/**
 * Paridad de rutas API: comprueba que las 4 fuentes siguen sincronizadas.
 *
 *  1. apps-script/main.gs  → ROUTES_ (backend real)
 *  2. src/lib/demo/api.ts  → cases del conmutador demo
 *  3. apps-script/README.md → tabla de documentación
 *  4. src/**               → llamadas api("ruta") del cliente
 *
 * Uso: npm run check:routes   (sale con código 1 si hay problemas)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const raiz = process.cwd();
const leer = (p) => readFileSync(join(raiz, p), "utf8");

const problemas = [];

/* 1) Rutas del backend ------------------------------------------------- */
const main = leer("apps-script/main.gs");
const bloque = /var ROUTES_ = \{([\s\S]*?)\n\};/.exec(main);
if (!bloque) {
  console.error("✗ No se encontró la tabla ROUTES_ en apps-script/main.gs");
  process.exit(1);
}
const backend = new Set(
  [...bloque[1].matchAll(/'([^']+)'\s*:/g)].map((m) => m[1]),
);

/* 2) Cases de la demo --------------------------------------------------- */
const demoCases = new Set(
  [...leer("src/lib/demo/api.ts").matchAll(/case "([^"]+)":/g)].map((m) => m[1]),
);

/* 3) Documentación ------------------------------------------------------ */
const readme = leer("apps-script/README.md");

/* 4) Llamadas del cliente ----------------------------------------------- */
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
for (const r of [...backend].sort()) {
  if (!demoCases.has(r)) problemas.push(`demo sin case: "${r}"`);
  if (!readme.includes("`" + r + "`")) {
    problemas.push(`sin documentar en apps-script/README.md: "${r}"`);
  }
}
for (const r of [...rutasCliente].sort()) {
  if (!backend.has(r)) {
    problemas.push(`el cliente llama a una ruta inexistente: "${r}"`);
  }
}

if (problemas.length) {
  console.error("✗ Paridad de rutas rota:");
  for (const p of problemas) console.error("  - " + p);
  process.exit(1);
}
console.log(
  `✓ Paridad de rutas OK: ${backend.size} backend · ${demoCases.size} demo · ${rutasCliente.size} usadas por el cliente`,
);
