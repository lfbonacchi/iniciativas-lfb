"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { InitiativeStage } from "@/types";
import {
  listMyInitiativeCards,
  type IniciativaCard,
} from "@/lib/storage/initiatives";
import { getCurrentUser } from "@/lib/storage/auth";
import { EmptyStateModal } from "@/components/shell/EmptyStateModal";
import { MultiplicadoresCard } from "@/components/shell/MultiplicadoresCard";

const STAGE_LABEL: Record<InitiativeStage, string> = {
  proposal: "Propuesta",
  dimensioning: "Dimensionamiento",
  mvp: "MVP",
  ltp_tracking: "Delivery",
};

const STAGE_ACCENT: Record<InitiativeStage, string> = {
  proposal: "bg-pae-blue",
  dimensioning: "bg-pae-blue",
  mvp: "bg-pae-green",
  ltp_tracking: "bg-pae-green",
};

const STAGE_TOOLTIP: Record<InitiativeStage, string> = {
  proposal: "Etapa 1 de 4 — Propuesta",
  dimensioning: "Etapa 2 de 4 — Dimensionamiento",
  mvp: "Etapa 3 de 4 — MVP",
  ltp_tracking: "Etapa 4 de 4 — Delivery",
};

const STAGE_CHIP: Record<InitiativeStage, { bg: string; text: string }> = {
  proposal: { bg: "bg-pae-blue/10", text: "text-pae-blue" },
  dimensioning: { bg: "bg-pae-blue/10", text: "text-pae-blue" },
  mvp: { bg: "bg-pae-green/10", text: "text-pae-green" },
  ltp_tracking: { bg: "bg-pae-green/10", text: "text-pae-green" },
};

function statusChipTone(
  status: IniciativaCard["status"],
): { bg: string; text: string } {
  switch (status) {
    case "in_progress":
      return { bg: "bg-pae-green/15", text: "text-pae-green" };
    case "pending":
      return { bg: "bg-pae-red/15", text: "text-pae-red" };
    case "paused":
    case "rejected":
    case "area_change":
      return {
        bg: "bg-pae-text-tertiary/15",
        text: "text-pae-text-secondary",
      };
  }
}

