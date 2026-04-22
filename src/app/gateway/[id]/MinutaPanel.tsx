"use client";

import { useEffect, useRef, useState } from "react";

import {
  EMPTY_MINUTA_CONTENT,
  upsertGatewayMinuta,
  type GatewayMinutaDetail,
} from "@/lib/storage/gateways";
import type { MinutaContent } from "@/lib/validations/gateways";

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

// Definición de los 6 campos obligatorios. El orden refleja la UI.
const FIELDS: {
  key: keyof MinutaContent;
  label: string;
  placeholder: string;
  type: "date" | "text" | "textarea";
  rows?: number;
}[] = [
  {
    key: "fecha_reunion",
    label: "Fecha de reunión",
    placeholder: "AAAA-MM-DD",
    type: "date",
  },
  {
    key: "participantes",
    label: "Participantes (convocados)",
    placeholder: "Nombres y roles, uno por línea",
    type: "textarea",
    rows: 3,
  },
  {
    key: "asistentes",
    label: "Asistentes (realmente presentes)",
    placeholder: "Nombres, uno por línea",
    type: "textarea",
    rows: 3,
  },
  {
    key: "mejoras",
    label: "Mejoras identificadas",
    placeholder: "Puntos a trabajar…",
    type: "textarea",
    rows: 4,
  },
  {
    key: "acuerdos",
    label: "Acuerdos",
    placeholder: "Compromisos y quién los asume",
    type: "textarea",
    rows: 4,
  },
  {
    key: "proximos_pasos",
    label: "Próximos pasos / decisiones",
    placeholder: "Fechas y responsables",
    type: "textarea",
    rows: 4,
  },
];

export function MinutaPanel({ gatewayId, detail, onSaved }: MinutaPanelProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<MinutaContent>(
    detail.content ?? EMPTY_MINUTA_CONTENT,
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setContent(detail.content ?? EMPTY_MINUTA_CONTENT);
  }, [detail.minuta?.id, detail.content]);

  function scheduleAutosave(next: MinutaContent) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // Autosave sin strict: acepta campos vacíos.
      const res = upsertGatewayMinuta(gatewayId, next, { strict: false });
      if (res.success) {
        setSavedAt(new Date().toISOString());
        setError(null);
        onSaved();
      } else {
        setError(res.error.message);
      }
    }, 800);
  }

  function handleChange(key: keyof MinutaContent, value: string) {
    const next = { ...content, [key]: value };
    setContent(next);
    scheduleAutosave(next);
  }

  function handleFinalize() {
    // Guardado estricto: todos los campos obligatorios.
    setSaving(true);
    const res = upsertGatewayMinuta(gatewayId, content, { strict: true });
    setSaving(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setError(null);
    setSavedAt(new Date().toISOString());
    onSaved();
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
  const missing = FIELDS.filter(
    (f) => !(content[f.key] ?? "").trim(),
  );

  return (
    <div className="mt-6 rounded-[10px] border border-pae-border bg-pae-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-pae-text">
            Minuta de reunión (obligatoria)
          </p>
          <p className="mt-1 text-[10px] text-pae-text-secondary">
            6 campos obligatorios — fecha, participantes, asistentes, mejoras,
            acuerdos y próximos pasos. El PO/Scrum tienen 3 días para completar.
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
          {hasMinuta && (
            <span
              className={`mt-1 rounded-full px-2.5 py-0.5 text-[9px] font-semibold ${
                detail.is_complete
                  ? "bg-pae-green/15 text-pae-green"
                  : "bg-pae-amber/15 text-pae-amber"
              }`}
            >
              {detail.is_complete ? "Completa" : "Borrador"}
            </span>
          )}
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
            + Completar minuta de reunión
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
            className="flex h-[85vh] w-full max-w-3xl flex-col rounded-[10px] bg-pae-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-pae-border px-5 py-3">
              <div>
                <p className="text-[13px] font-semibold text-pae-text">
                  📝 Minuta de la reunión
                </p>
                <p className="text-[10px] text-pae-text-tertiary">
                  {detail.can_edit
                    ? "Completá los 6 campos. Autoguardado mientras escribís. Finalizá cuando todos estén llenos."
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

            <div className="flex-1 overflow-auto p-5 space-y-4">
              {FIELDS.map((f) => {
                const value = content[f.key] ?? "";
                const isEmpty = !value.trim();
                return (
                  <div key={f.key}>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      {f.label}
                      {isEmpty && (
                        <span className="ml-1 text-pae-red">*</span>
                      )}
                    </label>
                    {f.type === "date" ? (
                      <input
                        type="date"
                        value={value}
                        disabled={!detail.can_edit}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        className="mt-1 w-48 rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text focus:border-pae-blue focus:outline-none disabled:opacity-60"
                      />
                    ) : f.type === "textarea" ? (
                      <textarea
                        rows={f.rows ?? 3}
                        value={value}
                        placeholder={f.placeholder}
                        disabled={!detail.can_edit}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        className="mt-1 block w-full resize-y rounded-md border border-pae-border bg-pae-bg p-3 text-[12px] leading-relaxed text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none disabled:opacity-60"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        placeholder={f.placeholder}
                        disabled={!detail.can_edit}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        className="mt-1 block w-full rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[12px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none disabled:opacity-60"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-pae-border px-5 py-3">
              <span className="text-[10px] text-pae-text-tertiary">
                {savedAt
                  ? `Autoguardado a las ${new Date(savedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Sin cambios sin guardar"}
                {error && (
                  <span className="ml-2 text-pae-red">· {error}</span>
                )}
              </span>
              {detail.can_edit && (
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={saving || missing.length > 0}
                  className="inline-flex h-8 items-center rounded-md bg-pae-green px-3 text-[11px] font-semibold text-white hover:bg-pae-green/90 disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    missing.length > 0
                      ? `Falta completar: ${missing.map((f) => f.label).join(", ")}`
                      : "Guarda la minuta como completa"
                  }
                >
                  {saving
                    ? "Guardando…"
                    : missing.length > 0
                      ? `Faltan ${missing.length}`
                      : "Finalizar minuta"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
