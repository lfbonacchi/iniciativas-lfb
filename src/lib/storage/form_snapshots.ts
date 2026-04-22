// Snapshots congelados de un formulario:
//  - "submitted"  → PRE-GATEWAY: estado al momento de enviar a aprobación
//  - "final"      → Versión Final (VF) post-gateway
// Los snapshots NUNCA se sobreescriben. Son el registro inmutable que queda
// en el historial de la iniciativa.

import type { FormFieldValue, FormSnapshot, FormSnapshotType, Id } from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { readStore, writeStore, type Store } from "./_store";
import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
} from "./_security";
import { appendAudit } from "./_audit";

function loadResponses(
  store: Store,
  formId: Id,
): Record<string, FormFieldValue> {
  const out: Record<string, FormFieldValue> = {};
  for (const r of store.form_responses) {
    if (r.form_id === formId) out[r.field_key] = r.value;
  }
  return out;
}

function nextVersionNumber(
  store: Store,
  formId: Id,
  type: FormSnapshotType,
): number {
  const existing = store.form_snapshots.filter(
    (s) => s.form_id === formId && s.snapshot_type === type,
  );
  return existing.length + 1;
}

// Crea un snapshot dentro de un store ya abierto (usado por submitForm y
// por la resolución del gateway — el caller es responsable de writeStore).
export function createSnapshotInStore(
  store: Store,
  formId: Id,
  type: FormSnapshotType,
  userId: Id,
  responsesOverride?: Readonly<Record<string, FormFieldValue>>,
): FormSnapshot {
  const responses = responsesOverride ?? loadResponses(store, formId);
  const snapshot: FormSnapshot = {
    id: newId("snap"),
    form_id: formId,
    snapshot_type: type,
    version_number: nextVersionNumber(store, formId, type),
    responses_data: { ...responses },
    created_at: nowIso(),
  };
  store.form_snapshots.push(snapshot);
  appendAudit(store, {
    user_id: userId,
    action: "form_snapshot_created",
    entity_type: "form",
    entity_id: formId,
    old_data: null,
    new_data: {
      snapshot_id: snapshot.id,
      snapshot_type: type,
      version_number: snapshot.version_number,
    },
  });
  return snapshot;
}

// API pública: listar snapshots de un form.
export function listFormSnapshots(formId: Id): Result<FormSnapshot[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const list = store.form_snapshots
    .filter((s) => s.form_id === formId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return ok(list);
}

export function getFormSnapshot(snapshotId: Id): Result<FormSnapshot> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const snap = store.form_snapshots.find((s) => s.id === snapshotId);
  if (!snap) return err("NOT_FOUND", "Snapshot no encontrado");
  const form = store.forms.find((f) => f.id === snap.form_id);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  return ok(snap);
}

// PO crea o actualiza la VF manualmente (acuerdos de minuta incorporados).
// Mientras el gateway no esté cerrado como approved, se permite crear/editar.
// Una vez creada, queda congelada (no se sobreescribe) — pero el PO puede crear
// una nueva versión VF superior (version_number +1) si necesita corregir.
export function createFinalVersionSnapshot(
  formId: Id,
  responses: Readonly<Record<string, FormFieldValue>>,
): Result<FormSnapshot> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const snap = createSnapshotInStore(store, formId, "final", user.id, responses);
  writeStore(store);
  return ok(snap);
}

// Helpers para leer el último snapshot de un tipo (usado por el document tree).
export function getLatestSnapshot(
  store: Store,
  formId: Id,
  type: FormSnapshotType,
): FormSnapshot | null {
  const list = store.form_snapshots
    .filter((s) => s.form_id === formId && s.snapshot_type === type)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return list[0] ?? null;
}

export function getSnapshotHistory(
  store: Store,
  formId: Id,
): FormSnapshot[] {
  return store.form_snapshots
    .filter((s) => s.form_id === formId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
