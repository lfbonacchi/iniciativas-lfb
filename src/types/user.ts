import type { Id } from "./common";

export type GlobalRole = "user" | "area_transformacion" | "admin";

export interface User {
  id: Id;
  azure_oid: string | null;
  email: string;
  display_name: string;
  job_title: string;
  department: string;
  vicepresidencia: string;
  global_role: GlobalRole;
  is_vp: boolean;
}
