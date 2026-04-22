"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteInitiative } from "@/lib/storage";

interface DeleteInitiativeModalProps {
  open: boolean;
  onClose: () => void;
  initiativeId: string;
  initiativeName: string;
}

export function DeleteInitiativeModal({
  open,
  onClose,
  initiativeId,
  initiativeName,
}: DeleteInitiativeModalProps) {
  const router = useRouter();
  const [confirmationName, setConfirmationName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setConfirmationName("");
    setReason("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const namesMatch = confirmationName.trim() === initiativeName;
  const reasonValid = reason.trim().length >= 5;
  const canSubmit = namesMatch && reasonValid && !submitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const result = deleteInitiative({
      initiative_id: initiativeId,
      confirmation_name: confirmationName,
      reason,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    onClose();
    router.push("/mis-iniciativas");
    router.refresh();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-ini-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-pae-surface p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2
            id="delete-ini-title"
            className="text-[16px] font-semibold text-pae-red"
          >
            Borrar iniciativa
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

        <div className="mb-4 rounded-lg border border-pae-red/30 bg-pae-red/5 p-3">
          <p className="text-[12px] font-semibold text-pae-red">
            Esta acción es irreversible.
          </p>
          <p className="mt-1 text-[12px] text-pae-text-secondary">
            Se eliminarán la iniciativa, sus formularios, gateways, votos,
            documentos, eventos y miembros. El borrado queda registrado en el
            audit log. Solo el Área de Transformación puede ejecutar esta
            acción, y únicamente para corregir iniciativas creadas por error o
            duplicadas.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-[13px] font-medium text-pae-text-secondary">
              Para confirmar, escribí el nombre exacto:
            </span>
            <p className="mt-1 mb-1.5 text-[12px] font-semibold text-pae-text">
              {initiativeName}
            </p>
            <input
              type="text"
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              placeholder="Nombre de la iniciativa"
              autoComplete="off"
              className="block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[14px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-red focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="block text-[13px] font-medium text-pae-text-secondary">
              Razón del borrado
            </span>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: iniciativa creada por error / duplicada de ini-xxx"
              className="mt-1.5 block w-full rounded-lg border border-pae-border bg-pae-bg px-3 py-2 text-[14px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-red focus:outline-none"
            />
            <span className="mt-1 block text-[11px] text-pae-text-tertiary">
              Mínimo 5 caracteres. Se registra en el audit log.
            </span>
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-pae-red/10 px-3 py-2 text-[13px] text-pae-red">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-pae-border bg-pae-surface px-3 py-2 text-[14px] font-medium text-pae-text-secondary hover:bg-pae-bg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-pae-red px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-pae-red/90 disabled:bg-pae-red/40"
          >
            {submitting ? "Borrando…" : "Borrar iniciativa"}
          </button>
        </div>
      </form>
    </div>
  );
}
