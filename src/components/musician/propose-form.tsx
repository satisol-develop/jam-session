"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { INSTRUMENTOS } from "@/lib/constants";

interface Adjunto {
  nombre: string;
  mimeType: string;
  base64: string;
  bytes: number;
}

interface PropuestaItem {
  id: string;
  cancion: string;
  artista: string;
  instrumento: string;
  estado: string;
  fecha: string;
  archivos?: { nombre: string; mimeType: string; bytes: number }[];
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "En repertorio",
  rechazada: "Descartada",
};

const MAX_ARCHIVOS = 6;
const MAX_ARCHIVO_BYTES = 6 * 1024 * 1024;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

function leerBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer el fichero."));
    lector.onload = () => {
      const dato = String(lector.result ?? "");
      resolve(dato.slice(dato.indexOf(",") + 1));
    };
    lector.readAsDataURL(file);
  });
}

export function ProposeForm() {
  const [cancion, setCancion] = useState("");
  const [artista, setArtista] = useState("");
  const [instrumento, setInstrumento] = useState("");
  const [propuestas, setPropuestas] = useState<PropuestaItem[]>([]);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const inputArchivos = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ propuestas: PropuestaItem[] }>("musician.myProposals")
      .then((d) => setPropuestas(d.propuestas ?? []))
      .catch(() => undefined);
  }, []);

  async function onArchivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const entradas = Array.from(files);
    if (adjuntos.length + entradas.length > MAX_ARCHIVOS) {
      setError(`Máximo ${MAX_ARCHIVOS} ficheros por propuesta.`);
      return;
    }
    let total = adjuntos.reduce((n, a) => n + a.bytes, 0);
    const nuevos: Adjunto[] = [];
    for (const f of entradas) {
      if (f.size > MAX_ARCHIVO_BYTES) {
        setError(`«${f.name}» supera los 6 MB.`);
        return;
      }
      total += f.size;
      if (total > MAX_TOTAL_BYTES) {
        setError("Los ficheros superan los 10 MB en total.");
        return;
      }
      nuevos.push({
        nombre: f.name,
        mimeType: f.type || "application/octet-stream",
        base64: await leerBase64(f),
        bytes: f.size,
      });
    }
    setAdjuntos((prev) => [...prev, ...nuevos]);
    if (inputArchivos.current) inputArchivos.current.value = "";
  }

  function quitarAdjunto(nombre: string) {
    setAdjuntos((prev) => prev.filter((a) => a.nombre !== nombre));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setBusy(true);
    try {
      const res = await api<{ id: string }>("musician.propose", {
        cancion,
        artista,
        instrumento,
        texto: `Quiero tocar «${cancion.trim()}»${artista.trim() ? ` de ${artista.trim()}` : ""} en ${instrumento}.`,
        archivos: adjuntos.map((a) => ({
          nombre: a.nombre,
          mimeType: a.mimeType,
          base64: a.base64,
        })),
      });
      setPropuestas((prev) => [
        {
          id: res.id,
          cancion: cancion.trim(),
          artista: artista.trim(),
          instrumento,
          estado: "pendiente",
          fecha: new Date().toISOString(),
          archivos: adjuntos.map((a) => ({
            nombre: a.nombre,
            mimeType: a.mimeType,
            bytes: a.bytes,
          })),
        },
        ...prev,
      ]);
      setCancion("");
      setArtista("");
      setInstrumento("");
      setAdjuntos([]);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cancion" className="block text-sm font-semibold">
              Canción
            </label>
            <input
              id="cancion"
              type="text"
              required
              maxLength={120}
              value={cancion}
              onChange={(e) => setCancion(e.target.value)}
              placeholder="Ej. September"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="artista" className="block text-sm font-semibold">
              Artista{" "}
              <span className="font-normal text-neutral-500 dark:text-neutral-400">
                (opcional)
              </span>
            </label>
            <input
              id="artista"
              type="text"
              maxLength={120}
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              placeholder="Ej. Earth, Wind & Fire"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="instrumento" className="block text-sm font-semibold">
            El instrumento con el que la tocarías
          </label>
          <select
            id="instrumento"
            required
            value={instrumento}
            onChange={(e) => setInstrumento(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:text-sm"
          >
            <option value="">Elige un instrumento…</option>
            {INSTRUMENTOS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="propuesta-ficheros"
            className="block text-sm font-semibold"
          >
            Ficheros (partitura, cifrado o guía)
          </label>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Si la propuesta se aprueba, estos ficheros pasan a formar parte del
            repertorio y se verán en «Partituras». Opcional: máx. {MAX_ARCHIVOS}{" "}
            ficheros, 6 MB cada uno.
          </p>
          <input
            ref={inputArchivos}
            id="propuesta-ficheros"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.svg,.mp3,.wav,.m4a,.ogg,.txt,.zip"
            onChange={(e) => void onArchivos(e.target.files)}
            className="mt-2 block w-full rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-2 text-sm text-black file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:file:bg-white dark:file:text-black"
          />
          {adjuntos.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {adjuntos.map((a) => (
                <li
                  key={a.nombre}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <span className="max-w-40 truncate">{a.nombre}</span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {(a.bytes / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarAdjunto(a.nombre)}
                    aria-label={`Quitar ${a.nombre}`}
                    className="inline-flex size-7 items-center justify-center rounded-full text-lg leading-none text-neutral-500 transition hover:bg-red-100 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        )}
        {ok && (
          <p
            role="status"
            className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
          >
            Propuesta enviada. El Grupo Base la tendrá en cuenta y el General
            decide si entra al repertorio.
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900 sm:w-auto"
        >
          {busy ? "Enviando…" : "Enviar propuesta"}
        </button>
      </form>

      {propuestas.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Aún no has enviado propuestas. Usa el formulario para proponer una
          canción.
        </p>
      )}

      {propuestas.length > 0 && (
        <ul className="space-y-2">
          {propuestas.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <span className="flex-1">
                «{p.cancion}»{p.artista ? ` — ${p.artista}` : ""}
                <span className="text-neutral-500 text-xs dark:text-neutral-400">
                  {" "}
                  · en {p.instrumento}
                  {p.archivos && p.archivos.length > 0
                    ? ` · ${p.archivos.length} fichero${p.archivos.length > 1 ? "s" : ""}`
                    : ""}
                </span>
              </span>
              <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                {ESTADO_LABEL[p.estado] ?? p.estado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
