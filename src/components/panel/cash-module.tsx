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
  /** Cerrar la caja sin poder escribirla (Coordinador General). */
  puedeCerrar?: boolean;
}

export function CashModule({ puedeEscribir, puedeCerrar }: Props) {
  const cerrarPermitido = puedeCerrar ?? puedeEscribir;
  const [data, setData] = useState<ResumenCaja | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmarCierre, setConfirmarCierre] = useState(false);

  const [tipo, setTipo] = useState<TipoMovimiento>("consumible");
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

  function cerrar(e: FormEvent) {
    e.preventDefault();
    if (puedeEscribir) {
      void ejecutarCierre();
    } else {
      setConfirmarCierre(true);
    }
  }

  async function ejecutarCierre() {
    setConfirmarCierre(false);
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
    return <p className="db-muted text-sm">{error ?? "Cargando caja…"}</p>;
  }

  const cobradoEfectivo = data.movimientos
    .filter((m) => m.metodo === "efectivo")
    .reduce((s, m) => s + (m.tipo === "gasto" ? -m.importe : m.importe), 0);
  const fondo =
    data.cierre?.fondoInicial ?? (Number(fondoInicial.replace(",", ".")) || 0);
  const esperado = data.cierre?.esperadoEnCaja ?? fondo + cobradoEfectivo;

  return (
    <div className="space-y-6">
      {error && <p className="db-error">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Consumos", data.totales.consumibles, false],
            ["Otros ingresos", data.totales.otros, false],
            ["Gastos", data.totales.gastos, false],
            ["Beneficio", data.totales.beneficio, true],
          ] as const
        ).map(([label, valor, destacado]) => (
          <div key={label} className="db-card p-3 text-center">
            <p className="db-muted text-xs uppercase tracking-wider">{label}</p>
            <p
              className={`mt-1 text-lg font-bold tabular-nums ${
                destacado
                  ? valor < 0
                    ? "text-red-400"
                    : "text-[#FFE600]"
                  : "text-white"
              }`}
            >
              {eur.format(valor)}
            </p>
          </div>
        ))}
      </div>

      {puedeEscribir && !data.cierre && (
        <form onSubmit={anadir} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
              className="db-input"
            >
              <option value="consumible">Consumición</option>
              <option value="otro">Otro ingreso (barra/bar)</option>
              <option value="gasto">Gasto</option>
            </select>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              className="db-input"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Concepto (ej. Cerveza, Aportación barra)"
              maxLength={120}
              className="db-input"
            />
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                placeholder="Importe €"
                className="db-input"
              />
              <button
                type="submit"
                disabled={busy || !importe}
                className="db-btn shrink-0 px-4!"
              >
                +
              </button>
            </div>
          </div>
        </form>
      )}

      {data.movimientos.length === 0 ? (
        <p className="db-muted text-sm">Sin movimientos todavía.</p>
      ) : (
        <ul className="db-card divide-y divide-white/10 overflow-hidden">
          {data.movimientos.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="flex-1">
                <span className="font-medium">{m.concepto || m.tipo}</span>
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    m.tipo === "gasto"
                      ? "bg-red-500/15 text-red-300"
                      : m.tipo === "otro"
                        ? "bg-[#FFE600]/15 text-[#FFE600]"
                        : "bg-white/10 text-white/60"
                  }`}
                >
                  {m.tipo}
                </span>
                <span className="db-muted ml-2 text-xs">{m.metodo}</span>
              </span>
              <span className="tabular-nums">{eur.format(m.importe)}</span>
              {puedeEscribir && !data.cierre && (
                <button
                  onClick={() => eliminar(m.id)}
                  disabled={busy}
                  aria-label="Anular movimiento"
                  className="text-xs text-red-400 disabled:opacity-50"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="db-card p-4">
        <h3 className="db-title mb-3 text-sm">Cierre y cuadre</h3>

        {data.cierre ? (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="db-muted">Fondo inicial</dt>
              <dd className="tabular-nums">{eur.format(data.cierre.fondoInicial)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="db-muted">Cobrado en efectivo</dt>
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
                data.cierre.diferencia === 0 ? "text-[#FFE600]" : "text-red-400"
              }`}
            >
              <dt>Diferencia</dt>
              <dd className="tabular-nums">{eur.format(data.cierre.diferencia)}</dd>
            </div>
          </dl>
        ) : cerrarPermitido ? (
          <form onSubmit={cerrar} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                inputMode="decimal"
                value={fondoInicial}
                onChange={(e) => setFondoInicial(e.target.value)}
                placeholder="Fondo inicial €"
                className="db-input"
              />
              <input
                type="text"
                inputMode="decimal"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                placeholder="Efectivo contado €"
                className="db-input"
              />
            </div>
            <p className="db-muted text-xs">
              Esperado en caja: <strong className="text-white">{eur.format(esperado)}</strong>
            </p>
            <button type="submit" disabled={busy} className="db-btn w-full">
              Cerrar caja
            </button>
          </form>
        ) : (
          <p className="db-muted text-xs">
            La caja aún no está cerrada. Solo puede cerrarla el titular de Caja
            o el Coordinador General.
          </p>
        )}
      </section>

      {confirmarCierre && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="db-card w-full max-w-md space-y-4 p-6">
            <h3 className="db-title text-base">Cerrar caja antes de tiempo</h3>
            <p className="text-sm">
              Estás cerrando la caja <strong>antes de que lo haga el rol Caja</strong>.
              El cierre quedará registrado a tu nombre en la auditoría y en el
              historial de la sesión, y el rol Caja ya no podrá registrar más
              movimientos.
            </p>
            <p className="db-muted text-xs">¿Quieres continuar?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={ejecutarCierre}
                disabled={busy}
                className="db-btn flex-1"
              >
                {busy ? "Cerrando…" : "Sí, cerrar caja"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmarCierre(false)}
                disabled={busy}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
