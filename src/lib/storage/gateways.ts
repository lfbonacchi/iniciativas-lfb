import type {
  Document,
  Form,
  FormType,
  Gateway,
  GatewayStatus,
  GatewayVote,
  GatewayVoteValue,
  Id,
  Initiative,
  InitiativeStage,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  addExtraApproverSchema,
  generateMinutaSchema,
  pendingDecisionSchema,
  publishSectionCommentsSchema,
  resubmitVFSchema,
  saveFeedbackDocSchema,
  saveInlineCommentSchema,
  saveMinutaSchema,
  submitVoteSchema,
} from "@/lib/validations/gateways";
import {
  readStore,
  writeStore,
  type GatewayExtraApprover,
  type GatewayInlineComment,
  type GatewayMinuta,
  type Store,
} from "./_store";
import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
  userRolesInInitiative,
} from "./_security";
import { appendAudit } from "./_audit";
import {
  applyStageChangeInStore,
  applyStatusChangeInStore,
} from "./initiatives";
import { createSnapshotInStore } from "./form_snapshots";

export interface GatewayDetail {
  gateway: Gateway;
  votes: GatewayVote[];
  feedback_by_user: Record<Id, string | null>;
}

export interface GatewayApprover {
  user_id: Id;
  display_name: string;
  role: "bo" | "sponsor" | "ld" | "extra";
  role_label: string;
  vote: GatewayVoteValue | null;
  is_current_user: boolean;
  feedback_text: string | null;
  // True si fue agregado manualmente (no es aprobador natural).
  is_additional: boolean;
  // True si su voto cuenta para la unanimidad. Los adicionales pueden
  // ser obligatorios (required=true) u opcionales (required=false).
  is_required: boolean;
}

export interface GatewayFullDetail {
  gateway: Gateway;
  initiative: Initiative;
  form: Form;
  promotor_name: string | null;
  ld_name: string | null;
  dimension: string | null;
  approvers: GatewayApprover[];
  // Votos recibidos (acotado a [0, votes_total]).
  votes_received: number;
  // Total de aprobadores cuyos votos son requeridos para unanimidad.
  votes_total: number;
  current_user_vote: GatewayVoteValue | null;
  current_user_is_approver: boolean;
  // Puede gestionar aprobadores adicionales (PO/SM/VP/AT).
  current_user_can_manage_approvers: boolean;
}

const ROLE_LABEL: Record<"bo" | "sponsor" | "ld" | "extra", string> = {
  sponsor: "Sponsor",
  bo: "Business Owner",
  ld: "Líder Dim.",
  extra: "Aprobador",
};

function userCanManageApprovers(
  user: { id: Id; global_role: string; is_vp?: boolean },
  initiativeId: Id,
  store: Store,
): boolean {
  if (user.global_role === "area_transformacion" || user.global_role === "admin") {
    return true;
  }
  if (user.is_vp) return true;
  const roles = store.initiative_members
    .filter((m) => m.user_id === user.id && m.initiative_id === initiativeId)
    .map((m) => m.role);
  return roles.includes("po") || roles.includes("sm");
}

export function getGatewayFullDetail(gatewayId: Id): Result<GatewayFullDetail> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const gateway = store.gateways.find((g) => g.id === gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const initiative = store.initiatives.find((i) => i.id === gateway.initiative_id);
  const form = store.forms.find((f) => f.id === gateway.form_id);
  if (!initiative || !form) return err("NOT_FOUND", "Datos del gateway incompletos");

  const members = store.initiative_members.filter(
    (m) => m.initiative_id === initiative.id,
  );
  const findName = (role: string) => {
    const m = members.find((mm) => mm.role === role);
    if (!m) return null;
    const u = store.users.find((uu) => uu.id === m.user_id);
    return u ? u.display_name : null;
  };
  const sponsor = members.find((m) => m.role === "sponsor");
  const sponsorUser = sponsor ? store.users.find((u) => u.id === sponsor.user_id) : null;

  const votes = store.gateway_votes.filter((v) => v.gateway_id === gateway.id);
  const extras = store.gateway_extra_approvers.filter(
    (e) => e.gateway_id === gateway.id,
  );
  const extraUserIds = new Set(extras.map((e) => e.user_id));

  const approverRoles: Array<"sponsor" | "bo" | "ld"> = ["sponsor", "bo", "ld"];
  const approvers: GatewayApprover[] = [];
  const seen = new Set<Id>();
  for (const role of approverRoles) {
    const roleMembers = members.filter((m) => m.role === role);
    for (const m of roleMembers) {
      if (seen.has(m.user_id)) continue;
      const u = store.users.find((uu) => uu.id === m.user_id);
      if (!u) continue;
      seen.add(u.id);
      const vote = votes.find((v) => v.user_id === u.id);
      approvers.push({
        user_id: u.id,
        display_name: u.display_name,
        role,
        role_label: ROLE_LABEL[role],
        vote: vote ? vote.vote : null,
        is_current_user: u.id === user.id,
        feedback_text: vote ? vote.feedback_text : null,
        is_additional: false,
        is_required: true,
      });
    }
  }
  for (const e of extras) {
    if (seen.has(e.user_id)) continue;
    const u = store.users.find((uu) => uu.id === e.user_id);
    if (!u) continue;
    seen.add(u.id);
    const vote = votes.find((v) => v.user_id === u.id);
    approvers.push({
      user_id: u.id,
      display_name: u.display_name,
      role: "extra",
      role_label: e.required ? "Aprobador (obl.)" : "Aprobador (opc.)",
      vote: vote ? vote.vote : null,
      is_current_user: u.id === user.id,
      feedback_text: vote ? vote.feedback_text : null,
      is_additional: true,
      is_required: e.required,
    });
  }

  const currentUserVote = votes.find((v) => v.user_id === user.id) ?? null;
  const requiredApprovers = approvers.filter((a) => a.is_required);
  const votesReceivedRequired = requiredApprovers.filter(
    (a) => a.vote !== null,
  ).length;
  const votesTotal = requiredApprovers.length;

  void extraUserIds;

  return ok({
    gateway,
    initiative,
    form,
    promotor_name: findName("promotor"),
    ld_name: findName("ld"),
    dimension: sponsorUser ? sponsorUser.vicepresidencia : null,
    approvers,
    // Siempre acotado a [0, votes_total] para evitar "4 de 3".
    votes_received: Math.min(votesReceivedRequired, votesTotal),
    votes_total: votesTotal,
    current_user_vote: currentUserVote ? currentUserVote.vote : null,
    current_user_is_approver: approvers.some((a) => a.is_current_user),
    current_user_can_manage_approvers: userCanManageApprovers(
      user,
      initiative.id,
      store,
    ),
  });
}

