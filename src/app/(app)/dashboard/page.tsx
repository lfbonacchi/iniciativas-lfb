"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Id, InitiativeStage } from "@/types";
import {
  getDashboardData,
  roleDisplayName,
  type DashboardData,
  type DashboardEvent,
  type RankingRow,
  type StageDistribution,
  type ValueStream,
  type VpBreakdown,
} from "@/lib/storage/dashboard";
import { AddEventModal } from "@/components/events/AddEventModal";
import { EventDetailModal } from "@/components/events/EventDetailModal";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtUsdShort(value: number): string {
  if (value === 0) return "USD 0";
  if (value >= 1_000_000) return `USD ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `USD ${(value / 1_000).toFixed(0)}K`;
  return `USD ${value}`;
}

function fmtHoursShort(hours: number): string {
  if (hours >= 1_000) return `${(hours / 1_000).toFixed(0)}K h`;
  return `${hours} h`;
}

function fmtDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

const STAGE_LABEL: Record<InitiativeStage, string> = {
  proposal: "Propuesta",
  dimensioning: "Dimensionamiento",
  mvp: "MVP",
  ltp_tracking: "Delivery",
};

const STAGE_SHORT: Record<InitiativeStage, string> = {
  proposal: "Prop.",
  dimensioning: "Dim.",
  mvp: "MVP",
  ltp_tracking: "Delivery",
};

const STAGE_TONE: Record<
  InitiativeStage,
  { bar: string; chipBg: string; chipText: string }
> = {
  proposal: {
    bar: "bg-pae-blue/60",
    chipBg: "bg-pae-blue/10",
    chipText: "text-pae-blue",
  },
  dimensioning: {
    bar: "bg-pae-blue/60",
    chipBg: "bg-pae-blue/10",
    chipText: "text-pae-blue",
  },
  mvp: {
    bar: "bg-pae-blue/60",
    chipBg: "bg-pae-blue/10",
    chipText: "text-pae-blue",
  },
  ltp_tracking: {
    bar: "bg-pae-green/60",
    chipBg: "bg-pae-green/10",
    chipText: "text-pae-green",
  },
};

// ---------------------------------------------------------------------------
// Block components
// ---------------------------------------------------------------------------

function KpiCards({ data }: { data: DashboardData }) {
  const { kpis } = data;
  const gatesBorder =
    kpis.gates_pending > 0 ? "before:bg-pae-red" : "before:bg-pae-text-tertiary";

  const cards = [
    {
      label: "Iniciativas activas",
      value: String(kpis.total_initiatives),
      accent: "before:bg-pae-blue",
    },
    {
      label: "Valor total",
      value: fmtUsdShort(kpis.total_value_usd),
      accent: "before:bg-pae-green",
    },
    {
      label: "Gasto total",
      value: fmtUsdShort(kpis.total_cost_usd),
      accent: "before:bg-pae-text-secondary",
    },
    {
      label: "Gates pendientes",
      value: String(kpis.gates_pending),
      accent: gatesBorder,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`relative overflow-hidden rounded-xl bg-pae-surface p-4 shadow-sm before:absolute before:left-0 before:right-0 before:top-0 before:h-1 ${c.accent}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
            {c.label}
          </p>
          <p className="mt-3 text-[20px] font-bold text-pae-text">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function StageDistributionCard({ dist }: { dist: StageDistribution }) {
  const entries: { stage: InitiativeStage; count: number }[] = [
    { stage: "proposal", count: dist.by_stage.proposal },
    { stage: "dimensioning", count: dist.by_stage.dimensioning },
    { stage: "mvp", count: dist.by_stage.mvp },
    { stage: "ltp_tracking", count: dist.by_stage.ltp_tracking },
  ];
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h3 className="text-[16px] font-semibold text-pae-text">
        Distribución por etapa
      </h3>
      <div
        className="mt-6 flex items-end justify-around gap-4"
        style={{ height: 200 }}
      >
        {entries.map((e) => {
          const isEmpty = e.count === 0;
          const h = isEmpty ? 0 : Math.round((e.count / max) * 140);
          const tone = STAGE_TONE[e.stage];
          return (
            <div
              key={e.stage}
              className="flex flex-col items-center gap-2"
            >
              <span
                className={`whitespace-nowrap text-[13px] font-semibold ${isEmpty ? "text-pae-text-tertiary" : "text-pae-text"}`}
              >
                {e.count}
              </span>
              {isEmpty ? (
                <div className="w-12" style={{ height: 1 }} aria-hidden />
              ) : (
                <div
                  className={`w-12 rounded-md ${tone.bar}`}
                  style={{ height: `${h}px` }}
                />
              )}
              <span className="whitespace-nowrap text-[11px] text-pae-text-secondary">
                {STAGE_SHORT[e.stage]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] text-pae-text-tertiary">
        Pausadas: {dist.paused} · Rechazadas: {dist.rejected}
      </p>
    </div>
  );
}

function ValueStreamsCard({ streams }: { streams: ValueStream[] }) {
  const max = Math.max(1, ...streams.map((s) => s.value_usd_y1));
  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h3 className="text-[16px] font-semibold text-pae-text">
        Corrientes de valor
      </h3>
      <p className="mt-1 text-[13px] text-pae-text-secondary">
        Proyección año 1 (HH convertido a USD · USD 60/h)
      </p>
      <div
        className="mt-6 flex items-end justify-around gap-4"
        style={{ height: 200 }}
      >
        {streams.map((s) => {
          const isEmpty = s.value_usd_y1 === 0;
          const h = isEmpty ? 0 : Math.round((s.value_usd_y1 / max) * 140);
          return (
            <div key={s.key} className="flex flex-col items-center gap-2">
              <span
                className={`whitespace-nowrap text-[12px] font-semibold ${isEmpty ? "text-pae-text-tertiary" : "text-pae-text"}`}
              >
                {isEmpty ? "—" : fmtUsdShort(s.value_usd_y1)}
              </span>
              {isEmpty ? (
                <div className="w-10" style={{ height: 1 }} aria-hidden />
              ) : (
                <div
                  className={`w-10 rounded-md ${
                    s.key === "opex" || s.key === "capex"
                      ? "bg-pae-blue/50"
                      : s.key === "hh"
                        ? "bg-pae-text-secondary/50"
                        : "bg-pae-green/50"
                  }`}
                  style={{ height: `${h}px` }}
                />
              )}
              <span className="whitespace-nowrap text-[11px] text-pae-text-secondary">
                {s.key === "hh" && s.raw_value
                  ? `HH (${fmtHoursShort(s.raw_value)})`
                  : s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type RankingSortKey =
  | "initiative_name"
  | "stage"
  | "expected_value_usd"
  | "expected_cost_usd"
  | "roi";

function RankingCard({ rows }: { rows: RankingRow[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<RankingSortKey>("roi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const maxRoi = useMemo(
    () => rows.reduce((acc, r) => (r.roi > acc ? r.roi : acc), 0),
    [rows],
  );

  function toggleSort(key: RankingSortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(
        key === "initiative_name" || key === "stage" ? "asc" : "desc",
      );
    }
  }

  function arrow(key: RankingSortKey): string {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  const HeaderCell = ({
    label,
    sortKeyName,
    align = "left",
  }: {
    label: string;
    sortKeyName: RankingSortKey;
    align?: "left" | "right";
  }) => (
    <th
      className={`px-3 py-2 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => toggleSort(sortKeyName)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary hover:text-pae-text-secondary"
      >
        {label} <span aria-hidden>{arrow(sortKeyName)}</span>
      </button>
    </th>
  );

  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-pae-text">
          Ranking de iniciativas
        </h3>
        <span className="text-[13px] text-pae-text-tertiary">
          Ordenar: {sortKey} {sortDir === "asc" ? "↑" : "↓"}
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-pae-border">
              <HeaderCell label="Iniciativa" sortKeyName="initiative_name" />
              <HeaderCell label="Etapa" sortKeyName="stage" />
              <HeaderCell
                label="Valor esp."
                sortKeyName="expected_value_usd"
                align="right"
              />
              <HeaderCell
                label="Gasto esp."
                sortKeyName="expected_cost_usd"
                align="right"
              />
              <HeaderCell label="ROI" sortKeyName="roi" align="right" />
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-[13px] text-pae-text-tertiary"
                >
                  Todavía no hay iniciativas para mostrar.
                </td>
              </tr>
            )}
            {sorted.map((row) => {
              const tone = STAGE_TONE[row.stage];
              return (
                <tr
                  key={row.initiative_id}
                  onClick={() =>
                    router.push(`/iniciativas/${row.initiative_id}`)
                  }
                  className="cursor-pointer border-b border-pae-border/60 transition hover:bg-pae-bg"
                >
                  <td className="px-3 py-2.5 text-[13px] text-pae-text">
                    {row.initiative_name}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-[2px] text-[12px] font-medium ${tone.chipBg} ${tone.chipText}`}
                    >
                      {STAGE_SHORT[row.stage]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[13px] text-pae-text">
                    {fmtUsdShort(row.expected_value_usd)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[13px] text-pae-text-secondary">
                    {fmtUsdShort(row.expected_cost_usd)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <span
                        className="h-[6px] rounded-full bg-pae-green/70"
                        style={{
                          width: `${Math.max(4, Math.round((row.roi / Math.max(maxRoi, 0.01)) * 56))}px`,
                        }}
                        aria-hidden
                      />
                      <span className="min-w-[40px] text-right text-[13px] font-semibold tabular-nums text-pae-green">
                        {row.roi.toFixed(1)}x
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {row.has_pending_gate ? (
                      <span className="rounded-full bg-pae-red/10 px-2 py-[2px] text-[12px] font-medium text-pae-red">
                        Gate
                      </span>
                    ) : (
                      <span className="rounded-full bg-pae-green/10 px-2 py-[2px] text-[12px] font-medium text-pae-green">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const EVENT_TONE: Record<DashboardEvent["kind"], string> = {
  gate: "bg-pae-red",
  sprint_review: "bg-pae-blue",
  seguimiento: "bg-pae-blue",
  ltp_plan: "bg-pae-green",
  entrega: "bg-pae-green",
};

function UpcomingEventsCard({
  events,
  onAddClick,
  onEventClick,
}: {
  events: DashboardEvent[];
  onAddClick: () => void;
  onEventClick: (event: DashboardEvent) => void;
}) {
  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-pae-text">
          Próximos eventos
        </h3>
        <button
          type="button"
          onClick={onAddClick}
          className="rounded-lg border border-pae-border bg-pae-surface px-3 py-1.5 text-[13px] font-medium text-pae-blue transition hover:bg-pae-blue/5"
        >
          + Agregar evento
        </button>
      </div>

      {events.length === 0 ? (
        <p className="mt-6 text-[13px] text-pae-text-tertiary">
          No hay eventos próximos.
        </p>
      ) : (
        <div className="relative mt-8">
          <div
            className="absolute left-4 right-4 top-[6px] h-[1px] bg-pae-border"
            aria-hidden
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {events.map((evt) => (
              <button
                key={evt.id}
                type="button"
                onClick={() => onEventClick(evt)}
                className="group relative flex flex-col items-center rounded-lg px-1 py-2 text-center transition hover:bg-pae-bg"
                aria-label={`Ver detalle de ${evt.name}`}
              >
                <span
                  className={`mb-3 h-3 w-3 shrink-0 rounded-full ring-4 ring-pae-surface transition group-hover:scale-125 ${EVENT_TONE[evt.kind]}`}
                  aria-hidden
                />
                <p className="text-[12px] font-semibold text-pae-text group-hover:text-pae-blue">
                  {evt.name}
                </p>
                <p
                  className="mt-1 line-clamp-2 text-[11px] leading-tight text-pae-text-secondary"
                  title={evt.initiative_name}
                >
                  {evt.initiative_name}
                </p>
                <p className="mt-1 text-[11px] text-pae-text-tertiary">
                  {fmtDateShort(evt.date)}
                </p>
                {evt.your_vote_pending && (
                  <p className="mt-1 text-[11px] font-semibold text-pae-red">
                    Tu voto
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VpSmallMultiplesCard({
  breakdown,
}: {
  breakdown: VpBreakdown[];
}) {
  const stages: InitiativeStage[] = [
    "proposal",
    "dimensioning",
    "mvp",
    "ltp_tracking",
  ];
  const globalMax = breakdown.reduce(
    (acc, b) =>
      Math.max(acc, ...stages.map((s) => b.by_stage[s])),
    1,
  );

  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h3 className="text-[16px] font-semibold text-pae-text">
        Distribución por etapa · por vicepresidencia
      </h3>
      <p className="mt-1 text-[13px] text-pae-text-secondary">
        Misma escala en todos los paneles para comparar directamente.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {breakdown.map((vp) => (
          <div
            key={vp.vicepresidencia}
            className="rounded-lg border border-pae-border bg-pae-bg/40 p-3"
          >
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] font-semibold text-pae-text">
                {vp.vicepresidencia}
              </p>
              <p className="text-[11px] text-pae-text-tertiary tabular-nums">
                {vp.total} inic.
              </p>
            </div>
            <div
              className="mt-3 flex items-end justify-between gap-2"
              style={{ height: 80 }}
            >
              {stages.map((stage) => {
                const count = vp.by_stage[stage];
                const h = count === 0 ? 0 : Math.round((count / globalMax) * 64);
                const tone = STAGE_TONE[stage];
                return (
                  <div
                    key={stage}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${count === 0 ? "text-pae-text-tertiary" : "text-pae-text"}`}
                    >
                      {count}
                    </span>
                    {count === 0 ? (
                      <div className="w-full" style={{ height: 1 }} aria-hidden />
                    ) : (
                      <div
                        className={`w-full rounded-sm ${tone.bar}`}
                        style={{ height: `${h}px` }}
                      />
                    )}
                    <span className="text-[9px] text-pae-text-secondary">
                      {STAGE_SHORT[stage]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrossValueStreamsCard({
  data,
}: {
  data: NonNullable<DashboardData["cross_value_streams"]>;
}) {
  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h3 className="text-[16px] font-semibold text-pae-text">
        Corrientes de valor cruzadas
      </h3>
      <p className="mt-1 text-[13px] text-pae-text-secondary">
        Iniciativas que aportan a cada corriente
      </p>
      <table className="mt-4 min-w-full">
        <thead>
          <tr className="border-b border-pae-border">
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
              Corriente
            </th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
              Total
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
              Iniciativas
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.stream_key}
              className="border-b border-pae-border/60"
            >
              <td className="px-3 py-2.5 text-[13px] text-pae-text">
                {row.label}
              </td>
              <td className="px-3 py-2.5 text-right text-[13px] font-semibold text-pae-green">
                {row.total_label}
              </td>
              <td className="px-3 py-2.5 text-[13px] text-pae-text-secondary">
                {row.contributors
                  .map((c) => `${c.initiative_name} (${c.amount_label})`)
                  .join(" · ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vpFilter, setVpFilter] = useState<string>("all");
  const [iniFilter, setIniFilter] = useState<Id | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<DashboardEvent | null>(
    null,
  );

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const result = getDashboardData({
      vicepresidencia: vpFilter,
      initiative_id: iniFilter,
    });
    if (!result.success) {
      setError(result.error.message);
      if (result.error.code === "AUTH_REQUIRED") {
        router.replace("/seleccionar-usuario");
      }
      return;
    }
    setError(null);
    setData(result.data);
  }, [router, vpFilter, iniFilter, reloadKey]);

  if (error) {
    return (
      <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
        <p className="text-[14px] text-pae-red">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
        <p className="text-[14px] text-pae-text-secondary">Cargando…</p>
      </div>
    );
  }

  const title = `Dashboards — ${roleDisplayName(data.role_key)}: ${data.user.display_name} (${data.kpis.total_initiatives} inic.)`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[18px] font-semibold text-pae-text">{title}</h1>

        <div className="flex flex-wrap items-center gap-3">
          {data.role_key === "at" && (
            <label className="flex items-center gap-2 text-[14px] text-pae-text-secondary">
              Filtro VP:
              <select
                value={vpFilter}
                onChange={(e) => setVpFilter(e.target.value)}
                className="h-8 rounded-lg border border-pae-border bg-pae-surface px-2 text-[14px] text-pae-text focus:border-pae-blue focus:outline-none"
              >
                <option value="all">Todas</option>
                {data.available_vps.map((vp) => (
                  <option key={vp} value={vp}>
                    {vp}
                  </option>
                ))}
              </select>
            </label>
          )}

          {data.role_key === "vp" && (
            <label className="flex items-center gap-2 text-[14px] text-pae-text-secondary">
              Iniciativa:
              <select
                value={iniFilter}
                onChange={(e) => setIniFilter(e.target.value as Id | "all")}
                className="h-8 max-w-[240px] rounded-lg border border-pae-border bg-pae-surface px-2 text-[14px] text-pae-text focus:border-pae-blue focus:outline-none"
              >
                <option value="all">Todas</option>
                {data.available_initiatives.map((ini) => (
                  <option key={ini.id} value={ini.id}>
                    {ini.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            onClick={() => alert("Generación PPTX pendiente")}
            className="rounded-lg border border-pae-red px-3 py-1.5 text-[14px] font-semibold text-pae-red transition hover:bg-pae-red/5"
          >
            Descargar PPTX
          </button>
        </div>
      </div>

      <KpiCards data={data} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StageDistributionCard dist={data.stage_distribution} />
        <ValueStreamsCard streams={data.value_streams} />
      </div>

      {data.role_key === "at" &&
        data.vp_breakdown &&
        data.vp_breakdown.length > 0 && (
          <VpSmallMultiplesCard breakdown={data.vp_breakdown} />
        )}

      {data.role_key === "vp" && data.cross_value_streams && (
        <CrossValueStreamsCard data={data.cross_value_streams} />
      )}

      <RankingCard rows={data.ranking} />

      <UpcomingEventsCard
        events={data.events}
        onAddClick={() => setModalOpen(true)}
        onEventClick={(evt) => setSelectedEvent(evt)}
      />

      <AddEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={reload}
        initiatives={data.available_initiatives}
      />

      <EventDetailModal
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        onChanged={reload}
        event={
          selectedEvent
            ? {
                id: selectedEvent.id,
                name: selectedEvent.name,
                type: selectedEvent.event_type,
                initiative_id: selectedEvent.initiative_id,
                initiative_name: selectedEvent.initiative_name,
                date: selectedEvent.date,
                is_custom: selectedEvent.is_custom,
              }
            : null
        }
      />
    </div>
  );
}
