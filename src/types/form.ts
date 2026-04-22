import type {
  FormFieldValue,
  Id,
  IsoDateString,
  LtpPeriod,
} from "./common";

export type FormType = "F1" | "F2" | "F3" | "F4" | "F5";

export type FormStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "final"
  | "reviewed"
  | "closed";

export type FormFieldType =
  | "text"
  | "textarea"
  | "rich_text"
  | "select"
  | "multiselect"
  | "radio"
  | "boolean"
  | "checkbox"
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "date_range"
  | "table"
  | "file";

export interface FormTableColumn {
  key: string;
  label: string;
  type:
    | "text"
    | "number"
    | "currency"
    | "percentage"
    | "select"
    | "date"
    | "boolean";
  options?: readonly string[];
  required?: boolean;
}

export interface FormSectionField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  hint?: string;
  placeholder?: string;
  options?: readonly string[];
  table_columns?: readonly FormTableColumn[];
  carry_over_from?: string;
  max_length?: number;
  min?: number;
  max?: number;
}

export interface FormSection {
  key: string;
  title: string;
  order: number;
  description?: string;
  fields: readonly FormSectionField[];
}

export interface FormDefinition {
  id: Id;
  form_type: FormType;
  version: number;
  sections_config: readonly FormSection[];
}

export interface Form {
  id: Id;
  initiative_id: Id;
  form_type: FormType;
  version: number;
  status: FormStatus;
  ltp_period: LtpPeriod | null;
  created_by: Id;
  created_at: IsoDateString;
  updated_at: IsoDateString;
  submitted_at: IsoDateString | null;
  approved_at: IsoDateString | null;
}

export interface FormResponse {
  id: Id;
  form_id: Id;
  field_key: string;
  value: FormFieldValue;
}

export interface FormChangeLog {
  id: Id;
  form_id: Id;
  field_key: string;
  old_value: FormFieldValue;
  new_value: FormFieldValue;
  changed_by: Id;
  changed_at: IsoDateString;
}

export type FormSnapshotType = "submitted" | "final";

export interface FormSnapshot {
  id: Id;
  form_id: Id;
  snapshot_type: FormSnapshotType;
  version_number: number;
  responses_data: Readonly<Record<string, FormFieldValue>>;
  created_at: IsoDateString;
}
