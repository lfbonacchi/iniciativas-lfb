"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  listPendingActionsForUser,
  type PendingActionItem,
} from "@/lib/storage/gateways";
import { getCurrentUser } from "@/lib/storage/auth";

const KIND_BADGE: Record<
  PendingActionItem["kind"],
  { label: string; bg: string; text: string }
> = {
  vote: { label: "Voto", bg: "bg-pae-red/10", text: "text-pae-red" },
  vf_pending: { label: "VF", bg: "bg-pae-amber/15", text: "text-pae-amber" },
  minuta_missing: {
    label: "Minuta",
    bg: "bg-pae-blue/10",
    text: "text-pae-blue",
  },
  minuta_incomplete: {
    label: "Minuta",
    bg: "bg-pae-blue/10",
    text: "text-pae-blue",
  },
  form_draft: {
    label: "Borrador",
    bg: "bg-pae-text-tertiary/15",
    text: "text-pae-text-secondary",
  },
};

export default function AccionesPendientesPage() {
  const [items, setItems] = useState<PendingActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIniId, setFilterIniId] = useState<string>("");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user.success) {
      setLoading(false);
      return;
    }
    const res = listPendingActionsForUser(user.data.id);
    setItems(res.success ? res.data : []);
    setLoading(false);
  }, []);

  const initiativesInList = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) map.set(it.initiative_id, it.initiative_name);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const filtered = filterIniId
    ? items.filter((i) => i.initiative_id === filterIniId)
    : items;

  const total = items.length;
  const visible = filtered.length;

  return (
    <main className="px-6 py-8 md:pl-[240px]">
      <div className="max-w-4xl">
        <h1 className="text-[20px] font-semibold text-pae-text">
          Acciones pendientes
        </h1>
        <p className="mt-1 text-[11px] text-pae-text-secondary">
          {loading
            ? "Cargando..."
            : total === 0
              ? "No tenés acciones pendientes. Todo al día."
              : filterIniId
                ? `${visible} de ${total} acción${total === 1 ? "" : "es"} — filtrado`
                : `${total} acción${total === 1 ? "" : "es"} que requieren tu atención`}
        </p>

        {/* Filtro por iniciativa */}
        {initiativesInList.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterIniId("")}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                filterIniId === ""
                  ? "bg-pae-blue text-white"
                  : "border border-pae-border bg-pae-surface text-pae-text-secondary hover:bg-pae-bg"
              }`}
            >
              Todas ({total})
            </button>
            {initiativesInList.map((ini) => {
              const count = items.filter(
                (i) => i.initiative_id === ini.id,
              ).length;
              const active = filterIniId === ini.id;
              return (
                <button
                  key={ini.id}
                  type="button"
                  onClick={() => setFilterIniId(ini.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    active
                      ? "bg-pae-blue text-white"
                      : "border border-pae-border bg-pae-surface text-pae-text-secondary hover:bg-pae-bg"
                  }`}
                >
                  {ini.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <ul className="mt-6 space-y-2">
            {filtered.map((item) => {
              const badge = KIND_BADGE[item.kind];
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-[10px] border border-pae-border bg-pae-surface p-4 transition hover:border-pae-blue/40 hover:bg-pae-bg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-pae-text">
                          {item.label}
                        </p>
                        <p className="truncate text-[11px] text-pae-text-secondary">
                          {item.initiative_name}
                        </p>
                      </div>
                    </div>
                    <span className="text-[16px] text-pae-text-tertiary">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
