import type { Id, PortfolioEvent } from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  createEventSchema,
  type CreateEventInput,
} from "@/lib/validations/events";

import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
} from "./_security";
import { readStore, writeStore } from "./_store";

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
    invited_user_ids: invited,
    created_by: user.id,
    created_at: nowIso(),
  };

  store.portfolio_events.push(evt);
  writeStore(store);
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
