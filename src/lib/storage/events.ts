import type {
  AttendanceStatus,
  AuditLog,
  Id,
  PortfolioEvent,
  PortfolioEventType,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  createEventSchema,
  type CreateEventInput,
} from "@/lib/validations/events";

import { appendAudit } from "./_audit";
import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  isAreaTransformacion,
  userCanAccessInitiative,
} from "./_security";
import { readStore, writeStore, type Store } from "./_store";

/**
 * Data needed to materialize a synthesized event (e.g. "Gate 2", "Sprint MVP")
 * into a real stored PortfolioEvent when the user takes an action on it.
 */
export interface SyntheticEventSeed {
  id: Id;
  name: string;
  type: PortfolioEventType;
  custom_type_label?: string | null;
  initiative_id: Id;
  date: string;
}

function findOrMaterialize(
  store: Store,
  eventId: Id,
  synthetic: SyntheticEventSeed | null,
  currentUserId: Id,
): PortfolioEvent | null {
  const existing = store.portfolio_events.find((e) => e.id === eventId);
  if (existing) return existing;
  if (!synthetic) return null;
  const evt: PortfolioEvent = {
    id: synthetic.id,
    name: synthetic.name,
    type: synthetic.type,
    custom_type_label: synthetic.custom_type_label ?? null,
    initiative_id: synthetic.initiative_id,
    date: synthetic.date,
    original_date: synthetic.date,
    status: "scheduled",
    invited_user_ids: [],
    attendance: {},
    created_by: currentUserId,
    created_at: nowIso(),
  };
  store.portfolio_events.push(evt);
  appendAudit(store, {
    user_id: currentUserId,
    action: "event_materialized",
    entity_type: "portfolio_event",
    entity_id: evt.id,
    old_data: null,
    new_data: { name: evt.name, date: evt.date, type: evt.type },
  });
  return evt;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function createPortfolioEvent(
  input: CreateEventInput,
): Result<PortfolioEvent> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find(
    (i) => i.id === parsed.data.initiative_id,
  );
  if (!initiative) {
    return err("NOT_FOUND", "Iniciativa no encontrada");
  }
  if (!userCanAccessInitiative(user, initiative.id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const validUserIds = new Set(store.users.map((u) => u.id));
  const invited = parsed.data.invited_user_ids.filter((id) =>
    validUserIds.has(id),
  );

  const evt: PortfolioEvent = {
    id: newId("evt"),
    name: parsed.data.name,
    type: parsed.data.type,
    custom_type_label:
      parsed.data.type === "otro"
        ? parsed.data.custom_type_label?.trim() ?? null
        : null,
    initiative_id: initiative.id,
    date: parsed.data.date,
    original_date: parsed.data.date,
    status: "scheduled",
    invited_user_ids: invited,
    attendance: {},
    created_by: user.id,
    created_at: nowIso(),
  };

  store.portfolio_events.push(evt);
  appendAudit(store, {
    user_id: user.id,
    action: "event_created",
    entity_type: "portfolio_event",
    entity_id: evt.id,
    old_data: null,
    new_data: {
      name: evt.name,
      type: evt.type,
      date: evt.date,
      initiative_id: evt.initiative_id,
    },
  });
  writeStore(store);
  return ok(evt);
}

export function getPortfolioEvent(id: Id): Result<PortfolioEvent> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const evt = store.portfolio_events.find((e) => e.id === id);
  if (!evt) return err("NOT_FOUND", "Evento no encontrado");
  if (!userCanAccessInitiative(user, evt.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  return ok(evt);
}

export function listPortfolioEvents(
  filter?: { initiative_id?: Id },
): Result<PortfolioEvent[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const events = store.portfolio_events.filter((e) => {
    if (filter?.initiative_id && e.initiative_id !== filter.initiative_id) {
      return false;
    }
    return userCanAccessInitiative(user, e.initiative_id, store);
  });
  return ok(events);
}

// ---------------------------------------------------------------------------
// Actions (accept/reject/reschedule/cancel) — work on both custom and
// synthesized events. For synthesized, pass `synthetic` so we materialize
// the event before applying the action.
// ---------------------------------------------------------------------------

export function setEventAttendance(
  eventId: Id,
  status: AttendanceStatus,
  synthetic: SyntheticEventSeed | null = null,
): Result<PortfolioEvent> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const evt = findOrMaterialize(store, eventId, synthetic, user.id);
  if (!evt) return err("NOT_FOUND", "Evento no encontrado");
  if (!userCanAccessInitiative(user, evt.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const previous = evt.attendance[user.id] ?? null;
  evt.attendance = { ...evt.attendance, [user.id]: status };
  appendAudit(store, {
    user_id: user.id,
    action: "event_attendance_set",
    entity_type: "portfolio_event",
    entity_id: evt.id,
    old_data: { attendance: previous },
    new_data: { attendance: status },
  });
  writeStore(store);
  return ok(evt);
}

export function rescheduleEvent(
  eventId: Id,
  newDate: string,
  synthetic: SyntheticEventSeed | null = null,
): Result<PortfolioEvent> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    return err("VALIDATION_ERROR", "La fecha debe tener formato YYYY-MM-DD");
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const evt = findOrMaterialize(store, eventId, synthetic, user.id);
  if (!evt) return err("NOT_FOUND", "Evento no encontrado");
  if (!userCanAccessInitiative(user, evt.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  if (evt.date === newDate) return ok(evt);
  const oldDate = evt.date;
  evt.original_date = evt.original_date ?? oldDate;
  evt.date = newDate;
  appendAudit(store, {
    user_id: user.id,
    action: "event_rescheduled",
    entity_type: "portfolio_event",
    entity_id: evt.id,
    old_data: { date: oldDate },
    new_data: { date: newDate },
  });
  writeStore(store);
  return ok(evt);
}

export function cancelPortfolioEvent(
  eventId: Id,
  synthetic: SyntheticEventSeed | null = null,
): Result<PortfolioEvent> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const evt = findOrMaterialize(store, eventId, synthetic, user.id);
  if (!evt) return err("NOT_FOUND", "Evento no encontrado");
  if (!userCanAccessInitiative(user, evt.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const canCancel =
    evt.created_by === user.id ||
    isAreaTransformacion(user) ||
    user.is_vp;
  if (!canCancel) {
    return err(
      "FORBIDDEN",
      "Solo quien creó el evento, el VP o Área Transformación pueden cancelarlo",
    );
  }

  if (evt.status === "cancelled") return ok(evt);
  evt.status = "cancelled";
  appendAudit(store, {
    user_id: user.id,
    action: "event_cancelled",
    entity_type: "portfolio_event",
    entity_id: evt.id,
    old_data: { status: "scheduled" },
    new_data: { status: "cancelled" },
  });
  writeStore(store);
  return ok(evt);
}

// Deprecated alias, kept to avoid breaking legacy imports.
export const deletePortfolioEvent = cancelPortfolioEvent;

// ---------------------------------------------------------------------------
// Audit log of an event (for "control de cambios" in the UI)
// ---------------------------------------------------------------------------

export interface EventChangeLogEntry {
  id: Id;
  action: AuditLog["action"];
  user_id: Id;
  user_display_name: string;
  timestamp: string;
  old_data: AuditLog["old_data"];
  new_data: AuditLog["new_data"];
}

export function getEventChangeLog(
  eventId: Id,
): Result<EventChangeLogEntry[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const entries = store.audit_log
    .filter(
      (a) => a.entity_type === "portfolio_event" && a.entity_id === eventId,
    )
    .map<EventChangeLogEntry>((a) => {
      const author = store.users.find((u) => u.id === a.user_id);
      return {
        id: a.id,
        action: a.action,
        user_id: a.user_id,
        user_display_name: author?.display_name ?? a.user_id,
        timestamp: a.timestamp,
        old_data: a.old_data,
        new_data: a.new_data,
      };
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return ok(entries);
}
