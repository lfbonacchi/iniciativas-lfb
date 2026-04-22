import type {
  Form,
  Id,
  Initiative,
  InitiativeMember,
  InitiativeStage,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  createInitiativeSchema,
  importInitiativeSchema,
  listInitiativesFiltersSchema,
  type ListInitiativesFilters,
} from "@/lib/validations/initiatives";
import { readStore, writeStore } from "./_store";
import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  isAreaTransformacion,
  userCanAccessInitiative,
} from "./_security";
import { appendAudit } from "./_audit";

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
