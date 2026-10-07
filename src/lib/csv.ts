/**
 * Exportación CSV en el cliente (sin backend): genera el fichero con los
 * datos ya cargados en memoria. Separador «;» y BOM UTF-8 para que Excel
 * en español lo abra bien.
 */
export function descargarCsv(
  nombre: string,
  columnas: string[],
  filas: (string | number)[][],
): void {
  const esc = (v: string | number): string => {
    const s = String(v ?? "");
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columnas, ...filas].map((f) => f.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre.endsWith(".csv") ? nombre : `${nombre}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
