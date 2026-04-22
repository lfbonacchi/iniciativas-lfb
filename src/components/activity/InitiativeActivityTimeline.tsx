"use client";

import { useEffect, useState } from "react";

import type { Id } from "@/types";
import {
  formatActivityDate,
  getInitiativeActivityTimeline,
  type InitiativeActivityEntry,
} from "@/lib/storage/activity";

interface InitiativeActivityTimelineProps {
  initiativeId: Id;
  limit?: number;
  defaultOpen?: boolean;
}

export function InitiativeActivityTimeline({
  initiativeId,
  limit = 15,
  defaultOpen = false,
}: InitiativeActivityTimelineProps) {
  const [entries, setEntries] = useState<InitiativeActivityEntry[]>([]);
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const result = getInitiativeActivityTimeline(initiativeId, limit);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setEntries(result.data);
  }, [initiativeId, limit]);

  return (
    <section className="rounded-xl border border-pae-border bg-pae-surface shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <h3 className="text-[14px] font-semibold text-pae-text">
            Actividad reciente
          </h3>
          <p className="mt-0.5 text-[11px] text-pae-text-tertiary">
            {entries.length > 0
              ? `Últimos ${entries.length} ${entries.length === 1 ? "evento" : "eventos"} de esta iniciativa`
              : "Sin actividad registrada"}
          </p>
        </div>
        <span
          aria-hidden
          className={`text-pae-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-pae-border px-5 py-4">
          {error && (
            <p className="mb-3 rounded-md bg-pae-red/10 px-3 py-2 text-[12px] text-pae-red">
              {error}
            </p>
          )}
          {entries.length === 0 ? (
            <p className="text-[12px] text-pae-text-tertiary">
              Todavía no hay actividad registrada.
            </p>
          ) : (
            <ol className="space-y-3">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 text-[12px] leading-snug"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-pae-blue"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-pae-text">
                      <span className="font-semibold">
                        {entry.is_system ? "Sistema" : entry.actor_name}
                      </span>{" "}
                      <span className="text-pae-text-secondary">
                        {entry.summary}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-pae-text-tertiary">
                      {formatActivityDate(entry.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
