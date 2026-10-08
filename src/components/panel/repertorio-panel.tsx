"use client";

import { useEffect, useState, type FormEvent } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import type { Cancion } from "@/types";

export function RepertorioPanel({ editable }: { editable: boolean }) {
  const [catalogo, setCatalogo] = useState<Cancion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [artista, setArtista] = useState("");
  const [tonalidad, setTonalidad] = useState("");

  useEffect(() => {
    api<{ catalogo: Cancion[] }>("public.catalog")
      .then((res) => setCatalogo(res.catalogo ?? []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setCatalogo([]);
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const cancion = await api<Cancion>("repertoire.add", {
        titulo: titulo.trim(),
        artista: artista.trim(),
        tonalidad: tonalidad.trim(),
      });
      setCatalogo((prev) => [...(prev ?? []), cancion]);
      setOk(`«${cancion.titulo}» añadido al repertorio.`);
      setTitulo("");
      setArtista("");
      setTonalidad("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo añadir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="db-error mb-4" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="db-ok mb-4" role="status">
          {ok}
        </p>
      )}

      {editable && (
        <form onSubmit={onSubmit} className="db-card mb-4 space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className="db-muted mb-1 block text-xs font-semibold">
                Título *
              </span>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Sultans of Swing"
                maxLength={160}
                className="db-input w-full"
                required
              />
            </label>
            <label className="block">
              <span className="db-muted mb-1 block text-xs font-semibold">
                Artista
              </span>
              <input
                type="text"
                value={artista}
                onChange={(e) => setArtista(e.target.value)}
                placeholder="Dire Straits"
                maxLength={160}
                className="db-input w-full"
              />
            </label>
            <label className="block">
              <span className="db-muted mb-1 block text-xs font-semibold">
                Tonalidad
              </span>
              <input
                type="text"
                value={tonalidad}
                onChange={(e) => setTonalidad(e.target.value)}
                placeholder="Dm"
                maxLength={16}
                className="db-input w-full"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy || titulo.trim().length < 2}
            className="db-btn"
          >
            {busy ? "Añadiendo…" : "Añadir al repertorio"}
          </button>
        </form>
      )}

      {catalogo === null ? (
        <SkeletonFilas n={3} />
      ) : catalogo.length === 0 ? (
        <p className="db-card p-6 text-center text-sm db-muted">
          El repertorio está vacío. Añade el primer tema.
        </p>
      ) : (
        <ol className="divide-y divide-white/10 rounded-2xl border border-white/12">
          {catalogo.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <span className="w-6 shrink-0 tabular-nums text-white/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 break-words font-medium">
                {c.titulo}
                {c.artista && (
                  <span className="text-white/55"> — {c.artista}</span>
                )}
              </span>
              {c.tonalidad && (
                <span className="db-badge shrink-0">{c.tonalidad}</span>
              )}
              {c.categoria && (
                <span className="db-badge db-badge-line hidden shrink-0 lg:inline-flex">
                  {c.categoria}
                </span>
              )}
              <span className="db-badge db-badge-line hidden shrink-0 sm:inline-flex">
                {c.origen}
              </span>
              {c.carpetaDriveId === "" && (
                <span className="db-badge db-badge-line hidden shrink-0 md:inline-flex">
                  sin material
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
