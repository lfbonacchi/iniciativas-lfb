import type {
  AuditLog,
  FormChangeLog,
  Id,
  IsoDateString,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { readStore } from "./_store";
import {
  getCurrentUserFromStore,
  isAreaTransformacion,
  userCanAccessInitiative,
} from "./_security";

export interface SectionChangeEntry {
  id: Id;
  field_key: string;
  field_label: string;
  changed_by_id: Id;
  changed_by_name: string;
  is_system: boolean;
  changed_at: IsoDateString;
}

export interface SectionLastEdit {
  section_key: string;
  last_changed_at: IsoDateString | null;
  last_changed_by_id: Id | null;
  last_changed_by_name: string | null;
}

export interface InitiativeActivityEntry {
  id: Id;
  action: AuditLog["action"];
  entity_type: AuditLog["entity_type"];
  entity_id: Id;
  actor_id: Id;
  actor_name: string;
  is_system: boolean;
  timestamp: IsoDateString;
  summary: string;
}

const SYSTEM_LABEL = "Sistema";

function displayNameFor(
  store: ReturnType<typeof readStore>,
  userId: Id,
): { name: string; is_system: boolean } {
  if (userId === "system") return { name: SYSTEM_LABEL, is_system: true };
  const u = store.users.find((uu) => uu.id === userId);
  return {
    name: u?.display_name ?? "Usuario desconocido",
    is_system: false,
  };
}

// Devuelve entradas crudas del form_change_log para una sección concreta.
// A diferencia de getSectionChangeHistory, NO requiere que la sección esté
// declarada en form_definitions (útil para el wizard F1, que mantiene su
// estructura en src/data/form_definitions/f1.ts).
export function getRawSectionChangeLog(
  formId: Id,
  sectionKey: string,
): Result<FormChangeLog[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const entries = store.form_change_log.filter(
    (c) => c.form_id === formId && c.field_key === sectionKey,
  );
  return ok(entries);
}

// Últimos N cambios de una sección concreta de un formulario.
export function getSectionChangeHistory(
  formId: Id,
  sectionKey: string,
  limit = 5,
): Result<SectionChangeEntry[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const definition = store.form_definitions.find(
    (d) => d.form_type === form.form_type && d.version === form.version,
  );
  const section = definition?.sections_config.find(
    (s) => s.key === sectionKey,
  );
  if (!section) return err("NOT_FOUND", "Sección no encontrada");

  const fieldKeys = new Set(section.fields.map((f) => f.key));
  const labelByKey = new Map(
    section.fields.map((f) => [f.key, f.label]),
  );

  const entries: SectionChangeEntry[] = store.form_change_log
    .filter(
      (c: FormChangeLog) =>
        c.form_id === formId && fieldKeys.has(c.field_key),
    )
    .sort((a, b) => (a.changed_at < b.changed_at ? 1 : -1))
    .slice(0, Math.max(limit, 0))
    .map((c) => {
      const actor = displayNameFor(store, c.changed_by);
      return {
        id: c.id,
        field_key: c.field_key,
        field_label: labelByKey.get(c.field_key) ?? c.field_key,
        changed_by_id: c.changed_by,
        changed_by_name: actor.name,
        is_system: actor.is_system,
        changed_at: c.changed_at,
      };
    });

  return ok(entries);
}

// Historial completo de un formulario (todas las secciones).
export function getFormChangeHistory(
  formId: Id,
): Result<SectionChangeEntry[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const definition = store.form_definitions.find(
    (d) => d.form_type === form.form_type && d.version === form.version,
  );
  const labelByKey = new Map<string, string>();
  definition?.sections_config.forEach((s) =>
    s.fields.forEach((f) => labelByKey.set(f.key, f.label)),
  );

  const entries: SectionChangeEntry[] = store.form_change_log
    .filter((c) => c.form_id === formId)
    .sort((a, b) => (a.changed_at < b.changed_at ? 1 : -1))
    .map((c) => {
      const actor = displayNameFor(store, c.changed_by);
      return {
        id: c.id,
        field_key: c.field_key,
        field_label: labelByKey.get(c.field_key) ?? c.field_key,
        changed_by_id: c.changed_by,
        changed_by_name: actor.name,
        is_system: actor.is_system,
        changed_at: c.changed_at,
      };
    });

  return ok(entries);
}

// "Última edición" por sección de un formulario (tab Formularios).
export function getSectionsLastEdits(
  formId: Id,
): Result<SectionLastEdit[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const definition = store.form_definitions.find(
    (d) => d.form_type === form.form_type && d.version === form.version,
  );
  if (!definition) return ok([]);

  const changes = store.form_change_log.filter((c) => c.form_id === formId);
  const result: SectionLastEdit[] = definition.sections_config.map(
    (section) => {
      const fieldKeys = new Set(section.fields.map((f) => f.key));
      const sectionChanges = changes
        .filter((c) => fieldKeys.has(c.field_key))
        .sort((a, b) => (a.changed_at < b.changed_at ? 1 : -1));
      const last = sectionChanges[0];
      if (!last) {
        return {
          section_key: section.key,
          last_changed_at: null,
          last_changed_by_id: null,
          last_changed_by_name: null,
        };
      }
      const actor = displayNameFor(store, last.changed_by);
      return {
        section_key: section.key,
        last_changed_at: last.changed_at,
        last_changed_by_id: last.changed_by,
        last_changed_by_name: actor.name,
      };
    },
  );
  return ok(result);
}

// Timeline de actividad de una iniciativa (para tab Resumen).
// Timeline global: todos los eventos del audit_log filtrados por RLS.
// AT ve todo. El resto ve solo lo de sus iniciativas visibles.
export function getGlobalActivityTimeline(
  limit = 100,
): Result<InitiativeActivityEntry[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const visibleInitiativeIds = new Set(
    store.initiatives
      .filter((i) => userCanAccessInitiative(user, i.id, store))
      .map((i) => i.id),
  );

  const formsInScope = new Set(
    store.forms
      .filter((f) => visibleInitiativeIds.has(f.initiative_id))
      .map((f) => f.id),
  );
  const gatewaysInScope = new Set(
    store.gateways
      .filter((g) => visibleInitiativeIds.has(g.initiative_id))
      .map((g) => g.id),
  );
  const docsInScope = new Set(
    store.documents
      .filter((d) => visibleInitiativeIds.has(d.initiative_id))
      .map((d) => d.id),
  );
  const uploadsInScope = new Set(
    store.file_uploads
      .filter((u) => visibleInitiativeIds.has(u.initiative_id))
      .map((u) => u.id),
  );
  const eventsInScope = new Set(
    store.portfolio_events
      .filter((e) => visibleInitiativeIds.has(e.initiative_id))
      .map((e) => e.id),
  );
  const atSeesAll = isAreaTransformacion(user);

  const relevant = store.audit_log.filter((a) => {
    if (atSeesAll) return true;
    if (a.entity_type === "initiative")
      return visibleInitiativeIds.has(a.entity_id);
    if (a.entity_type === "initiative_member")
      return visibleInitiativeIds.has(a.entity_id);
    if (a.entity_type === "form" || a.entity_type === "form_response")
      return formsInScope.has(a.entity_id);
    if (a.entity_type === "gateway" || a.entity_type === "gateway_vote")
      return gatewaysInScope.has(a.entity_id);
    if (a.entity_type === "document") return docsInScope.has(a.entity_id);
    if (a.entity_type === "file_upload")
      return uploadsInScope.has(a.entity_id);
    if (a.entity_type === "portfolio_event")
      return eventsInScope.has(a.entity_id);
    return false;
  });

  const initiativeNameByFormId = new Map<Id, string>();
  store.forms.forEach((f) => {
    const ini = store.initiatives.find((i) => i.id === f.initiative_id);
    if (ini) initiativeNameByFormId.set(f.id, ini.name);
  });
  const initiativeNameByGatewayId = new Map<Id, string>();
  store.gateways.forEach((g) => {
    const ini = store.initiatives.find((i) => i.id === g.initiative_id);
    if (ini) initiativeNameByGatewayId.set(g.id, ini.name);
  });
  const initiativeNameByDocId = new Map<Id, string>();
  store.documents.forEach((d) => {
    const ini = store.initiatives.find((i) => i.id === d.initiative_id);
    if (ini) initiativeNameByDocId.set(d.id, ini.name);
  });
  const initiativeNameByUploadId = new Map<Id, string>();
  store.file_uploads.forEach((u) => {
    const ini = store.initiatives.find((i) => i.id === u.initiative_id);
    if (ini) initiativeNameByUploadId.set(u.id, ini.name);
  });
  const initiativeNameById = new Map<Id, string>();
  store.initiatives.forEach((i) => initiativeNameById.set(i.id, i.name));

  const sorted = [...relevant].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1,
  );
  const top = sorted.slice(0, Math.max(limit, 0));

  return ok(
    top.map((a) => {
      const actor = displayNameFor(store, a.user_id);
      let contextName: string | null = null;
      if (a.entity_type === "initiative" || a.entity_type === "initiative_member") {
        contextName = initiativeNameById.get(a.entity_id) ?? null;
      } else if (a.entity_type === "form" || a.entity_type === "form_response") {
        contextName = initiativeNameByFormId.get(a.entity_id) ?? null;
      } else if (a.entity_type === "gateway" || a.entity_type === "gateway_vote") {
        contextName = initiativeNameByGatewayId.get(a.entity_id) ?? null;
      } else if (a.entity_type === "document") {
        contextName = initiativeNameByDocId.get(a.entity_id) ?? null;
      } else if (a.entity_type === "file_upload") {
        contextName = initiativeNameByUploadId.get(a.entity_id) ?? null;
      }
      const base = summarizeAudit(a);
      const summary = contextName ? `${base} — ${contextName}` : base;
      return {
        id: a.id,
        action: a.action,
        entity_type: a.entity_type,
        entity_id: a.entity_id,
        actor_id: a.user_id,
        actor_name: actor.name,
        is_system: actor.is_system,
        timestamp: a.timestamp,
        summary,
      };
    }),
  );
}

