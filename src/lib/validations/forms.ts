import { z } from "zod";
import { fileMetaSchema, idSchema, jsonValueSchema } from "./common";

export const getFormSchema = z.object({
  formId: idSchema,
});

export const saveFormResponsesSchema = z.object({
  formId: idSchema,
  fields: z.record(z.string(), jsonValueSchema),
});
export type SaveFormResponsesInput = z.infer<typeof saveFormResponsesSchema>;

export const submitFormSchema = z.object({
  formId: idSchema,
});

export const markFormReviewedSchema = z.object({
  formId: idSchema,
  comment: z.string().trim().min(1).max(2000),
});
export type MarkFormReviewedInput = z.infer<typeof markFormReviewedSchema>;

export const generateDocumentSchema = z.object({
  formId: idSchema,
  type: z.enum([
    "formulario_xlsx",
    "formulario_pdf",
    "vf_formulario_xlsx",
    "vf_formulario_pdf",
    "vf_presentacion_pptx",
    "vf_nota_prensa_docx",
  ]),
});
export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;

export const uploadFinalVersionSchema = z.object({
  formId: idSchema,
  file: fileMetaSchema,
});
export type UploadFinalVersionInput = z.infer<typeof uploadFinalVersionSchema>;
