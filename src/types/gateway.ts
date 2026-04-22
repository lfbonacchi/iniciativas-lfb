import type { Id } from "./common";

export type GatewayNumber = 1 | 2 | 3;

export type GatewayStatus =
  | "pending"
  | "approved"
  | "feedback"
  | "pause"
  | "reject"
  | "area_change";

export type GatewayVoteValue =
  | "approved"
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
