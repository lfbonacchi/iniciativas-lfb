import type { Id, InitiativeMember, InitiativeMemberRole, User } from "@/types";
import { err, ok, type Result } from "@/lib/result";

import { appendAudit } from "./_audit";
import {
  getCurrentUserFromStore,
  isAreaTransformacion,
  userCanAccessInitiative,
} from "./_security";
import {
  readStore,
  writeStore,
  type InitiativeAreaChange,
  type Store,
} from "./_store";
import { newId, nowIso } from "./_ids";
import { getOverlay } from "./financials";

export type WorkType = "Interno" | "Externo";

export interface TeamWorkMember {
  user_id: Id;
  display_name: string;
  role: InitiativeMemberRole;
  role_label: string;
  allocation_percent: number;
  work_type: WorkType;
  vicepresidencia: string;
}

export interface StrategicAlignmentRow {
  key: "sponsor" | "bo" | "portfolio" | "ld";
  label: string;
  display_name: string | null;
  job_title: string | null;
  vicepresidencia: string | null;
}

export interface StakeholderRow {
  user_id: Id;
  display_name: string;
  position: string;
  vicepresidencia: string;
}

export interface InitiativeTeam {
  work_members: TeamWorkMember[];
  strategic_alignment: StrategicAlignmentRow[];
  stakeholders: StakeholderRow[];
  can_manage: boolean;
}

const ROLE_LABEL: Record<InitiativeMemberRole, string> = {
  promotor: "Promotor",
  ld: "Líder de Dimensión",
  po: "Product Owner",
  bo: "Business Owner",
  sponsor: "Sponsor",
  sm: "Scrum Master",
  equipo: "Equipo de trabajo",
  afectado: "Afectado",
};

const WORK_ROLES: readonly InitiativeMemberRole[] = [
  "po",
  "promotor",
  "ld",
  "sm",
  "equipo",
];