export function getInitiativeActivityTimeline(
  initiativeId: Id,
  limit = 15,
): Result<InitiativeActivityEntry[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const formsOfInitiative = new Set(
    store.forms
      .filter((f) => f.initiative_id === initiativeId)
      .map((f) => f.id),
  );
  const gatewaysOfInitiative = new Set(
    store.gateways
      .filter((g) => g.initiative_id === initiativeId)
      .map((g) => g.id),
  );
  const docsOfInitiative = new Set(
    store.documents
      .filter((d) => d.initiative_id === initiativeId)
      .map((d) => d.id),
  );
  const uploadsOfInitiative = new Set(
    store.file_uploads
      .filter((u) => u.initiative_id === initiativeId)
      .map((u) => u.id),
  );
  const eventsOfInitiative = new Set(
    store.portfolio_events
      .filter((e) => e.initiative_id === initiativeId)
      .map((e) => e.id),
  );

  const relevant = store.audit_log.filter((a) => {
    if (a.entity_type === "initiative") return a.entity_id === initiativeId;
    if (a.entity_type === "initiative_member")
      return a.entity_id === initiativeId;
    if (a.entity_type === "form" || a.entity_type === "form_response")
      return formsOfInitiative.has(a.entity_id);
    if (a.entity_type === "gateway" || a.entity_type === "gateway_vote")
      return gatewaysOfInitiative.has(a.entity_id);
    if (a.entity_type === "document")
      return docsOfInitiative.has(a.entity_id);
    if (a.entity_type === "file_upload")
      return uploadsOfInitiative.has(a.entity_id);
    if (a.entity_type === "portfolio_event")
      return eventsOfInitiative.has(a.entity_id);
    return false;
  });

  const sorted = [...relevant].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : -1,
  );
  const top = sorted.slice(0, Math.max(limit, 0));

  const entries: InitiativeActivityEntry[] = top.map((a) => {
    const actor = displayNameFor(store, a.user_id);
    return {
      id: a.id,
      action: a.action,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      actor_id: a.user_id,
      actor_name: actor.name,
      is_system: actor.is_system,
      timestamp: a.timestamp,
      summary: summarizeAudit(a),
    };
  });

  return ok(entries);
}