export interface GatewayListItem {
  gateway: Gateway;
  initiative: Initiative;
  form: Form;
  form_type: FormType;
  promotor_name: string | null;
  ld_name: string | null;
  sponsor_name: string | null;
  dimension: string | null;
  submitted_at: string | null;
  votes_received: number;
  votes_total: number;
  user_is_approver: boolean;
  user_has_voted: boolean;
}

function buildGatewayListItem(
  store: Store,
  gateway: Gateway,
  currentUserId: Id | null,
): GatewayListItem | null {
  const initiative = store.initiatives.find(
    (i) => i.id === gateway.initiative_id,
  );
  const form = store.forms.find((f) => f.id === gateway.form_id);
  if (!initiative || !form) return null;

  const members = store.initiative_members.filter(
    (m) => m.initiative_id === initiative.id,
  );
  const findName = (role: string) => {
    const m = members.find((mm) => mm.role === role);
    if (!m) return null;
    const u = store.users.find((uu) => uu.id === m.user_id);
    return u ? u.display_name : null;
  };
  const sponsor = members.find((m) => m.role === "sponsor");
  const sponsorUser = sponsor
    ? store.users.find((u) => u.id === sponsor.user_id)
    : null;

  const approvers = approversForInitiative(store, initiative.id);
  const votes = store.gateway_votes.filter((v) => v.gateway_id === gateway.id);
  const userHasVoted = currentUserId
    ? votes.some((v) => v.user_id === currentUserId)
    : false;
  const userIsApprover = currentUserId
    ? approvers.includes(currentUserId)
    : false;

  return {
    gateway,
    initiative,
    form,
    form_type: form.form_type,
    promotor_name: findName("promotor"),
    ld_name: findName("ld"),
    sponsor_name: sponsorUser ? sponsorUser.display_name : null,
    dimension: sponsorUser ? sponsorUser.vicepresidencia : null,
    submitted_at: form.submitted_at,
    votes_received: votes.length,
    votes_total: approvers.length,
    user_is_approver: userIsApprover,
    user_has_voted: userHasVoted,
  };
}

export function listGateways(): Result<GatewayListItem[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const items: GatewayListItem[] = [];
  for (const g of store.gateways) {
    if (!userCanAccessInitiative(user, g.initiative_id, store)) continue;
    const item = buildGatewayListItem(store, g, user.id);
    if (item) items.push(item);
  }
  items.sort((a, b) =>
    (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""),
  );
  return ok(items);
}

export function listPendingApprovalsForUser(): Result<GatewayListItem[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const items: GatewayListItem[] = [];
  for (const g of store.gateways) {
    if (g.status !== "pending") continue;
    const approvers = approversForInitiative(store, g.initiative_id);
    if (!approvers.includes(user.id)) continue;
    const alreadyVoted = store.gateway_votes.some(
      (v) => v.gateway_id === g.id && v.user_id === user.id,
    );
    if (alreadyVoted) continue;
    const item = buildGatewayListItem(store, g, user.id);
    if (item) items.push(item);
  }
  items.sort((a, b) =>
    (a.submitted_at ?? "").localeCompare(b.submitted_at ?? ""),
  );
  return ok(items);
}

export function getGateway(gatewayId: Id): Result<GatewayDetail> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const gateway = store.gateways.find((g) => g.id === gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  const votes = store.gateway_votes.filter((v) => v.gateway_id === gatewayId);
  const feedback_by_user: Record<Id, string | null> = {};
  for (const v of votes) feedback_by_user[v.user_id] = v.feedback_text;
  return ok({ gateway, votes, feedback_by_user });
}

function resolveStatusFromVotes(
  votes: readonly GatewayVoteValue[],
  expectedVoters: number,
): GatewayStatus {
  // Prioridad: reject > pause > feedback > approved_with_changes > approved
  // feedback ("necesita cambios") rompe la ronda y rearma VF.
  // approved_with_changes cuenta como aprobación + pide cambios al PO.
  if (votes.includes("reject")) return "reject";
  if (votes.includes("pause")) return "pause";
  if (votes.includes("area_change")) return "area_change";
  if (votes.includes("feedback")) return "feedback";
  if (votes.length < expectedVoters) return "pending";
  const allApproving = votes.every(
    (v) => v === "approved" || v === "approved_with_changes",
  );
  if (!allApproving) return "pending";
  return votes.includes("approved_with_changes")
    ? "approved_with_changes"
    : "approved";
}

function approversForInitiative(store: Store, initiativeId: Id): Id[] {
  const natural = store.initiative_members
    .filter(
      (m) =>
        m.initiative_id === initiativeId &&
        (m.role === "bo" || m.role === "sponsor" || m.role === "ld"),
    )
    .map((m) => m.user_id);
  // Además, extras requeridos de cualquier gateway de la iniciativa que
  // todavía esté pending. Usamos un Set para evitar duplicados.
  const pendingGatewayIds = new Set(
    store.gateways
      .filter(
        (g) => g.initiative_id === initiativeId && g.status === "pending",
      )
      .map((g) => g.id),
  );
  const extras = store.gateway_extra_approvers
    .filter((e) => pendingGatewayIds.has(e.gateway_id) && e.required)
    .map((e) => e.user_id);
  return Array.from(new Set([...natural, ...extras]));
}

// Variante por gateway-id para contar correctamente los extras del gateway
// específico al resolver votos.
function requiredApproverIdsForGateway(store: Store, gateway: Gateway): Id[] {
  const natural = store.initiative_members
    .filter(
      (m) =>
        m.initiative_id === gateway.initiative_id &&
        (m.role === "bo" || m.role === "sponsor" || m.role === "ld"),
    )
    .map((m) => m.user_id);
  const extras = store.gateway_extra_approvers
    .filter((e) => e.gateway_id === gateway.id && e.required)
    .map((e) => e.user_id);
  return Array.from(new Set([...natural, ...extras]));
}

