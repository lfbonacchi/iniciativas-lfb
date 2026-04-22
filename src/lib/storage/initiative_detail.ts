import type {
  Id,
  Initiative,
  InitiativeMemberRole,
  InitiativeStage,
  InitiativeStatus,
  InitiativeSummary,
  User,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import {
  getInitiativeSummary,
  getInitiativeSummaries,
} from "@/data/initiative_summaries";

import { readStore, type Store } from "./_store";
import {
  getCurrentUserFromStore,
  isAreaTransformacion,
  userCanAccessInitiative,
} from "./_security";
import { getOverlay } from "./financials";

export interface InitiativeHeaderRole {
  key: "po" | "ld" | "bo" | "sponsor";
  abbr: string;
  label: string;
  display_name: string;
}

export interface InitiativeStageLink {
  id: Id;
  name: string;
  current_stage: InitiativeStage;
}

export interface CrossStream {
  stream: string;
  total: string;
  initiatives: string;
}

export interface ObjectiveLink {
  objective: string;
  initiative_name: string;
  initiative_id: Id;
  stage: InitiativeStage;
  deliverable: string;
}

export interface UpcomingEvent {
  label: string;
  date_label: string;
  initiative_id: Id;
  has_vote_pending: boolean;
}

export interface InitiativeDetailKpis {
  value_usd: number;
  cost_usd: number;
  roi: number;
  hh: number;
}

export interface InitiativeDetail {
  initiative: Initiative;
  stage_label: string;
  status_label: string;
  status: InitiativeStatus;
  dimension: string;
  header_roles: InitiativeHeaderRole[];
  kpis: InitiativeDetailKpis;
  summary: InitiativeSummary;
  resolved_interdependencies: {
    initiative_id: Id | null;
    label: string;
    ref_note: string;
    stage: InitiativeStage | null;
    status: InitiativeStatus | null;
  }[];
  is_stage_4_unlocked: boolean;
  is_vp_or_at: boolean;
  vp_at_extras: {
    objectives: ObjectiveLink[];
    cross_streams: CrossStream[];
    upcoming_events: UpcomingEvent[];
  } | null;
}

const STAGE_LABEL: Record<InitiativeStage, string> = {
  proposal: "Propuesta",
  dimensioning: "Dimensionamiento",
  mvp: "MVP",
  ltp_tracking: "Delivery",
};

const STAGE_GATEWAY_NUMBER: Record<InitiativeStage, number | null> = {
  proposal: 1,
  dimensioning: 2,
  mvp: 3,
  ltp_tracking: null,
};

const ROLE_META: Record<
  InitiativeHeaderRole["key"],
  { abbr: string; label: string }
> = {
  po: { abbr: "PO", label: "Product Owner" },
  ld: { abbr: "LD", label: "Líder de Dimensión" },
  bo: { abbr: "BO", label: "Business Owner" },
  sponsor: { abbr: "Sponsor", label: "Sponsor" },
};

const HEADER_ROLE_ORDER: InitiativeHeaderRole["key"][] = [
  "po",
  "ld",
  "bo",
  "sponsor",
];

function pickUserForRole(
  role: InitiativeMemberRole,
  initiativeId: Id,
  store: Store,
): User | null {
  const m = store.initiative_members.find(
    (mm) => mm.initiative_id === initiativeId && mm.role === role,
  );
  if (!m) return null;
  return store.users.find((u) => u.id === m.user_id) ?? null;
}

function statusLabelFor(ini: Initiative): string {
  switch (ini.status) {
    case "in_progress":
      return "En progreso";
    case "pending": {
      const n = STAGE_GATEWAY_NUMBER[ini.current_stage];
      return n ? `Gateway ${n} pendiente` : "Revisión pendiente";
    }
    case "paused":
      return "Pausada";
    case "rejected":
      return "Rechazada";
    case "area_change":
      return "Cambio de área";
  }
}

function dimensionForInitiative(ini: Initiative): string {
  const map: Record<string, string> = {
    "ini-001": "Producción",
    "ini-002": "Producción",
    "ini-003": "Seguridad",
    "ini-004": "Producción",
    "ini-005": "Data & Analytics",
    "ini-006": "Sustentabilidad",
    "ini-007": "Downstream",
    "ini-008": "Data & Analytics",
  };
  return map[ini.id] ?? "Sin dimensión";
}

function parseHhValue(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

function hhFromSummary(summary: InitiativeSummary): number {
  const row = summary.value_streams_5y.find((v) =>
    v.stream.toUpperCase().startsWith("HH"),
  );
  if (!row) return 0;
  const y3 = parseHhValue(row.year_3);
  if (y3 > 0) return y3;
  const y5 = parseHhValue(row.year_5);
  if (y5 > 0) return y5;
  return parseHhValue(row.year_1);
}

function kpisFromOverlay(
  initiativeId: Id,
  summary: InitiativeSummary,
): InitiativeDetailKpis {
  const overlay = getOverlay(initiativeId);
  const value = overlay.expected_value_usd;
  const cost = overlay.expected_cost_usd;
  const roi = cost > 0 ? value / cost : 0;
  const hh = hhFromSummary(summary) || (overlay.contribution.hh ?? 0);
  return { value_usd: value, cost_usd: cost, roi, hh };
}

function isStage4Unlocked(ini: Initiative, store: Store): boolean {
  if (ini.current_stage === "ltp_tracking") return true;
  const hasF4 = store.forms.some(
    (f) => f.initiative_id === ini.id && f.form_type === "F4",
  );
  if (hasF4) return true;
  const f3Approved = store.forms.some(
    (f) =>
      f.initiative_id === ini.id &&
      f.form_type === "F3" &&
      (f.status === "approved" || f.status === "final"),
  );
  return f3Approved;
}

function vpOrAt(user: User): boolean {
  return isAreaTransformacion(user) || user.is_vp;
}

function buildVpAtExtras(
  ini: Initiative,
  store: Store,
  currentUser: User,
): InitiativeDetail["vp_at_extras"] {
  const allSummaries = getInitiativeSummaries();

  const objectives: ObjectiveLink[] = allSummaries
    .filter((s) => s.initiative_id !== ini.id)
    .slice(0, 4)
    .map((s) => {
      const other = store.initiatives.find((i) => i.id === s.initiative_id);
      if (!other) return null;
      const firstPriorityIndicator =
        s.impact_indicators.find((x) => x.priority === "Alta") ??
        s.impact_indicators[0];
      return {
        objective: firstPriorityIndicator
          ? `${firstPriorityIndicator.indicator}: ${firstPriorityIndicator.target}`
          : "Objetivo",
        initiative_name: other.name,
        initiative_id: other.id,
        stage: other.current_stage,
        deliverable:
          s.deliverables[0]?.name ??
          s.value_streams_5y[0]?.year_3 ??
          "—",
      };
    })
    .filter((x): x is ObjectiveLink => x !== null);

  const sumByStream: Record<string, { total: string; contribs: string[] }> = {};
  for (const s of allSummaries) {
    for (const row of s.value_streams_5y) {
      const name = row.stream.split(" (")[0] ?? row.stream;
      const contrib = store.initiatives.find(
        (i) => i.id === s.initiative_id,
      )?.name;
      if (!contrib) continue;
      const bucket = sumByStream[name] ?? { total: "", contribs: [] };
      if (row.year_3 && row.year_3 !== "N/A" && row.year_3 !== "Indirecto") {
        const contribFirstWord = contrib.split(" ")[0] ?? contrib;
        bucket.contribs.push(`${contribFirstWord} (${row.year_3})`);
      }
      sumByStream[name] = bucket;
    }
  }

  const cross_streams: CrossStream[] = Object.entries(sumByStream)
    .filter(([, v]) => v.contribs.length > 0)
    .slice(0, 4)
    .map(([stream, v]) => ({
      stream,
      total: "—",
      initiatives: v.contribs.slice(0, 3).join(" · "),
    }));

  const upcoming_events: UpcomingEvent[] = store.gateways
    .filter((g) => g.status === "pending")
    .slice(0, 4)
    .map((g) => {
      const other = store.initiatives.find((i) => i.id === g.initiative_id);
      if (!other) return null;
      const alreadyVoted = store.gateway_votes.some(
        (v) => v.gateway_id === g.id && v.user_id === currentUser.id,
      );
      const isVoter =
        currentUser.is_vp || isAreaTransformacion(currentUser);
      return {
        label: `Gateway ${g.gateway_number}: ${other.name}`,
        date_label: "Próximo",
        initiative_id: other.id,
        has_vote_pending: isVoter && !alreadyVoted,
      };
    })
    .filter((x): x is UpcomingEvent => x !== null);

  return { objectives, cross_streams, upcoming_events };
}

export function getInitiativeDetail(
  initiativeId: Id,
): Result<InitiativeDetail> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");

  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const summary = getInitiativeSummary(initiativeId);
  if (!summary) {
    return err(
      "NOT_FOUND",
      "No hay resumen disponible para esta iniciativa",
    );
  }

  const header_roles: InitiativeHeaderRole[] = [];
  for (const key of HEADER_ROLE_ORDER) {
    const u = pickUserForRole(key, initiativeId, store);
    if (!u) continue;
    header_roles.push({
      key,
      abbr: ROLE_META[key].abbr,
      label: ROLE_META[key].label,
      display_name: u.display_name,
    });
  }

  const kpis = kpisFromOverlay(initiativeId, summary);

  const resolved_interdependencies = summary.interdependencies.map((dep) => {
    const ini = dep.initiative_id
      ? store.initiatives.find((i) => i.id === dep.initiative_id)
      : null;
    return {
      initiative_id: dep.initiative_id,
      label: dep.label,
      ref_note: dep.ref_note,
      stage: ini?.current_stage ?? null,
      status: ini?.status ?? null,
    };
  });

  const stage4Unlocked = isStage4Unlocked(initiative, store);
  const showVpAt = vpOrAt(user);

  const detail: InitiativeDetail = {
    initiative,
    stage_label: STAGE_LABEL[initiative.current_stage],
    status_label: statusLabelFor(initiative),
    status: initiative.status,
    dimension: dimensionForInitiative(initiative),
    header_roles,
    kpis,
    summary,
    resolved_interdependencies,
    is_stage_4_unlocked: stage4Unlocked,
    is_vp_or_at: showVpAt,
    vp_at_extras: showVpAt
      ? buildVpAtExtras(initiative, store, user)
      : null,
  };

  return ok(detail);
}
