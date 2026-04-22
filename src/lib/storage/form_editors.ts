import type { Id, InitiativeMember, User } from "@/types";
import { err, ok, type Result } from "@/lib/result";

import {
  getCurrentUserFromStore,
  isAreaTransformacion,
  userCanAccessInitiative,
} from "./_security";
import { appendAudit } from "./_audit";
import { readStore, writeStore, type Store } from "./_store";

// Rol usado cuando el PO delega permiso de edición a otro usuario.
// Se crea como "equipo" con can_edit=true; así el mismo helper
// userCanEditInitiativeForms ya lo reconoce como editor.
const DELEGATED_ROLE: InitiativeMember["role"] = "equipo";

function isPOofInitiative(
  user: User,
  initiativeId: Id,
  store: Store,
): boolean {
  return store.initiative_members.some(
    (m) =>
      m.initiative_id === initiativeId &&
      m.user_id === user.id &&
      (m.role === "po" || m.role === "promotor"),
  );
}

function canManageEditors(
  user: User,
  initiativeId: Id,
  store: Store,
): boolean {
  if (isAreaTransformacion(user)) return true;
  return isPOofInitiative(user, initiativeId, store);
}

export interface DelegatedEditor {
  user_id: Id;
  display_name: string;
  job_title: string;
  vicepresidencia: string;
  role_label: string;
  /** True si el usuario ya tiene edición (por rol o por delegación). */
  can_edit: boolean;
  /** True si la edición viene de un rol natural (PO/Promotor/LD/SM), no delegada. */
  is_natural_editor: boolean;
}

function naturalEditorRole(
  userId: Id,
  initiativeId: Id,
  store: Store,
): string | null {
  const m = store.initiative_members.find(
    (mm) =>
      mm.initiative_id === initiativeId &&
      mm.user_id === userId &&
      (mm.role === "po" ||
        mm.role === "promotor" ||
        mm.role === "ld" ||
        mm.role === "sm"),
  );
  if (!m) return null;
  switch (m.role) {
    case "po":
      return "PO";
    case "promotor":
      return "Promotor";
    case "ld":
      return "LD";
    case "sm":
      return "Scrum Master";
  }
}

export interface FormEditorsSnapshot {
  /** Editores actuales (con edición activa, por rol o por delegación). */
  editors: DelegatedEditor[];
  /** Usuarios a los que el PO puede dar edición (no-VP, con acceso, todavía sin edición). */
  candidates: DelegatedEditor[];
  /** True si el usuario actual puede modificar estos permisos. */
  can_manage: boolean;
}

export function getFormEditors(
  initiativeId: Id,
): Result<FormEditorsSnapshot> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const members = store.initiative_members.filter(
    (m) => m.initiative_id === initiativeId,
  );
  const memberByUser = new Map<Id, InitiativeMember[]>();
  for (const m of members) {
    const arr = memberByUser.get(m.user_id) ?? [];
    arr.push(m);
    memberByUser.set(m.user_id, arr);
  }

  const editors: DelegatedEditor[] = [];
  const candidates: DelegatedEditor[] = [];

  // Primero los miembros de la iniciativa con edición actual o sin ella.
  const seen = new Set<Id>();
  for (const [userId, entries] of memberByUser.entries()) {
    const target = store.users.find((u) => u.id === userId);
    if (!target) continue;
    seen.add(userId);

    // VP nunca puede ser editor delegado.
    if (target.is_vp) continue;

    const natural = naturalEditorRole(userId, initiativeId, store);
    const delegatedEntry = entries.find(
      (e) => e.role === DELEGATED_ROLE && e.can_edit,
    );
    const hasEdit = Boolean(natural) || Boolean(delegatedEntry);

    const info: DelegatedEditor = {
      user_id: userId,
      display_name: target.display_name,
      job_title: target.job_title,
      vicepresidencia: target.vicepresidencia,
      role_label:
        natural ?? (delegatedEntry ? "Editor delegado" : entries[0]?.role ?? "—"),
      can_edit: hasEdit,
      is_natural_editor: Boolean(natural),
    };

    if (hasEdit) editors.push(info);
    else candidates.push(info);
  }

  // Después, cualquier otro usuario del sistema que NO sea VP y no esté ya
  // en la iniciativa → también puede ser invitado como editor.
  for (const target of store.users) {
    if (seen.has(target.id)) continue;
    if (target.is_vp) continue;
    candidates.push({
      user_id: target.id,
      display_name: target.display_name,
      job_title: target.job_title,
      vicepresidencia: target.vicepresidencia,
      role_label: "Externo a la iniciativa",
      can_edit: false,
      is_natural_editor: false,
    });
  }

  editors.sort((a, b) => a.display_name.localeCompare(b.display_name));
  candidates.sort((a, b) => a.display_name.localeCompare(b.display_name));

  return ok({
    editors,
    candidates,
    can_manage: canManageEditors(user, initiativeId, store),
  });
}

