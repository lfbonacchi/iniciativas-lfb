import { z } from "zod";
import { fileMetaSchema, idSchema, initiativeStageSchema } from "./common";

export const listDocumentsSchema = z.object({
  initiativeId: idSchema,
  stage: initiativeStageSchema.optional(),
});

export const uploadDocumentSchema = z.object({
  initiativeId: idSchema,
  stage: initiativeStageSchema,
  file: fileMetaSchema,
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const getDocumentUrlSchema = z.object({
  documentId: idSchema,
});
