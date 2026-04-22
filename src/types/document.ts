import type { Id, IsoDateString, LtpPeriod } from "./common";
import type { InitiativeStage } from "./initiative";

export type DocumentType =
  | "formulario_xlsx"
  | "formulario_pdf"
  | "vf_formulario_xlsx"
  | "vf_formulario_pdf"
  | "vf_presentacion_pptx"
  | "vf_nota_prensa_docx"
  | "minuta_gateway_docx"
  | "manual_upload";

export type FileType = "docx" | "xlsx" | "pdf" | "pptx" | "png" | "jpg" | "mp4";

export interface Document {
  id: Id;
  initiative_id: Id;
  document_type: DocumentType;
  file_path: string;
  stage: InitiativeStage;
  ltp_period: LtpPeriod | null;
  generated_by: Id;
  created_at: IsoDateString;
}

export interface FileUpload {
  id: Id;
  initiative_id: Id;
  folder_id: Id;
  file_name: string;
  file_type: FileType;
  file_size: number;
  uploaded_by: Id;
  created_at: IsoDateString;
}
