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
import { useAuth } from "@/lib/auth/auth-provider";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { fmt, rutaLocalizada } from "@/i18n";
import { useDict, useLocale } from "@/i18n/use-locale";
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
  const d = useDict();
  const [archivos, setArchivos] = useState<Archivo[] | null>(null);
  const [contenido, setContenido] = useState<ArchivoContenido | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api<{ archivos: Archivo[] }>("material.list", {
      carpetaDriveId: cancion.carpetaDriveId,
    })
      .then((d2) => setArchivos(d2.archivos ?? []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : d.partituras.errorCargar),
      );
  }, [cancion.carpetaDriveId, d.partituras.errorCargar]);

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
      setError(err instanceof Error ? err.message : d.partituras.errorAbrir);
    } finally {
      setCargando(false);
    }
  }, [d.partituras.errorAbrir]);

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
          {d.partituras.sinArchivos}
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
          {d.partituras.abriendo}
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
              {d.partituras.descargar}
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
              {d.partituras.audioNo}
            </audio>
          ) : (
            <a
              href={blobUrl}
              download={contenido.nombre}
              className="inline-block rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              {fmt(d.partituras.descargarNombre, { nombre: contenido.nombre })}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function PartiturasVista() {
  const { roles } = useAuth();
  const { pendiente } = useRequireAuth();
  const locale = useLocale();
  const d = useDict();
  // El admin no pasa por Mi zona (le redirige), así que vuelve a su panel.
  const esAdmin = Boolean(roles.admin);
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
      .then((d2) => setCatalogo((d2.catalogo ?? []).filter((c) => c.carpetaDriveId)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : d.partituras.errorCargar),
      );
  }, [d.partituras.errorCargar]);

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
        header: d.partituras.colTitulo,
        cell: (ctx) => (
          <span className="font-medium">{ctx.row.original.titulo}</span>
        ),
      },
      {
        accessorKey: "artista",
        header: d.partituras.colArtista,
        cell: (ctx) => (
          <span className="text-neutral-500 dark:text-neutral-400">
            {ctx.row.original.artista || "—"}
          </span>
        ),
      },
      {
        accessorKey: "categoria",
        header: d.partituras.colGenero,
        cell: (ctx) => (
          <span className="text-neutral-500 dark:text-neutral-400">
            {ctx.row.original.categoria || "—"}
          </span>
        ),
      },
    ],
    [d.partituras.colTitulo, d.partituras.colArtista, d.partituras.colGenero],
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
          href={esAdmin ? "/panel" : rutaLocalizada(locale, "/mi")}
          className="mb-1 inline-flex min-h-10 items-center text-sm font-semibold text-neutral-500 underline transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          {esAdmin ? d.partituras.volverPanel : d.partituras.volverMiZona}
        </Link>
        <p className="text-xs font-extrabold tracking-[0.22em] text-red-500 uppercase">
          {d.partituras.kicker}
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight uppercase italic">
          {d.partituras.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {d.partituras.subtitulo}
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
          {d.partituras.sinMaterial}
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
              placeholder={d.partituras.buscar}
              aria-label={d.partituras.buscarAria}
              className="min-h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white sm:w-72 sm:text-sm"
            />
            <label className="ml-auto flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              {d.partituras.porPagina}
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
                        className={`px-3 py-1 text-left ${claseColumna(header.column.id)}`}
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex min-h-10 items-center gap-1 font-semibold uppercase tracking-wide text-xs text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
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
                      {fmt(d.partituras.sinCoincidencias, { q: busqueda })}
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
              {fmt(d.partituras.mostrando, {
                n: filas.length,
                m: table.getFilteredRowModel().rows.length,
              })}
              {table.getFilteredRowModel().rows.length !== total
                ? fmt(d.partituras.repertorioTotal, { t: total })
                : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="min-h-10 rounded-lg border border-neutral-300 px-3 py-1.5 font-medium transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                {d.partituras.anterior}
              </button>
              <span>
                {fmt(d.partituras.pagina, {
                  a: pagination.pageIndex + 1,
                  b: Math.max(table.getPageCount(), 1),
                })}
              </span>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="min-h-10 rounded-lg border border-neutral-300 px-3 py-1.5 font-medium transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                {d.partituras.siguiente}
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
                  {d.partituras.cerrar}
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