export function submitVote(
  gatewayId: Id,
  vote: GatewayVoteValue,
  feedback: string | null,
): Result<{ gateway: Gateway; resolution: GatewayStatus }> {
  const parsed = submitVoteSchema.safeParse({ gatewayId, vote, feedback });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  const roles = userRolesInInitiative(user, gateway.initiative_id, store);
  const isNaturalApprover =
    roles.includes("bo") || roles.includes("sponsor") || roles.includes("ld");
  const isExtraApprover = store.gateway_extra_approvers.some(
    (e) => e.gateway_id === gateway.id && e.user_id === user.id,
  );
  if (!isNaturalApprover && !isExtraApprover) {
    return err(
      "FORBIDDEN",
      "Solo los aprobadores del gateway pueden votar",
    );
  }
  if (gateway.status !== "pending") {
    return err("CONFLICT", "El gateway ya fue resuelto");
  }

  const now = nowIso();
  const existing = store.gateway_votes.find(
    (v) => v.gateway_id === gateway.id && v.user_id === user.id,
  );
  if (existing) {
    existing.vote = parsed.data.vote;
    existing.feedback_text = parsed.data.feedback;
  } else {
    const newVote: GatewayVote = {
      id: newId("vote"),
      gateway_id: gateway.id,
      user_id: user.id,
      vote: parsed.data.vote,
      feedback_text: parsed.data.feedback,
    };
    store.gateway_votes.push(newVote);
  }

  // Solo cuentan para unanimidad los aprobadores requeridos (naturales +
  // extras marcados como obligatorios). Los extras opcionales pueden votar
  // pero no bloquean ni cuentan.
  const requiredIds = requiredApproverIdsForGateway(store, gateway);
  const requiredVotes = store.gateway_votes
    .filter(
      (v) => v.gateway_id === gateway.id && requiredIds.includes(v.user_id),
    )
    .map((v) => v.vote);
  const resolution = resolveStatusFromVotes(
    requiredVotes,
    Math.max(requiredIds.length, 1),
  );

  const oldStatus = gateway.status;
  appendAudit(store, {
    user_id: user.id,
    action: "gateway_vote_cast",
    entity_type: "gateway_vote",
    entity_id: gateway.id,
    old_data: { status: oldStatus },
    new_data: { vote: parsed.data.vote, resolution },
  });

  if (resolution !== "pending") {
    gateway.status = resolution;

    const form = store.forms.find((f) => f.id === gateway.form_id);
    const initiative = store.initiatives.find(
      (i) => i.id === gateway.initiative_id,
    );

    if ((resolution === "approved" || resolution === "approved_with_changes") && form) {
      const oldFormStatus = form.status;
      form.status = "approved";
      form.approved_at = now;
      form.updated_at = now;

      // "Aprobar con cambios": notificar al PO para que arme la VF
      // incorporando los acuerdos de la minuta + feedback.
      if (resolution === "approved_with_changes") {
        const po = store.initiative_members.find(
          (m) =>
            m.initiative_id === gateway.initiative_id &&
            (m.role === "po" || m.role === "promotor"),
        );
        if (po) {
          store.notifications.push({
            id: newId("notif"),
            user_id: po.user_id,
            type: "gateway_resolved",
            title: "Gateway aprobado con cambios",
            message: `El Gateway ${gateway.gateway_number} fue aprobado con cambios. Armá la VF incorporando minuta y feedback.`,
            initiative_id: gateway.initiative_id,
            read: false,
            created_at: now,
          });
        }
      }
      // Snapshot VF automático: toma las responses vigentes al momento de
      // aprobación como base. El PO puede crear luego una VF editada
      // con los acuerdos de minuta vía createFinalVersionSnapshot.
      createSnapshotInStore(store, form.id, "final", user.id);
      appendAudit(store, {
        user_id: user.id,
        action: "form_approved",
        entity_type: "form",
        entity_id: form.id,
        old_data: { status: oldFormStatus },
        new_data: { status: form.status },
      });
      if (initiative) {
        const nextStage: InitiativeStage | null =
          gateway.gateway_number === 1
            ? "dimensioning"
            : gateway.gateway_number === 2
              ? "mvp"
              : gateway.gateway_number === 3
                ? "ltp_tracking"
                : null;
        if (nextStage) {
          applyStageChangeInStore(store, user.id, initiative, nextStage);
        }
      }
    } else if (resolution === "feedback" && form) {
      // Resetear votos a pending → ronda limpia. Form vuelve a draft.
      const votesReset = store.gateway_votes.filter(
        (v) => v.gateway_id === gateway.id,
      ).length;
      form.status = "draft";
      form.updated_at = now;
      gateway.status = "pending";
      store.gateway_votes = store.gateway_votes.filter(
        (v) => v.gateway_id !== gateway.id,
      );
      appendAudit(store, {
        user_id: user.id,
        action: "gateway_resolved",
        entity_type: "gateway",
        entity_id: gateway.id,
        old_data: { status: oldStatus },
        new_data: {
          status: "feedback",
          reset_votes: votesReset,
          returned_to: "draft",
        },
      });
    } else if (resolution === "pause" && initiative) {
      applyStatusChangeInStore(store, user.id, initiative, "paused");
    } else if (resolution === "reject" && initiative) {
      applyStatusChangeInStore(store, user.id, initiative, "rejected");
    } else if (resolution === "area_change" && initiative) {
      applyStatusChangeInStore(store, user.id, initiative, "area_change");
    }

    if (resolution !== "feedback") {
      appendAudit(store, {
        user_id: user.id,
        action: "gateway_resolved",
        entity_type: "gateway",
        entity_id: gateway.id,
        old_data: { status: oldStatus },
        new_data: { status: gateway.status },
      });
    }
  }

  writeStore(store);
  return ok({ gateway, resolution: gateway.status });
}

