import type { Id } from "./common";

export type GatewayNumber = 1 | 2 | 3;

export type GatewayStatus =
  | "pending"
  | "approved"
  | "approved_with_changes"
  | "feedback"
  | "pause"
  | "reject"
  | "area_change";

// Valores que emiten los aprobadores en el gateway:
// - approved           → "Aprobar sin cambios"
// - approved_with_changes → "Aprobar con cambios" (aprueba + pide cambios al PO)
// - feedback           → "Necesita cambios" (rearma VF, nuevo gateway)
// - pause              → "On hold"
// - reject             → "Rechazar"
// - area_change        → Cambio de área (no se emite como voto desde Tanda A,
//                        se dispara por botón separado — ver Tanda C)
export type GatewayVoteValue =
  | "approved"
  | "approved_with_changes"
  | "feedback"
  | "pause"
  | "reject"
  | "area_change";

export interface Gateway {
  id: Id;
  form_id: Id;
  initiative_id: Id;
  gateway_number: GatewayNumber;
  status: GatewayStatus;
  requires_unanimity: true;
}

export interface GatewayVote {
  id: Id;
  gateway_id: Id;
  user_id: Id;
  vote: GatewayVoteValue;
  feedback_text: string | null;
}