function fmtUsd(v: number): string {
  if (v === 0) return "—";
  if (v >= 1_000_000) return `USD ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `USD ${Math.round(v / 1_000)}K`;
  return `USD ${v}`;
}

type TabKey = "own" | "impacting";
type SortKey = "name_asc" | "value_desc" | "value_asc" | "stage";

function sortCards(cards: IniciativaCard[], key: SortKey): IniciativaCard[] {
  const copy = [...cards];
  switch (key) {
    case "name_asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "value_desc":
      return copy.sort(
        (a, b) => b.expected_value_usd - a.expected_value_usd,
      );
    case "value_asc":
      return copy.sort(
        (a, b) => a.expected_value_usd - b.expected_value_usd,
      );
    case "stage": {
      const order: InitiativeStage[] = [
        "proposal",
        "dimensioning",
        "mvp",
        "ltp_tracking",
      ];
      return copy.sort(
        (a, b) =>
          order.indexOf(a.current_stage) - order.indexOf(b.current_stage),
      );
    }
  }
}

export default function MisIniciativasPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    own: IniciativaCard[];
    impacting: IniciativaCard[];
    available_vps: string[];
  } | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<InitiativeStage | "all">(
    "all",
  );
  const [vpFilter, setVpFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name_asc");
  const [tab, setTab] = useState<TabKey>("own");
  const [emptyModalOpen, setEmptyModalOpen] = useState(false);
  const [canCreate, setCanCreate] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const userResult = getCurrentUser();
      if (!userResult.success) {
        router.replace("/seleccionar-usuario");
        return;
      }
      const user = userResult.data;
      setCanCreate(user.global_role === "area_transformacion" || !user.is_vp);

      const result = listMyInitiativeCards();
      if (!result.success) {
        if (result.error.code === "AUTH_REQUIRED") {
          router.replace("/seleccionar-usuario");
          return;
        }
        setPageError(result.error.message);
        setData({ own: [], impacting: [], available_vps: [] });
        return;
      }
      setData(result.data);
      const totalVisible =
        result.data.own.length + result.data.impacting.length;
      if (totalVisible === 0) setEmptyModalOpen(true);
    } catch (e) {
      console.error("mis-iniciativas failed:", e);
      setPageError(
        e instanceof Error ? e.message : "Error inesperado al cargar iniciativas",
      );
      setData({ own: [], impacting: [], available_vps: [] });
    }
  }, [router]);

  const visibleCards = useMemo<IniciativaCard[]>(() => {
    if (!data) return [];
    const source = tab === "own" ? data.own : data.impacting;
    const q = search.trim().toLowerCase();
    const filtered = source.filter((ini) => {
      if (stageFilter !== "all" && ini.current_stage !== stageFilter)
        return false;
      if (vpFilter !== "all" && ini.vicepresidencia !== vpFilter)
        return false;
      if (q && !ini.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return sortCards(filtered, sortKey);
  }, [data, tab, search, stageFilter, vpFilter, sortKey]);

  if (!data) {
    return (
      <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
        <p className="text-[14px] text-pae-text-secondary">Cargando…</p>
      </div>
    );
  }

  const totalAll = data.own.length + data.impacting.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[18px] font-semibold text-pae-text">
          Mis iniciativas
        </h1>
        <MultiplicadoresCard />
      </div>

      {pageError && (
        <div className="rounded-xl border border-pae-red/30 bg-pae-red/5 p-4">
          <p className="text-[13px] text-pae-red">
            Hubo un error cargando tus iniciativas: {pageError}
          </p>
          <p className="mt-1 text-[12px] text-pae-text-secondary">
            Probá &ldquo;Limpiar todos los datos&rdquo; desde el selector de
            usuario y recargá.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-pae-text-tertiary">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar iniciativa..."
            className="h-9 w-full rounded-lg border border-pae-border bg-pae-surface pl-9 pr-3 text-[14px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-[13px] text-pae-text-secondary">
          Etapa:
          <select
            value={stageFilter}
            onChange={(e) =>
              setStageFilter(e.target.value as InitiativeStage | "all")
            }
            className="h-9 rounded-lg border border-pae-border bg-pae-surface px-2 text-[13px] text-pae-text focus:border-pae-blue focus:outline-none"
          >
            <option value="all">Todas</option>
            <option value="proposal">Propuesta</option>
            <option value="dimensioning">Dimensionamiento</option>
            <option value="mvp">MVP</option>
            <option value="ltp_tracking">Delivery</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-[13px] text-pae-text-secondary">
          VP:
          <select
            value={vpFilter}
            onChange={(e) => setVpFilter(e.target.value)}
            className="h-9 rounded-lg border border-pae-border bg-pae-surface px-2 text-[13px] text-pae-text focus:border-pae-blue focus:outline-none"
          >
            <option value="all">Todas</option>
            {data.available_vps.map((vp) => (
              <option key={vp} value={vp}>
                {vp}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-[13px] text-pae-text-secondary">
          Ordenar:
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 rounded-lg border border-pae-border bg-pae-surface px-2 text-[13px] text-pae-text focus:border-pae-blue focus:outline-none"
          >
            <option value="name_asc">Nombre (A-Z)</option>
            <option value="value_desc">Valor esperado ↓</option>
            <option value="value_asc">Valor esperado ↑</option>
            <option value="stage">Etapa</option>
          </select>
        </label>
      </div>

      {/* Tabs */}
      <div className="border-b border-pae-border">
        <nav className="flex gap-6">
          <button
            type="button"
            onClick={() => setTab("own")}
            className={`relative -mb-px border-b-[3px] px-1 py-2 text-[14px] transition ${
              tab === "own"
                ? "border-pae-blue font-semibold text-pae-blue"
                : "border-transparent text-pae-text-secondary hover:text-pae-text"
            }`}
          >
            Iniciativas propias{" "}
            <span className="ml-1 text-[12px] text-pae-text-tertiary">
              ({data.own.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("impacting")}
            className={`relative -mb-px border-b-[3px] px-1 py-2 text-[14px] transition ${
              tab === "impacting"
                ? "border-pae-blue font-semibold text-pae-blue"
                : "border-transparent text-pae-text-secondary hover:text-pae-text"
            }`}
          >
            Que me impactan{" "}
            <span className="ml-1 text-[12px] text-pae-text-tertiary">
              ({data.impacting.length})
            </span>
          </button>
        </nav>
      </div>

      {visibleCards.length === 0 ? (
        <div className="rounded-xl bg-pae-surface p-8 text-center shadow-sm">
          <p className="text-[14px] text-pae-text-secondary">
            {totalAll === 0
              ? "Todavía no hay iniciativas cargadas."
              : "Ninguna iniciativa coincide con los filtros."}
          </p>
          {totalAll === 0 && canCreate && (
            <Link
              href="/nueva-propuesta"
              className="mt-4 inline-block rounded-lg bg-pae-blue px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-pae-blue/90"
            >
              + Nueva propuesta
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleCards.map((ini) => (
            <InitiativeCard key={ini.id} ini={ini} />
          ))}
        </div>
      )}

      <EmptyStateModal
        open={emptyModalOpen}
        onClose={() => setEmptyModalOpen(false)}
        canCreate={canCreate}
      />
    </div>
  );
}

function InitiativeCard({ ini }: { ini: IniciativaCard }) {
  const stageChip = STAGE_CHIP[ini.current_stage];
  const statusTone = statusChipTone(ini.status);
  const accent = STAGE_ACCENT[ini.current_stage];
  const rolesText = ini.roles
    .map((r) => `${r.abbr}: ${r.display_name.split(" ").map((p, i) => (i === 0 ? p.charAt(0) + "." : p)).join(" ")}`)
    .join(" | ");

  return (
    <div className="card-initiative p-5">
      <span
        className={`absolute left-0 top-0 h-full w-[3px] ${accent}`}
        aria-hidden
      />
      <div className="pl-2">
        <Link
          href={`/iniciativas/${ini.id}`}
          className="block text-[15px] font-medium text-pae-text transition-colors hover:text-pae-blue"
        >
          {ini.name}
        </Link>

        <div className="mt-2 flex flex-wrap gap-2">
          <span
            title={STAGE_TOOLTIP[ini.current_stage]}
            className={`pill-interactive ${stageChip.bg} ${stageChip.text}`}
          >
            {STAGE_LABEL[ini.current_stage]}
          </span>
          <span
            title={`Estado: ${ini.status_label}`}
            className={`pill-interactive ${statusTone.bg} ${statusTone.text}`}
          >
            {ini.status_label}
          </span>
        </div>

        {rolesText && (
          <p className="mt-3 text-[12px] font-normal text-pae-text-secondary">
            {rolesText}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="Valor esp." value={fmtUsd(ini.expected_value_usd)} />
          <Metric label="Gasto esp." value={fmtUsd(ini.expected_cost_usd)} />
          {ini.third_metric ? (
            <Metric
              label={ini.third_metric.label}
              value={ini.third_metric.value}
            />
          ) : (
            <Metric label="—" value="—" muted />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {ini.pending_action ? (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-pae-red">
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full bg-pae-red"
                aria-hidden
              />
              {ini.pending_action}
            </p>
          ) : (
            <span />
          )}
          <Link
            href={`/iniciativas/${ini.id}`}
            className="shrink-0 rounded-lg border border-pae-border bg-pae-surface px-3 py-1.5 text-[12px] font-medium text-pae-blue hover:border-pae-blue/40 hover:bg-pae-blue/5"
          >
            Ir a iniciativa →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[14px] font-medium tabular-nums ${
          muted ? "text-pae-text-tertiary" : "text-pae-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
