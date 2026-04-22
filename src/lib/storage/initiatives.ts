import type {
  Form,
  FormType,
  Id,
  Initiative,
  InitiativeMember,
  InitiativeStage,
  InitiativeStatus,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  createInitiativeSchema,
  importInitiativeSchema,
  listInitiativesFiltersSchema,
  type ListInitiativesFilters,
} from "@/lib/validations/initiatives";
import { readStore, writeStore, type Store } from "./_store";
import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  isAreaTransformacion,
  userCanAccessInitiative,
} from "./_security";
import { appendAudit } from "./_audit";
import { getOverlay } from "./financials";

export function createInitiative(
  name: string,
): Result<{ initiative: Initiative; form: Form }> {
  const parsed = createInitiativeSchema.safeParse({ name });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const now = nowIso();
  const initiativeId = newId("init");
  const initiative: Initiative = {
    id: initiativeId,
    name: parsed.data.name,
    current_stage: "proposal",
    status: "in_progress",
    created_at: now,
    has_etapa1: true,
    has_etapa2: false,
    has_etapa3: false,
  };
  const member: InitiativeMember = {
    user_id: user.id,
    initiative_id: initiativeId,
    role: "promotor",
    can_edit: true,
  };
  const form: Form = {
    id: newId("form"),
    initiative_id: initiativeId,
    form_type: "F1",
    version: 1,
    status: "draft",
    ltp_period: null,
    created_by: user.id,
    created_at: now,
    updated_at: now,
    submitted_at: null,
    approved_at: null,
  };

  store.initiatives.push(initiative);
  store.initiative_members.push(member);
  store.forms.push(form);
  appendAudit(store, {
    user_id: user.id,
    action: "initiative_created",
    entity_type: "initiative",
    entity_id: initiative.id,
    old_data: null,
    new_data: { name: initiative.name, current_stage: initiative.current_stage },
  });
  writeStore(store);
  return ok({ initiative, form });
}

export function importInitiative(
  name: string,
  stage: InitiativeStage,
): Result<Initiative> {
  const parsed = importInitiativeSchema.safeParse({ name, stage });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const now = nowIso();
  const initiativeId = newId("init");
  const has_etapa1 =
    parsed.data.stage === "proposal" ||
    parsed.data.stage === "dimensioning" ||
    parsed.data.stage === "mvp";
  const has_etapa2 =
    parsed.data.stage === "dimensioning" || parsed.data.stage === "mvp";
  const has_etapa3 = parsed.data.stage === "mvp";

  const initiative: Initiative = {
    id: initiativeId,
    name: parsed.data.name,
    current_stage: parsed.data.stage,
    status: "in_progress",
    created_at: now,
    has_etapa1,
    has_etapa2,
    has_etapa3,
  };
  const member: InitiativeMember = {
    user_id: user.id,
    initiative_id: initiativeId,
    role: "po",
    can_edit: true,
  };

  store.initiatives.push(initiative);
  store.initiative_members.push(member);
  appendAudit(store, {
    user_id: user.id,
    action: "initiative_imported",
    entity_type: "initiative",
    entity_id: initiative.id,
    old_data: null,
    new_data: { name: initiative.name, current_stage: initiative.current_stage },
  });
  writeStore(store);
  return ok(initiative);
}

