"use client";

import { useEffect, useRef, useState } from "react";

import {
  upsertGatewayMinuta,
  type GatewayMinutaDetail,
} from "@/lib/storage/gateways";

interface MinutaPanelProps {
  gatewayId: string;
  detail: GatewayMinutaDetail;
  onSaved: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function MinutaPanel({ gatewayId, detail, onSaved }: MinutaPanelProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(detail.minuta?.content ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setContent(detail.minuta?.content ?? "");
  }, [detail.minuta?.id, detail.minuta?.content]);

  function scheduleAutosave(next: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const res = upsertGatewayMinuta(gatewayId, next);
      if (res.success) {
        setSavedAt(new Date().toISOString());
        setError(null);
        onSaved();
      } else {
        setError(res.error.message);
      }
    }, 800);
  }

  const days = detail.days_remaining;
  const deadlineChip =
    days == null
      ? null
      : detail.overdue
        ? { label: "Minuta vencida", bg: "bg-pae-red/10", text: "text-pae-red" }
        : days <= 0
          ? {
              label: "Vence hoy",
              bg: "bg-pae-amber/15",
              text: "text-pae-amber",
            }
          : days === 1
            ? {
                label: "Vence mañana",
                bg: "bg-pae-amber/15",
                text: "text-pae-amber",
              }
            : {
                label: `Faltan ${days} días`,
                bg: "bg-pae-blue/10",
                text: "text-pae-blue",
              };

  const hasMinuta = !!detail.minuta;

  return (
    <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-pae-text">
            Minuta de reunión (obligatoria)
          </p>
          <p className="mt-1 text-[10px] text-pae-text-secondary">
            El PO tiene 3 días post-gateway para subir la minuta con acuerdos
            de la reunión. Queda editable por PO y Scrum.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {deadlineChip && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${deadlineChip.bg} ${deadlineChip.text}`}
            >
              {deadlineChip.label}
            </span>
          )}
          <span className="text-[9px] text-pae-text-tertiary">
            Deadline: {formatDate(detail.deadline_at)}
          </span>
        </div>
      </div>

      <div className="mt-3">
        {hasMinuta ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-pae-border bg-pae-bg px-3 text-[11px] font-medium text-pae-text transition hover:bg-pae-surface"
          >
            📝 Abrir minuta
            <span className="text-[9px] text-pae-text-tertiary">
              · actualizada {formatDate(detail.minuta?.updated_at ?? null)}
            </span>
          </button>
        ) : detail.can_edit ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-pae-blue px-3 text-[11px] font-semibold text-white hover:bg-pae-blue/90"
          >
            + Agregar minuta de reunión
          </button>
        ) : (
          <p className="text-[11px] text-pae-text-tertiary">
            Todavía no hay minuta. Solo PO y Scrum pueden crearla.
          </p>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[80vh] w-full max-w-3xl flex-col rounded-[10px] bg-pae-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-pae-border px-5 py-3">
              <div>
                <p className="text-[13px] font-semibold text-pae-text">
                  📝 Minuta de la reunión
                </p>
                <p className="text-[10px] text-pae-text-tertiary">
                  {detail.can_edit
                    ? "Escribí los acuerdos. Se guarda automáticamente."
                    : "Solo lectura (no sos PO ni Scrum)."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[16px] text-pae-text-tertiary hover:text-pae-text"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {detail.can_edit ? (
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    scheduleAutosave(e.target.value);
                  }}
                  placeholder="Acuerdos, decisiones, responsables, fechas..."
                  className="block h-full w-full resize-none rounded-md border border-pae-border bg-pae-bg p-3 text-[12px] leading-relaxed text-pae-text focus:border-pae-blue focus:outline-none"
                />
              ) : (
                <div className="whitespace-pre-wrap text-[12px] text-pae-text">
                  {content || (
                    <span className="italic text-pae-text-tertiary">
                      Sin contenido todavía.
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-pae-border px-5 py-2 text-[10px] text-pae-text-tertiary">
              <span>
                {savedAt
                  ? `Autoguardado a las ${new Date(savedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Sin cambios sin guardar"}
              </span>
              {error && <span className="text-pae-red">{error}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