export function countPendingApprovalsForUser(userId: Id): Result<number> {
  const store = readStore();
  const pending = store.gateways.filter((g) => g.status === "pending");
  let count = 0;
  for (const g of pending) {
    const approvers = approversForInitiative(store, g.initiative_id);
    if (!approvers.includes(userId)) continue;
    const alreadyVoted = store.gateway_votes.some(
      (v) => v.gateway_id === g.id && v.user_id === userId,
    );
    if (!alreadyVoted) count += 1;
  }
  return ok(count);
}

export function generateMinuta(gatewayId: Id): Result<Document> {
  const parsed = generateMinutaSchema.safeParse({ gatewayId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  // STUB: solo crea metadata. Generación DOCX real con docx lib (browser) — TBD.
  const now = nowIso();
  const stage =
    gateway.gateway_number === 1
      ? "proposal"
      : gateway.gateway_number === 2
        ? "dimensioning"
        : "mvp";
  const doc: Document = {
    id: newId("doc"),
    initiative_id: gateway.initiative_id,
    document_type: "minuta_gateway_docx",
    file_path: `/Iniciativas/${gateway.initiative_id}/${stage}/Minuta_gateway_${gateway.gateway_number}.docx`,
    stage,
    ltp_period: null,
    generated_by: user.id,
    created_at: now,
  };
  store.documents.push(doc);
  appendAudit(store, {
    user_id: user.id,
    action: "document_generated",
    entity_type: "document",
    entity_id: doc.id,
    old_data: null,
    new_data: { document_type: doc.document_type, file_path: doc.file_path },
  });
  writeStore(store);
  return ok(doc);
}

// ---------------------------------------------------------------------------
// Aprobadores adicionales
// ---------------------------------------------------------------------------

export function addExtraApprover(
  gatewayId: Id,
  userId: Id,
  required: boolean,
): Result<GatewayExtraApprover> {
  const parsed = addExtraApproverSchema.safeParse({ gatewayId, userId, required });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanManageApprovers(user, gateway.initiative_id, store)) {
    return err(
      "FORBIDDEN",
      "Solo PO, Scrum, VP o Área Transformación pueden agregar aprobadores",
    );
  }
  if (gateway.status !== "pending") {
    return err("CONFLICT", "El gateway ya fue resuelto");
  }

  const target = store.users.find((u) => u.id === parsed.data.userId);
  if (!target) return err("NOT_FOUND", "Usuario no encontrado");

  // Duplicados: ya es aprobador natural?
  const naturalRoles = store.initiative_members.filter(
    (m) =>
      m.initiative_id === gateway.initiative_id &&
      m.user_id === parsed.data.userId &&
      (m.role === "bo" || m.role === "sponsor" || m.role === "ld"),
  );
  if (naturalRoles.length > 0) {
    return err("VALIDATION_ERROR", `${target.display_name} ya es aprobador natural`);
  }
  const already = store.gateway_extra_approvers.some(
    (e) => e.gateway_id === gateway.id && e.user_id === parsed.data.userId,
  );
  if (already) {
    return err("VALIDATION_ERROR", `${target.display_name} ya fue agregado`);
  }

  const now = nowIso();
  const extra: GatewayExtraApprover = {
    id: newId("xappr"),
    gateway_id: gateway.id,
    user_id: parsed.data.userId,
    required: parsed.data.required,
    added_by: user.id,
    added_at: now,
  };
  store.gateway_extra_approvers.push(extra);

  // Notificación al nuevo aprobador.
  store.notifications.push({
    id: newId("notif"),
    user_id: parsed.data.userId,
    type: "gateway_vote_pending",
    title: parsed.data.required
      ? "Fuiste agregado como aprobador obligatorio"
      : "Fuiste agregado como aprobador opcional",
    message: `Tu voto fue solicitado para el Gateway ${gateway.gateway_number}`,
    initiative_id: gateway.initiative_id,
    read: false,
    created_at: now,
  });

  appendAudit(store, {
    user_id: user.id,
    action: "gateway_approver_added",
    entity_type: "gateway",
    entity_id: gateway.id,
    old_data: null,
    new_data: { user_id: parsed.data.userId, required: parsed.data.required },
  });
  writeStore(store);
  return ok(extra);
}

export function removeExtraApprover(
  gatewayId: Id,
  userId: Id,
): Result<null> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanManageApprovers(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No podés gestionar aprobadores");
  }
  const before = store.gateway_extra_approvers.length;
  store.gateway_extra_approvers = store.gateway_extra_approvers.filter(
    (e) => !(e.gateway_id === gatewayId && e.user_id === userId),
  );
  if (store.gateway_extra_approvers.length === before) {
    return err("NOT_FOUND", "Aprobador no encontrado");
  }
  // Si tenía voto, se mantiene el registro histórico; su voto deja de contar
  // automáticamente porque ya no está en required list.
  appendAudit(store, {
    user_id: user.id,
    action: "gateway_approver_removed",
    entity_type: "gateway",
    entity_id: gatewayId,
    old_data: { user_id: userId },
    new_data: null,
  });
  writeStore(store);
  return ok(null);
}

// ---------------------------------------------------------------------------
// Documentos de feedback (DOCX lógico)
// ---------------------------------------------------------------------------

export interface FeedbackDocListItem {
  id: Id;
  gateway_id: Id;
  user_id: Id;
  author_name: string;
  file_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_current_user: boolean;
}

function feedbackFileName(authorName: string): string {
  const slug = authorName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return `${slug || "usuario"}_feedback.docx`;
}