export function getInitiative(id: Id): Result<Initiative> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find((i) => i.id === id);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  if (!userCanAccessInitiative(user, id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  return ok(initiative);
}

export function listInitiatives(
  filters?: ListInitiativesFilters,
): Result<Initiative[]> {
  const parsed = listInitiativesFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  let visible = store.initiatives;

  // RLS: usuarios normales solo ven iniciativas donde son miembros.
  if (!isAreaTransformacion(user) && !user.is_vp) {
    const allowedIds = new Set(
      store.initiative_members
        .filter((m) => m.user_id === user.id)
        .map((m) => m.initiative_id),
    );
    visible = visible.filter((i) => allowedIds.has(i.id));
  }

  const f = parsed.data;
  if (f) {
    if (f.stage) visible = visible.filter((i) => i.current_stage === f.stage);
    if (f.status) visible = visible.filter((i) => i.status === f.status);
    if (f.bo_user_id) {
      const matching = new Set(
        store.initiative_members
          .filter((m) => m.user_id === f.bo_user_id && m.role === "bo")
          .map((m) => m.initiative_id),
      );
      visible = visible.filter((i) => matching.has(i.id));
    }
    if (f.vp_user_id) {
      const vp = store.users.find((u) => u.id === f.vp_user_id);
      if (vp) {
        const matching = new Set(
          store.initiative_members
            .filter((m) => m.role === "sponsor")
            .filter((m) => {
              const sponsor = store.users.find((u) => u.id === m.user_id);
              return sponsor?.vicepresidencia === vp.vicepresidencia;
            })
            .map((m) => m.initiative_id),
        );
        visible = visible.filter((i) => matching.has(i.id));
      }
    }
  }

  return ok(visible);
}

export interface InitiativeSearchResult {
  id: Id;
  name: string;
  current_stage: InitiativeStage;
  status: InitiativeStatus;
  po_display_name: string | null;
  current_form_type: FormType;
  status_label: string;
}

const STAGE_TO_FORM: Record<InitiativeStage, FormType> = {
  proposal: "F1",
  dimensioning: "F2",
  mvp: "F3",
  ltp_tracking: "F4",
};

const STAGE_GATEWAY_NUMBER: Record<InitiativeStage, number | null> = {
  proposal: 1,
  dimensioning: 2,
  mvp: 3,
  ltp_tracking: null,
};

function statusLabel(
  ini: Initiative,
  currentFormType: FormType,
): string {
  if (ini.status === "paused") return "Pausada";
  if (ini.status === "rejected") return "Rechazada";
  if (ini.status === "area_change") return "Cambio de área";
  if (ini.status === "pending") {
    const gn = STAGE_GATEWAY_NUMBER[ini.current_stage];
    return gn ? `Gateway ${gn} pendiente` : "Revisión pendiente";
  }
  return `En progreso ${currentFormType}`;
}

export function searchInitiatives(
  query: string,
): Result<InitiativeSearchResult[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  let visible = store.initiatives;
  if (!isAreaTransformacion(user) && !user.is_vp) {
    const allowedIds = new Set(
      store.initiative_members
        .filter((m) => m.user_id === user.id)
        .map((m) => m.initiative_id),
    );
    visible = visible.filter((i) => allowedIds.has(i.id));
  }

  const q = query.trim().toLowerCase();
  const matched = q
    ? visible.filter((i) => i.name.toLowerCase().includes(q))
    : visible;

  const results: InitiativeSearchResult[] = matched.map((ini) => {
    const poMember = store.initiative_members.find(
      (m) =>
        m.initiative_id === ini.id &&
        (m.role === "po" || m.role === "promotor"),
    );
    const poUser = poMember
      ? store.users.find((u) => u.id === poMember.user_id) ?? null
      : null;
    const currentFormType = STAGE_TO_FORM[ini.current_stage];
    return {
      id: ini.id,
      name: ini.name,
      current_stage: ini.current_stage,
      status: ini.status,
      po_display_name: poUser?.display_name ?? null,
      current_form_type: currentFormType,
      status_label: statusLabel(ini, currentFormType),
    };
  });

  results.sort((a, b) => a.name.localeCompare(b.name));
  return ok(results);
}

// ---------------------------------------------------------------------------
// Mis iniciativas (listado con tabs Propias / Que me impactan)
// ---------------------------------------------------------------------------

export type IniciativaRoleKey =
  | "po"
  | "promotor"
  | "ld"
  | "bo"
  | "sm"
  | "sponsor";

export interface IniciativaRoleInCard {
  key: IniciativaRoleKey;
  abbr: string;
  display_name: string;
}

export interface IniciativaThirdMetric {
  label: string;
  value: string;
}

export interface IniciativaCard {
  id: Id;
  name: string;
  current_stage: InitiativeStage;
  status: InitiativeStatus;
  status_label: string;
  roles: IniciativaRoleInCard[];
  expected_value_usd: number;
  expected_cost_usd: number;
  third_metric: IniciativaThirdMetric | null;
  pending_action: string | null;
  vicepresidencia: string;
  current_form_type: FormType;
  is_own: boolean;
  is_impacting: boolean;
}

export interface ListMyInitiativesResult {
  own: IniciativaCard[];
  impacting: IniciativaCard[];
  available_vps: string[];
}

const OWNER_ROLES: ReadonlySet<string> = new Set(["po", "promotor", "ld"]);

const ROLE_ABBR: Record<IniciativaRoleKey, string> = {
  po: "PO",
  promotor: "Promotor",
  ld: "LD",
  bo: "BO",
  sm: "SM",
  sponsor: "Sponsor",
};

function fmtUsdShort(v: number): string {
  if (v >= 1_000_000) return `USD ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `USD ${Math.round(v / 1_000)}K`;
  return `USD ${v}`;
}

function fmtHoursShort(hours: number): string {
  if (hours >= 1_000) return `${(hours / 1_000).toFixed(1)}K h`;
  return `${hours} h`;
}

function thirdMetricFor(initiativeId: Id): IniciativaThirdMetric | null {
  const overlay = getOverlay(initiativeId);
  const c = overlay.contribution;
  if (c.hh && c.hh > 0) {
    return { label: "HH ahorro", value: fmtHoursShort(c.hh) };
  }
  if (c.produccion && c.produccion > 0) {
    return { label: "Producción", value: fmtUsdShort(c.produccion) };
  }
  if (c.opex && c.opex > 0) {
    return { label: "OPEX red.", value: fmtUsdShort(c.opex) };
  }
  if (c.capex && c.capex > 0) {
    return { label: "CAPEX", value: fmtUsdShort(c.capex) };
  }
  if (c.intangible && c.intangible > 0) {
    return { label: "Intangible", value: fmtUsdShort(c.intangible) };
  }
  return null;
}

function firstIncompleteSectionOrder(
  store: Store,
  form: Form,
): number | null {
  const def = store.form_definitions.find(
    (d) => d.form_type === form.form_type,
  );
  if (!def) return null;
  const responses = store.form_responses.filter((r) => r.form_id === form.id);
  const byKey = new Map(responses.map((r) => [r.field_key, r.value]));
  const sections = [...def.sections_config].sort(
    (a, b) => a.order - b.order,
  );
  for (const section of sections) {
    for (const field of section.fields) {
      if (!field.required) continue;
      const val = byKey.get(field.key);
      const empty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (empty) return section.order;
    }
  }
  return null;
}

function computePendingAction(
  store: Store,
  user: { id: Id; is_vp: boolean },
  initiative: Initiative,
  userRoles: IniciativaRoleKey[],
): string | null {
  // 1) Voto pendiente en gateway
  const pendingGateway = store.gateways.find(
    (g) => g.initiative_id === initiative.id && g.status === "pending",
  );
  if (pendingGateway) {
    const hasVoted = store.gateway_votes.some(
      (v) => v.gateway_id === pendingGateway.id && v.user_id === user.id,
    );
    const isVoter = user.is_vp || userRoles.includes("sponsor");
    if (isVoter && !hasVoted) {
      return `Gateway ${pendingGateway.gateway_number}: tu voto pendiente`;
    }
  }

  // 2) Editor con formulario incompleto
  const isEditor = userRoles.some((r) => OWNER_ROLES.has(r));
  if (!isEditor) return null;

  const iniForms = store.forms.filter(
    (f) => f.initiative_id === initiative.id,
  );
  const draftForm = iniForms
    .filter((f) => f.status === "draft")
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
  if (!draftForm) return null;

  const sectionOrder = firstIncompleteSectionOrder(store, draftForm);
  if (sectionOrder !== null) {
    return `Completar sección ${sectionOrder}`;
  }
  return "Enviar a aprobación";
}

export function listMyInitiativeCards(): Result<ListMyInitiativesResult> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  // Rol global: AT ve todo como "impactante" potencial. Para otros, se
  // clasifica por pertenencia real.
  const own: IniciativaCard[] = [];
  const impacting: IniciativaCard[] = [];
  const vpsSet = new Set<string>();

  for (const ini of store.initiatives) {
    const members = store.initiative_members.filter(
      (m) => m.initiative_id === ini.id,
    );
    const myMemberships = members.filter((m) => m.user_id === user.id);
    const myRoleKeys: IniciativaRoleKey[] = myMemberships.map(
      (m) => m.role as IniciativaRoleKey,
    );

    const overlay = getOverlay(ini.id);
    const isVpOfScope = user.is_vp && overlay.vicepresidencia === user.vicepresidencia;
    const atSeesAll = isAreaTransformacion(user);

    const isOwn = myRoleKeys.some((r) => OWNER_ROLES.has(r));
    const isImpactingDirectly =
      myRoleKeys.some((r) =>
        ["bo", "sm", "sponsor", "equipo"].includes(r),
      ) || isVpOfScope;

    // RLS: si no sos miembro ni VP de scope ni AT, no ves la iniciativa.
    if (!isOwn && !isImpactingDirectly && !atSeesAll) continue;

    vpsSet.add(overlay.vicepresidencia);

    const displayRoles: IniciativaRoleInCard[] = [];
    const seenKeys = new Set<IniciativaRoleKey>();
    const preferredOrder: IniciativaRoleKey[] = [
      "po",
      "promotor",
      "ld",
      "bo",
      "sponsor",
      "sm",
    ];
    for (const key of preferredOrder) {
      const m = members.find((mm) => mm.role === key);
      if (!m) continue;
      if (seenKeys.has(key)) continue;
      const u = store.users.find((uu) => uu.id === m.user_id);
      if (!u) continue;
      displayRoles.push({
        key,
        abbr: ROLE_ABBR[key],
        display_name: u.display_name,
      });
      seenKeys.add(key);
    }

    const currentFormType = STAGE_TO_FORM[ini.current_stage];
    const pending = computePendingAction(
      store,
      { id: user.id, is_vp: Boolean(user.is_vp) },
      ini,
      myRoleKeys,
    );

    const card: IniciativaCard = {
      id: ini.id,
      name: ini.name,
      current_stage: ini.current_stage,
      status: ini.status,
      status_label: statusLabel(ini, currentFormType),
      roles: displayRoles,
      expected_value_usd: overlay.expected_value_usd,
      expected_cost_usd: overlay.expected_cost_usd,
      third_metric: thirdMetricFor(ini.id),
      pending_action: pending,
      vicepresidencia: overlay.vicepresidencia,
      current_form_type: currentFormType,
      is_own: isOwn,
      is_impacting: isImpactingDirectly || (atSeesAll && !isOwn),
    };

    if (isOwn) own.push(card);
    else impacting.push(card);
  }

  const byName = (a: IniciativaCard, b: IniciativaCard) =>
    a.name.localeCompare(b.name);
  own.sort(byName);
  impacting.sort(byName);

  const available_vps = Array.from(vpsSet).sort();

  return ok({ own, impacting, available_vps });
}
