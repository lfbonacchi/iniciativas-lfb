import type { Id, IsoDateString, LtpPeriod } from "./common";

export type InitiativeStage =
  | "proposal"
  | "dimensioning"
  | "mvp"
  | "ltp_tracking";

export type InitiativeStatus =
  | "in_progress"
  | "pending"
  | "paused"
  | "rejected"
  | "area_change";

export type InitiativeMemberRole =
  | "promotor"
  | "ld"
  | "po"
  | "bo"
  | "sponsor"
  | "sm"
  | "equipo";

export interface Initiative {
  id: Id;
  name: string;
  current_stage: InitiativeStage;
  status: InitiativeStatus;
  created_at: IsoDateString;
  has_etapa1: boolean;
  has_etapa2: boolean;
  has_etapa3: boolean;
}

export interface InitiativeMember {
  user_id: Id;
  initiative_id: Id;
  role: InitiativeMemberRole;
  can_edit: boolean;
}

export interface InitiativeFolder {
  id: Id;
  initiative_id: Id;
  folder_path: string;
  stage: InitiativeStage;
  ltp_period: LtpPeriod | null;
  created_at: IsoDateString;
}