export function listGatewayFeedbackDocs(
  gatewayId: Id,
): Result<FeedbackDocListItem[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  const docs = store.gateway_feedback_docs
    .filter((d) => d.gateway_id === gatewayId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return ok(
    docs.map((d) => {
      const u = store.users.find((uu) => uu.id === d.user_id);
      const name = u?.display_name ?? "Usuario";
      return {
        id: d.id,
        gateway_id: d.gateway_id,
        user_id: d.user_id,
        author_name: name,
        file_name: feedbackFileName(name),
        content: d.content,
        created_at: d.created_at,
        updated_at: d.updated_at,
        is_current_user: d.user_id === user.id,
      };
    }),
  );
}

// Crea o actualiza el doc de feedback del usuario actual para el gateway.
// Un usuario tiene un doc por gateway. El doc se edita solo por su creador.
export function upsertGatewayFeedbackDoc(
  gatewayId: Id,
  content: string,
): Result<FeedbackDocListItem> {
  const parsed = saveFeedbackDocSchema.safeParse({ gatewayId, content });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  if (gateway.status !== "pending") {
    return err(
      "CONFLICT",
      "El gateway ya se cerró: no se puede modificar el feedback",
    );
  }

  const now = nowIso();
  let doc = store.gateway_feedback_docs.find(
    (d) => d.gateway_id === gateway.id && d.user_id === user.id,
  );
  const isNew = !doc;
  if (!doc) {
    doc = {
      id: newId("fbdoc"),
      gateway_id: gateway.id,
      initiative_id: gateway.initiative_id,
      user_id: user.id,
      content: parsed.data.content,
      created_at: now,
      updated_at: now,
    };
    store.gateway_feedback_docs.push(doc);
  } else {
    doc.content = parsed.data.content;
    doc.updated_at = now;
  }

  if (isNew) {
    // Notificar al PO que hay un feedback nuevo.
    const po = store.initiative_members.find(
      (m) =>
        m.initiative_id === gateway.initiative_id &&
        (m.role === "po" || m.role === "promotor"),
    );
    if (po && po.user_id !== user.id) {
      store.notifications.push({
        id: newId("notif"),
        user_id: po.user_id,
        type: "form_feedback_received",
        title: "Nuevo feedback de gateway",
        message: `${user.display_name} subió un feedback al Gateway ${gateway.gateway_number}`,
        initiative_id: gateway.initiative_id,
        read: false,
        created_at: now,
      });
    }
    appendAudit(store, {
      user_id: user.id,
      action: "gateway_feedback_doc_created",
      entity_type: "gateway",
      entity_id: gateway.id,
      old_data: null,
      new_data: { doc_id: doc.id },
    });
  }

  writeStore(store);
  return ok({
    id: doc.id,
    gateway_id: doc.gateway_id,
    user_id: doc.user_id,
    author_name: user.display_name,
    file_name: feedbackFileName(user.display_name),
    content: doc.content,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    is_current_user: true,
  });
}

// ---------------------------------------------------------------------------
// Decisión con ventana de undo (60s)
// ---------------------------------------------------------------------------

const DECISION_UNDO_WINDOW_MS = 60 * 1000;

export interface PendingDecision {
  id: Id;
  gateway_id: Id;
  user_id: Id;
  vote: GatewayVoteValue;
  feedback_text: string | null;
  created_at: string;
  expires_at: string;
  seconds_remaining: number;
}

// Encola una decisión pendiente sin aplicarla. Si existe una previa del mismo
// usuario para el mismo gateway, la reemplaza.
export function enqueuePendingDecision(
  gatewayId: Id,
  vote: GatewayVoteValue,
  feedback: string | null,
): Result<PendingDecision> {
  const parsed = pendingDecisionSchema.safeParse({ gatewayId, vote, feedback });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (gateway.status !== "pending") {
    return err("CONFLICT", "El gateway ya fue resuelto");
  }

  const now = new Date();
  const expires = new Date(now.getTime() + DECISION_UNDO_WINDOW_MS);
  store.gateway_decisions = store.gateway_decisions.filter(
    (d) => !(d.gateway_id === gateway.id && d.user_id === user.id),
  );
  const pending = {
    id: newId("gwdec"),
    gateway_id: gateway.id,
    user_id: user.id,
    vote: parsed.data.vote,
    feedback_text: parsed.data.feedback,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
  store.gateway_decisions.push(pending);
  writeStore(store);
  return ok({
    ...pending,
    vote: pending.vote as GatewayVoteValue,
    seconds_remaining: Math.ceil(DECISION_UNDO_WINDOW_MS / 1000),
  });
}

// Cancela una decisión pendiente si todavía está en ventana.
export function cancelPendingDecision(gatewayId: Id): Result<null> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  store.gateway_decisions = store.gateway_decisions.filter(
    (d) => !(d.gateway_id === gatewayId && d.user_id === user.id),
  );
  writeStore(store);
  return ok(null);
}

// Devuelve la decisión pendiente del usuario (si existe y no venció).
export function getPendingDecision(
  gatewayId: Id,
): Result<PendingDecision | null> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const pending = store.gateway_decisions.find(
    (d) => d.gateway_id === gatewayId && d.user_id === user.id,
  );
  if (!pending) return ok(null);
  const expiresAt = new Date(pending.expires_at).getTime();
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return ok(null);
  return ok({
    ...pending,
    vote: pending.vote as GatewayVoteValue,
    seconds_remaining: Math.ceil(remaining / 1000),
  });
}

