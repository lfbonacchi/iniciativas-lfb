"use client";

import { useEffect, useMemo, useState } from "react";

import {
  formatActivityDate,
  getGlobalActivityTimeline,
  type InitiativeActivityEntry,
} from "@/lib/storage/activity";

const MAX_ENTRIES = 500;

export default function ControlDeCambiosPage() {
  const [entries, setEntries] = useState<InitiativeActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    const result = getGlobalActivityTimeline(MAX_ENTRIES);
    if (!result.success) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    setEntries(result.data);
    setLoading(false);
  }, []);

  const actors = useMemo(() => {
    const set = new Map<string, string>();
    for (const e of entries) {
      if (!set.has(e.actor_id)) set.set(e.actor_id, e.actor_name);
    }
    return Array.from(set.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (actorFilter !== "all" && e.actor_id !== actorFilter) return false;
      if (q.length === 0) return true;
      return (
        e.summary.toLowerCase().includes(q) ||
        e.actor_name.toLowerCase().includes(q)
      );
    });
  }, [entries, actorFilter, query]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-[20px] font-semibold text-pae-text">
          Control de cambios
        </h1>
        <p className="mt-1 text-[12px] text-pae-text-secondary">
          Registro de todas las acciones realizadas en el sistema. Podés
          filtrar por persona o buscar por palabra clave.
        </p>
      </header>

      <section className="mb-4 rounded-xl border border-pae-border bg-pae-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="actor-filter"
              className="text-[11px] font-semibold uppercase tracking-[0.04em] text-pae-text-tertiary"
            >
              Persona
            </label>
            <select
              id="actor-filter"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="h-9 rounded-md border border-pae-border bg-pae-bg px-2 text-[12px] text-pae-text"
            >
              <option value="all">Todas</option>
              {actors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <label
              htmlFor="query"
              className="text-[11px] font-semibold uppercase tracking-[0.04em] text-pae-text-tertiary"
            >
              Buscar
            </label>
            <input
              id="query"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: gateway, F1, documento…"
              className="h-9 flex-1 rounded-md border border-pae-border bg-pae-bg px-3 text-[12px] text-pae-text placeholder:text-pae-text-tertiary"
            />
          </div>
          <span className="text-[11px] text-pae-text-tertiary">
            {filtered.length} de {entries.length}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-pae-border bg-pae-surface shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="p-6 text-[12px] text-pae-text-tertiary">
            Cargando…
          </div>
        ) : error ? (
          <div className="m-4 rounded-md bg-pae-red/10 px-3 py-2 text-[12px] text-pae-red">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-[12px] text-pae-text-tertiary">
            No hay cambios que coincidan con los filtros aplicados.
          </div>
        ) : (
          <ol className="divide-y divide-pae-border">
            {filtered.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 px-5 py-3 text-[12px] leading-snug"
              >
                <span
                  aria-hidden
                  className={`mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                    entry.is_system ? "bg-pae-text-tertiary" : "bg-pae-blue"
                  }`}
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
      </section>
    </div>
  );
}
