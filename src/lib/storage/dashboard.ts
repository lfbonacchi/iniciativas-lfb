import type {
  Gateway,
  Id,
  Initiative,
  InitiativeStage,
  InitiativeStatus,
  PortfolioEvent,
  PortfolioEventType,
  User,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import {
  getCurrentUserFromStore,
  isAreaTransformacion,
} from "./_security";
import { readStore, type Store } from "./_store";

export type DashboardRoleKey = "at" | "vp" | "bo" | "po";

export interface DashboardFilters {
  vicepresidencia: string | "all";
  initiative_id: Id | "all";
}

export interface KpiMetrics {
  total_initiatives: number;
  total_value_usd: number;
  total_cost_usd: number;
  gates_pending: number;
}

export interface StageDistribution {
  by_stage: Record<InitiativeStage, number>;
  paused: number;
  rejected: number;
}

export type ValueStreamKey =
  | "produccion"
  | "opex"
  | "capex"
  | "hh"
  | "intangible";

export interface ValueStream {
  key: ValueStreamKey;
  label: string;
  value_usd_y1: number;
  raw_value?: number;
  raw_unit?: string;
}

const HH_USD_RATE = 60;

export interface RankingRow {
  initiative_id: Id;
  initiative_name: string;
  stage: InitiativeStage;
  expected_value_usd: number;
  expected_cost_usd: number;
  roi: number;
  has_pending_gate: boolean;
}

export type DashboardEventKind =
  | "gate"
  | "sprint_review"
  | "seguimiento"
  | "ltp_plan"
  | "entrega";

export interface DashboardEvent {
  id: Id;
  name: string;
  kind: DashboardEventKind;
  initiative_id: Id;
  initiative_name: string;
  date: string;
  your_vote_pending: boolean;
}

export interface ValueStreamCrossRow {
  stream_key: ValueStreamKey;
  label: string;
  total_label: string;
  contributors: { initiative_name: string; amount_label: string }[];
}

export interface DashboardInitiativeOption {
  id: Id;
  name: string;
}

export interface DashboardData {
  role_key: DashboardRoleKey;
  user: User;
  filters: DashboardFilters;
  available_vps: string[];
  available_initiatives: DashboardInitiativeOption[];
  kpis: KpiMetrics;
  stage_distribution: StageDistribution;
  value_streams: ValueStream[];
  ranking: RankingRow[];
  events: DashboardEvent[];
  cross_value_streams?: ValueStreamCrossRow[];
}

// ---------------------------------------------------------------------------
// Mock financial overlay per initiative (deterministic, demo-ready).
// Real data lives embedded in form responses; for the dashboard we surface
// a stable per-initiative overlay so totals/ROI are consistent demo-to-demo.
// ---------------------------------------------------------------------------

interface FinancialOverlay {
  expected_value_usd: number;
  expected_cost_usd: number;
  vicepresidencia: string;
  contribution: Partial<Record<ValueStreamKey, number>>;
}

const FINANCIAL_OVERLAY: Record<Id, FinancialOverlay> = {
  "ini-001": {
    expected_value_usd: 1_200_000,
    expected_cost_usd: 180_000,
    vicepresidencia: "VP Upstream",
    contribution: { produccion: 8_000_000, opex: 2_100_000 },
  },
  "ini-002": {
    expected_value_usd: 3_500_000,
    expected_cost_usd: 420_000,
    vicepresidencia: "VP Upstream",
    contribution: { opex: 3_100_000, intangible: 900_000 },
  },
  "ini-003": {
    expected_value_usd: 950_000,
    expected_cost_usd: 95_000,
    vicepresidencia: "VP Upstream",
    contribution: { opex: 850_000, hh: 6_000 },
  },
  "ini-004": {
    expected_value_usd: 5_200_000,
    expected_cost_usd: 620_000,
    vicepresidencia: "VP Upstream",
    contribution: { produccion: 4_400_000, opex: 1_200_000, hh: 8_000 },
  },
  "ini-005": {
    expected_value_usd: 2_800_000,
    expected_cost_usd: 450_000,
    vicepresidencia: "VP Upstream",
    contribution: { opex: 1_400_000, intangible: 1_100_000 },
  },
  "ini-006": {
    expected_value_usd: 1_800_000,
    expected_cost_usd: 240_000,
    vicepresidencia: "VP Downstream",
    contribution: { opex: 900_000, intangible: 700_000, hh: 4_000 },
  },
  "ini-007": {
    expected_value_usd: 2_100_000,
    expected_cost_usd: 310_000,
    vicepresidencia: "VP Downstream",
    contribution: { opex: 1_500_000, capex: 380_000 },
  },
  "ini-008": {
    expected_value_usd: 650_000,
    expected_cost_usd: 150_000,
    vicepresidencia: "VP Upstream",
    contribution: { intangible: 500_000 },
  },
};

function getOverlay(id: Id): FinancialOverlay {
  return (
    FINANCIAL_OVERLAY[id] ?? {
      expected_value_usd: 0,
      expected_cost_usd: 0,
      vicepresidencia: "VP Upstream",
      contribution: {},
    }
  );
}

// ---------------------------------------------------------------------------
// Role resolution
// ---------------------------------------------------------------------------

function resolveRoleKey(user: User, store: Store): DashboardRoleKey {
  if (isAreaTransformacion(user)) return "at";
  if (user.is_vp) return "vp";
  const roles = store.initiative_members
    .filter((m) => m.user_id === user.id)
    .map((m) => m.role);
  if (roles.includes("bo")) return "bo";
  return "po";
}

function initiativesForUser(
  user: User,
  roleKey: DashboardRoleKey,
  store: Store,
): Initiative[] {
  if (roleKey === "at") return store.initiatives;

  if (roleKey === "vp") {
    return store.initiatives.filter((ini) => {
      const overlay = getOverlay(ini.id);
      return overlay.vicepresidencia === user.vicepresidencia;
    });
  }

  const roleFilter: Record<DashboardRoleKey, string[]> = {
    at: [],
    vp: [],
    bo: ["bo"],
    po: ["po", "promotor", "ld"],
  };
  const allowedRoles = roleFilter[roleKey];
  const myInitiativeIds = new Set(
    store.initiative_members
      .filter(
        (m) => m.user_id === user.id && allowedRoles.includes(m.role),
      )
      .map((m) => m.initiative_id),
  );
  return store.initiatives.filter((ini) => myInitiativeIds.has(ini.id));
}

// ---------------------------------------------------------------------------
// KPI and block computations
// ---------------------------------------------------------------------------

function isActiveStatus(status: InitiativeStatus): boolean {
  return status !== "rejected";
}

function pendingGatesForScope(
  store: Store,
  scopedIds: Set<Id>,
  user: User,
  roleKey: DashboardRoleKey,
): { gateways: Gateway[]; userVotePending: Set<Id> } {
  const gateways = store.gateways.filter(
    (g) => scopedIds.has(g.initiative_id) && g.status === "pending",
  );
  const userVotePending = new Set<Id>();
  if (roleKey === "vp") {
    for (const g of gateways) {
      const voted = store.gateway_votes.some(
        (v) => v.gateway_id === g.id && v.user_id === user.id,
      );
      if (!voted) userVotePending.add(g.id);
    }
  }
  return { gateways, userVotePending };
}

function computeKpis(
  initiatives: Initiative[],
  gatewaysPending: Gateway[],
): KpiMetrics {
  let value = 0;
  let cost = 0;
  for (const ini of initiatives) {
    const o = getOverlay(ini.id);
    value += o.expected_value_usd;
    cost += o.expected_cost_usd;
  }
  return {
    total_initiatives: initiatives.filter((i) => isActiveStatus(i.status))
      .length,
    total_value_usd: value,
    total_cost_usd: cost,
    gates_pending: gatewaysPending.length,
  };
}

function computeStageDistribution(
  initiatives: Initiative[],
): StageDistribution {
  const dist: StageDistribution = {
    by_stage: {
      proposal: 0,
      dimensioning: 0,
      mvp: 0,
      ltp_tracking: 0,
    },
    paused: 0,
    rejected: 0,
  };
  for (const ini of initiatives) {
    if (ini.status === "paused") dist.paused += 1;
    if (ini.status === "rejected") dist.rejected += 1;
    dist.by_stage[ini.current_stage] += 1;
  }
  return dist;
}

const STREAM_LABELS: Record<ValueStreamKey, string> = {
  produccion: "Producción",
  opex: "OPEX",
  capex: "CAPEX",
  hh: "HH",
  intangible: "Intangible",
};

function computeValueStreams(initiatives: Initiative[]): ValueStream[] {
  const totals: Record<ValueStreamKey, number> = {
    produccion: 0,
    opex: 0,
    capex: 0,
    hh: 0,
    intangible: 0,
  };
  for (const ini of initiatives) {
    const o = getOverlay(ini.id);
    for (const [key, amount] of Object.entries(o.contribution)) {
      const k = key as ValueStreamKey;
      totals[k] += amount ?? 0;
    }
  }
  return (Object.keys(totals) as ValueStreamKey[]).map((key) => {
    if (key === "hh") {
      const hours = totals.hh;
      return {
        key,
        label: STREAM_LABELS[key],
        value_usd_y1: hours * HH_USD_RATE,
        raw_value: hours,
        raw_unit: "h",
      };
    }
    return {
      key,
      label: STREAM_LABELS[key],
      value_usd_y1: totals[key],
    };
  });
}

function computeRanking(
  initiatives: Initiative[],
  pendingGateIds: Set<Id>,
): RankingRow[] {
  return initiatives
    .map((ini) => {
      const o = getOverlay(ini.id);
      const value = o.expected_value_usd;
      const cost = o.expected_cost_usd;
      const roi = cost > 0 ? value / cost : 0;
      return {
        initiative_id: ini.id,
        initiative_name: ini.name,
        stage: ini.current_stage,
        expected_value_usd: value,
        expected_cost_usd: cost,
        roi,
        has_pending_gate: pendingGateIds.has(ini.id),
      };
    })
    .sort((a, b) => b.roi - a.roi);
}

function computeCrossStreams(
  initiatives: Initiative[],
): ValueStreamCrossRow[] {
  const streams: ValueStreamCrossRow[] = [];
  (Object.keys(STREAM_LABELS) as ValueStreamKey[]).forEach((key) => {
    const contribs: ValueStreamCrossRow["contributors"] = [];
    let total = 0;
    for (const ini of initiatives) {
      const o = getOverlay(ini.id);
      const amount = o.contribution[key];
      if (amount && amount > 0) {
        total += amount;
        contribs.push({
          initiative_name: ini.name,
          amount_label: formatShortUsd(amount, key),
        });
      }
    }
    if (contribs.length === 0) return;
    streams.push({
      stream_key: key,
      label: STREAM_LABELS[key],
      total_label: formatShortUsd(total, key),
      contributors: contribs,
    });
  });
  return streams;
}

function formatShortUsd(v: number, key: ValueStreamKey): string {
  const sign = key === "opex" || key === "capex" ? "-" : "+";
  if (key === "hh") return `${sign}${Math.round(v / 1000)}K HH`;
  if (v >= 1_000_000) return `${sign}USD ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${sign}USD ${(v / 1_000).toFixed(0)}K`;
  return `${sign}USD ${v}`;
}

// ---------------------------------------------------------------------------
// Events: synthesized from pending gateways + a small anchored mock list.
// ---------------------------------------------------------------------------

function eventKindFromType(type: PortfolioEventType): DashboardEventKind {
  switch (type) {
    case "gate":
      return "gate";
    case "sprint_review":
      return "sprint_review";
    case "ltp_plan":
      return "ltp_plan";
    case "entrega":
      return "entrega";
    case "seg_q":
    case "seg_mensual":
    case "otro":
    default:
      return "seguimiento";
  }
}

function mapCustomEvent(
  evt: PortfolioEvent,
  byId: Map<Id, Initiative>,
): DashboardEvent | null {
  const ini = byId.get(evt.initiative_id);
  if (!ini) return null;
  return {
    id: evt.id,
    name: evt.type === "otro" && evt.custom_type_label ? evt.custom_type_label : evt.name,
    kind: eventKindFromType(evt.type),
    initiative_id: ini.id,
    initiative_name: ini.name,
    date: evt.date,
    your_vote_pending: false,
  };
}

function computeEvents(
  store: Store,
  initiatives: Initiative[],
  userVotePending: Set<Id>,
): DashboardEvent[] {
  const byId = new Map(initiatives.map((i) => [i.id, i]));
  const evts: DashboardEvent[] = [];

  const anchorDates = [
    "2026-04-14",
    "2026-04-21",
    "2026-04-28",
    "2026-05-05",
    "2026-05-12",
  ];

  // Gate events from pending gateways
  const pendingGateways = store.gateways.filter(
    (g) => g.status === "pending" && byId.has(g.initiative_id),
  );
  pendingGateways.slice(0, 3).forEach((g, idx) => {
    const ini = byId.get(g.initiative_id);
    if (!ini) return;
    evts.push({
      id: `evt_gate_${g.id}`,
      name: `Gate ${g.gateway_number}`,
      kind: "gate",
      initiative_id: ini.id,
      initiative_name: ini.name,
      date: anchorDates[idx] ?? "2026-05-01",
      your_vote_pending: userVotePending.has(g.id),
    });
  });

  // Custom events persisted by the user
  for (const evt of store.portfolio_events) {
    const mapped = mapCustomEvent(evt, byId);
    if (mapped) evts.push(mapped);
  }

  // Sort by date ascending
  evts.sort((a, b) => a.date.localeCompare(b.date));

  return evts.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getDashboardData(
  filters?: Partial<DashboardFilters>,
): Result<DashboardData> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) {
    return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  }
  const roleKey = resolveRoleKey(user, store);
  const baseInitiatives = initiativesForUser(user, roleKey, store);

  const vpFilter: string =
    roleKey === "at" ? filters?.vicepresidencia ?? "all" : "all";
  const iniFilter: Id | "all" =
    roleKey === "vp" ? filters?.initiative_id ?? "all" : "all";

  const filtered = baseInitiatives.filter((ini) => {
    if (roleKey === "at" && vpFilter !== "all") {
      if (getOverlay(ini.id).vicepresidencia !== vpFilter) return false;
    }
    if (roleKey === "vp" && iniFilter !== "all") {
      if (ini.id !== iniFilter) return false;
    }
    return true;
  });

  const scopedIds = new Set(filtered.map((i) => i.id));
  const { gateways: pendingGateways, userVotePending } =
    pendingGatesForScope(store, scopedIds, user, roleKey);
  const pendingInitiativeIds = new Set(
    pendingGateways.map((g) => g.initiative_id),
  );

  const available_vps = Array.from(
    new Set(baseInitiatives.map((i) => getOverlay(i.id).vicepresidencia)),
  ).sort();

  const available_initiatives: DashboardInitiativeOption[] = baseInitiatives
    .map((i) => ({ id: i.id, name: i.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const data: DashboardData = {
    role_key: roleKey,
    user,
    filters: { vicepresidencia: vpFilter, initiative_id: iniFilter },
    available_vps,
    available_initiatives,
    kpis: computeKpis(filtered, pendingGateways),
    stage_distribution: computeStageDistribution(filtered),
    value_streams: computeValueStreams(filtered),
    ranking: computeRanking(filtered, pendingInitiativeIds),
    events: computeEvents(store, filtered, userVotePending),
  };

  if (roleKey === "vp") {
    data.cross_value_streams = computeCrossStreams(filtered);
  }

  return ok(data);
}

export function roleDisplayName(roleKey: DashboardRoleKey): string {
  switch (roleKey) {
    case "at":
      return "Área Transformación";
    case "vp":
      return "Sponsor / VP";
    case "bo":
      return "Business Owner";
    case "po":
      return "Product Owner";
  }
}