// Fuerza la materialización de las decisiones pendientes cuya ventana venció.
// Devuelve cuántas se aplicaron. El caller lo llama antes de leer el gateway
// para que el estado esté al día.
export function flushExpiredDecisions(gatewayId: Id): Result<number> {
  const store = readStore();
  const _user = getCurrentUserFromStore(store);
  if (!_user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const now = Date.now();
  const expired = store.gateway_decisions.filter(
    (d) =>
      d.gateway_id === gatewayId &&
      new Date(d.expires_at).getTime() <= now,
  );
  if (expired.length === 0) return ok(0);

  let applied = 0;
  for (const dec of expired) {
    // Impersonamos al autor de la decisión para submitVote.
    // En storage local no hay concepto de "impersonación"; replicamos la
    // lógica manualmente para evitar depender del current_user_id.
    const result = applyVoteAsUser(
      store,
      dec.user_id,
      dec.gateway_id,
      dec.vote as GatewayVoteValue,
      dec.feedback_text,
    );
    if (result) applied++;
  }
  store.gateway_decisions = store.gateway_decisions.filter(
    (d) => !expired.some((e) => e.id === d.id),
  );
  writeStore(store);
  return ok(applied);
}

function applyVoteAsUser(
  store: Store,
  userId: Id,
  gatewayId: Id,
  vote: GatewayVoteValue,
  feedback: string | null,
): boolean {
  const gateway = store.gateways.find((g) => g.id === gatewayId);
  if (!gateway) return false;
  if (gateway.status !== "pending") return false;
  const now = nowIso();
  const existing = store.gateway_votes.find(
    (v) => v.gateway_id === gatewayId && v.user_id === userId,
  );
  if (existing) {
    existing.vote = vote;
    existing.feedback_text = feedback;
  } else {
    store.gateway_votes.push({
      id: newId("vote"),
      gateway_id: gatewayId,
      user_id: userId,
      vote,
      feedback_text: feedback,
    });
  }
  const requiredIds = requiredApproverIdsForGateway(store, gateway);
  const requiredVotes = store.gateway_votes
    .filter(
      (v) => v.gateway_id === gatewayId && requiredIds.includes(v.user_id),
    )
    .map((v) => v.vote);
  const resolution = resolveStatusFromVotes(
    requiredVotes,
    Math.max(requiredIds.length, 1),
  );

  appendAudit(store, {
    user_id: userId,
    action: "gateway_vote_cast",
    entity_type: "gateway_vote",
    entity_id: gatewayId,
    old_data: { status: gateway.status },
    new_data: { vote, resolution, via: "deferred" },
  });

  if (resolution !== "pending") {
    gateway.status = resolution;
    const form = store.forms.find((f) => f.id === gateway.form_id);
    const initiative = store.initiatives.find(
      (i) => i.id === gateway.initiative_id,
    );
    if (
      (resolution === "approved" || resolution === "approved_with_changes") &&
      form
    ) {
      form.status = "approved";
      form.approved_at = now;
      form.updated_at = now;
      createSnapshotInStoreProxy(store, form.id, userId);
      if (initiative) {
        const nextStage: InitiativeStage | null =
          gateway.gateway_number === 1
            ? "dimensioning"
            : gateway.gateway_number === 2
              ? "mvp"
              : gateway.gateway_number === 3
                ? "ltp_tracking"
                : null;
        if (nextStage) applyStageChangeInStore(store, userId, initiative, nextStage);
      }
    } else if (resolution === "feedback" && form) {
      form.status = "draft";
      form.updated_at = now;
      gateway.status = "pending";
      store.gateway_votes = store.gateway_votes.filter(
        (v) => v.gateway_id !== gatewayId,
      );
    } else if (resolution === "pause" && initiative) {
      applyStatusChangeInStore(store, userId, initiative, "paused");
    } else if (resolution === "reject" && initiative) {
      applyStatusChangeInStore(store, userId, initiative, "rejected");
    } else if (resolution === "area_change" && initiative) {
      applyStatusChangeInStore(store, userId, initiative, "area_change");
    }
  }
  return true;
}

function createSnapshotInStoreProxy(
  store: Store,
  formId: Id,
  userId: Id,
): void {
  // Thin wrapper — la lógica vive en form_snapshots; evitamos la importación
  // directa para romper ciclo si apareciera.
  createSnapshotInStore(store, formId, "final", userId);
}

// ---------------------------------------------------------------------------
// Comentarios inline por campo (vista read-only del gateway)
// ---------------------------------------------------------------------------

export interface InlineCommentItem {
  id: Id;
  gateway_id: Id;
  user_id: Id;
  author_name: string;
  section_key: string;
  field_key: string;
  text: string;
  status: "draft" | "published";
  updated_at: string;
  published_at: string | null;
  is_current_user: boolean;
}

function stageForGateway(n: 1 | 2 | 3): "proposal" | "dimensioning" | "mvp" {
  return n === 1 ? "proposal" : n === 2 ? "dimensioning" : "mvp";
}

function feedbackFormFileName(
  authorName: string,
  gatewayNumber: 1 | 2 | 3,
): string {
  const slug = authorName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  // DOCX es el "mejor tipo de archivo" para feedback editable con texto
  // narrativo. Un solo archivo por persona por etapa acumula todos sus
  // comentarios publicados.
  return `${slug || "usuario"}_feedbackE${gatewayNumber}.docx`;
}

// Guarda o actualiza el borrador (solo visible al autor) de un comentario
// para un campo específico. Un usuario tiene máximo un comentario por campo.
export function saveInlineCommentDraft(
  gatewayId: Id,
  sectionKey: string,
  fieldKey: string,
  text: string,
): Result<InlineCommentItem> {
  const parsed = saveInlineCommentSchema.safeParse({
    gatewayId,
    sectionKey,
    fieldKey,
    text,
  });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  if (gateway.status !== "pending") {
    return err(
      "CONFLICT",
      "El gateway ya se cerró: no se pueden enviar nuevos comentarios",
    );
  }

  const now = nowIso();
  let c = store.gateway_inline_comments.find(
    (x) =>
      x.gateway_id === gateway.id &&
      x.user_id === user.id &&
      x.field_key === parsed.data.fieldKey &&
      x.section_key === parsed.data.sectionKey,
  );
  if (!c) {
    c = {
      id: newId("icmt"),
      gateway_id: gateway.id,
      user_id: user.id,
      section_key: parsed.data.sectionKey,
      field_key: parsed.data.fieldKey,
      text: parsed.data.text,
      // Si el comentario anterior estaba published y el usuario lo edita,
      // mantenemos published para que siga visible (edit in place).
      status: "draft",
      created_at: now,
      updated_at: now,
      published_at: null,
    };
    store.gateway_inline_comments.push(c);
  } else {
    c.text = parsed.data.text;
    c.updated_at = now;
    // Si ya estaba publicado, re-editar lo devuelve a draft hasta reenviar.
    if (c.status === "published") {
      c.status = "draft";
      c.published_at = null;
    }
  }
  writeStore(store);
  return ok(toInlineCommentItem(c, user.display_name, user.id));
}

function toInlineCommentItem(
  c: GatewayInlineComment,
  authorName: string,
  currentUserId: Id,
): InlineCommentItem {
  return {
    id: c.id,
    gateway_id: c.gateway_id,
    user_id: c.user_id,
    author_name: authorName,
    section_key: c.section_key,
    field_key: c.field_key,
    text: c.text,
    status: c.status,
    updated_at: c.updated_at,
    published_at: c.published_at,
    is_current_user: c.user_id === currentUserId,
  };
}

// Lista comentarios del gateway. El caller filtra por sección/campo.
// Draft: solo lo ve el autor. Published: lo ven todos.
export function listInlineComments(
  gatewayId: Id,
): Result<InlineCommentItem[]> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const items: InlineCommentItem[] = [];
  for (const c of store.gateway_inline_comments) {
    if (c.gateway_id !== gatewayId) continue;
    const visible = c.status === "published" || c.user_id === user.id;
    if (!visible) continue;
    const u = store.users.find((uu) => uu.id === c.user_id);
    items.push(toInlineCommentItem(c, u?.display_name ?? "Usuario", user.id));
  }
  items.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  return ok(items);
}

