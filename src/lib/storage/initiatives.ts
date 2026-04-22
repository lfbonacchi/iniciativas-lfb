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

export function changeInitiativeStage(
  initiativeId: Id,
  newStage: InitiativeStage,
): Result<Initiative> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  const old = initiative.current_stage;
  if (old === newStage) return ok(initiative);
  initiative.current_stage = newStage;
  if (newStage === "dimensioning") initiative.has_etapa2 = true;
  if (newStage === "mvp") initiative.has_etapa3 = true;
  appendAudit(store, {
    user_id: user.id,
    action: "initiative_stage_changed",
    entity_type: "initiative",
    entity_id: initiative.id,
    old_data: { current_stage: old },
    new_data: { current_stage: newStage },
  });
  writeStore(store);
  return ok(initiative);
}

export function changeInitiativeStatus(
  initiativeId: Id,
  newStatus: InitiativeStatus,
): Result<Initiative> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  const old = initiative.status;
  if (old === newStatus) return ok(initiative);
  initiative.status = newStatus;
  appendAudit(store, {
    user_id: user.id,
    action: "initiative_status_changed",
    entity_type: "initiative",
    entity_id: initiative.id,
    old_data: { status: old },
    new_data: { status: newStatus },
  });
  writeStore(store);
  return ok(initiative);
}

// Helpers internos para usar desde otros módulos (gateways/forms) SIN releer
// el store. Reciben el store abierto y lo mutan + agregan el audit.
export function applyStageChangeInStore(
  store: Store,
  actorUserId: Id,
  initiative: Initiative,
  newStage: InitiativeStage,
): void {
  if (initiative.current_stage === newStage) return;
  const old = initiative.current_stage;
  initiative.current_stage = newStage;
  if (newStage === "dimensioning") initiative.has_etapa2 = true;
  if (newStage === "mvp") initiative.has_etapa3 = true;
  appendAudit(store, {
    user_id: actorUserId,
    action: "initiative_stage_changed",
    entity_type: "initiative",
    entity_id: initiative.id,
    old_data: { current_stage: old },
    new_data: { current_stage: newStage },
  });
}

export function applyStatusChangeInStore(
  store: Store,
  actorUserId: Id,
  initiative: Initiative,
  newStatus: InitiativeStatus,
): void {
  if (initiative.status === newStatus) return;
  const old = initiative.status;
  initiative.status = newStatus;
  appendAudit(store, {
    user_id: actorUserId,
    action: "initiative_status_changed",
    entity_type: "initiative",
    entity_id: initiative.id,
    old_data: { status: old },
    new_data: { status: newStatus },
  });
}

export interface DeleteInitiativeInput {
  initiative_id: Id;
  /** Nombre exacto de la iniciativa, para confirmar que el usuario sabe qué está borrando. */
  confirmation_name: string;
  /** Razón del borrado (ej: "creada por error", "duplicada"). Mínimo 5 chars. */
  reason: string;
}

