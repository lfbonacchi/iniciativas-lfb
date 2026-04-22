"use client";

import { useEffect, useState } from "react";

import type { Id } from "@/types";
import {
  formatActivityDate,
  getFormChangeHistory,
  getSectionChangeHistory,
  type SectionChangeEntry,
} from "@/lib/storage/activity";

interface SectionChangeHistoryProps {
  formId: Id;
  sectionKey: string;
  previewLimit?: number;
}

export function SectionChangeHistory({
  formId,
  sectionKey,
  previewLimit = 5,
}: SectionChangeHistoryProps) {
  const [preview, setPreview] = useState<SectionChangeEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [full, setFull] = useState<SectionChangeEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const result = getSectionChangeHistory(formId, sectionKey, previewLimit);
    if (!result.success) {
      setError(result.error.message);
      setPreview([]);
      return;
    }
    setError(null);
    setPreview(result.data);
  }, [formId, sectionKey, previewLimit]);

  function handleExpand() {
    if (full === null) {
      const result = getFormChangeHistory(formId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      const sectionScoped = result.data.filter(
        (e) =>
          preview.some((p) => p.field_key === e.field_key) ||
          e.field_key === "",
      );
      const relevant =
        sectionScoped.length > 0 ? sectionScoped : result.data;
      setFull(relevant);
    }
    setExpanded((v) => !v);
  }

  const visible = expanded && full !== null ? full : preview;

  if (error) {
    return (
      <div className="mt-3 text-[11px] text-pae-red">
        No se pudo cargar el historial: {error}
      </div>
    );
  }

  if (preview.length === 0) {
    return (
      <div className="mt-3 text-[11px] text-pae-text-tertiary">
        Sin cambios registrados en esta sección todavía.
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-pae-border pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-pae-text-tertiary">
        Historial de esta sección
      </p>
      <ul className="space-y-1">
        {visible.map((entry) => (
          <li
            key={entry.id}
            className="text-[11px] leading-snug text-pae-text-tertiary"
          >
            <span className="text-pae-text-secondary">
              {entry.is_system ? "Sistema" : entry.changed_by_name}
            </span>{" "}
            editó{" "}
            <span className="text-pae-text-secondary">
              {entry.field_label}
            </span>{" "}
            — {formatActivityDate(entry.changed_at)}
          </li>
        ))}
      </ul>
      {(preview.length >= previewLimit || expanded) && (
        <button
          type="button"
          onClick={handleExpand}
          className="mt-2 text-[11px] font-medium text-pae-blue hover:underline"
        >
          {expanded ? "Ocultar historial completo" : "Ver historial completo"}
        </button>
      )}
    </div>
  );
}
