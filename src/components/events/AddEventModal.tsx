"use client";

import { useEffect, useMemo, useState } from "react";

import type { Id, PortfolioEvent, PortfolioEventType, User } from "@/types";
import { createPortfolioEvent } from "@/lib/storage/events";
import { getAvailableUsers } from "@/lib/storage/auth";

interface InitiativeOption {
  id: Id;
  name: string;
}

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (event: PortfolioEvent) => void;
  initiatives: InitiativeOption[];
  defaultInitiativeId?: Id;
  /** If true, the initiative selector is hidden (used from the Events tab inside a specific initiative). */
  lockInitiative?: boolean;
}

const TYPE_OPTIONS: { value: PortfolioEventType; label: string }[] = [
  { value: "gate", label: "Gate" },
  { value: "sprint_review", label: "Sprint Review" },
  { value: "seg_q", label: "Seg. Q" },
  { value: "seg_mensual", label: "Seg. mensual" },
  { value: "ltp_plan", label: "LTP Plan" },
  { value: "entrega", label: "Entrega" },
  { value: "otro", label: "Otro" },
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AddEventModal({
  open,
  onClose,
  onCreated,
  initiatives,
  defaultInitiativeId,
  lockInitiative = false,
}: AddEventModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PortfolioEventType>("gate");
  const [customTypeLabel, setCustomTypeLabel] = useState("");
  const [initiativeId, setInitiativeId] = useState<Id | "">(
    defaultInitiativeId ?? "",
  );
  const [date, setDate] = useState(todayIso());
  const [invitedUserIds, setInvitedUserIds] = useState<Id[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setType("gate");
    setCustomTypeLabel("");
    setDate(todayIso());
    setInvitedUserIds([]);
    setError(null);
    setInitiativeId(defaultInitiativeId ?? "");
    const usersResult = getAvailableUsers();
    if (usersResult.success) setAllUsers(usersResult.data);
  }, [open, defaultInitiativeId]);

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
      [...allUsers].sort((a, b) => a.display_name.localeCompare(b.display_name)),
    [allUsers],
  );

  function toggleInvited(id: Id) {
    setInvitedUserIds((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!initiativeId) {
      setError("Seleccioná una iniciativa");
      return;
    }
    setSubmitting(true);
    const result = createPortfolioEvent({
      name: name.trim(),
      type,
      custom_type_label: type === "otro" ? customTypeLabel.trim() : null,
      initiative_id: initiativeId,
      date,
      invited_user_ids: invitedUserIds,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    onCreated(result.data);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-event-title"
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
            id="add-event-title"
            className="text-[14px] font-semibold text-pae-text"
          >
            Agregar evento
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-[14px] text-pae-text-tertiary hover:bg-pae-bg hover:text-pae-text"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-[11px] font-medium text-pae-text-secondary">
              Nombre del evento
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Gate 1 · Optimización de pozo"
              className="mt-1.5 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[12px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-medium text-pae-text-secondary">
              Tipo
            </span>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as PortfolioEventType)
              }
              className="mt-1.5 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[12px] text-pae-text focus:border-pae-blue focus:outline-none"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {type === "otro" && (
            <label className="block">
              <span className="block text-[11px] font-medium text-pae-text-secondary">
                Describí el tipo
              </span>
              <input
                type="text"
                required
                value={customTypeLabel}
                onChange={(e) => setCustomTypeLabel(e.target.value)}
                placeholder="Ej: Workshop con proveedor"
                className="mt-1.5 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[12px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none"
              />
            </label>
          )}

          {!lockInitiative && (
            <label className="block">
              <span className="block text-[11px] font-medium text-pae-text-secondary">
                Iniciativa
              </span>
              <select
                required
                value={initiativeId}
                onChange={(e) => setInitiativeId(e.target.value as Id)}
                className="mt-1.5 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[12px] text-pae-text focus:border-pae-blue focus:outline-none"
              >
                <option value="">— Seleccioná una iniciativa —</option>
                {initiatives.map((ini) => (
                  <option key={ini.id} value={ini.id}>
                    {ini.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="block text-[11px] font-medium text-pae-text-secondary">
              Fecha
            </span>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[12px] text-pae-text focus:border-pae-blue focus:outline-none"
            />
          </label>

          <div>
            <span className="block text-[11px] font-medium text-pae-text-secondary">
              Invitados ({invitedUserIds.length} seleccionados)
            </span>
            <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-pae-border bg-pae-bg p-2">
              {sortedUsers.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-pae-text-tertiary">
                  No hay usuarios disponibles.
                </p>
              ) : (
                <ul className="space-y-1">
                  {sortedUsers.map((u) => {
                    const checked = invitedUserIds.includes(u.id);
                    return (
                      <li key={u.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[11px] hover:bg-pae-surface">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleInvited(u.id)}
                            className="h-3.5 w-3.5 accent-pae-blue"
                          />
                          <span className="text-pae-text">
                            {u.display_name}
                          </span>
                          <span className="text-pae-text-tertiary">
                            · {u.job_title}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-pae-red/10 px-3 py-2 text-[11px] text-pae-red">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-pae-border bg-pae-surface px-3 py-2 text-[12px] font-medium text-pae-text-secondary hover:bg-pae-bg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-pae-blue px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:bg-pae-blue/50"
          >
            {submitting ? "Guardando…" : "Guardar"}
          </button>
        </div>

        <p className="mt-3 text-[9px] text-pae-text-tertiary">
          Se agrega a la lista de próximos eventos del dashboard y al tab
          Eventos de la iniciativa.
        </p>
      </form>
    </div>
  );
}
