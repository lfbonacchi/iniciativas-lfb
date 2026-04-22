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

// Tipo de acceso delegado a los formularios de la iniciativa.
// - "edit":    puede editar y comentar.
// - "comment": puede leer y dejar comentarios (no edita).
// - "view":    solo lectura.
// Ausente (undefined) aplica para miembros con rol "natural" (po, ld, sm, bo,
// sponsor, promotor, equipo legacy): el acceso se deriva de `can_edit` y del
// rol, no de este campo.
export type MemberAccessLevel = "edit" | "comment" | "view";

export interface InitiativeMember {
  user_id: Id;
  initiative_id: Id;
  role: InitiativeMemberRole;
  can_edit: boolean;
  access_level?: MemberAccessLevel;
}

export interface InitiativeFolder {
  id: Id;
  initiative_id: Id;
  folder_path: string;
  stage: InitiativeStage;
  ltp_period: LtpPeriod | null;
  created_at: IsoDateString;
}
