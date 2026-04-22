import type { Id, IsoDateString } from "./common";

export type PortfolioEventType =
  | "gate"
  | "sprint_review"
  | "seg_q"
  | "seg_mensual"
  | "ltp_plan"
  | "entrega"
  | "otro";

export interface PortfolioEvent {
  id: Id;
  name: string;
  type: PortfolioEventType;
  custom_type_label: string | null;
  initiative_id: Id;
  date: IsoDateString;
  invited_user_ids: Id[];
  created_by: Id;
  created_at: IsoDateString;
}