export function grantFormEditAccess(
  initiativeId: Id,
  targetUserId: Id,
): Result<{ user_id: Id }> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  if (!canManageEditors(user, initiativeId, store)) {
    return err(
      "FORBIDDEN",
      "Solo el PO/Promotor o el Área Transformación pueden delegar edición",
    );
  }

  const target = store.users.find((u) => u.id === targetUserId);
  if (!target) return err("NOT_FOUND", "Usuario no encontrado");
  if (target.is_vp) {
    return err(
      "VALIDATION_ERROR",
      "Los VP no pueden ser designados editores — solo pueden comentar",
    );
  }

  // Si ya tiene una entrada "equipo", marcarla can_edit=true.
  const existingEquipo = store.initiative_members.find(
    (m) =>
      m.initiative_id === initiativeId &&
      m.user_id === targetUserId &&
      m.role === DELEGATED_ROLE,
  );
  if (existingEquipo) {
    if (existingEquipo.can_edit) {
      return ok({ user_id: targetUserId });
    }
    existingEquipo.can_edit = true;
  } else {
    store.initiative_members.push({
      user_id: targetUserId,
      initiative_id: initiativeId,
      role: DELEGATED_ROLE,
      can_edit: true,
    });
  }

  appendAudit(store, {
    user_id: user.id,
    action: "form_edit_access_granted",
    entity_type: "initiative_member",
    entity_id: initiativeId,
    old_data: null,
    new_data: { target_user_id: targetUserId, role: DELEGATED_ROLE },
  });
  writeStore(store);
  return ok({ user_id: targetUserId });
}

export function revokeFormEditAccess(
  initiativeId: Id,
  targetUserId: Id,
): Result<{ user_id: Id }> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  if (!canManageEditors(user, initiativeId, store)) {
    return err(
      "FORBIDDEN",
      "Solo el PO/Promotor o el Área Transformación pueden revocar edición",
    );
  }

  // No permitir revocar editores "naturales" (PO, Promotor, LD, SM) — esos se
  // gestionan desde la tabla de equipo, no desde este panel.
  if (naturalEditorRole(targetUserId, initiativeId, store)) {
    return err(
      "VALIDATION_ERROR",
      "No se puede revocar edición a un PO/Promotor/LD/Scrum Master desde este panel",
    );
  }

  const idx = store.initiative_members.findIndex(
    (m) =>
      m.initiative_id === initiativeId &&
      m.user_id === targetUserId &&
      m.role === DELEGATED_ROLE,
  );
  if (idx === -1) return err("NOT_FOUND", "El usuario no tiene edición delegada");
  store.initiative_members.splice(idx, 1);

  appendAudit(store, {
    user_id: user.id,
    action: "form_edit_access_revoked",
    entity_type: "initiative_member",
    entity_id: initiativeId,
    old_data: { target_user_id: targetUserId, role: DELEGATED_ROLE },
    new_data: null,
  });
  writeStore(store);
  return ok({ user_id: targetUserId });
}
