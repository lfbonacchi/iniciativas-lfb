"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";

import type {
  FormDefinition,
  FormFieldValue,
  GatewayStatus,
  GatewayVoteValue,
  User,
} from "@/types";
import {
  generateMinuta,
  getGatewayFullDetail,
  submitVote,
  type GatewayFullDetail,
} from "@/lib/storage/gateways";
import { getForm } from "@/lib/storage/forms";
import { getCurrentUser, getAvailableUsers } from "@/lib/storage/auth";
import { addTeamMember } from "@/lib/storage/team";

import { VotersPanel } from "./VotersPanel";
import { ReadOnlySections } from "./ReadOnlySections";

const STATUS_PILL: Record<GatewayStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-pae-amber/15", text: "text-pae-amber", label: "Esperando votos" },
  approved: { bg: "bg-pae-green/15", text: "text-pae-green", label: "Aprobado" },
  feedback: { bg: "bg-pae-blue/15", text: "text-pae-blue", label: "Con feedback" },
  pause: { bg: "bg-pae-amber/15", text: "text-pae-amber", label: "Pausado" },
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

const DECISION_BUTTONS: {
  vote: GatewayVoteValue;
  label: string;
  className: string;
}[] = [
  { vote: "approved", label: "Aprobar", className: "bg-pae-green hover:bg-pae-green/90" },
  { vote: "feedback", label: "Feedback", className: "bg-pae-blue hover:bg-pae-blue/90" },
  { vote: "pause", label: "Pausa", className: "bg-pae-amber hover:bg-pae-amber/90" },
  { vote: "reject", label: "Rechazar", className: "bg-pae-red hover:bg-pae-red/90" },
  {
    vote: "area_change",
    label: "Cambio de área",
    className: "bg-pae-text-secondary hover:bg-pae-text-secondary/90",
  },
];

