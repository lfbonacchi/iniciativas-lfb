"use client";

import Link from "next/link";

import type { GatewayStatus, GatewayNumber, InitiativeStage, FormType } from "@/types";
import type { GatewayListItem } from "@/lib/storage/gateways";

const STAGE_BY_FORM: Record<FormType, InitiativeStage | null> = {
  F1: "proposal",
  F2: "dimensioning",
  F3: "mvp",
  F4: null,
  F5: null,
};

const STAGE_LABEL: Record<InitiativeStage, string> = {
  proposal: "Propuesta",
  dimensioning: "Dimensionamiento",
  mvp: "MVP",
  ltp_tracking: "Delivery",
};

const STAGE_CHIP: Record<InitiativeStage, { bg: string; text: string }> = {
  proposal: { bg: "bg-pae-blue/15", text: "text-pae-blue" },
  dimensioning: { bg: "bg-pae-blue/15", text: "text-pae-blue" },
  mvp: { bg: "bg-pae-green/15", text: "text-pae-green" },
  ltp_tracking: { bg: "bg-pae-green/15", text: "text-pae-green" },
};

const STAGE_TOOLTIP: Record<InitiativeStage, string> = {
  proposal: "Etapa 1 de 4 — Propuesta",
  dimensioning: "Etapa 2 de 4 — Dimensionamiento",
  mvp: "Etapa 3 de 4 — MVP",
  ltp_tracking: "Etapa 4 de 4 — Delivery",
};

const STATUS_LABEL: Record<GatewayStatus, string> = {
  pending: "Esperando votos",
  approved: "Aprobado",
  approved_with_changes: "Aprobado c/ cambios",
  feedback: "Necesita cambios",
  pause: "On hold",
  reject: "Rechazado",
  area_change: "Cambio de área",
};

const STATUS_CHIP: Record<GatewayStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-pae-amber/15", text: "text-pae-amber-dark" },
  approved: { bg: "bg-pae-green/15", text: "text-pae-green" },
  approved_with_changes: { bg: "bg-pae-green/15", text: "text-pae-green" },
  feedback: { bg: "bg-pae-blue/15", text: "text-pae-blue" },
  pause: { bg: "bg-pae-amber/15", text: "text-pae-amber-dark" },
  reject: { bg: "bg-pae-red/15", text: "text-pae-red" },
  area_change: { bg: "bg-pae-text-tertiary/15", text: "text-pae-text-secondary" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

export function GatewayCard({
  item,
  highlightPending = false,
}: {
  item: GatewayListItem;
  highlightPending?: boolean;
}) {
  const stage = STAGE_BY_FORM[item.form_type];
  const stageChip = stage ? STAGE_CHIP[stage] : null;
  const stageLabel = stage ? STAGE_LABEL[stage] : item.form_type;
  const showPending =
    highlightPending && item.user_is_approver && !item.user_has_voted && item.gateway.status === "pending";
  const statusChip = STATUS_CHIP[item.gateway.status];

  return (
    <div className="card-initiative relative flex items-center gap-4 border border-pae-border p-4 pl-5">
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-pae-red"
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
          Gateway {item.gateway.gateway_number as GatewayNumber}
        </p>
        <p className="mt-0.5 text-[14px] font-medium text-pae-text truncate">
          {item.initiative.name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {stageChip && stage && (
            <span
              title={STAGE_TOOLTIP[stage]}
              className={`pill-interactive ${stageChip.bg} ${stageChip.text}`}
            >
              {stageLabel}
            </span>
          )}
          <span
            title={`Estado del gateway: ${STATUS_LABEL[item.gateway.status]}`}
            className={`pill-interactive ${statusChip.bg} ${statusChip.text}`}
          >
            {STATUS_LABEL[item.gateway.status]}
          </span>
        </div>
        <p className="mt-2 text-[10px] text-pae-text-secondary">
          Promotor: {item.promotor_name ?? "—"} · Enviado: {formatDate(item.submitted_at)} ·{" "}
          {item.votes_received} de {item.votes_total} votos
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {showPending && (
          <span className="text-[10px] font-semibold text-pae-red">
            Tu voto pendiente
          </span>
        )}
        <Link
          href={`/gateway/${item.gateway.id}`}
          className="inline-flex h-7 items-center rounded-md bg-pae-red px-3 text-[11px] font-semibold text-white transition hover:bg-pae-red/90"
        >
          Ir al Gateway
        </Link>
      </div>
    </div>
  );
}
