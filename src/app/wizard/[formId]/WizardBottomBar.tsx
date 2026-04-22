"use client";

import { useEffect, useState } from "react";

import { formatLastSaved, type WizardAutoSaveState } from "./useWizardAutoSave";

export function WizardBottomBar({
  autosave,
  percent,
  canSubmit,
  submitLabel,
  submittingLabel,
  disabledHint,
  onPreview,
  onGeneratePptx,
  onSubmit,
  submitting,
}: {
  autosave: WizardAutoSaveState;
  percent: number;
  canSubmit: boolean;
  submitLabel: string;
  submittingLabel?: string;
  disabledHint?: string;
  onPreview: () => void;
  onGeneratePptx: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  // Re-render cada 15 s para refrescar "hace X min".
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const savedLabel = formatLastSaved(autosave.lastSavedAt, now);

  let indicator: { text: string; className: string };
  if (autosave.status === "saving") {
    indicator = {
      text: "Guardando…",
      className: "bg-pae-blue/10 text-pae-blue",
    };
  } else if (autosave.status === "error") {
    indicator = {
      text: autosave.errorMessage
        ? `Error al guardar: ${autosave.errorMessage}`
        : "Error al guardar",
      className: "bg-pae-red/10 text-pae-red",
    };
  } else if (savedLabel) {
    indicator = {
      text: `✓ Guardado automáticamente — ${savedLabel}`,
      className: "bg-pae-green/10 text-pae-green",
    };
  } else {
    indicator = {
      text: "Sin cambios todavía",
      className: "bg-pae-bg text-pae-text-tertiary",
    };
  }

  return (
    <div className="sticky bottom-0 z-10 border-t border-pae-border bg-pae-surface/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${indicator.className}`}
        >
          {indicator.text}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="rounded-lg border border-pae-border bg-pae-surface px-3 py-1.5 text-[12px] font-medium text-pae-text-secondary transition hover:border-pae-blue/40 hover:text-pae-blue"
          >
            Previsualizar
          </button>
          <button
            type="button"
            onClick={onGeneratePptx}
            className="rounded-lg border border-pae-red/30 bg-pae-red/5 px-3 py-1.5 text-[12px] font-medium text-pae-red transition hover:bg-pae-red/10"
          >
            Generar PPTX
          </button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={onSubmit}
            title={
              !canSubmit
                ? disabledHint ??
                  `Completá todas las secciones (${percent}%) para enviar`
                : undefined
            }
            className="rounded-lg bg-pae-blue px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:cursor-not-allowed disabled:bg-pae-blue/40"
          >
            {submitting ? submittingLabel ?? "Enviando…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
