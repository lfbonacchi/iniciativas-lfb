"use client";

import { useEffect, useState } from "react";

import {
  listPendingApprovalsForUser,
  type GatewayListItem,
} from "@/lib/storage/gateways";
import { GatewayCard } from "@/components/shell/GatewayCard";

export default function AprobacionesPage() {
  const [items, setItems] = useState<GatewayListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const result = listPendingApprovalsForUser();
    setItems(result.success ? result.data : []);
    setLoading(false);
  }, []);

  return (
    <main className="px-6 py-8 md:pl-[240px]">
      <div className="max-w-4xl">
        <h1 className="text-[20px] font-semibold text-pae-text">
          Aprobaciones pendientes
        </h1>
        <p className="mt-1 text-[11px] text-pae-text-secondary">
          {loading
            ? "Cargando..."
            : `${items.length} gateway${items.length === 1 ? "" : "s"} requieren tu voto`}
        </p>

        <div className="mt-6 space-y-3">
          {!loading && items.length === 0 && (
            <p className="text-[11px] text-pae-text-tertiary">
              No tenés aprobaciones pendientes.
            </p>
          )}
          {items.map((item) => (
            <GatewayCard key={item.gateway.id} item={item} highlightPending />
          ))}
        </div>
      </div>
    </main>
  );
}
