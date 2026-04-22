"use client";

import { useEffect, useState } from "react";

import type { Id } from "@/types";
import {
  formatActivityDate,
  getSectionsLastEdits,
  type SectionLastEdit as SectionLastEditEntry,
} from "@/lib/storage/activity";

interface SectionLastEditProps {
  formId: Id;
  sectionKey: string;
}

export function SectionLastEdit({ formId, sectionKey }: SectionLastEditProps) {
  const [entry, setEntry] = useState<SectionLastEditEntry | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const result = getSectionsLastEdits(formId);
    if (!result.success) {
      setLoaded(true);
      return;
    }
    const match = result.data.find((s) => s.section_key === sectionKey) ?? null;
    setEntry(match);
    setLoaded(true);
  }, [formId, sectionKey]);

  if (!loaded) return null;
  if (!entry || !entry.last_changed_at) {
    return (
      <span className="text-[11px] text-pae-text-tertiary">
        Sin ediciones registradas
      </span>
    );
  }

  return (
    <span className="text-[11px] text-pae-text-tertiary">
      Última edición: {entry.last_changed_by_name ?? "—"},{" "}
      {formatActivityDate(entry.last_changed_at)}
    </span>
  );
}
