"use client";

import type { FormChangeLog, User } from "@/types";

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function SectionHistory({
  changes,
  users,
}: {
  changes: readonly FormChangeLog[];
  users: readonly User[];
}) {
  if (changes.length === 0) {
    return (
      <p className="text-[11px] italic text-pae-text-tertiary">
        Sin cambios registrados aún en esta sección.
      </p>
    );
  }
  const userName = (id: string) => {
    if (id === "system") return "Sistema (carry-over)";
    return users.find((u) => u.id === id)?.display_name ?? "Usuario";
  };
  const sorted = [...changes].sort((a, b) =>
    b.changed_at.localeCompare(a.changed_at),
  );
  const latest = sorted.slice(0, 4);
  return (
    <ul className="space-y-1">
      {latest.map((c) => (
        <li key={c.id} className="text-[11px] text-pae-text-tertiary">
          {userName(c.changed_by)} editó la sección — {formatDateTime(c.changed_at)}
        </li>
      ))}
      {sorted.length > latest.length && (
        <li className="text-[11px] text-pae-text-tertiary">
          … y {sorted.length - latest.length} cambios más
        </li>
      )}
    </ul>
  );
}
