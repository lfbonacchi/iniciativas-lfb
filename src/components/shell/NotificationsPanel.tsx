"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import type { Notification, NotificationType } from "@/types";
import { markAsRead } from "@/lib/storage/notifications";
import type { PendingActionItem } from "@/lib/storage/gateways";

interface NotificationsPanelProps {
  notifications: Notification[];
  pendingActions: PendingActionItem[];
  initiativeNames: Record<string, string>;
  onClose: () => void;
  onChanged: () => void;
}

function iconForType(type: NotificationType): string {
  switch (type) {
    case "gateway_vote_pending":
    case "gateway_resolved":
      return "🚦";
    case "form_feedback_received":
    case "form_submitted":
    case "form_reviewed":
      return "📝";
    case "member_added":
    case "member_removed":
      return "👥";
    case "document_generated":
    case "document_uploaded":
      return "📄";
    case "initiative_paused":
    case "initiative_rejected":
    case "initiative_area_change":
      return "⚠️";
    default:
      return "🔔";
  }
}

function iconForAction(kind: PendingActionItem["kind"]): string {
  switch (kind) {
    case "vote":
      return "🗳";
    case "vf_pending":
      return "📝";
    case "minuta_missing":
    case "minuta_incomplete":
      return "📋";
    case "form_draft":
      return "✏️";
  }
}

function routeForType(type: NotificationType, initiativeId: string): string {
  if (type === "gateway_vote_pending") return "/aprobaciones";
  return `/iniciativas/${initiativeId}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `Hoy ${d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsPanel({
  notifications,
  pendingActions,
  initiativeNames,
  onClose,
  onChanged,
}: NotificationsPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const sortedNotifs = useMemo(
    () =>
      [...notifications].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1,
      ),
    [notifications],
  );

  function handleNotifClick(n: Notification) {
    if (!n.read) {
      const res = markAsRead(n.id);
      if (res.success) onChanged();
    }
    onClose();
    router.push(routeForType(n.type, n.initiative_id));
  }

  function handleActionClick(a: PendingActionItem) {
    onClose();
    router.push(a.href);
  }

  const totalItems = pendingActions.length + sortedNotifs.length;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notificaciones"
      className="absolute right-0 top-10 z-50 w-[380px] overflow-hidden rounded-xl border border-pae-border bg-pae-surface shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-center justify-between border-b border-pae-border px-4 py-3">
        <h3 className="text-[14px] font-semibold text-pae-text">
          Notificaciones
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] text-pae-text-secondary hover:text-pae-text"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {totalItems === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-pae-text-tertiary">
            No tenés notificaciones
          </div>
        ) : (
          <>
            {pendingActions.length > 0 && (
              <div>
                <p className="bg-pae-red/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-pae-red">
                  Acciones pendientes ({pendingActions.length})
                </p>
                <ul className="divide-y divide-pae-border">
                  {pendingActions.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => handleActionClick(a)}
                        className="flex w-full items-start gap-3 bg-pae-red/[0.02] px-4 py-3 text-left transition hover:bg-pae-red/[0.06]"
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-pae-red/10 text-[16px]"
                        >
                          {iconForAction(a.kind)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-pae-text">
                            {a.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-pae-text-secondary">
                            {a.initiative_name}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sortedNotifs.length > 0 && (
              <div>
                <p className="bg-pae-bg px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                  Historial
                </p>
                <ul className="divide-y divide-pae-border">
                  {sortedNotifs.map((n) => {
                    const iniName =
                      initiativeNames[n.initiative_id] ?? "Iniciativa";
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleNotifClick(n)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-pae-bg ${
                            n.read ? "" : "bg-pae-blue/[0.06]"
                          }`}
                        >
                          <span
                            aria-hidden
                            className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-pae-bg text-[16px]"
                          >
                            {iconForType(n.type)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span
                                className={`truncate text-[13px] ${
                                  n.read
                                    ? "text-pae-text"
                                    : "font-semibold text-pae-text"
                                }`}
                              >
                                {n.title}
                              </span>
                              {!n.read && (
                                <span
                                  aria-label="No leída"
                                  className="h-2 w-2 flex-none rounded-full bg-pae-blue"
                                />
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-pae-text-secondary">
                              {iniName}
                            </span>
                            <span className="mt-1 block text-[10px] text-pae-text-tertiary">
                              {formatDate(n.created_at)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
