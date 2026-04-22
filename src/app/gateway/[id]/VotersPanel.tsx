"use client";

import type { GatewayApprover } from "@/lib/storage/gateways";

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
      caption: "Feedback",
      captionColor: "text-pae-blue",
    };
  }
  if (a.vote === "pause") {
    return {
      bg: "bg-pae-amber/20",
      text: "text-pae-amber",
      icon: "⏸",
      caption: "Pausa",
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

export function VotersPanel({
  approvers,
  votesReceived,
  votesTotal,
}: {
  approvers: GatewayApprover[];
  votesReceived: number;
  votesTotal: number;
}) {
  return (
    <div className="rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-semibold text-pae-text">
          Panel de votos — Unanimidad requerida
        </p>
        <p className="text-[11px] text-pae-text-secondary">
          {votesReceived} de {votesTotal} votos recibidos
        </p>
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
                className="flex w-[110px] flex-col items-center text-center"
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold ${v.bg} ${v.text}`}
                >
                  {v.icon}
                </div>
                <p className="mt-2 text-[11px] font-medium text-pae-text truncate max-w-[110px]">
                  {a.display_name}
                </p>
                <p className="text-[9px] text-pae-text-tertiary">{a.role_label}</p>
                <p className={`mt-1 text-[9px] font-semibold ${v.captionColor}`}>
                  {v.caption}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
