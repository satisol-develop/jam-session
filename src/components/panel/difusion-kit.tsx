"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import type { Evento } from "@/types";

const CARTEL_MIME_OK = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_CARTEL_BYTES = 6 * 1024 * 1024;

interface Plantilla {
  id: string;
  nombre: string;
  mimeType: string;
  bytes: number;
  url: string;
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

const fmtFecha = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(",")[1] ?? "");
    fr.onerror = () => reject(new Error("No se pudo leer el archivo."));
    fr.readAsDataURL(file);
  });
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    img.src = src;
  });
}

interface CartelArchivo {
  nombre: string;
  mimeType: string;
  base64: string;
}

/**
 * Valida y prepara el cartel: SVG tal cual; raster grande se reescala a
 * 1600 px en JPEG para que la portada cargue rápido y entre en el límite.
 */
async function prepararCartel(file: File): Promise<CartelArchivo> {
  const mime =
    file.type || (file.name.toLowerCase().endsWith(".svg") ? "image/svg+xml" : "");
  if (!CARTEL_MIME_OK.includes(mime)) {
    throw new Error("Formato no admitido: usa JPG, PNG, WEBP o SVG.");
  }
  if (file.size > 30 * 1024 * 1024) {
    throw new Error("El archivo pesa demasiado.");
  }

  if (mime === "image/svg+xml") {
    const b64 = await fileToBase64(file);
    if (b64.length * 0.75 > MAX_CARTEL_BYTES) {
      throw new Error("El cartel supera los 6 MB.");
    }
    return { nombre: file.name, mimeType: mime, base64: b64 };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await cargarImagen(url);
    const largo = Math.max(img.naturalWidth, img.naturalHeight) || 1;
    const escala = Math.min(1, 1600 / largo);
    if (escala === 1 && file.size <= 1_200_000) {
      const b64 = await fileToBase64(file);
      if (b64.length * 0.75 > MAX_CARTEL_BYTES) {
        throw new Error("El cartel supera los 6 MB; exporta una imagen más ligera.");
      }
      return { nombre: file.name, mimeType: mime, base64: b64 };
    }
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.max(1, Math.round(img.naturalWidth * escala));
    lienzo.height = Math.max(1, Math.round(img.naturalHeight * escala));
    const ctx = lienzo.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible en este navegador.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    const b64 = lienzo.toDataURL("image/jpeg", 0.86).split(",")[1] ?? "";
    if (b64.length * 0.75 > MAX_CARTEL_BYTES) {
      throw new Error("El cartel supera los 6 MB; exporta una imagen más ligera.");
    }
    return {
      nombre: file.name.replace(/\.[^.]+$/, "") + ".jpg",
      mimeType: "image/jpeg",
      base64: b64,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function DifusionKit({ editable }: { editable: boolean }) {
  const [evento, setEvento] = useState<Evento | null | undefined>(undefined);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [plantillasEstado, setPlantillasEstado] = useState<
    "cargando" | "ok" | "error"
  >("cargando");

  useEffect(() => {
    api<{ evento: Evento | null }>("public.event")
      .then((res) => setEvento(res.evento ?? null))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setEvento(null);
      });
  }, []);

  useEffect(() => {
    api<{ plantillas: Plantilla[] }>("plantilla.list")
      .then((res) => {
        setPlantillas(res.plantillas ?? []);
        setPlantillasEstado("ok");
      })
      .catch(() => setPlantillasEstado("error"));
  }, []);

  if (evento === undefined) {
    return <SkeletonFilas n={3} />;
  }
  if (error && !evento) {
    return (
      <p className="db-error" role="alert">
        {error}
      </p>
    );
  }
  if (!evento) {
    return (
      <p className="db-muted text-sm">
        No hay evento activo: crea el evento del mes para poder difundirlo.
      </p>
    );
  }

  const fecha = evento.fecha
    ? fmtFecha.format(new Date(evento.fecha))
    : "Fecha por confirmar";
  const ensayo = evento.ensayo
    ? `${fmtFecha.format(new Date(evento.ensayo))} · ${new Date(evento.ensayo).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
    : "";
  const url = typeof window !== "undefined" ? window.location.origin : "";

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* portapapeles no disponible */
    }
  }

  async function subirCartel(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || subiendo) return;
    setSubiendo(true);
    setError(null);
    setOk(null);
    try {
      const prep = await prepararCartel(file);
      const res = await api<{ cartelUrl: string }>("event.setCartel", prep);
      setEvento((prev) => (prev ? { ...prev, cartelUrl: res.cartelUrl } : prev));
      setOk("Cartel publicado: ya se ve en la portada de la web.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el cartel.");
    } finally {
      setSubiendo(false);
    }
  }

  const datos: [string, string][] = [
    ["Título", evento.titulo],
    ["Fecha", fecha],
    ["Hora", evento.hora || "—"],
    ["Lugar", evento.lugar || "—"],
  ];
  if (ensayo) datos.push(["Ensayo general", ensayo]);

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        {datos.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/12 p-3">
            <dt className="db-kicker mb-1">{k}</dt>
            <dd className="text-sm font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-xl border border-white/12 p-3">
        <p className="db-kicker mb-1">Texto base para el cartel</p>
        <p className="text-sm">
          {evento.titulo} — {fecha} · {evento.hora} · {evento.lugar}.
          {ensayo && ` Ensayo general: ${ensayo}.`} ¡Toca con nosotros!
          #DebarockKolektiboa
        </p>
      </div>

      <div className="rounded-xl border border-white/12 p-3">
        <p className="db-kicker mb-2">Cartel de la sesión</p>

        {evento.cartelUrl ? (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={evento.cartelUrl}
              alt={`Cartel de ${evento.titulo}`}
              className="max-h-72 rounded-xl border border-white/12"
            />
            <p className="db-muted mt-1 text-xs">
              Así se ve ahora mismo en la portada pública.
            </p>
          </div>
        ) : (
          <p className="db-muted mb-3 text-sm">
            Aún no hay cartel publicado: la portada muestra el hueco
            «El cartel del mes se publicará aquí».
          </p>
        )}

        <div className="mb-3">
          <p className="db-kicker mb-1">Plantillas descargables</p>
          {plantillasEstado === "cargando" && (
            <p className="db-muted text-xs">Cargando plantillas…</p>
          )}
          {plantillasEstado === "error" && (
            <p className="db-error text-xs" role="alert">
              No se pudieron cargar las plantillas.
            </p>
          )}
          {plantillasEstado === "ok" && plantillas.length === 0 && (
            <p className="db-muted text-xs">
              Aún no hay plantillas: sube los archivos (PSD, AI, SVG, PNG,
              ZIP…) a la carpeta «Jam Session — Plantillas» de Drive y
              aparecerán aquí.
            </p>
          )}
          {plantillas.length > 0 && (
            <ul className="space-y-1">
              {plantillas.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="db-ghost truncate text-xs!"
                  >
                    {p.nombre}
                  </a>
                  <span className="db-badge db-badge-line shrink-0 text-[11px]!">
                    {(p.nombre.split(".").pop() || "?").toUpperCase()} ·{" "}
                    {formatBytes(p.bytes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`db-ghost text-xs! ${subiendo ? "pointer-events-none opacity-50" : ""}`}
            >
              {subiendo ? "Subiendo…" : "Subir cartel"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={subirCartel}
                disabled={subiendo}
              />
            </label>
          </div>
        )}

        <p className="db-muted mt-2 text-xs">
          Descarga una plantilla, edítala en el editor que quieras (Photoshop,
          Figma, Illustrator…) y vuelve a subirla aquí: JPG, PNG, WEBP o SVG
          (máx. 6 MB). Solo se publica un cartel en la portada: al subir uno
          nuevo sustituye al anterior.
        </p>
        {ok && (
          <p className="db-ok mt-2" role="status">
            {ok}
          </p>
        )}
        {error && (
          <p className="db-error mt-2" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => copiar(url)} className="db-btn text-xs!" disabled={!url}>
          {copiado ? "¡Copiado!" : "Copiar enlace"}
        </button>
        <button
          onClick={() =>
            copiar(
              `${evento.titulo} — ${fecha} · ${evento.hora} · ${evento.lugar}. ${ensayo ? `Ensayo general: ${ensayo}. ` : ""}¡Toca con nosotros! #DebarockKolektiboa`,
            )
          }
          className="db-ghost text-xs!"
        >
          Copiar texto del cartel
        </button>
      </div>

      <p className="db-muted text-xs">
        Cobertura audiovisual y publicaciones se registran como tareas del rol
        en la lista de arriba.
      </p>
    </div>
  );
}
