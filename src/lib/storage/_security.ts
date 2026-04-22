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
  if (isAreaTransformacion(user) || user.is_vp) return true;
  return store.initiative_members.some(
    (m) => m.user_id === user.id && m.initiative_id === initiativeId,
  );
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