function summarizeAudit(a: AuditLog): string {
  const nd = (a.new_data ?? {}) as Record<string, unknown>;
  const od = (a.old_data ?? {}) as Record<string, unknown>;
  switch (a.action) {
    case "initiative_created":
      return `Creó la iniciativa "${String(nd.name ?? "")}"`;
    case "initiative_imported":
      return `Importó la iniciativa "${String(nd.name ?? "")}"`;
    case "initiative_stage_changed":
      return `Cambió la etapa: ${String(od.current_stage ?? "")} → ${String(nd.current_stage ?? "")}`;
    case "initiative_status_changed":
      return `Cambió el estado: ${String(od.status ?? "")} → ${String(nd.status ?? "")}`;
    case "initiative_member_added":
      return `Agregó un miembro al equipo (rol: ${String(nd.role ?? "")})`;
    case "initiative_member_removed":
      return `Sacó un miembro del equipo (rol: ${String(od.role ?? "")})`;
    case "initiative_member_role_changed":
      return `Cambió el rol: ${String(od.role ?? "")} → ${String(nd.role ?? "")}`;
    case "form_submitted":
      return `Envió el formulario ${String(nd.form_type ?? "")}`.trim();
    case "form_approved":
      return "Formulario aprobado";
    case "form_reviewed":
      return "Marcó el formulario como revisado";
    case "form_response_changed": {
      const source = nd.source === "carry_over" ? " (carry-over)" : "";
      const count = Number(nd.changed_count ?? 0);
      return `Editó ${count} ${count === 1 ? "campo" : "campos"}${source}`;
    }
    case "gateway_vote_cast":
      return `Votó en gateway: ${String(nd.vote ?? "")}`;
    case "gateway_resolved":
      return `Gateway resuelto: ${String(nd.status ?? "")}`;
    case "document_uploaded":
      return `Subió documento: ${String(nd.file_name ?? nd.document_type ?? "")}`;
    case "document_generated":
      return `Generó documento: ${String(nd.file_name ?? nd.document_type ?? "")}`;
    case "document_downloaded":
      return `Descargó documento: ${String(nd.file_name ?? "")}`;
    case "document_moved":
      return `Movió documento a ${String(nd.folder ?? "")}`;
    case "document_deleted":
      return `Borró documento`;
    case "file_uploaded":
      return `Subió archivo: ${String(nd.file_name ?? "")}`;
    case "file_downloaded":
      return `Descargó archivo: ${String(nd.file_name ?? "")}`;
    case "file_moved":
      return `Movió archivo a ${String(nd.folder ?? "")}`;
    case "file_deleted":
      return `Borró archivo`;
    case "event_created":
      return `Creó evento: ${String(nd.name ?? nd.tipo ?? "")}`;
    case "event_attendance_set":
      return `Actualizó asistencia al evento`;
    case "event_rescheduled":
      return `Reprogramó evento`;
    case "event_cancelled":
      return `Canceló evento`;
    case "event_materialized":
      return `Habilitó acciones del evento`;
    case "memory_cleared":
      return "Borró la memoria del MVP";
    default:
      return a.action;
  }
}

export function formatActivityDate(iso: IsoDateString): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hh}:${mm}`;
}
