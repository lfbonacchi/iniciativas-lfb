"use client";

import { useEffect, useState } from "react";

import type { GatewayStatus } from "@/types";
import { listGateways, type GatewayListItem } from "@/lib/storage/gateways";
import { GatewayCard } from "@/components/shell/GatewayCard";

const FILTERS: { key: "all" | "pending" | "resolved"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "resolved", label: "Resueltos" },
];

function matchesFilter(status: GatewayStatus, key: "all" | "pending" | "resolved"): boolean {
  if (key === "all") return true;
  if (key === "pending") return status === "pending";
  return status !== "pending";
}

export default function GatewaysPage() {
  const [items, setItems] = useState<GatewayListItem[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const result = listGateways();
    setItems(result.success ? result.data : []);
    setLoading(false);
  }, []);

  const filtered = items.filter((i) => matchesFilter(i.gateway.status, filter));

  return (
    <main className="px-6 py-8 md:pl-[240px]">
      <div className="max-w-4xl">
        <h1 className="text-[20px] font-semibold text-pae-text">Gateways</h1>
        <p className="mt-1 text-[11px] text-pae-text-secondary">
          Todos los gateways de iniciativas a las que tenés acceso.
        </p>

        <div className="mt-6 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition ${
                filter === f.key
                  ? "bg-pae-blue text-white"
                  : "bg-pae-surface text-pae-text-secondary border border-pae-border hover:bg-pae-bg"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-[11px] text-pae-text-tertiary">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-[11px] text-pae-text-tertiary">
              No hay gateways que coincidan con el filtro.
            </p>
          ) : (
            filtered.map((item) => (
              <GatewayCard key={item.gateway.id} item={item} highlightPending />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
