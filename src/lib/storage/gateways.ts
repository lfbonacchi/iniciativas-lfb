import type {
  Document,
  Gateway,
  GatewayStatus,
  GatewayVote,
  GatewayVoteValue,
  Id,
  InitiativeStage,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  generateMinutaSchema,
  submitVoteSchema,
} from "@/lib/validations/gateways";
import { readStore, writeStore, type Store } from "./_store";
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

export interface GatewayDetail {
  gateway: Gateway;
  votes: GatewayVote[];
  feedback_by_user: Record<Id, string | null>;
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
  // Prioridad: reject > pause > area_change > feedback > pending > approved
  if (votes.includes("reject")) return "reject";
  if (votes.includes("pause")) return "pause";
  if (votes.includes("area_change")) return "area_change";
  if (votes.includes("feedback")) return "feedback";
  if (votes.length < expectedVoters) return "pending";
  if (votes.every((v) => v === "approved")) return "approved";
  return "pending";
}

function approversForInitiative(store: Store, initiativeId: Id): Id[] {
  return store.initiative_members
    .filter(
      (m) =>
        m.initiative_id === initiativeId &&
        (m.role === "bo" || m.role === "sponsor" || m.role === "ld"),
    )
    .map((m) => m.user_id);
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
  const isApprover =
    roles.includes("bo") || roles.includes("sponsor") || roles.includes("ld");
  if (!isApprover) {
    return err("FORBIDDEN", "Solo BO, Sponsor o LD pueden votar");
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

  const expected = approversForInitiative(store, gateway.initiative_id).length;
  const allVotes = store.gateway_votes
    .filter((v) => v.gateway_id === gateway.id)
    .map((v) => v.vote);
  const resolution = resolveStatusFromVotes(allVotes, Math.max(expected, 1));

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

    if (resolution === "approved" && form) {
      const oldFormStatus = form.status;
      form.status = "approved";
      form.approved_at = now;
      form.updated_at = now;
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
