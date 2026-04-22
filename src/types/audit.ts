import type { Id, IsoDateString, JsonObject } from "./common";

export type AuditAction =
  | "initiative_created"
  | "initiative_imported"
  | "initiative_status_changed"
  | "initiative_member_added"
  | "initiative_member_removed"
  | "initiative_member_role_changed"
  | "form_submitted"
  | "form_approved"
  | "form_reviewed"
  | "form_response_changed"
  | "gateway_vote_cast"
  | "gateway_resolved"
  | "document_uploaded"
  | "document_generated"
  | "file_uploaded"
  | "event_created"
  | "event_attendance_set"
  | "event_rescheduled"
  | "event_cancelled"
  | "event_materialized";

export type AuditEntityType =
  | "initiative"
  | "initiative_member"
  | "form"
  | "form_response"
  | "gateway"
  | "gateway_vote"
  | "document"
  | "file_upload"
  | "portfolio_event";

export interface AuditLog {
  id: Id;
  user_id: Id;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: Id;
  old_data: JsonObject | null;
  new_data: JsonObject | null;
  timestamp: IsoDateString;
}
