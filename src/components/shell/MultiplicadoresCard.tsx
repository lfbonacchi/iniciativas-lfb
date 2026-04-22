"use client";

import { useState } from "react";

import { RATE_ROWS } from "@/lib/storage/financials";

function fmtRate(n: number): string {
  if (n >= 1_000_000) return `USD ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `USD ${(n / 1_000).toFixed(0)}K`;
  return `USD ${n}`;
}

export function MultiplicadoresCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-pae-amber/40 bg-pae-amber/5 px-3 py-1.5 text-[12px] font-medium text-pae-amber transition hover:bg-pae-amber/10"
      >
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-pae-amber text-[10px] font-bold text-white"
          aria-hidden
        >
          !
        </span>
        Equivalencias a USD
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-pae-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold text-pae-text">
                  Equivalencias a USD (multiplicadores por corriente)
                </p>
                <p className="mt-1 text-[12px] text-pae-text-secondary">
                  <span className="font-semibold text-pae-amber">
                    Definir con Valor las equivalencias
                  </span>{" "}
                  reales para calcular corrientes de valor. Los valores
                  marcados como placeholder son provisorios.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-[14px] text-pae-text-tertiary hover:bg-pae-bg hover:text-pae-text"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RATE_ROWS.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between rounded-lg border border-pae-border bg-pae-bg/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-pae-text">
                      {r.label}
                    </p>
                    <p className="text-[10px] text-pae-text-tertiary">
                      por {r.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold tabular-nums text-pae-text">
                      {fmtRate(r.usd_per_unit)}
                    </span>
                    {r.is_placeholder && (
                      <span className="rounded-full bg-pae-amber/15 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wide text-pae-amber">
                        Placeholder
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
