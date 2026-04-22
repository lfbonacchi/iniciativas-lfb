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
import {
  getOverlay,
  HH_USD_RATE,
  type ValueStreamKey,
} from "./financials";

export type { ValueStreamKey };

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

export interface ValueStream {
  key: ValueStreamKey;
  label: string;
  value_usd_y1: number;
  raw_value?: number;
  raw_unit?: string;
}

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
  event_type: PortfolioEventType;
  initiative_id: Id;
  initiative_name: string;
  date: string;
  your_vote_pending: boolean;
  is_custom: boolean;
  status: "scheduled" | "cancelled";
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

export interface VpBreakdown {
  vicepresidencia: string;
  total: number;
  by_stage: Record<InitiativeStage, number>;
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
  vp_breakdown?: VpBreakdown[];
}

// Financial overlay lives in ./financials so the dashboard and mis-iniciativas
// share the exact same data source.

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
    event_type: evt.type,
    initiative_id: ini.id,
    initiative_name: ini.name,
    date: evt.date,
    your_vote_pending: false,
    is_custom: true,
    status: evt.status,
  };
}

const EVENTS_ANCHOR = Date.UTC(2026, 3, 14); // 14 abril 2026

function dateOffsetIso(days: number): string {
  const d = new Date(EVENTS_ANCHOR + days * 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function iniJitter(id: Id): number {
  const match = id.match(/(\d+)$/);
  const digits = match?.[1];
  if (!digits) return 0;
  return parseInt(digits, 10) % 7;
}

function computeEvents(
  store: Store,
  initiatives: Initiative[],
  userVotePending: Set<Id>,
): DashboardEvent[] {
  const byId = new Map(initiatives.map((i) => [i.id, i]));
  const evts: DashboardEvent[] = [];

  // ---- 1) Pending gateways → Gate N (concretos)
  const pendingGateways = store.gateways.filter(
    (g) => g.status === "pending" && byId.has(g.initiative_id),
  );
  pendingGateways.forEach((g, idx) => {
    const ini = byId.get(g.initiative_id);
    if (!ini) return;
    evts.push({
      id: `evt_gate_${g.id}`,
      name: `Gate ${g.gateway_number}`,
      kind: "gate",
      event_type: "gate",
      status: "scheduled",
      initiative_id: ini.id,
      initiative_name: ini.name,
      date: dateOffsetIso(idx * 7),
      your_vote_pending: userVotePending.has(g.id),
      is_custom: false,
    });
  });

  // ---- 2) Eventos sintetizados por etapa desde los formularios
  for (const ini of initiatives) {
    if (ini.status !== "in_progress") continue;
    const iniForms = store.forms.filter((f) => f.initiative_id === ini.id);
    const hasDraft = iniForms.some((f) => f.status === "draft");
    const hasSubmitted = iniForms.some((f) => f.status === "submitted");
    const jitter = iniJitter(ini.id);

    if (ini.current_stage === "proposal") {
      if (hasDraft) {
        evts.push({
          id: `evt_sprint_prop_${ini.id}`,
          name: "Sprint Propuesta",
          kind: "sprint_review",
          event_type: "sprint_review",
          status: "scheduled",
          initiative_id: ini.id,
          initiative_name: ini.name,
          date: dateOffsetIso(10 + jitter),
          your_vote_pending: false,
      is_custom: false,
        });
      }
      if (hasDraft || hasSubmitted) {
        evts.push({
          id: `evt_next_gate1_${ini.id}`,
          name: "Próximo Gate 1",
          kind: "gate",
          event_type: "gate",
          status: "scheduled",
          initiative_id: ini.id,
          initiative_name: ini.name,
          date: dateOffsetIso(21 + jitter),
          your_vote_pending: false,
      is_custom: false,
        });
      }
    } else if (ini.current_stage === "dimensioning") {
      evts.push({
        id: `evt_sprint_dim_${ini.id}`,
        name: "Sprint Dimensionamiento",
        kind: "sprint_review",
        event_type: "sprint_review",
        status: "scheduled",
        initiative_id: ini.id,
        initiative_name: ini.name,
        date: dateOffsetIso(7 + jitter),
        your_vote_pending: false,
      is_custom: false,
      });
      if (hasDraft) {
        evts.push({
          id: `evt_next_gate2_${ini.id}`,
          name: "Próximo Gate 2",
          kind: "gate",
          event_type: "gate",
          status: "scheduled",
          initiative_id: ini.id,
          initiative_name: ini.name,
          date: dateOffsetIso(28 + jitter),
          your_vote_pending: false,
      is_custom: false,
        });
      }
    } else if (ini.current_stage === "mvp") {
      evts.push({
        id: `evt_sprint_mvp_${ini.id}`,
        name: "Sprint MVP",
        kind: "sprint_review",
        event_type: "sprint_review",
        status: "scheduled",
        initiative_id: ini.id,
        initiative_name: ini.name,
        date: dateOffsetIso(5 + jitter),
        your_vote_pending: false,
      is_custom: false,
      });
      if (hasDraft) {
        evts.push({
          id: `evt_next_gate3_${ini.id}`,
          name: "Próximo Gate 3",
          kind: "gate",
          event_type: "gate",
          status: "scheduled",
          initiative_id: ini.id,
          initiative_name: ini.name,
          date: dateOffsetIso(35 + jitter),
          your_vote_pending: false,
      is_custom: false,
        });
      }
    } else if (ini.current_stage === "ltp_tracking") {
      evts.push({
        id: `evt_seg_m_${ini.id}`,
        name: "Seg. mensual",
        kind: "seguimiento",
        event_type: "seg_mensual",
        status: "scheduled",
        initiative_id: ini.id,
        initiative_name: ini.name,
        date: dateOffsetIso(14 + jitter),
        your_vote_pending: false,
      is_custom: false,
      });
      const hasF4 = iniForms.some((f) => f.form_type === "F4");
      const hasF5 = iniForms.some((f) => f.form_type === "F5");
      if (hasF4 || hasF5) {
        evts.push({
          id: `evt_ltp_review_${ini.id}`,
          name: hasF5 ? "Review F5 · Planificación" : "Review F4 · Visión Anual",
          kind: "ltp_plan",
          event_type: "ltp_plan",
          status: "scheduled",
          initiative_id: ini.id,
          initiative_name: ini.name,
          date: dateOffsetIso(42 + jitter),
          your_vote_pending: false,
      is_custom: false,
        });
      }
    }
  }

  // ---- 3) Eventos custom creados por el usuario (incluye materializados
  //      de sintetizados). Custom gana ante duplicados de id.
  const customMapped: DashboardEvent[] = [];
  for (const evt of store.portfolio_events) {
    const mapped = mapCustomEvent(evt, byId);
    if (mapped) customMapped.push(mapped);
  }
  const customIds = new Set(customMapped.map((e) => e.id));

  // Orden + dedup: custom primero (gana), luego sintetizados no duplicados.
  const all: DashboardEvent[] = [
    ...customMapped,
    ...evts.filter((e) => !customIds.has(e.id)),
  ];
  // Filtrar cancelados del timeline (siguen en store para historial).
  const visible = all.filter((e) => e.status !== "cancelled");
  visible.sort((a, b) => a.date.localeCompare(b.date));

  return visible.slice(0, 12);
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

  if (roleKey === "at") {
    data.vp_breakdown = computeVpBreakdown(filtered);
  }

  return ok(data);
}

function computeVpBreakdown(initiatives: Initiative[]): VpBreakdown[] {
  const map = new Map<string, VpBreakdown>();
  for (const ini of initiatives) {
    const vp = getOverlay(ini.id).vicepresidencia;
    let entry = map.get(vp);
    if (!entry) {
      entry = {
        vicepresidencia: vp,
        total: 0,
        by_stage: { proposal: 0, dimensioning: 0, mvp: 0, ltp_tracking: 0 },
      };
      map.set(vp, entry);
    }
    entry.total += 1;
    entry.by_stage[ini.current_stage] += 1;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.vicepresidencia.localeCompare(b.vicepresidencia),
  );
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
