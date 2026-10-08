"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SkeletonFilas } from "@/components/loading";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { api } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import type { Cancion } from "@/types";

interface Archivo {
  id: string;
  nombre: string;
  mimeType: string;
}

interface ArchivoContenido extends Archivo {
  base64: string;
}

function base64ToBlob(b64: string, mimeType: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function fileIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.startsWith("audio/")) return "AUD";
  return "DOC";
}

function MaterialViewer({ cancion }: { cancion: Cancion }) {
  const [archivos, setArchivos] = useState<Archivo[] | null>(null);
  const [contenido, setContenido] = useState<ArchivoContenido | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api<{ archivos: Archivo[] }>("material.list", {
      carpetaDriveId: cancion.carpetaDriveId,
    })
      .then((d) => setArchivos(d.archivos ?? []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar."),
      );
  }, [cancion.carpetaDriveId]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const abrirArchivo = useCallback(async (archivo: Archivo) => {
    setError(null);
    setCargando(true);
    try {
      const data = await api<ArchivoContenido>("material.file", {
        fileId: archivo.id,
      });
      const blob = base64ToBlob(data.base64, data.mimeType);
      setContenido(data);
      setBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir.");
    } finally {
      setCargando(false);
    }
  }, []);

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {archivos === null ? (
        <SkeletonFilas n={3} />
      ) : archivos.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Este tema aún no tiene archivos.
        </p>
      ) : (
        <ul className="space-y-2">
          {archivos.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => abrirArchivo(a)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  contenido?.id === a.id
                    ? "border-neutral-900 dark:border-white"
                    : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800"
                }`}
              >
                <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-black">
                  {fileIcon(a.mimeType)}
                </span>
                <span className="min-w-0 flex-1 break-words font-medium">
                  {a.nombre}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {cargando && (
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Abriendo archivo…
        </p>
      )}

      {contenido && blobUrl && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{contenido.nombre}</h2>
            <a
              href={blobUrl}
              download={contenido.nombre}
              className="inline-block rounded-lg px-2 py-2 text-sm font-medium underline text-neutral-500 dark:text-neutral-400"
            >
              Descargar
            </a>
          </div>
          {contenido.mimeType.includes("pdf") ? (
            <iframe
              src={blobUrl}
              title={contenido.nombre}
              className="h-[75dvh] w-full rounded-xl border border-neutral-200 dark:border-neutral-800"
            />
          ) : contenido.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobUrl}
              alt={contenido.nombre}
              className="mx-auto max-h-[75dvh] rounded-xl border border-neutral-200 dark:border-neutral-800"
            />
          ) : contenido.mimeType.startsWith("audio/") ? (
            <audio controls src={blobUrl} className="w-full">
              Tu navegador no puede reproducir este audio.
            </audio>
          ) : (
            <a
              href={blobUrl}
              download={contenido.nombre}
              className="inline-block rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Descargar {contenido.nombre}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function PartiturasPage() {
  const { pendiente } = useRequireAuth();
  const [catalogo, setCatalogo] = useState<Cancion[] | null>(null);
  const [cancionId, setCancionId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "titulo", desc: false },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [error, setError] = useState<string | null>(null);
  const visorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    api<{ catalogo: Cancion[] }>("public.catalog")
      .then((d) => setCatalogo((d.catalogo ?? []).filter((c) => c.carpetaDriveId)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar."),
      );
  }, []);

  // Al abrir un tema, el visor queda fuera de pantalla en móvil: bajamos
  // hasta él y le devolvemos el foco (accesible con teclado y claro).
  useEffect(() => {
    if (!cancionId) return;
    const raf = requestAnimationFrame(() => {
      visorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      visorRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [cancionId]);

  const columnas = useMemo<ColumnDef<Cancion>[]>(
    () => [
      {
        accessorKey: "titulo",
        header: "Título",
        cell: (ctx) => (
          <span className="font-medium">{ctx.row.original.titulo}</span>
        ),
      },
      {
        accessorKey: "artista",
        header: "Artista",
        cell: (ctx) => (
          <span className="text-neutral-500 dark:text-neutral-400">
            {ctx.row.original.artista || "—"}
          </span>
        ),
      },
      {
        accessorKey: "categoria",
        header: "Género",
        cell: (ctx) => (
          <span className="text-neutral-500 dark:text-neutral-400">
            {ctx.row.original.categoria || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: catalogo ?? [],
    columns: columnas,
    state: { globalFilter: busqueda, sorting, pagination },
    onGlobalFilterChange: setBusqueda,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (pendiente) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SkeletonFilas n={5} />
      </div>
    );
  }

  const filas = table.getRowModel().rows;
  const cancion = catalogo?.find((c) => c.id === cancionId) ?? null;
  const total = catalogo?.length ?? 0;
  // En móvil solo se muestra la columna «Título» (el resto se recupera
  // a partir de sm): la tabla no llega a necesitar scroll horizontal.
  const claseColumna = (id: string) =>
    id === "artista" || id === "categoria" ? "hidden sm:table-cell" : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <Link
          href="/mi"
          className="mb-1 inline-flex min-h-10 items-center text-sm font-semibold text-neutral-500 underline transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Mi zona
        </Link>
        <h1 className="text-2xl font-bold">Partituras y material</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Cifrados, partituras y guías de audio del repertorio. Acceso solo
          para músicos registrados.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {catalogo === null ? (
        <SkeletonFilas n={5} />
      ) : total === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          Todavía no hay material publicado para este repertorio.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              placeholder="Buscar por título, artista o género…"
              aria-label="Buscar en el repertorio"
              className="min-h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white sm:w-72 sm:text-sm"
            />
            <label className="ml-auto flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              Por página
              <select
                value={pagination.pageSize}
                onChange={(e) =>
                  setPagination((p) => ({
                    ...p,
                    pageIndex: 0,
                    pageSize: Number(e.target.value),
                  }))
                }
                className="min-h-10 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className={`px-3 py-2.5 text-left ${claseColumna(header.column.id)}`}
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 font-semibold uppercase tracking-wide text-xs text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: " ↑",
                              desc: " ↓",
                            }[header.column.getIsSorted() as string] ?? ""}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {filas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnas.length}
                      className="px-3 py-6 text-center text-neutral-500 dark:text-neutral-400"
                    >
                      Ningún tema coincide con «{busqueda}».
                    </td>
                  </tr>
                ) : (
                  filas.map((fila) => (
                    <tr
                      key={fila.id}
                      onClick={() => setCancionId(fila.original.id)}
                      className={`cursor-pointer border-b border-neutral-100 transition last:border-0 dark:border-neutral-900 ${
                        cancionId === fila.original.id
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      }`}
                    >
                      {fila.getVisibleCells().map((celda, i) => (
                        <td
                          key={celda.id}
                          className={`px-3 py-2.5 ${claseColumna(celda.column.id)}`}
                        >
                          {i === 0 ? (
                            // El título es el control real de la fila:
                            // alcanzable con Tab/Enter (el onClick del <tr>
                            // sigue funcionando con el ratón).
                            <button
                              type="button"
                              onClick={() => setCancionId(fila.original.id)}
                              aria-current={
                                cancionId === fila.original.id
                                  ? "true"
                                  : undefined
                              }
                              className="w-full text-left"
                            >
                              {flexRender(
                                celda.column.columnDef.cell,
                                celda.getContext(),
                              )}
                            </button>
                          ) : (
                            flexRender(
                              celda.column.columnDef.cell,
                              celda.getContext(),
                            )
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Mostrando {filas.length} de{" "}
              {table.getFilteredRowModel().rows.length} temas
              {table.getFilteredRowModel().rows.length !== total
                ? ` (repertorio: ${total})`
                : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="min-h-10 rounded-lg border border-neutral-300 px-3 py-1.5 font-medium transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Anterior
              </button>
              <span>
                Pág. {pagination.pageIndex + 1} de{" "}
                {Math.max(table.getPageCount(), 1)}
              </span>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="min-h-10 rounded-lg border border-neutral-300 px-3 py-1.5 font-medium transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Siguiente
              </button>
            </div>
          </div>

          {cancion && (
            <section
              ref={visorRef}
              tabIndex={-1}
              className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">
                  {cancion.titulo}
                  {cancion.artista ? (
                    <span className="font-normal text-neutral-500 dark:text-neutral-400">
                      {" "}
                      — {cancion.artista}
                    </span>
                  ) : null}
                </h2>
                <button
                  type="button"
                  onClick={() => setCancionId("")}
                  className="inline-flex min-h-10 items-center text-xs text-neutral-500 underline dark:text-neutral-400"
                >
                  Cerrar
                </button>
              </div>
              <MaterialViewer key={cancion.id} cancion={cancion} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