export function deleteInitiative(
  input: DeleteInitiativeInput,
): Result<{ id: Id; name: string }> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!isAreaTransformacion(user)) {
    return err(
      "FORBIDDEN",
      "Solo el Área de Transformación puede borrar iniciativas",
    );
  }

  const initiative = store.initiatives.find((i) => i.id === input.initiative_id);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");

  const confirmation = (input.confirmation_name ?? "").trim();
  if (confirmation !== initiative.name) {
    return err(
      "VALIDATION_ERROR",
      "El nombre de confirmación no coincide con el nombre de la iniciativa",
    );
  }
  const reason = (input.reason ?? "").trim();
  if (reason.length < 5) {
    return err(
      "VALIDATION_ERROR",
      "Ingresá una razón (mínimo 5 caracteres) para registrar el borrado",
    );
  }

  const iniId = initiative.id;
  const deletedSnapshot = { name: initiative.name, reason };

  const formIds = new Set(
    store.forms.filter((f) => f.initiative_id === iniId).map((f) => f.id),
  );
  const gatewayIds = new Set(
    store.gateways.filter((g) => g.initiative_id === iniId).map((g) => g.id),
  );

  store.initiatives = store.initiatives.filter((i) => i.id !== iniId);
  store.initiative_members = store.initiative_members.filter(
    (m) => m.initiative_id !== iniId,
  );
  store.forms = store.forms.filter((f) => f.initiative_id !== iniId);
  store.form_responses = store.form_responses.filter(
    (r) => !formIds.has(r.form_id),
  );
  store.form_change_log = store.form_change_log.filter(
    (l) => !formIds.has(l.form_id),
  );
  store.form_snapshots = store.form_snapshots.filter(
    (s) => !formIds.has(s.form_id),
  );
  store.gateways = store.gateways.filter((g) => g.initiative_id !== iniId);
  store.gateway_votes = store.gateway_votes.filter(
    (v) => !gatewayIds.has(v.gateway_id),
  );
  store.notifications = store.notifications.filter(
    (n) => n.initiative_id !== iniId,
  );
  store.documents = store.documents.filter((d) => d.initiative_id !== iniId);
  store.initiative_folders = store.initiative_folders.filter(
    (f) => f.initiative_id !== iniId,
  );
  store.file_uploads = store.file_uploads.filter(
    (f) => f.initiative_id !== iniId,
  );
  store.portfolio_events = store.portfolio_events.filter(
    (e) => e.initiative_id !== iniId,
  );

  appendAudit(store, {
    user_id: user.id,
    action: "initiative_deleted",
    entity_type: "initiative",
    entity_id: iniId,
    old_data: deletedSnapshot,
    new_data: null,
  });
  writeStore(store);
  return ok({ id: iniId, name: deletedSnapshot.name });
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

  // RLS: AT ve todo. Para el resto filtramos con userCanAccessInitiative,
  // que ya contempla miembro directo, VP de scope y aprobador de gate.
  if (!isAreaTransformacion(user)) {
    visible = visible.filter((i) =>
      userCanAccessInitiative(user, i.id, store),
    );
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
  if (!isAreaTransformacion(user)) {
    visible = visible.filter((i) =>
      userCanAccessInitiative(user, i.id, store),
    );
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

const OWNER_ROLES: ReadonlySet<string> = new Set([
  "po",
  "promotor",
  "ld",
  "bo",
  "sponsor",
  // El Scrum Master toma las iniciativas donde participa como propias: edita
  // formularios igual que el PO y el PO puede sumarlo a su equipo.
  "sm",
]);
const IMPACTING_ROLES: ReadonlySet<string> = new Set(["equipo"]);

const ROLE_ABBR: Record<IniciativaRoleKey, string> = {
  po: "PO",
  promotor: "Promotor",
  ld: "LD",
  bo: "BO",
  sm: "SM",
  sponsor: "Sponsor",
};

function userIsGatewayApprover(
  store: Store,
  initiativeId: Id,
  userId: Id,
): boolean {
  return store.gateway_votes.some((v) => {
    if (v.user_id !== userId) return false;
    const gw = store.gateways.find((g) => g.id === v.gateway_id);
    return gw?.initiative_id === initiativeId;
  });
}

function sponsorVpFor(store: Store, initiativeId: Id): string | null {
  const sponsorMember = store.initiative_members.find(
    (m) => m.initiative_id === initiativeId && m.role === "sponsor",
  );
  if (!sponsorMember) return null;
  const sponsor = store.users.find((u) => u.id === sponsorMember.user_id);
  return sponsor?.vicepresidencia ?? null;
}

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

  // Regla: AT lidera todo el portfolio → todas las iniciativas son "propias".
  // Para el resto: PO/Promotor/LD/BO/Sponsor directo → propias. SM, equipo,
  // aprobador de gateway sin rol directo, y VP de la VP del sponsor → impactan.
  const own: IniciativaCard[] = [];
  const impacting: IniciativaCard[] = [];
  const vpsSet = new Set<string>();

  const atLeadsAll = isAreaTransformacion(user);

  for (const ini of store.initiatives) {
    const members = store.initiative_members.filter(
      (m) => m.initiative_id === ini.id,
    );
    const myMemberships = members.filter((m) => m.user_id === user.id);
    const myRoleKeys: IniciativaRoleKey[] = myMemberships.map(
      (m) => m.role as IniciativaRoleKey,
    );

    const overlay = getOverlay(ini.id);
    const sponsorVp = sponsorVpFor(store, ini.id);
    const initiativeVp = sponsorVp ?? overlay.vicepresidencia;

    const hasOwnerRole = myRoleKeys.some((r) => OWNER_ROLES.has(r));
    const hasImpactingRole = myRoleKeys.some((r) => IMPACTING_ROLES.has(r));
    const isApproverOnly =
      !hasOwnerRole && userIsGatewayApprover(store, ini.id, user.id);
    const isVpOfScopeOnly =
      !hasOwnerRole &&
      Boolean(user.is_vp) &&
      initiativeVp === user.vicepresidencia;

    let isOwn: boolean;
    let isImpacting: boolean;

    if (atLeadsAll) {
      isOwn = true;
      isImpacting = false;
    } else if (hasOwnerRole) {
      isOwn = true;
      isImpacting = false;
    } else if (hasImpactingRole || isApproverOnly || isVpOfScopeOnly) {
      isOwn = false;
      isImpacting = true;
    } else {
      // Sin pertenencia → no ve la iniciativa
      continue;
    }

    vpsSet.add(initiativeVp);

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
      vicepresidencia: initiativeVp,
      current_form_type: currentFormType,
      is_own: isOwn,
      is_impacting: isImpacting,
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