type DownloadKind = "pptx" | "pdf" | "xlsx" | "press";
const DOWNLOADS: { kind: DownloadKind; label: string }[] = [
  { kind: "pptx", label: "PPTX estándar" },
  { kind: "pdf", label: "PDF formulario" },
  { kind: "xlsx", label: "XLSX" },
  { kind: "press", label: "Nota de prensa" },
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
  const [feedbackBySection, setFeedbackBySection] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
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
      setDefinition(formRes.data.definition);
      setResponses(formRes.data.responses);
    }
  }, [id, reloadTick]);

  const handleFeedbackChange = useCallback((sectionKey: string, value: string) => {
    setFeedbackBySection((prev) => ({ ...prev, [sectionKey]: value }));
  }, []);

  const handleVote = useCallback(
    (vote: GatewayVoteValue) => {
      if (!detail) return;
      setSubmitting(true);
      setError(null);
      const cleanFeedback: Record<string, string> = {};
      for (const [k, v] of Object.entries(feedbackBySection)) {
        if (v.trim()) cleanFeedback[k] = v.trim();
      }
      const feedbackStr =
        Object.keys(cleanFeedback).length > 0
          ? JSON.stringify(cleanFeedback)
          : null;
      const result = submitVote(detail.gateway.id, vote, feedbackStr);
      setSubmitting(false);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setReloadTick((x) => x + 1);
    },
    [detail, feedbackBySection],
  );

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
  const isApproved = detail.gateway.status === "approved";
  const showVFBox =
    isApproved && currentUser &&
    // PO o Promotor pueden subir VF
    true;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href="/aprobaciones"
        className="text-[11px] font-medium text-pae-blue hover:underline"
      >
        ← Aprobaciones pendientes
      </Link>

      {/* Header rojo sutil */}
      <div className="mt-4 rounded-[10px] border border-pae-red/20 bg-pae-red/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-pae-red">
              Gateway {detail.gateway.gateway_number} — {detail.form.form_type}
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

      {/* Panel votos */}
      <div className="mt-6">
        <VotersPanel
          approvers={detail.approvers}
          votesReceived={detail.votes_received}
          votesTotal={detail.votes_total}
        />
      </div>

      {/* Downloads */}
      <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
        <p className="text-[13px] font-semibold text-pae-text">
          Documentos del formulario
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DOWNLOADS.map((d) => (
            <button
              key={d.kind}
              type="button"
              onClick={() => alert(`Descarga ${d.label} — generación pendiente`)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text-secondary transition hover:bg-pae-surface"
            >
              📎 {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Read-only sections */}
      <div className="mt-6">
        <p className="mb-3 text-[13px] font-semibold text-pae-text">
          Formulario {detail.form.form_type} (read-only)
        </p>
        <ReadOnlySections
          definition={definition}
          responses={responses}
          approvers={detail.approvers}
          currentUserId={currentUser?.id ?? null}
          feedbackBySection={feedbackBySection}
          onFeedbackChange={handleFeedbackChange}
          inputDisabled={!canVote || submitting}
        />
      </div>

      {/* Decision buttons o Post-gateway */}
      {isPending ? (
        <DecisionPanel
          canVote={canVote}
          alreadyVoted={!!detail.current_user_vote}
          currentVote={detail.current_user_vote}
          submitting={submitting}
          error={error}
          onVote={handleVote}
        />
      ) : (
        <PostGatewayPanel
          detail={detail}
          onActionDone={() => setReloadTick((x) => x + 1)}
        />
      )}

      {/* VF pendiente box */}
      {showVFBox && (
        <div className="mt-6 rounded-[10px] border border-pae-amber/30 bg-pae-amber/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold text-pae-text">
                ⚠ Versión Final pendiente
              </p>
              <p className="mt-1 text-[11px] text-pae-text-secondary">
                El gateway no se cierra hasta que subas la Versión Final del
                formulario incorporando los acuerdos de la minuta.
              </p>
            </div>
            <Link
              href={`/wizard/${detail.form.id}`}
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-pae-amber px-3 text-[11px] font-semibold text-white transition hover:bg-pae-amber/90"
            >
              Ir al formulario (editar VF) →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function DecisionPanel({
  canVote,
  alreadyVoted,
  currentVote,
  submitting,
  error,
  onVote,
}: {
  canVote: boolean;
  alreadyVoted: boolean;
  currentVote: GatewayVoteValue | null;
  submitting: boolean;
  error: string | null;
  onVote: (v: GatewayVoteValue) => void;
}) {
  return (
    <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <p className="text-[13px] font-semibold text-pae-text">Tu decisión</p>
      <p className="mt-1 text-[10px] text-pae-text-secondary">
        Unanimidad: todos deben aprobar. Si uno da feedback, vuelve al PO y
        todos re-votan.{" "}
        <span className="text-pae-text-tertiary">
          Prioridad: Rechazar › Pausa › Cambio de área › Feedback › Aprobar.
        </span>
      </p>

      {alreadyVoted && (
        <div className="mt-3 rounded-md bg-pae-blue/10 px-3 py-2 text-[11px] text-pae-blue">
          Ya emitiste tu voto ({currentVote}). No podés votar de nuevo salvo que
          se resetee la ronda.
        </div>
      )}

      {!canVote && !alreadyVoted && (
        <div className="mt-3 rounded-md bg-pae-bg px-3 py-2 text-[11px] text-pae-text-secondary">
          No sos aprobador de este gateway.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {DECISION_BUTTONS.map((b) => (
          <button
            key={b.vote}
            type="button"
            disabled={!canVote || submitting}
            onClick={() => onVote(b.vote)}
            className={`inline-flex h-9 items-center rounded-md px-4 text-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${b.className}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-[11px] text-pae-red">{error}</p>
      )}
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

  function handleMinuta() {
    const res = generateMinuta(detail.gateway.id);
    if (!res.success) {
      setActionErr(res.error.message);
      return;
    }
    setActionMsg(`Minuta creada: ${res.data.file_path}`);
    setActionErr(null);
    onActionDone();
  }

  return (
    <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <p className="text-[13px] font-semibold text-pae-text">Acciones post-gateway</p>
      <p className="mt-1 text-[10px] text-pae-text-secondary">
        Gateway resuelto. Documentá los acuerdos y asigná los roles de la siguiente etapa.
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
        <button
          type="button"
          onClick={handleMinuta}
          className="inline-flex h-8 items-center rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text transition hover:bg-pae-surface"
        >
          📝 Minuta
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
