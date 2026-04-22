"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import type { Notification, NotificationType } from "@/types";
import { markAsRead } from "@/lib/storage/notifications";

interface NotificationsPanelProps {
  notifications: Notification[];
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

  const sorted = useMemo(
    () =>
      [...notifications].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1,
      ),
    [notifications],
  );

  function handleClick(n: Notification) {
    if (!n.read) {
      const res = markAsRead(n.id);
      if (res.success) onChanged();
    }
    onClose();
    router.push(routeForType(n.type, n.initiative_id));
  }

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
        {sorted.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-pae-text-tertiary">
            No tenés notificaciones
          </div>
        ) : (
          <ul className="divide-y divide-pae-border">
            {sorted.map((n) => {
              const iniName =
                initiativeNames[n.initiative_id] ?? "Iniciativa";
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
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
        )}
      </div>
    </div>
  );
}
