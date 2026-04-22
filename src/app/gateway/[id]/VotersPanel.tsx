"use client";

import { useEffect, useMemo, useState } from "react";

import type { GatewayApprover } from "@/lib/storage/gateways";
import {
  addExtraApprover,
  removeExtraApprover,
} from "@/lib/storage/gateways";
import { getAvailableUsers } from "@/lib/storage/auth";
import type { User } from "@/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function approverVisual(a: GatewayApprover): {
  bg: string;
  text: string;
  icon: string;
  caption: string;
  captionColor: string;
} {
  if (a.vote === "approved") {
    return {
      bg: "bg-pae-green/15",
      text: "text-pae-green",
      icon: "✓",
      caption: "Aprobado",
      captionColor: "text-pae-green",
    };
  }
  if (a.vote === "approved_with_changes") {
    return {
      bg: "bg-pae-green/15",
      text: "text-pae-green",
      icon: "✓±",
      caption: "Aprob. c/ camb.",
      captionColor: "text-pae-green",
    };
  }
  if (a.vote === "reject") {
    return {
      bg: "bg-pae-red/15",
      text: "text-pae-red",
      icon: "✕",
      caption: "Rechazado",
      captionColor: "text-pae-red",
    };
  }
  if (a.vote === "feedback") {
    return {
      bg: "bg-pae-blue/15",
      text: "text-pae-blue",
      icon: "💬",
      caption: "Nec. cambios",
      captionColor: "text-pae-blue",
    };
  }
  if (a.vote === "pause") {
    return {
      bg: "bg-pae-amber/20",
      text: "text-pae-amber",
      icon: "⏸",
      caption: "On hold",
      captionColor: "text-pae-amber",
    };
  }
  if (a.vote === "area_change") {
    return {
      bg: "bg-pae-text-tertiary/20",
      text: "text-pae-text-secondary",
      icon: "↔",
      caption: "Cambio área",
      captionColor: "text-pae-text-secondary",
    };
  }
  if (a.is_current_user) {
    return {
      bg: "bg-pae-red/15",
      text: "text-pae-red",
      icon: initials(a.display_name),
      caption: "Tu voto pend.",
      captionColor: "text-pae-red",
    };
  }
  return {
    bg: "bg-pae-amber/20",
    text: "text-pae-amber",
    icon: "⏳",
    caption: "Pendiente",
    captionColor: "text-pae-amber",
  };
}

interface VotersPanelProps {
  gatewayId: string;
  gatewayNumber: number;
  approvers: GatewayApprover[];
  votesReceived: number;
  votesTotal: number;
  canManageApprovers: boolean;
  canReload: () => void;
}

export function VotersPanel({
  gatewayId,
  gatewayNumber,
  approvers,
  votesReceived,
  votesTotal,
  canManageApprovers,
  canReload,
}: VotersPanelProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [required, setRequired] = useState<"required" | "optional">("required");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showPopup) return;
    const res = getAvailableUsers();
    if (res.success) setUsers(res.data);
  }, [showPopup]);

  const existingIds = useMemo(
    () => new Set(approvers.map((a) => a.user_id)),
    [approvers],
  );
  const assignable = useMemo(
    () => users.filter((u) => !existingIds.has(u.id)),
    [users, existingIds],
  );

  function handleAdd() {
    if (!selectedUser) {
      setError("Elegí una persona");
      return;
    }
    const res = addExtraApprover(
      gatewayId,
      selectedUser,
      required === "required",
    );
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setShowPopup(false);
    setSelectedUser("");
    setRequired("required");
    setError(null);
    canReload();
  }

  function handleRemove(userId: string) {
    if (!confirm("¿Sacar a este aprobador adicional?")) return;
    const res = removeExtraApprover(gatewayId, userId);
    if (!res.success) {
      alert(res.error.message);
      return;
    }
    canReload();
  }

  // Clamp defensivo — nunca mostrar "4 de 3".
  const displayReceived = Math.max(
    0,
    Math.min(votesReceived, Math.max(votesTotal, 1)),
  );

  return (
    <div className="rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold text-pae-text">
          Panel de votos — Unanimidad requerida
        </p>
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-pae-text-secondary">
            {displayReceived} de {votesTotal} votos recibidos
          </p>
          {canManageApprovers && (
            <button
              type="button"
              onClick={() => setShowPopup(true)}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-pae-blue/40 bg-pae-blue/5 px-2.5 text-[10px] font-semibold text-pae-blue transition hover:bg-pae-blue/10"
            >
              + Agregar aprobadores
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-6">
        {approvers.length === 0 ? (
          <p className="text-[11px] text-pae-text-tertiary">
            No hay aprobadores asignados.
          </p>
        ) : (
          approvers.map((a) => {
            const v = approverVisual(a);
            return (
              <div
                key={a.user_id}
                className="group relative flex w-[110px] flex-col items-center text-center"
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold ${v.bg} ${v.text}`}
                >
                  {v.icon}
                </div>
                {a.is_additional && (
                  <span
                    className={`mt-1 inline-flex h-4 items-center rounded-full px-1.5 text-[8px] font-semibold uppercase tracking-wide ${
                      a.is_required
                        ? "bg-pae-blue/10 text-pae-blue"
                        : "bg-pae-text-tertiary/15 text-pae-text-secondary"
                    }`}
                  >
                    {a.is_required ? "Extra obl." : "Extra opc."}
                  </span>
                )}
                <p className="mt-1 text-[11px] font-medium text-pae-text truncate max-w-[110px]">
                  {a.display_name}
                </p>
                <p className="text-[9px] text-pae-text-tertiary">
                  {a.role_label}
                </p>
                <p className={`mt-1 text-[9px] font-semibold ${v.captionColor}`}>
                  {v.caption}
                </p>
                {a.is_additional && canManageApprovers && (
                  <button
                    type="button"
                    onClick={() => handleRemove(a.user_id)}
                    className="absolute -right-1 -top-1 hidden h-5 w-5 place-items-center rounded-full bg-pae-red/90 text-[10px] text-white group-hover:grid"
                    title="Sacar aprobador"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {showPopup && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="w-full max-w-md rounded-[10px] bg-pae-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[14px] font-semibold text-pae-text">
              Agregar aprobador al Gateway {gatewayNumber}
            </p>
            <p className="mt-1 text-[10px] text-pae-text-tertiary">
              Se notifica a la persona. Obligatorio suma al total para
              unanimidad; opcional puede votar pero no bloquea.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                  Persona
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                >
                  <option value="">Seleccionar...</option>
                  {assignable.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name} — {u.job_title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                  Tipo de voto
                </label>
                <div className="mt-2 flex gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-pae-text">
                    <input
                      type="radio"
                      name="required"
                      value="required"
                      checked={required === "required"}
                      onChange={() => setRequired("required")}
                    />
                    Obligatorio (cuenta para unanimidad)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-pae-text">
                    <input
                      type="radio"
                      name="required"
                      value="optional"
                      checked={required === "optional"}
                      onChange={() => setRequired("optional")}
                    />
                    Opcional (puede votar sin bloquear)
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-[11px] text-pae-red">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-surface px-3 text-[11px] font-medium text-pae-text-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex h-8 items-center rounded-md bg-pae-blue px-3 text-[11px] font-semibold text-white hover:bg-pae-blue/90"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
