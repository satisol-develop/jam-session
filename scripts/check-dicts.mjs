// Compara es.ts vs eu.ts: nº de claves, orden y placeholders {x} por clave.
// También compara el diccionario `instrumentos` con INSTRUMENTOS (constants.ts).
// Uso: node scripts/check-dicts.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const i18n = join(raiz, "src", "i18n") + "/";
const PARES = /(\w+):\s*(["'`])((?:\\.|(?!\2)[\s\S])*)\2/g;

function pares(file) {
  const txt = readFileSync(i18n + file, "utf8");
  const out = [];
  let m;
  while ((m = PARES.exec(txt)) !== null) {
    out.push({ key: m[1], val: m[3] });
  }
  return out;
}

function placeholders(s) {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
}

const es = pares("es.ts");
const eu = pares("eu.ts");
console.log(`pares clave-valor: es=${es.length} eu=${eu.length}`);

let problemas = 0;
const n = Math.min(es.length, eu.length);
for (let i = 0; i < n; i++) {
  if (es[i].key !== eu[i].key) {
    // desalineación: buscar la key de es en eu a partir de i
    console.log(`DESALENACIÓN en #${i}: es.${es[i].key} vs eu.${eu[i].key}`);
    problemas++;
    if (problemas > 10) break;
    continue;
  }
  const a = placeholders(es[i].val);
  const b = placeholders(eu[i].val);
  if (a !== b) {
    console.log(`PLACEHOLDER distinto en ${es[i].key}: es=[${a}] eu=[${b}]`);
    problemas++;
  }
}
if (es.length !== eu.length) {
  console.log(`CONTEO distinto: es=${es.length} eu=${eu.length}`);
  problemas++;
}

// instrumentos: constants.ts vs diccionario
const constants = readFileSync(join(raiz, "src", "lib", "constants.ts"), "utf8");
const bloq = constants.match(/export const INSTRUMENTOS[^=]*=\s*\[([\s\S]*?)\]/);
const inst = bloq ? [...bloq[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
console.log(`INSTRUMENTOS (constants): ${inst.length} -> ${inst.join(" | ")}`);

for (const file of ["es.ts", "eu.ts"]) {
  const txt = readFileSync(i18n + file, "utf8");
  const sec = txt.match(/instrumentos:\s*\{([\s\S]*?)\n  \}/);
  const claves = sec ? [...sec[1].matchAll(/["']?([^"':\s]+)["']?:\s*"/g)].map((m) => m[1]) : [];
  const faltan = inst.filter((i) => !claves.includes(i));
  const sobran = claves.filter((c) => !inst.includes(c));
  console.log(
    `${file} instrumentos=${claves.length}` +
      (faltan.length ? ` FALTAN: ${faltan.join(", ")}` : "") +
      (sobran.length ? ` SOBRAN: ${sobran.join(", ")}` : ""),
  );
}
console.log(problemas === 0 ? "OK: sin problemas" : `${problemas} problema(s)`);
process.exit(problemas === 0 ? 0 : 1);
