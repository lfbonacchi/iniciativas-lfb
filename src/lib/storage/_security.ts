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

export function userRolesInInitiative(
  user: User,
  initiativeId: Id,
  store: Store,
): InitiativeMemberRole[] {
  return store.initiative_members
    .filter((m) => m.user_id === user.id && m.initiative_id === initiativeId)
    .map((m) => m.role);
}