// Publica todos los drafts del usuario actual en una sección. Genera el PDF
// (stub: metadata en documents) y notifica al PO.
export function publishSectionComments(
  gatewayId: Id,
  sectionKey: string,
): Result<{ published: number; pdf_document_id: Id | null }> {
  const parsed = publishSectionCommentsSchema.safeParse({ gatewayId, sectionKey });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  if (gateway.status !== "pending") {
    return err(
      "CONFLICT",
      "El gateway ya se cerró: no se pueden publicar nuevos comentarios",
    );
  }

  const now = nowIso();
  let published = 0;
  for (const c of store.gateway_inline_comments) {
    if (
      c.gateway_id === gateway.id &&
      c.user_id === user.id &&
      c.section_key === parsed.data.sectionKey &&
      c.status === "draft" &&
      c.text.trim().length > 0
    ) {
      c.status = "published";
      c.published_at = now;
      published++;
    }
  }

  let pdfDocumentId: Id | null = null;
  if (published > 0) {
    // Genera/actualiza UN solo archivo por persona por etapa:
    // {nombre}_feedbackE{N}.docx en archivos adicionales.
    // Cada publish agrega comentarios al mismo archivo (acumulativo).
    const stage = stageForGateway(gateway.gateway_number);
    const fileName = feedbackFormFileName(
      user.display_name,
      gateway.gateway_number,
    );
    const filePath = `/Iniciativas/${gateway.initiative_id}/${stage}/archivos adicionales/${fileName}`;
    const existing = store.documents.find(
      (d) =>
        d.initiative_id === gateway.initiative_id &&
        d.stage === stage &&
        d.file_path === filePath,
    );
    if (existing) {
      existing.created_at = now;
      pdfDocumentId = existing.id;
    } else {
      const doc: Document = {
        id: newId("doc"),
        initiative_id: gateway.initiative_id,
        document_type: "manual_upload",
        file_path: filePath,
        stage,
        ltp_period: null,
        generated_by: user.id,
        created_at: now,
      };
      store.documents.push(doc);
      pdfDocumentId = doc.id;
    }

    // Notificar al PO.
    const po = store.initiative_members.find(
      (m) =>
        m.initiative_id === gateway.initiative_id &&
        (m.role === "po" || m.role === "promotor"),
    );
    if (po && po.user_id !== user.id) {
      store.notifications.push({
        id: newId("notif"),
        user_id: po.user_id,
        type: "form_feedback_received",
        title: "Feedback enviado en el gateway",
        message: `${user.display_name} envió comentarios en el Gateway ${gateway.gateway_number}`,
        initiative_id: gateway.initiative_id,
        read: false,
        created_at: now,
      });
    }

    appendAudit(store, {
      user_id: user.id,
      action: "gateway_inline_comments_published",
      entity_type: "gateway",
      entity_id: gateway.id,
      old_data: null,
      new_data: { section_key: parsed.data.sectionKey, count: published },
    });
  }

  writeStore(store);
  return ok({ published, pdf_document_id: pdfDocumentId });
}

// ---------------------------------------------------------------------------
// Minuta de reunión (PO/Scrum, deadline 3 días)
// ---------------------------------------------------------------------------

const MINUTA_DEADLINE_DAYS = 3;

export interface GatewayMinutaDetail {
  minuta: GatewayMinuta | null;
  can_edit: boolean;
  deadline_at: string | null;
  days_remaining: number | null;
  overdue: boolean;
}

function userIsPoOrScrum(
  user: { id: Id },
  initiativeId: Id,
  store: Store,
): boolean {
  return store.initiative_members.some(
    (m) =>
      m.initiative_id === initiativeId &&
      m.user_id === user.id &&
      (m.role === "po" || m.role === "promotor" || m.role === "sm"),
  );
}

export function getGatewayMinuta(gatewayId: Id): Result<GatewayMinutaDetail> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userCanAccessInitiative(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const minuta =
    store.gateway_minutas.find((m) => m.gateway_id === gatewayId) ?? null;

  // Calculamos deadline a partir del approved_at del form (o submitted_at).
  const form = store.forms.find((f) => f.id === gateway.form_id);
  const base = form?.approved_at ?? form?.submitted_at ?? null;
  let deadlineAt: string | null = null;
  if (base) {
    const d = new Date(base);
    d.setDate(d.getDate() + MINUTA_DEADLINE_DAYS);
    deadlineAt = d.toISOString();
  } else if (minuta) {
    deadlineAt = minuta.deadline_at;
  }

  let daysRemaining: number | null = null;
  let overdue = false;
  if (deadlineAt) {
    const diffMs = new Date(deadlineAt).getTime() - Date.now();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    overdue = diffMs < 0 && !minuta;
  }

  return ok({
    minuta,
    can_edit: userIsPoOrScrum(user, gateway.initiative_id, store),
    deadline_at: deadlineAt,
    days_remaining: daysRemaining,
    overdue,
  });
}

