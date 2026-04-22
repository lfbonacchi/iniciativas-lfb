import type { Id, IsoDateString } from "./common";

export type NotificationType =
  | "gateway_vote_pending"
  | "gateway_resolved"
  | "form_feedback_received"
  | "form_submitted"
  | "form_reviewed"
  | "initiative_paused"
  | "initiative_rejected"
  | "initiative_area_change"
  | "member_added"
  | "member_removed"
  | "document_generated"
  | "document_uploaded";

export interface Notification {
  id: Id;
  user_id: Id;
  type: NotificationType;
  title: string;
  message: string;
  initiative_id: Id;
  read: boolean;
  created_at: IsoDateString;
}
