import type { Id, IsoDateString } from "./common";

export type PortfolioEventType =
  | "gate"
  | "sprint_review"
  | "seg_q"
  | "seg_mensual"
  | "ltp_plan"
  | "entrega"
  | "otro";

export type AttendanceStatus = "yes" | "no";

export type EventStatus = "scheduled" | "cancelled";

export interface PortfolioEvent {
  id: Id;
  name: string;
  type: PortfolioEventType;
  custom_type_label: string | null;
  initiative_id: Id;
  date: IsoDateString;
  original_date: IsoDateString | null;
  status: EventStatus;
  invited_user_ids: Id[];
  attendance: Record<Id, AttendanceStatus>;
  created_by: Id;
  created_at: IsoDateString;
}
