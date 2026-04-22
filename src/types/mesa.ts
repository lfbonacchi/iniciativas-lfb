import type { Id, IsoDateString } from "./common";

export interface MesaBloqueante {
  id: Id;
  initiative_id: Id;
  name: string;
  involucrados: Id[];
  is_priority: boolean;
  resolved: boolean;
  created_at: IsoDateString;
  created_by: Id;
}

export interface MesaTemaPendiente {
  id: Id;
  initiative_id: Id;
  text: string;
  done: boolean;
  created_at: IsoDateString;
  created_by: Id;
}

export interface MesaBrainstormNote {
  initiative_id: Id;
  content: string;
  updated_at: IsoDateString;
  updated_by: Id;
}
