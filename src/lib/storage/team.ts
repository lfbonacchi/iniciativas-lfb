import type { Id, InitiativeMember, InitiativeMemberRole, User } from "@/types";
import { err, ok, type Result } from "@/lib/result";

import { appendAudit } from "./_audit";
import {
  getCurrentUserFromStore,
  isAreaTransformacion,
  userCanAccessInitiative,
} from "./_security";
import { readStore, writeStore, type Store } from "./_store";

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
];

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
  if (!isAreaTransformacion(user)) {
    return err(
      "FORBIDDEN",
      "Solo Área Transformación puede gestionar el equipo",
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
  if (!isAreaTransformacion(user)) {
    return err(
      "FORBIDDEN",
      "Solo Área Transformación puede gestionar el equipo",
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
  if (!isAreaTransformacion(user)) {
    return err(
      "FORBIDDEN",
      "Solo Área Transformación puede gestionar el equipo",
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