export function upsertGatewayMinuta(
  gatewayId: Id,
  content: string,
): Result<GatewayMinuta> {
  const parsed = saveMinutaSchema.safeParse({ gatewayId, content });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userIsPoOrScrum(user, gateway.initiative_id, store)) {
    return err(
      "FORBIDDEN",
      "Solo el PO/Promotor o Scrum pueden editar la minuta",
    );
  }

  const now = nowIso();
  let m = store.gateway_minutas.find((x) => x.gateway_id === gateway.id);
  if (!m) {
    const form = store.forms.find((f) => f.id === gateway.form_id);
    const base = form?.approved_at ?? form?.submitted_at ?? now;
    const d = new Date(base);
    d.setDate(d.getDate() + MINUTA_DEADLINE_DAYS);
    m = {
      id: newId("minuta"),
      gateway_id: gateway.id,
      initiative_id: gateway.initiative_id,
      content: parsed.data.content,
      created_by: user.id,
      created_at: now,
      updated_at: now,
      deadline_at: d.toISOString(),
    };
    store.gateway_minutas.push(m);

    // Metadata del doc en archivos adicionales (stub).
    const stage = stageForGateway(gateway.gateway_number);
    store.documents.push({
      id: newId("doc"),
      initiative_id: gateway.initiative_id,
      document_type: "minuta_gateway_docx",
      file_path: `/Iniciativas/${gateway.initiative_id}/${stage}/archivos adicionales/Minuta_gateway_${gateway.gateway_number}.docx`,
      stage,
      ltp_period: null,
      generated_by: user.id,
      created_at: now,
    });
  } else {
    m.content = parsed.data.content;
    m.updated_at = now;
  }

  appendAudit(store, {
    user_id: user.id,
    action: "gateway_minuta_saved",
    entity_type: "gateway",
    entity_id: gateway.id,
    old_data: null,
    new_data: { length: parsed.data.content.length },
  });
  writeStore(store);
  return ok(m);
}

// ---------------------------------------------------------------------------
// Reenvío a gateway (nueva revisión de la misma etapa)
// ---------------------------------------------------------------------------

export function resubmitForRevision(
  gatewayId: Id,
): Result<{ new_gateway: Gateway; revision_number: number }> {
  const parsed = resubmitVFSchema.safeParse({ gatewayId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === parsed.data.gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userIsPoOrScrum(user, gateway.initiative_id, store)) {
    return err(
      "FORBIDDEN",
      "Solo el PO/Promotor o Scrum pueden reenviar a gateway",
    );
  }
  // Permitimos reenvío cuando el gateway original pidió cambios
  // (approved_with_changes o feedback). En otros casos es CONFLICT.
  const allowed: GatewayStatus[] = [
    "approved_with_changes",
    "feedback",
    "pending",
  ];
  if (!allowed.includes(gateway.status)) {
    return err(
      "CONFLICT",
      "Solo se reenvía cuando el gateway pidió cambios",
    );
  }

  const form = store.forms.find((f) => f.id === gateway.form_id);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");

  const now = nowIso();
  const prevCount = store.gateway_revisions.filter(
    (r) =>
      r.initiative_id === gateway.initiative_id &&
      r.gateway_number === gateway.gateway_number,
  ).length;
  const nextRevision = prevCount + 2; // revisión inicial = 1, próxima = 2.

  // Nuevo gateway para la misma etapa, mismo form.
  const newGateway: Gateway = {
    id: newId("gw"),
    form_id: form.id,
    initiative_id: gateway.initiative_id,
    gateway_number: gateway.gateway_number,
    status: "pending",
    requires_unanimity: true,
  };
  store.gateways.push(newGateway);

  store.gateway_revisions.push({
    id: newId("gwrev"),
    initiative_id: gateway.initiative_id,
    gateway_number: gateway.gateway_number,
    revision_number: nextRevision,
    gateway_id: newGateway.id,
    created_at: now,
  });

  // El form vuelve a in_review para el nuevo gateway (mantiene responses).
  form.status = "in_review";
  form.submitted_at = now;
  form.updated_at = now;
  createSnapshotInStoreProxy(store, form.id, user.id);

  // Notificar a los aprobadores requeridos (naturales + extras del nuevo gw).
  // Los extras se arrastran desde el gateway anterior por defecto.
  const prevExtras = store.gateway_extra_approvers.filter(
    (e) => e.gateway_id === gateway.id,
  );
  for (const e of prevExtras) {
    store.gateway_extra_approvers.push({
      id: newId("xappr"),
      gateway_id: newGateway.id,
      user_id: e.user_id,
      required: e.required,
      added_by: user.id,
      added_at: now,
    });
  }
  const approverIds = requiredApproverIdsForGateway(store, newGateway);
  for (const uid of approverIds) {
    store.notifications.push({
      id: newId("notif"),
      user_id: uid,
      type: "gateway_vote_pending",
      title: `Gateway ${gateway.gateway_number} — Revisión ${nextRevision}`,
      message: `Hay una nueva revisión esperando tu voto`,
      initiative_id: gateway.initiative_id,
      read: false,
      created_at: now,
    });
  }

  appendAudit(store, {
    user_id: user.id,
    action: "gateway_resubmitted",
    entity_type: "gateway",
    entity_id: newGateway.id,
    old_data: { previous_gateway_id: gateway.id, previous_status: gateway.status },
    new_data: { gateway_number: gateway.gateway_number, revision: nextRevision },
  });

  writeStore(store);
  return ok({ new_gateway: newGateway, revision_number: nextRevision });
}

export function getGatewayRevision(
  gatewayId: Id,
): Result<{ revision_number: number }> {
  const store = readStore();
  const rev = store.gateway_revisions.find((r) => r.gateway_id === gatewayId);
  return ok({ revision_number: rev?.revision_number ?? 1 });
}

// Habilita la edición del form asociado al gateway como VF. Cambia el form
// a draft para que el wizard existente pueda editarlo. Solo PO/Scrum y solo
// si el gateway quedó en approved_with_changes o feedback.
export function enableVFEditing(
  gatewayId: Id,
): Result<{ form_id: Id }> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  const gateway = store.gateways.find((g) => g.id === gatewayId);
  if (!gateway) return err("NOT_FOUND", "Gateway no encontrado");
  if (!userIsPoOrScrum(user, gateway.initiative_id, store)) {
    return err("FORBIDDEN", "Solo el PO/Promotor o Scrum pueden editar la VF");
  }
  if (
    gateway.status !== "approved_with_changes" &&
    gateway.status !== "feedback"
  ) {
    return err(
      "CONFLICT",
      "La VF solo se edita cuando el gateway pidió cambios",
    );
  }
  const form = store.forms.find((f) => f.id === gateway.form_id);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");

  // Si el form está approved, lo volvemos a draft para permitir edición. El
  // snapshot final ya se creó al aprobar; los cambios quedarán en el próximo
  // snapshot (al reenviar a gateway).
  if (form.status !== "draft") {
    form.status = "draft";
    form.updated_at = nowIso();
  }
  writeStore(store);
  return ok({ form_id: form.id });
}
