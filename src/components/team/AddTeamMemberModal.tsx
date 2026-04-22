"use client";

import { useEffect, useMemo, useState } from "react";

import type { Id, InitiativeMemberRole, User } from "@/types";
import { getAvailableUsers } from "@/lib/storage/auth";
import { addTeamMember } from "@/lib/storage/team";

interface AddTeamMemberModalProps {
  open: boolean;
  initiativeId: Id;
  /** User ids that already have the selected role — filtered out of the dropdown */
  excludedUserIdsByRole: Partial<Record<InitiativeMemberRole, Id[]>>;
  onClose: () => void;
  onAdded: () => void;
}

const ROLE_OPTIONS: { value: InitiativeMemberRole; label: string }[] = [
  { value: "equipo", label: "Equipo de trabajo" },
  { value: "sm", label: "Scrum Master" },
  { value: "po", label: "Product Owner" },
  { value: "ld", label: "Líder de Dimensión" },
  { value: "promotor", label: "Promotor" },
];

export function AddTeamMemberModal({
  open,
  initiativeId,
  excludedUserIdsByRole,
  onClose,
  onAdded,
}: AddTeamMemberModalProps) {
  const [role, setRole] = useState<InitiativeMemberRole>("equipo");
  const [userId, setUserId] = useState<Id | "">("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRole("equipo");
    setUserId("");
    setError(null);
    const result = getAvailableUsers();
    if (result.success) setAllUsers(result.data);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const options = useMemo(() => {
    const excluded = new Set(excludedUserIdsByRole[role] ?? []);
    return [...allUsers]
      .filter((u) => !excluded.has(u.id))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [allUsers, excludedUserIdsByRole, role]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!userId) {
      setError("Seleccioná una persona");
      return;
    }
    setSubmitting(true);
    const result = addTeamMember({
      initiative_id: initiativeId,
      user_id: userId,
      role,
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
      aria-labelledby="add-team-title"
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
            id="add-team-title"
            className="text-[16px] font-semibold text-pae-text"
          >
            Agregar al equipo
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
              Rol
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as InitiativeMemberRole);
                setUserId("");
              }}
              className="mt-1.5 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[14px] text-pae-text focus:border-pae-blue focus:outline-none"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[13px] font-medium text-pae-text-secondary">
              Persona
            </span>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value as Id)}
              className="mt-1.5 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[14px] text-pae-text focus:border-pae-blue focus:outline-none"
            >
              <option value="">— Seleccioná una persona —</option>
              {options.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name} · {u.job_title}
                </option>
              ))}
            </select>
            {options.length === 0 && (
              <p className="mt-1.5 text-[11px] text-pae-text-tertiary">
                No hay personas disponibles para ese rol en esta iniciativa.
              </p>
            )}
          </label>

          <p className="rounded-lg bg-pae-bg/70 px-3 py-2 text-[11px] text-pae-text-secondary">
            % asignación e Interno/Externo se completan automáticamente. En
            Fase 5 van a ser editables.
          </p>
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
            disabled={submitting || options.length === 0}
            className="rounded-lg bg-pae-blue px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:bg-pae-blue/50"
          >
            {submitting ? "Agregando…" : "Agregar"}
          </button>
        </div>
      </form>
    </div>
  );
}