// Mocks deterministas derivados del user id para columnas que el modelo aún
// no persiste (% asignación, interno/externo, costo/mes). En Fase 5 estos
// campos pasarán a vivir en la tabla initiative_members.
function hashToInt(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function allocationFor(userId: Id, role: InitiativeMemberRole): number {
  if (role === "po" || role === "ld") return 80;
  if (role === "sponsor" || role === "bo") return 15;
  if (role === "sm") return 50;
  const buckets = [20, 30, 40, 50, 60, 70];
  return buckets[hashToInt(userId) % buckets.length] ?? 40;
}

function workTypeFor(userId: Id, role: InitiativeMemberRole): WorkType {
  if (role === "sponsor" || role === "bo" || role === "ld") return "Interno";
  return hashToInt(userId) % 4 === 0 ? "Externo" : "Interno";
}

function pickFirstByRole(
  role: InitiativeMemberRole,
  initiativeId: Id,
  store: Store,
): User | null {
  const member = store.initiative_members.find(
    (m) => m.initiative_id === initiativeId && m.role === role,
  );
  if (!member) return null;
  return store.users.find((u) => u.id === member.user_id) ?? null;
}

function pickPortfolioUser(store: Store, initiativeId: Id): User | null {
  // El rol "Portfolio" refiere al coordinador de Área Transformación que
  // acompaña la iniciativa. No está en initiative_members, así que elegimos
  // determinísticamente un usuario con global_role area_transformacion.
  const atUsers = store.users.filter(
    (u) => u.global_role === "area_transformacion",
  );
  if (atUsers.length === 0) return null;
  const idx = hashToInt(initiativeId) % atUsers.length;
  return atUsers[idx] ?? atUsers[0] ?? null;
}

function pickStakeholders(
  store: Store,
  initiativeId: Id,
  excludedUserIds: Set<Id>,
): StakeholderRow[] {
  // Mock determinista: tomamos 3 usuarios que no sean parte del equipo ni de
  // la alineación estratégica, rotados según el id de la iniciativa.
  const candidates = store.users.filter((u) => !excludedUserIds.has(u.id));
  if (candidates.length === 0) return [];
  const seed = hashToInt(initiativeId);
  const sorted = [...candidates].sort(
    (a, b) =>
      ((hashToInt(a.id) + seed) % 997) - ((hashToInt(b.id) + seed) % 997),
  );
  return sorted.slice(0, 3).map((u) => ({
    user_id: u.id,
    display_name: u.display_name,
    position: u.job_title,
    vicepresidencia: u.vicepresidencia,
  }));
}

export function getInitiativeTeam(initiativeId: Id): Result<InitiativeTeam> {
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

  // Tabla 1 — Equipo de trabajo (roles operativos). Deduplicamos por user.
  const seenUsers = new Set<Id>();
  const workMembers: TeamWorkMember[] = [];
  for (const m of members) {
    if (!WORK_ROLES.includes(m.role)) continue;
    if (seenUsers.has(m.user_id)) continue;
    const u = store.users.find((uu) => uu.id === m.user_id);
    if (!u) continue;
    seenUsers.add(m.user_id);
    const allocation = allocationFor(u.id, m.role);
    const workType = workTypeFor(u.id, m.role);
    workMembers.push({
      user_id: u.id,
      display_name: u.display_name,
      role: m.role,
      role_label: ROLE_LABEL[m.role],
      allocation_percent: allocation,
      work_type: workType,
      vicepresidencia: u.vicepresidencia,
    });
  }
  workMembers.sort((a, b) => a.display_name.localeCompare(b.display_name));

  // Tabla 2 — Alineación estratégica.
  const sponsor = pickFirstByRole("sponsor", initiativeId, store);
  const bo = pickFirstByRole("bo", initiativeId, store);
  const ld = pickFirstByRole("ld", initiativeId, store);
  const portfolio = pickPortfolioUser(store, initiativeId);

  function alignmentRow(
    key: StrategicAlignmentRow["key"],
    label: string,
    u: User | null,
  ): StrategicAlignmentRow {
    return {
      key,
      label,
      display_name: u?.display_name ?? null,
      job_title: u?.job_title ?? null,
      vicepresidencia: u?.vicepresidencia ?? null,
    };
  }

  const strategicAlignment: StrategicAlignmentRow[] = [
    alignmentRow("sponsor", "Sponsor", sponsor),
    alignmentRow("bo", "Business Owner", bo),
    alignmentRow("portfolio", "Portfolio", portfolio),
    alignmentRow("ld", "Líder de Dimensión", ld),
  ];

  // Tabla 3 — Interesados y consultados (usuarios fuera del core).
  const excluded = new Set<Id>(
    [
      ...workMembers.map((w) => w.user_id),
      sponsor?.id,
      bo?.id,
      ld?.id,
      portfolio?.id,
    ].filter((id): id is Id => Boolean(id)),
  );
  const stakeholders = pickStakeholders(store, initiativeId, excluded);

  return ok({
    work_members: workMembers,
    strategic_alignment: strategicAlignment,
    stakeholders,
    can_manage: isAreaTransformacion(user),
  });
}

// ---------------------------------------------------------------------------
// Mutations — solo Área Transformación puede modificar el equipo
// ---------------------------------------------------------------------------

const ASSIGNABLE_ROLES: readonly InitiativeMemberRole[] = [
  "equipo",
  "sm",
  "po",
  "ld",
  "promotor",
  "afectado",
];

// Quién puede gestionar el equipo / afectados / área: AT, admin, PO, SM o
// promotor de la iniciativa. VPs también (sobre iniciativas de su VP).
function userCanManageTeam(
  user: User,
  initiativeId: Id,
  store: Store,
): boolean {
  if (isAreaTransformacion(user)) return true;
  if (user.is_vp) return true;
  const roles = store.initiative_members
    .filter((m) => m.user_id === user.id && m.initiative_id === initiativeId)
    .map((m) => m.role);
  return (
    roles.includes("po") ||
    roles.includes("promotor") ||
    roles.includes("sm")
  );
}

export interface AddTeamMemberInput {
  initiative_id: Id;
  user_id: Id;
  role: InitiativeMemberRole;
}

export function addTeamMember(
  input: AddTeamMemberInput,
): Result<InitiativeMember> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanManageTeam(user, input.initiative_id, store)) {
    return err(
      "FORBIDDEN",
      "Solo AT, VP, PO/Promotor o Scrum pueden gestionar el equipo",
    );
  }

  if (!ASSIGNABLE_ROLES.includes(input.role)) {
    return err(
      "VALIDATION_ERROR",
      "El rol seleccionado no se puede asignar desde acá",
    );
  }

  const initiative = store.initiatives.find((i) => i.id === input.initiative_id);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");

  const targetUser = store.users.find((u) => u.id === input.user_id);
  if (!targetUser) return err("NOT_FOUND", "Usuario no encontrado");

  const exists = store.initiative_members.some(
    (m) =>
      m.initiative_id === input.initiative_id &&
      m.user_id === input.user_id &&
      m.role === input.role,
  );
  if (exists) {
    return err(
      "VALIDATION_ERROR",
      `${targetUser.display_name} ya está en el equipo con ese rol`,
    );
  }

  const member: InitiativeMember = {
    user_id: input.user_id,
    initiative_id: input.initiative_id,
    role: input.role,
    can_edit: input.role !== "equipo" ? true : true,
  };
  store.initiative_members.push(member);
  appendAudit(store, {
    user_id: user.id,
    action: "initiative_member_added",
    entity_type: "initiative_member",
    entity_id: input.initiative_id,
    old_data: null,
    new_data: {
      user_id: input.user_id,
      role: input.role,
    },
  });
  writeStore(store);
  return ok(member);
}

