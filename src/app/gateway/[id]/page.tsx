"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import type {
  FormDefinition,
  FormFieldValue,
  GatewayStatus,
  GatewayVoteValue,
  User,
} from "@/types";
import {
  cancelPendingDecision,
  enqueuePendingDecision,
  flushExpiredDecisions,
  getGatewayFullDetail,
  getGatewayMinuta,
  getGatewayRevision,
  getPendingDecision,
  submitVote,
  type GatewayFullDetail,
  type GatewayMinutaDetail,
  type PendingDecision,
} from "@/lib/storage/gateways";
import { getForm } from "@/lib/storage/forms";
import { getCurrentUser, getAvailableUsers } from "@/lib/storage/auth";
import { addTeamMember } from "@/lib/storage/team";

import { VotersPanel } from "./VotersPanel";
import { ReadOnlySections } from "./ReadOnlySections";
import { FeedbackDocsPanel } from "./FeedbackDocsPanel";
import { DecisionConfirmPopup } from "./DecisionConfirmPopup";
import { MinutaPanel } from "./MinutaPanel";
import { VFPanel } from "./VFPanel";
import {
  buildSyntheticFormDefinition,
  normalizeResponsesForSections,
} from "./form_definition_bridge";
import { DocumentPreviewModal } from "@/app/(app)/iniciativas/[id]/documentos/DocumentPreviewModal";
import type { DocFileNode, DocFileSource } from "@/lib/storage/documents";
import { listFormSnapshots } from "@/lib/storage/form_snapshots";

