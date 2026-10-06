"use client";

import { useCallback, useEffect, useState } from "react";
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
        <p className="text-sm text-neutral-500">Cargando archivos…</p>
      ) : archivos.length === 0 ? (
        <p className="text-sm text-neutral-500">
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
        <p className="mt-4 text-sm text-neutral-500">Abriendo archivo…</p>
      )}

      {contenido && blobUrl && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{contenido.nombre}</h2>
            <a
              href={blobUrl}
              download={contenido.nombre}
              className="inline-block rounded-lg px-2 py-2 text-sm font-medium underline text-neutral-500"
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ catalogo: Cancion[] }>("public.catalog")
      .then((d) => setCatalogo((d.catalogo ?? []).filter((c) => c.carpetaDriveId)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar."),
      );
  }, []);

  if (pendiente) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-500">
        Cargando…
      </div>
    );
  }

  const conMaterial = catalogo?.length ?? 0;
  const cancion = catalogo?.find((c) => c.id === cancionId) ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Partituras y material</h1>
        <p className="mt-1 text-sm text-neutral-500">
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
        <p className="text-sm text-neutral-500">Cargando repertorio…</p>
      ) : conMaterial === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Todavía no hay material publicado para este repertorio.
        </p>
      ) : (
        <>
          <label htmlFor="cancion" className="mb-2 block text-sm font-semibold">
            Elige un tema
          </label>
          <select
            id="cancion"
            value={cancionId}
            onChange={(e) => setCancionId(e.target.value)}
            className="mb-6 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:text-sm"
          >
            <option value="">— Selecciona —</option>
            {catalogo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
                {c.artista ? ` — ${c.artista}` : ""}
              </option>
            ))}
          </select>

          {cancion && <MaterialViewer key={cancion.id} cancion={cancion} />}
        </>
      )}
    </div>
  );
}