export function removeTeamMember(
  initiativeId: Id,
  userId: Id,
  role: InitiativeMemberRole,
): Result<null> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanManageTeam(user, initiativeId, store)) {
    return err(
      "FORBIDDEN",
      "Solo AT, VP, PO/Promotor o Scrum pueden gestionar el equipo",
    );
  }

  const idx = store.initiative_members.findIndex(
    (m) =>
      m.initiative_id === initiativeId &&
      m.user_id === userId &&
      m.role === role,
  );
  if (idx === -1) return err("NOT_FOUND", "Miembro no encontrado");

  const removed = store.initiative_members[idx];
  store.initiative_members.splice(idx, 1);
  appendAudit(store, {
    user_id: user.id,
    action: "initiative_member_removed",
    entity_type: "initiative_member",
    entity_id: initiativeId,
    old_data: removed ? { user_id: removed.user_id, role: removed.role } : null,
    new_data: null,
  });
  writeStore(store);
  return ok(null);
}

export function changeTeamMemberRole(
  initiativeId: Id,
  userId: Id,
  oldRole: InitiativeMemberRole,
  newRole: InitiativeMemberRole,
): Result<InitiativeMember> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanManageTeam(user, initiativeId, store)) {
    return err(
      "FORBIDDEN",
      "Solo AT, VP, PO/Promotor o Scrum pueden gestionar el equipo",
    );
  }

  const member = store.initiative_members.find(
    (m) =>
      m.initiative_id === initiativeId &&
      m.user_id === userId &&
      m.role === oldRole,
  );
  if (!member) return err("NOT_FOUND", "Miembro no encontrado");
  if (oldRole === newRole) return ok(member);

  const conflict = store.initiative_members.some(
    (m) =>
      m.initiative_id === initiativeId &&
      m.user_id === userId &&
      m.role === newRole,
  );
  if (conflict) {
    return err(
      "VALIDATION_ERROR",
      "El miembro ya tiene ese rol en esta iniciativa",
    );
  }

  member.role = newRole;
  appendAudit(store, {
    user_id: user.id,
    action: "initiative_member_role_changed",
    entity_type: "initiative_member",
    entity_id: initiativeId,
    old_data: { user_id: userId, role: oldRole },
    new_data: { user_id: userId, role: newRole },
  });
  writeStore(store);
  return ok(member);
}

// ---------------------------------------------------------------------------
// Afectados
// ---------------------------------------------------------------------------

