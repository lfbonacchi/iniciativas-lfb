"use client";

import Link from "next/link";
import { useEffect } from "react";

interface EmptyStateModalProps {
  open: boolean;
  onClose: () => void;
  canCreate?: boolean;
}

export function EmptyStateModal({
  open,
  onClose,
  canCreate = true,
}: EmptyStateModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="empty-state-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-pae-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="empty-state-title"
            className="text-[18px] font-semibold text-pae-text"
          >
            Todavía no hay propuestas.
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-[16px] text-pae-text-tertiary hover:bg-pae-bg hover:text-pae-text"
          >
            ✕
          </button>
        </div>

        <p className="text-[14px] leading-relaxed text-pae-text-secondary">
          No se cargaron datos demo y todavía no creaste ninguna iniciativa.
        </p>

        {canCreate ? (
          <p className="mt-3 text-[14px] leading-relaxed text-pae-text-secondary">
            Podés crear una desde{" "}
            <span className="font-semibold text-pae-blue">
              + Nueva propuesta
            </span>{" "}
            en el sidebar.
          </p>
        ) : (
          <p className="mt-3 text-[14px] leading-relaxed text-pae-text-secondary">
            Esperá a que alguien cargue datos o cree una iniciativa donde
            participes.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-pae-border bg-pae-surface px-3 py-2 text-[14px] font-medium text-pae-text-secondary hover:bg-pae-bg"
          >
            Cerrar
          </button>
          {canCreate && (
            <Link
              href="/nueva-propuesta"
              className="rounded-lg bg-pae-blue px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-pae-blue/90"
            >
              + Nueva propuesta
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