const STATUS_PILL: Record<GatewayStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-pae-amber/15", text: "text-pae-amber", label: "Esperando votos" },
  approved: { bg: "bg-pae-green/15", text: "text-pae-green", label: "Aprobado" },
  approved_with_changes: {
    bg: "bg-pae-green/15",
    text: "text-pae-green",
    label: "Aprobado con cambios",
  },
  feedback: { bg: "bg-pae-blue/15", text: "text-pae-blue", label: "Necesita cambios" },
  pause: { bg: "bg-pae-amber/15", text: "text-pae-amber", label: "On hold" },
  reject: { bg: "bg-pae-red/15", text: "text-pae-red", label: "Rechazado" },
  area_change: {
    bg: "bg-pae-text-tertiary/15",
    text: "text-pae-text-secondary",
    label: "Cambio de área",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

interface DecisionDef {
  vote: GatewayVoteValue;
  label: string;
  description: string;
  className: string;
}

const DECISIONS: DecisionDef[] = [
  {
    vote: "approved",
    label: "Aprobar sin cambios",
    description: "Se aprueba el gateway y la iniciativa avanza a la siguiente etapa.",
    className: "bg-pae-green hover:bg-pae-green/90",
  },
  {
    vote: "approved_with_changes",
    label: "Aprobar con cambios",
    description:
      "Se aprueba, pero el PO debe incorporar los cambios acordados (minuta + feedback) en la VF.",
    className: "bg-pae-green/80 hover:bg-pae-green",
  },
  {
    vote: "feedback",
    label: "Necesita cambios",
    description:
      "El PO arma una nueva versión y se genera un nuevo gateway para la misma etapa.",
    className: "bg-pae-blue hover:bg-pae-blue/90",
  },
  {
    vote: "pause",
    label: "On hold",
    description:
      "La iniciativa queda en espera. Sponsor o AT pueden reactivarla más adelante.",
    className: "bg-pae-amber hover:bg-pae-amber/90",
  },
  {
    vote: "reject",
    label: "Rechazar",
    description: "La iniciativa queda cerrada en el log como rechazada.",
    className: "bg-pae-red hover:bg-pae-red/90",
  },
];

type DownloadKind = "raw_xlsx" | "form_pdf" | "pptx" | "press";
const DOWNLOADS: { kind: DownloadKind; label: string; icon: string }[] = [
  { kind: "raw_xlsx", label: "Formulario raw data (xlsx)", icon: "📋" },
  { kind: "form_pdf", label: "Formulario (pdf)", icon: "📄" },
  { kind: "pptx", label: "PPTX estándar", icon: "📊" },
  { kind: "press", label: "Nota de prensa", icon: "📝" },
];

export default function GatewayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [detail, setDetail] = useState<GatewayFullDetail | null>(null);
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [responses, setResponses] = useState<Record<string, FormFieldValue>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(
    null,
  );
  const [minutaDetail, setMinutaDetail] = useState<GatewayMinutaDetail | null>(
    null,
  );
  const [revisionNumber, setRevisionNumber] = useState(1);
  const [previewFile, setPreviewFile] = useState<DocFileNode | null>(null);

  const reload = useCallback(() => setReloadTick((x) => x + 1), []);

  useEffect(() => {
    flushExpiredDecisions(id);

    const u = getCurrentUser();
    setCurrentUser(u.success ? u.data : null);

    const res = getGatewayFullDetail(id);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setDetail(res.data);
    const formRes = getForm(res.data.form.id);
    if (formRes.success) {
      // Si el store no trae la definición (caso típico en Fase 2-4 donde las
      // definiciones viven en módulos TS y no en form_definitions), sintetizamos
      // una mínima desde las WizardSection correspondientes al form_type.
      const storeDef = formRes.data.definition;
      const finalDef =
        storeDef ??
        buildSyntheticFormDefinition(
          formRes.data.form.form_type,
          formRes.data.form.id,
          formRes.data.form.version,
        );
      setDefinition(finalDef);
      // Normalizamos las respuestas para que cada section.key tenga el blob
      // agregado correspondiente, aún cuando el seed use keys alternativas
      // (ej. F3 con `descripcion_mvp` dentro de `seccion_6_mvp`).
      setResponses(
        normalizeResponsesForSections(
          formRes.data.form.form_type,
          formRes.data.responses,
        ),
      );
    }
    const pend = getPendingDecision(id);
    setPendingDecision(pend.success ? pend.data : null);

    const m = getGatewayMinuta(id);
    setMinutaDetail(m.success ? m.data : null);

    const rev = getGatewayRevision(id);
    setRevisionNumber(rev.success ? rev.data.revision_number : 1);
  }, [id, reloadTick]);

  const startDecision = useCallback(
    (vote: GatewayVoteValue) => {
      if (!detail) return;
      setError(null);
      const res = enqueuePendingDecision(detail.gateway.id, vote, null);
      if (!res.success) {
        setError(res.error.message);
        return;
      }
      setPendingDecision(res.data);
    },
    [detail],
  );

  const handleUndoDecision = useCallback(() => {
    if (!detail) return;
    cancelPendingDecision(detail.gateway.id);
    setPendingDecision(null);
  }, [detail]);

  const handleOpenDownload = useCallback(
    (kind: DownloadKind) => {
      if (!detail) return;
      // Para XLSX y PDF: buscamos el último snapshot "submitted" (PRE-GATEWAY)
      // del formulario y armamos un DocFileNode que consume el preview modal.
      if (kind === "raw_xlsx" || kind === "form_pdf") {
        const format = kind === "raw_xlsx" ? "xlsx" : "pdf";
        const snapsRes = listFormSnapshots(detail.form.id);
        const snaps = snapsRes.success ? snapsRes.data : [];
        const submitted = [...snaps]
          .reverse()
          .find((s) => s.snapshot_type === "submitted");
        const formId = detail.form.id;

        const source: DocFileSource = submitted
          ? {
              kind: "form_snapshot",
              form_id: formId,
              snapshot_id: submitted.id,
              snapshot_type: "submitted",
              format,
            }
          : { kind: "form_current", form_id: formId, format };

        const nameBase =
          kind === "raw_xlsx"
            ? `${detail.form.form_type}_formulario_raw_data`
            : `${detail.form.form_type}_formulario`;
        const fileNode: DocFileNode = {
          kind: "file",
          id: `gw-${kind}-${formId}`,
          name: `${nameBase}.${format}`,
          icon: format === "xlsx" ? "📋" : "📄",
          origin: "auto",
          created_at:
            submitted?.created_at ??
            detail.form.submitted_at ??
            detail.form.updated_at,
          author_name: detail.promotor_name,
          can_regenerate: true,
          source,
        };
        setPreviewFile(fileNode);
        return;
      }
      alert(
        kind === "pptx"
          ? "Generación de PPTX pendiente."
          : "Generación de nota de prensa pendiente.",
      );
    },
    [detail],
  );

  const handleApplyDecision = useCallback(() => {
    if (!detail || !pendingDecision) return;
    cancelPendingDecision(detail.gateway.id);
    const res = submitVote(
      detail.gateway.id,
      pendingDecision.vote,
      pendingDecision.feedback_text,
    );
    setPendingDecision(null);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    reload();
  }, [detail, pendingDecision, reload]);

  if (error && !detail) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/aprobaciones"
          className="text-[11px] font-medium text-pae-blue hover:underline"
        >
          ← Aprobaciones pendientes
        </Link>
        <p className="mt-6 text-[12px] text-pae-red">{error}</p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-[11px] text-pae-text-tertiary">Cargando gateway...</p>
      </main>
    );
  }

  const pill = STATUS_PILL[detail.gateway.status];
  const isPending = detail.gateway.status === "pending";
  const canVote =
    isPending && detail.current_user_is_approver && !detail.current_user_vote;
  const gatewayResolved = !isPending;
  const pendingDecisionDef = pendingDecision
    ? DECISIONS.find((d) => d.vote === pendingDecision.vote) ?? null
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href="/aprobaciones"
        className="text-[11px] font-medium text-pae-blue hover:underline"
      >
        ← Aprobaciones pendientes
      </Link>

      <div className="mt-4 rounded-[10px] border border-pae-red/20 bg-pae-red/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-pae-red">
              Gateway {detail.gateway.gateway_number}
              {revisionNumber > 1 ? ` · Revisión ${revisionNumber}` : ""} —{" "}
              {detail.form.form_type}
            </p>
            <h1 className="mt-1 text-[20px] font-semibold text-pae-text">
              {detail.initiative.name}
            </h1>
            <p className="mt-2 text-[11px] text-pae-text-secondary">
              Promotor: {detail.promotor_name ?? "—"} · LD:{" "}
              {detail.ld_name ?? "—"} · Dim: {detail.dimension ?? "—"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-medium ${pill.bg} ${pill.text}`}
            >
              {pill.label}
            </span>
            <p className="text-[11px] text-pae-text-secondary">
              Enviado: {formatDate(detail.form.submitted_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <VotersPanel
          gatewayId={detail.gateway.id}
          gatewayNumber={detail.gateway.gateway_number}
          approvers={detail.approvers}
          votesReceived={detail.votes_received}
          votesTotal={detail.votes_total}
          canManageApprovers={detail.current_user_can_manage_approvers}
          canReload={reload}
        />
      </div>

      <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
        <p className="text-[13px] font-semibold text-pae-text">
          Documentos del formulario
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DOWNLOADS.map((d) => (
            <button
              key={d.kind}
              type="button"
              onClick={() => handleOpenDownload(d.kind)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text-secondary transition hover:bg-pae-surface"
            >
              {d.icon} {d.label}
            </button>
          ))}
        </div>

        <FeedbackDocsPanel
          gatewayId={detail.gateway.id}
          currentUserId={currentUser?.id ?? null}
          gatewayResolved={gatewayResolved}
        />
      </div>

      <div className="mt-6">
        <p className="mb-3 text-[13px] font-semibold text-pae-text">
          Formulario {detail.form.form_type} (read-only)
        </p>
        <ReadOnlySections
          gatewayId={detail.gateway.id}
          definition={definition}
          responses={responses}
          currentUserId={currentUser?.id ?? null}
          inputDisabled={!!pendingDecision || gatewayResolved}
        />
      </div>

      {isPending ? (
        <DecisionPanel
          canVote={canVote}
          alreadyVoted={!!detail.current_user_vote}
          currentVote={detail.current_user_vote}
          hasPendingDecision={!!pendingDecision}
          error={error}
          onVote={startDecision}
        />
      ) : (
        <PostGatewayPanel detail={detail} onActionDone={reload} />
      )}

      {/* Minuta: solo visible post-gateway */}
      {gatewayResolved && minutaDetail && (
        <MinutaPanel
          gatewayId={detail.gateway.id}
          detail={minutaDetail}
          onSaved={reload}
        />
      )}

      {/* VF + reenvío: solo si aprobaron con cambios o pidieron cambios */}
      {gatewayResolved &&
        (detail.gateway.status === "approved_with_changes" ||
          detail.gateway.status === "feedback") && (
          <VFPanel
            gatewayId={detail.gateway.id}
            formId={detail.form.id}
            initiativeId={detail.initiative.id}
            currentUserId={currentUser?.id ?? null}
            onResubmitted={reload}
          />
        )}

      {pendingDecision && pendingDecisionDef && (
        <DecisionConfirmPopup
          vote={pendingDecision.vote}
          label={pendingDecisionDef.label}
          description={pendingDecisionDef.description}
          totalSeconds={pendingDecision.seconds_remaining}
          onUndo={handleUndoDecision}
          onTimeout={handleApplyDecision}
        />
      )}

      {previewFile && (
        <DocumentPreviewModal
          file={previewFile}
          initiativeName={detail.initiative.name}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </main>
  );
}

function DecisionPanel({
  canVote,
  alreadyVoted,
  currentVote,
  hasPendingDecision,
  error,
  onVote,
}: {
  canVote: boolean;
  alreadyVoted: boolean;
  currentVote: GatewayVoteValue | null;
  hasPendingDecision: boolean;
  error: string | null;
  onVote: (v: GatewayVoteValue) => void;
}) {
  return (
    <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <p className="text-[13px] font-semibold text-pae-text">Tu decisión</p>
      <p className="mt-1 text-[10px] text-pae-text-secondary">
        Unanimidad entre aprobadores requeridos. Prioridad: Rechazar › On hold ›
        Necesita cambios › Aprobar con cambios › Aprobar sin cambios.
      </p>

      {alreadyVoted && !hasPendingDecision && (
        <div className="mt-3 rounded-md bg-pae-blue/10 px-3 py-2 text-[11px] text-pae-blue">
          Ya emitiste tu voto ({currentVote}). No podés votar de nuevo salvo
          que se reinicie la ronda.
        </div>
      )}

      {!canVote && !alreadyVoted && !hasPendingDecision && (
        <div className="mt-3 rounded-md bg-pae-bg px-3 py-2 text-[11px] text-pae-text-secondary">
          No sos aprobador de este gateway.
        </div>
      )}

      {hasPendingDecision && (
        <div className="mt-3 rounded-md bg-pae-amber/10 px-3 py-2 text-[11px] text-pae-amber">
          Tenés una decisión pendiente. Esperá el popup de confirmación.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {DECISIONS.map((b) => (
          <button
            key={b.vote}
            type="button"
            disabled={!canVote || hasPendingDecision}
            onClick={() => onVote(b.vote)}
            className={`inline-flex h-9 items-center rounded-md px-4 text-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${b.className}`}
            title={b.description}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-[11px] text-pae-red">{error}</p>}
    </div>
  );
}

function PostGatewayPanel({
  detail,
  onActionDone,
}: {
  detail: GatewayFullDetail;
  onActionDone: () => void;
}) {
  const [openPopup, setOpenPopup] = useState<"role" | "stakeholder" | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("po");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  useEffect(() => {
    const res = getAvailableUsers();
    if (res.success) setUsers(res.data);
  }, []);

  function handleAssign(role: "po" | "ld" | "equipo" | "sm") {
    if (!selectedUser) {
      setActionErr("Seleccioná una persona");
      return;
    }
    const result = addTeamMember({
      initiative_id: detail.initiative.id,
      user_id: selectedUser,
      role,
    });
    if (!result.success) {
      setActionErr(result.error.message);
      return;
    }
    setActionMsg("Asignación realizada");
    setActionErr(null);
    setOpenPopup(null);
    setSelectedUser("");
    onActionDone();
  }

  return (
    <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <p className="text-[13px] font-semibold text-pae-text">Acciones post-gateway</p>
      <p className="mt-1 text-[10px] text-pae-text-secondary">
        Gateway resuelto. Asigná roles de la siguiente etapa. La minuta y el
        VF tienen paneles propios debajo.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setOpenPopup("role");
            setSelectedRole("po");
          }}
          className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text transition hover:bg-pae-surface"
        >
          Asignar rol
        </button>
        <button
          type="button"
          onClick={() => {
            setOpenPopup("stakeholder");
            setSelectedRole("equipo");
          }}
          className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text transition hover:bg-pae-surface"
        >
          Stakeholders
        </button>
      </div>

      {actionMsg && (
        <p className="mt-3 text-[11px] text-pae-green">{actionMsg}</p>
      )}
      {actionErr && (
        <p className="mt-3 text-[11px] text-pae-red">{actionErr}</p>
      )}

      {openPopup && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4"
          onClick={() => setOpenPopup(null)}
        >
          <div
            className="w-full max-w-md rounded-[10px] bg-pae-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[14px] font-semibold text-pae-text">
              {openPopup === "role" ? "Asignar rol" : "Agregar stakeholder"}
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
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name} — {u.job_title}
                    </option>
                  ))}
                </select>
              </div>
              {openPopup === "role" && (
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                    Rol
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-1 w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text"
                  >
                    <option value="po">Product Owner</option>
                    <option value="ld">Líder de Dimensión</option>
                    <option value="sm">Scrum Master</option>
                  </select>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenPopup(null)}
                className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-surface px-3 text-[11px] font-medium text-pae-text-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAssign(
                    openPopup === "role"
                      ? (selectedRole as "po" | "ld" | "sm")
                      : "equipo",
                  )
                }
                className="inline-flex h-8 items-center rounded-md bg-pae-blue px-3 text-[11px] font-semibold text-white hover:bg-pae-blue/90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