export function addAffectedMember(
  initiativeId: Id,
  userId: Id,
): Result<InitiativeMember> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanManageTeam(user, initiativeId, store)) {
    return err(
      "FORBIDDEN",
      "Solo AT, VP, PO/Promotor o Scrum pueden marcar afectados",
    );
  }
  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  const targetUser = store.users.find((u) => u.id === userId);
  if (!targetUser) return err("NOT_FOUND", "Usuario no encontrado");

  const exists = store.initiative_members.some(
    (m) =>
      m.initiative_id === initiativeId &&
      m.user_id === userId &&
      m.role === "afectado",
  );
  if (exists) {
    return err(
      "VALIDATION_ERROR",
      `${targetUser.display_name} ya está marcado como afectado`,
    );
  }

  const member: InitiativeMember = {
    user_id: userId,
    initiative_id: initiativeId,
    role: "afectado",
    can_edit: false,
    access_level: "view",
  };
  store.initiative_members.push(member);

  const now = nowIso();
  store.notifications.push({
    id: newId("notif"),
    user_id: userId,
    type: "member_added",
    title: "Iniciativa que te afecta",
    message: `Fuiste incluido como afectado en "${initiative.name}". Podés verla en "Que me impactan".`,
    initiative_id: initiativeId,
    read: false,
    created_at: now,
  });

  appendAudit(store, {
    user_id: user.id,
    action: "initiative_affected_added",
    entity_type: "initiative_member",
    entity_id: initiativeId,
    old_data: null,
    new_data: { user_id: userId, role: "afectado" },
  });
  writeStore(store);
  return ok(member);
}

// ---------------------------------------------------------------------------
// Cambio de área (VP)
// ---------------------------------------------------------------------------

// Devuelve el VP actual de una iniciativa considerando los cambios de área
// registrados. El último cambio (si hay) gana; si no, cae al sponsor o al
// overlay financiero.
export function getCurrentInitiativeVp(
  initiativeId: Id,
): { current_vp: string; changed: boolean } {
  const store = readStore();
  const changes = store.initiative_area_changes
    .filter((c) => c.initiative_id === initiativeId)
    .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  if (changes.length > 0) {
    return { current_vp: changes[0]!.to_vp, changed: true };
  }
  const sponsor = store.initiative_members.find(
    (m) => m.initiative_id === initiativeId && m.role === "sponsor",
  );
  if (sponsor) {
    const u = store.users.find((uu) => uu.id === sponsor.user_id);
    if (u) return { current_vp: u.vicepresidencia, changed: false };
  }
  return {
    current_vp: getOverlay(initiativeId).vicepresidencia,
    changed: false,
  };
}

export function listAvailableVps(): string[] {
  const store = readStore();
  const vps = new Set<string>();
  for (const u of store.users) {
    if (u.vicepresidencia) vps.add(u.vicepresidencia);
  }
  return Array.from(vps).sort();
}

export function changeInitiativeArea(
  initiativeId: Id,
  toVp: string,
  reason: string | null,
): Result<InitiativeAreaChange> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanManageTeam(user, initiativeId, store)) {
    return err(
      "FORBIDDEN",
      "Solo AT, VP, PO/Promotor o Scrum pueden cambiar el área",
    );
  }
  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  const clean = (toVp ?? "").trim();
  if (clean.length < 2) {
    return err("VALIDATION_ERROR", "Seleccioná un VP destino válido");
  }

  const current = getCurrentInitiativeVp(initiativeId);
  if (current.current_vp === clean) {
    return err("CONFLICT", "La iniciativa ya está en esa VP");
  }

  const now = nowIso();
  const change: InitiativeAreaChange = {
    id: newId("areachg"),
    initiative_id: initiativeId,
    from_vp: current.current_vp,
    to_vp: clean,
    changed_by: user.id,
    changed_at: now,
    reason: reason && reason.trim().length > 0 ? reason.trim() : null,
  };
  store.initiative_area_changes.push(change);

  // Notificar a los miembros core y a AT de la nueva VP. Para evitar
  // dependencia de listas externas, notificamos a todos los miembros actuales.
  const members = store.initiative_members.filter(
    (m) => m.initiative_id === initiativeId,
  );
  for (const m of members) {
    if (m.user_id === user.id) continue;
    store.notifications.push({
      id: newId("notif"),
      user_id: m.user_id,
      type: "initiative_area_change",
      title: "Cambio de área en la iniciativa",
      message: `"${initiative.name}" pasó de ${current.current_vp} a ${clean}`,
      initiative_id: initiativeId,
      read: false,
      created_at: now,
    });
  }

  appendAudit(store, {
    user_id: user.id,
    action: "initiative_area_changed",
    entity_type: "initiative",
    entity_id: initiativeId,
    old_data: { vp: current.current_vp },
    new_data: { vp: clean, reason: change.reason },
  });
  writeStore(store);
  return ok(change);
}
