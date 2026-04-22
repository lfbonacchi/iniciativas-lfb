"use client";

import { useEffect, useMemo, useState } from "react";

import type { Id } from "@/types";
import { addBloqueante } from "@/lib/storage/mesa_de_trabajo";

interface AddBloqueanteModalProps {
  open: boolean;
  initiativeId: Id;
  availableUsers: { id: Id; display_name: string }[];
  onClose: () => void;
  onAdded: () => void;
}

export function AddBloqueanteModal({
  open,
  initiativeId,
  availableUsers,
  onClose,
  onAdded,
}: AddBloqueanteModalProps) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Id[]>([]);
  const [isPriority, setIsPriority] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSelected([]);
    setIsPriority(false);
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

  const sortedUsers = useMemo(
    () =>
      [...availableUsers].sort((a, b) =>
        a.display_name.localeCompare(b.display_name),
      ),
    [availableUsers],
  );

  function toggleUser(id: Id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const result = addBloqueante({
      initiative_id: initiativeId,
      name,
      involucrados: selected,
      is_priority: isPriority,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    onAdded();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bloq-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-pae-surface p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="add-bloq-title"
            className="text-[16px] font-semibold text-pae-text"
          >
            Agregar bloqueante
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

        <div className="space-y-4">
          <label className="block">
            <span className="block text-[13px] font-medium text-pae-text-secondary">
              Nombre del bloqueante
            </span>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: API datos maestros no disponible"
              maxLength={200}
              className="mt-1.5 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[14px] text-pae-text focus:border-pae-blue focus:outline-none"
            />
          </label>

          <div>
            <span className="block text-[13px] font-medium text-pae-text-secondary">
              Involucrados
            </span>
            <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-pae-border bg-pae-bg p-2">
              {sortedUsers.length === 0 && (
                <p className="px-2 py-1 text-[12px] text-pae-text-tertiary">
                  No hay usuarios disponibles.
                </p>
              )}
              {sortedUsers.map((u) => {
                const checked = selected.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[12px] text-pae-text hover:bg-pae-surface"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUser(u.id)}
                      className="accent-pae-blue"
                    />
                    <span>{u.display_name}</span>
                  </label>
                );
              })}
            </div>
            {selected.length > 0 && (
              <p className="mt-1 text-[11px] text-pae-text-tertiary">
                {selected.length} seleccionado
                {selected.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="block text-[13px] font-medium text-pae-text-secondary">
              ¿Es prioridad?
            </legend>
            <div className="mt-1.5 flex gap-4">
              <label className="flex items-center gap-2 text-[13px] text-pae-text">
                <input
                  type="radio"
                  name="priority"
                  checked={isPriority}
                  onChange={() => setIsPriority(true)}
                  className="accent-pae-red"
                />
                Sí
              </label>
              <label className="flex items-center gap-2 text-[13px] text-pae-text">
                <input
                  type="radio"
                  name="priority"
                  checked={!isPriority}
                  onChange={() => setIsPriority(false)}
                  className="accent-pae-blue"
                />
                No
              </label>
            </div>
          </fieldset>
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
            disabled={submitting || !name.trim()}
            className="rounded-lg bg-pae-blue px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:bg-pae-blue/50"
          >
            {submitting ? "Agregando…" : "Agregar"}
          </button>
        </div>
      </form>
    </div>
  );
}
