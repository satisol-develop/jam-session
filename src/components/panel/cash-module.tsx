"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import type { MovimientoCaja, ResumenCaja, TipoMovimiento } from "@/types";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

interface Props {
  puedeEscribir: boolean;
}

export function CashModule({ puedeEscribir }: Props) {
  const [data, setData] = useState<ResumenCaja | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [tipo, setTipo] = useState<TipoMovimiento>("entrada");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [metodo, setMetodo] = useState("efectivo");

  const [fondoInicial, setFondoInicial] = useState("");
  const [efectivoContado, setEfectivoContado] = useState("");

  useEffect(() => {
    api<ResumenCaja>("cash.list")
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar."),
      );
  }, []);

  async function reload() {
    try {
      setData(await api<ResumenCaja>("cash.list"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar.");
    }
  }

  async function anadir(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<MovimientoCaja>("cash.add", {
        tipo,
        concepto,
        importe: Number(importe.replace(",", ".")),
        metodo,
      });
      setConcepto("");
      setImporte("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo añadir.");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(id: string) {
    setBusy(true);
    setError(null);
    try {
      await api("cash.delete", { id });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular.");
    } finally {
      setBusy(false);
    }
  }

  async function cerrar(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("cash.close", {
        fondoInicial: Number(fondoInicial.replace(",", ".")) || 0,
        efectivoContado: Number(efectivoContado.replace(",", ".")) || 0,
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return <p className="text-sm text-neutral-500">{error ?? "Cargando caja…"}</p>;
  }

  const cobradoEfectivo = data.movimientos
    .filter((m) => m.metodo === "efectivo")
    .reduce((s, m) => s + m.importe, 0);
  const fondo =
    data.cierre?.fondoInicial ?? (Number(fondoInicial.replace(",", ".")) || 0);
  const esperado = data.cierre?.esperadoEnCaja ?? fondo + cobradoEfectivo;

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Entradas", data.totales.entradas],
            ["Consumos", data.totales.consumibles],
            ["Otros", data.totales.otros],
          ] as const
        ).map(([label, valor]) => (
          <div
            key={label}
            className="rounded-xl border border-neutral-200 p-3 text-center dark:border-neutral-800"
          >
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{eur.format(valor)}</p>
          </div>
        ))}
      </div>

      {puedeEscribir && !data.cierre && (
        <form onSubmit={anadir} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            >
              <option value="entrada">Entrada</option>
              <option value="consumible">Consumición</option>
              <option value="otro">Otro</option>
            </select>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Concepto (ej. Cerveza, Entrada)"
              maxLength={120}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                placeholder="Importe €"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={busy || !importe}
                className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                +
              </button>
            </div>
          </div>
        </form>
      )}

      {data.movimientos.length === 0 ? (
        <p className="text-sm text-neutral-500">Sin movimientos todavía.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {data.movimientos.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex-1">
                <span className="font-medium">{m.concepto || m.tipo}</span>
                <span className="ml-2 text-xs text-neutral-500">{m.metodo}</span>
              </span>
              <span className="tabular-nums">{eur.format(m.importe)}</span>
              {puedeEscribir && !data.cierre && (
                <button
                  onClick={() => eliminar(m.id)}
                  disabled={busy}
                  aria-label="Anular movimiento"
                  className="text-xs text-red-500 disabled:opacity-50"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-3 text-sm font-bold">Cierre y cuadre</h3>

        {data.cierre ? (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Fondo inicial</dt>
              <dd className="tabular-nums">{eur.format(data.cierre.fondoInicial)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Cobrado en efectivo</dt>
              <dd className="tabular-nums">{eur.format(data.cierre.cobradoEfectivo)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Esperado en caja</dt>
              <dd className="tabular-nums">{eur.format(data.cierre.esperadoEnCaja)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Contado</dt>
              <dd className="tabular-nums">{eur.format(data.cierre.efectivoContado)}</dd>
            </div>
            <div
              className={`flex justify-between font-bold ${
                data.cierre.diferencia === 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              <dt>Diferencia</dt>
              <dd className="tabular-nums">
                {eur.format(data.cierre.diferencia)}
              </dd>
            </div>
          </dl>
        ) : puedeEscribir ? (
          <form onSubmit={cerrar} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                inputMode="decimal"
                value={fondoInicial}
                onChange={(e) => setFondoInicial(e.target.value)}
                placeholder="Fondo inicial €"
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
              <input
                type="text"
                inputMode="decimal"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                placeholder="Efectivo contado €"
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
            </div>
            <p className="text-xs text-neutral-500">
              Esperado en caja: <strong>{eur.format(esperado)}</strong>
            </p>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              Cerrar caja
            </button>
          </form>
        ) : (
          <p className="text-xs text-neutral-500">
            La caja aún no está cerrada. Solo el titular puede cerrarla.
          </p>
        )}
      </section>
    </div>
  );
}
