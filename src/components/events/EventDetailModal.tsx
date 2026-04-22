"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AttendanceStatus,
  Id,
  PortfolioEvent,
  PortfolioEventType,
  User,
} from "@/types";
import { getCurrentUser, getAvailableUsers } from "@/lib/storage/auth";
import {
  cancelPortfolioEvent,
  getEventChangeLog,
  getPortfolioEvent,
  rescheduleEvent,
  setEventAttendance,
  type EventChangeLogEntry,
  type SyntheticEventSeed,
} from "@/lib/storage/events";

export interface EventDetailInput {
  id: Id;
  name: string;
  type: PortfolioEventType;
  custom_type_label?: string | null;
  initiative_id: Id;
  initiative_name: string;
  date: string;
  is_custom: boolean;
}

interface EventDetailModalProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  event: EventDetailInput | null;
}

const TYPE_LABEL: Record<PortfolioEventType, string> = {
  gate: "Gate",
  sprint_review: "Sprint Review",
  seg_q: "Seg. Q",
  seg_mensual: "Seg. mensual",
  ltp_plan: "LTP Plan",
  entrega: "Entrega",
  otro: "Otro",
};

const ACTION_LABEL: Record<EventChangeLogEntry["action"], string> = {
  initiative_created: "",
  initiative_imported: "",
  initiative_stage_changed: "",
  initiative_status_changed: "",
  initiative_member_added: "",
  initiative_member_removed: "",
  initiative_member_role_changed: "",
  form_submitted: "",
  form_approved: "",
  form_reviewed: "",
  form_response_changed: "",
  gateway_vote_cast: "",
  gateway_resolved: "",
  document_uploaded: "",
  document_generated: "",
  document_downloaded: "",
  document_moved: "",
  document_deleted: "",
  file_uploaded: "",
  file_downloaded: "",
  file_moved: "",
  file_deleted: "",
  memory_cleared: "",
  event_created: "Evento creado",
  event_attendance_set: "Cambio de asistencia",
  event_rescheduled: "Evento reprogramado",
  event_cancelled: "Evento cancelado",
  event_materialized: "Evento habilitado para acciones",
};

function fmtDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${d.getUTCDate()} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

function fmtDateTimeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSynthSeed(input: EventDetailInput): SyntheticEventSeed {
  return {
    id: input.id,
    name: input.name,
    type: input.type,
    custom_type_label: input.custom_type_label ?? null,
    initiative_id: input.initiative_id,
    date: input.date,
  };
}

