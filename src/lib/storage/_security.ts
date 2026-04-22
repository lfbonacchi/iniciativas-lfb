import type { Id, InitiativeMemberRole, User } from "@/types";
import type { Store } from "./_store";

export function getCurrentUserFromStore(store: Store): User | null {
  if (!store.current_user_id) return null;
  return store.users.find((u) => u.id === store.current_user_id) ?? null;
}

export function isAreaTransformacion(user: User): boolean {
  return (
    user.global_role === "area_transformacion" || user.global_role === "admin"
  );
}

export function userCanAccessInitiative(
  user: User,
  initiativeId: Id,
  store: Store,
): boolean {
  // AT ve todo (lidera todo el portfolio).
  if (isAreaTransformacion(user)) return true;

  // VP ve las iniciativas de su vicepresidencia (por sponsor).
  if (user.is_vp) {
    const sponsorMember = store.initiative_members.find(
      (m) => m.initiative_id === initiativeId && m.role === "sponsor",
    );
    if (sponsorMember) {
      const sponsor = store.users.find((u) => u.id === sponsorMember.user_id);
      if (sponsor?.vicepresidencia === user.vicepresidencia) return true;
    }
  }

  // Miembro directo.
  const isMember = store.initiative_members.some(
    (m) => m.user_id === user.id && m.initiative_id === initiativeId,
  );
  if (isMember) return true;

  // Aprobador de algún gateway de la iniciativa (aunque no sea miembro).
  const isApprover = store.gateway_votes.some((v) => {
    if (v.user_id !== user.id) return false;
    const gw = store.gateways.find((g) => g.id === v.gateway_id);
    return gw?.initiative_id === initiativeId;
  });
  return isApprover;
}

// Roles "naturales" con permiso de edición sobre los formularios.
// PO, Promotor, LD y Scrum Master siempre pueden editar (carry con el rol).
// Para miembros "equipo" la capacidad depende del access_level / can_edit.
const NATURAL_EDITOR_ROLES: InitiativeMemberRole[] = [
  "promotor",
  "po",
  "ld",
  "sm",
];

// Roles "naturales" que sólo comentan (no editan): VP, BO, Sponsor y AT global.
// El "equipo" depende del access_level explícito.

export function userCanEditInitiativeForms(
  user: User,
  initiativeId: Id,
  store: Store,
): boolean {
  // Admin puede editar todo (escape hatch para soporte).
  if (user.global_role === "admin") return true;
  const members = store.initiative_members.filter(
    (m) => m.user_id === user.id && m.initiative_id === initiativeId,
  );
  return members.some((m) => {
    if (NATURAL_EDITOR_ROLES.includes(m.role)) return true;
    if (m.role === "equipo") {
      // Nuevo formato: access_level explícito manda sobre can_edit legacy.
      if (m.access_level === "edit") return true;
      if (m.access_level === "comment" || m.access_level === "view") return false;
      return !!m.can_edit;
    }
    return false;
  });
}

// Puede comentar si:
// - Tiene edición (todo editor puede comentar).
// - Es VP / BO / Sponsor de la iniciativa (rol natural de comentario).
// - Es AT global.
// - Es delegado como "comment".
// El caller debe además validar que el formulario esté en un estado que
// acepte nuevos comentarios (no read-only).
export function userCanCommentInitiativeForms(
  user: User,
  initiativeId: Id,
  store: Store,
): boolean {
  if (userCanEditInitiativeForms(user, initiativeId, store)) return true;
  if (isAreaTransformacion(user)) {
    // AT puede ver todo; asumimos que además puede comentar.
    return userCanAccessInitiative(user, initiativeId, store);
  }
  const members = store.initiative_members.filter(
    (m) => m.user_id === user.id && m.initiative_id === initiativeId,
  );
  return members.some((m) => {
    if (m.role === "bo" || m.role === "sponsor") return true;
    if (m.role === "equipo" && m.access_level === "comment") return true;
    return false;
  });
}

export function userRolesInInitiative(
  user: User,
  initiativeId: Id,
  store: Store,
): InitiativeMemberRole[] {
  return store.initiative_members
    .filter((m) => m.user_id === user.id && m.initiative_id === initiativeId)
    .map((m) => m.role);
}