export function EventDetailModal({
  open,
  onClose,
  onChanged,
  event: input,
}: EventDetailModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [evt, setEvt] = useState<PortfolioEvent | null>(null);
  const [changeLog, setChangeLog] = useState<EventChangeLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Action UI state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!open || !input) return;
    setError(null);
    setRescheduleOpen(false);
    setConfirmCancel(false);
    setNewDate(input.date);
    setSubmitting(false);

    const cu = getCurrentUser();
    setCurrentUser(cu.success ? cu.data : null);
    const au = getAvailableUsers();
    setAllUsers(au.success ? au.data : []);

    // Try to load persisted version (custom or previously materialized)
    const res = getPortfolioEvent(input.id);
    if (res.success) {
      setEvt(res.data);
      const log = getEventChangeLog(input.id);
      setChangeLog(log.success ? log.data : []);
    } else {
      // Not yet materialized — we'll show read-only info from input until the
      // user takes an action. The action handlers will materialize it.
      setEvt(null);
      setChangeLog([]);
    }
  }, [open, input]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const userById = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u] as const)),
    [allUsers],
  );

  if (!open || !input) return null;

  function refreshFromStore() {
    if (!input) return;
    const res = getPortfolioEvent(input.id);
    if (res.success) setEvt(res.data);
    const log = getEventChangeLog(input.id);
    if (log.success) setChangeLog(log.data);
    onChanged();
  }

  function handleAttend(status: AttendanceStatus) {
    if (!input || submitting) return;
    setSubmitting(true);
    const seed = buildSynthSeed(input);
    const res = setEventAttendance(input.id, status, seed);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setError(null);
    refreshFromStore();
  }

  function handleReschedule() {
    if (!input || submitting) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      setError("La fecha debe tener formato YYYY-MM-DD");
      return;
    }
    setSubmitting(true);
    const seed = buildSynthSeed(input);
    const res = rescheduleEvent(input.id, newDate, seed);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setError(null);
    setRescheduleOpen(false);
    refreshFromStore();
  }

  function handleCancel() {
    if (!input || submitting) return;
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setSubmitting(true);
    const seed = buildSynthSeed(input);
    const res = cancelPortfolioEvent(input.id, seed);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setError(null);
    refreshFromStore();
    // Event disappears from timeline now — close.
    onClose();
  }

  const myStatus: AttendanceStatus | undefined =
    evt && currentUser ? evt.attendance[currentUser.id] : undefined;
  const currentDate = evt?.date ?? input.date;
  const isCancelled = evt?.status === "cancelled";
  const wasRescheduled =
    evt?.original_date != null && evt.original_date !== evt.date;
  const invitedIds = evt?.invited_user_ids ?? [];
  const attendance = evt?.attendance ?? {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-pae-surface p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
              {TYPE_LABEL[input.type]}
              {isCancelled && (
                <span className="ml-2 rounded-full bg-pae-red/10 px-2 py-[1px] text-[10px] font-semibold text-pae-red">
                  Cancelado
                </span>
              )}
            </p>
            <h2
              id="event-detail-title"
              className="mt-1 text-[16px] font-semibold text-pae-text"
            >
              {input.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-[16px] text-pae-text-tertiary hover:bg-pae-bg hover:text-pae-text"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-pae-red/10 px-3 py-2 text-[13px] text-pae-red">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
              Iniciativa
            </p>
            <p className="mt-1 text-[13px] text-pae-text">
              {input.initiative_name}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
              Fecha
            </p>
            <p className="mt-1 text-[13px] text-pae-text">
              {fmtDateLong(currentDate)}
            </p>
            {wasRescheduled && evt?.original_date && (
              <p className="text-[11px] text-pae-text-tertiary">
                Original: {fmtDateLong(evt.original_date)}
              </p>
            )}
          </div>

          {invitedIds.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                Invitados ({invitedIds.length})
              </p>
              <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                {invitedIds.map((uid) => {
                  const u = userById.get(uid);
                  const s = attendance[uid];
                  return (
                    <li
                      key={uid}
                      className="flex items-center justify-between rounded px-2 py-1 text-[13px]"
                    >
                      <span className="text-pae-text">
                        {u?.display_name ?? uid}
                      </span>
                      {s === "yes" && (
                        <span className="rounded-full bg-pae-green/10 px-2 py-[2px] text-[11px] font-medium text-pae-green">
                          Asiste
                        </span>
                      )}
                      {s === "no" && (
                        <span className="rounded-full bg-pae-red/10 px-2 py-[2px] text-[11px] font-medium text-pae-red">
                          No asiste
                        </span>
                      )}
                      {!s && (
                        <span className="text-[11px] text-pae-text-tertiary">
                          Sin respuesta
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {!isCancelled && (
          <>
            <div className="mt-5 border-t border-pae-border pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                ¿Vas a asistir?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAttend("yes")}
                  disabled={submitting}
                  className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-semibold transition ${
                    myStatus === "yes"
                      ? "border-pae-green bg-pae-green text-white"
                      : "border-pae-green/30 bg-pae-green/10 text-pae-green hover:bg-pae-green/20"
                  }`}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => handleAttend("no")}
                  disabled={submitting}
                  className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-semibold transition ${
                    myStatus === "no"
                      ? "border-pae-red bg-pae-red text-white"
                      : "border-pae-red/30 bg-pae-red/10 text-pae-red hover:bg-pae-red/20"
                  }`}
                >
                  Rechazar
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-pae-border pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                Acciones sobre el evento
              </p>
              {!rescheduleOpen ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleOpen(true);
                      setNewDate(currentDate);
                    }}
                    disabled={submitting}
                    className="flex-1 rounded-lg border border-pae-blue/30 bg-pae-blue/10 px-3 py-2 text-[13px] font-semibold text-pae-blue transition hover:bg-pae-blue/20"
                  >
                    Reprogramar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-semibold transition ${
                      confirmCancel
                        ? "border-pae-red bg-pae-red text-white hover:bg-pae-red/90"
                        : "border-pae-red/30 bg-pae-red/5 text-pae-red hover:bg-pae-red/10"
                    }`}
                  >
                    {confirmCancel ? "Confirmar cancelación" : "Cancelar"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block">
                    <span className="block text-[12px] font-medium text-pae-text-secondary">
                      Nueva fecha
                    </span>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="mt-1 block h-9 w-full rounded-lg border border-pae-border bg-pae-bg px-3 text-[14px] text-pae-text focus:border-pae-blue focus:outline-none"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRescheduleOpen(false)}
                      className="flex-1 rounded-lg border border-pae-border bg-pae-surface px-3 py-2 text-[13px] font-medium text-pae-text-secondary hover:bg-pae-bg"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleReschedule}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-pae-blue px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-pae-blue/90"
                    >
                      Guardar fecha
                    </button>
                  </div>
                </div>
              )}
              {confirmCancel && !rescheduleOpen && (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="mt-2 block w-full text-center text-[11px] text-pae-text-tertiary hover:text-pae-text"
                >
                  Volver
                </button>
              )}
            </div>
          </>
        )}

        {changeLog.length > 0 && (
          <div className="mt-5 border-t border-pae-border pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
              Control de cambios
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto">
              {changeLog.map((entry) => {
                const label = ACTION_LABEL[entry.action] ?? entry.action;
                return (
                  <li
                    key={entry.id}
                    className="rounded px-2 py-1 text-[11px] leading-tight"
                  >
                    <span className="font-medium text-pae-text">{label}</span>{" "}
                    <span className="text-pae-text-secondary">
                      · {entry.user_display_name}
                    </span>
                    <span className="block text-pae-text-tertiary">
                      {fmtDateTimeShort(entry.timestamp)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {!input.is_custom && !evt && (
          <p className="mt-4 rounded-lg bg-pae-bg px-3 py-2 text-[11px] leading-snug text-pae-text-tertiary">
            Este evento se deriva automáticamente. Al aceptar, rechazar,
            reprogramar o cancelar queda registrado en el control de cambios.
          </p>
        )}
      </div>
    </div>
  );
}
