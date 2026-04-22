import { z } from "zod";
import {
  fileTypeSchema,
  idSchema,
  initiativeStageSchema,
  ltpPeriodSchema,
} from "./common";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const MIME_BY_EXT: Readonly<Record<string, readonly string[]>> = {
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  mp4: ["video/mp4"],
} as const;

const FOLDER_ETAPA_VALUES = [
  "Etapa 1",
  "Etapa 2",
  "Etapa 3",
  "LTP y Seguimiento",
  "Reuniones y minutas",
  "Feedback de gateways",
  "archivos adicionales",
] as const;

export const fileFolderSchema = z.union([
  z.enum(FOLDER_ETAPA_VALUES),
  z.string().min(1).max(200),
]);

export const sanitizedFileNameSchema = z
  .string()
  .min(1, "Nombre de archivo vacío")
  .max(255, "Nombre demasiado largo (máx 255)")
  .refine(
    (v) => !/[\/\\:*?"<>|\x00-\x1f]/.test(v),
    "Nombre contiene caracteres no permitidos",
  );

export const uploadFileInfoSchema = z
  .object({
    file_name: sanitizedFileNameSchema,
    mime_type: z.string().min(1).max(255),
    file_type: fileTypeSchema,
    file_size: z
      .number()
      .int()
      .min(1, "Archivo vacío")
      .max(MAX_FILE_SIZE_BYTES, "Máximo 50MB"),
    is_auto: z.boolean(),
    form_id: idSchema.optional(),
    document_type: z.string().min(1).max(64).optional(),
  })
  .superRefine((val, ctx) => {
    const expected = MIME_BY_EXT[val.file_type];
    if (expected && !expected.includes(val.mime_type)) {
      ctx.addIssue({
        code: "custom",
        path: ["mime_type"],
        message: `El MIME type "${val.mime_type}" no corresponde a un .${val.file_type}`,
      });
    }
  });
export type UploadFileInfoInput = z.infer<typeof uploadFileInfoSchema>;

export const saveFileMetadataSchema = z.object({
  initiativeId: idSchema,
  stage: initiativeStageSchema,
  folder: fileFolderSchema,
  ltpPeriod: ltpPeriodSchema.optional(),
  fileInfo: uploadFileInfoSchema,
});

export const getFilesSchema = z.object({
  initiativeId: idSchema,
  stage: initiativeStageSchema.optional(),
  folder: fileFolderSchema.optional(),
});

export const downloadGeneratedFileSchema = z.object({
  initiativeId: idSchema,
  formId: idSchema,
  type: z.enum([
    "formulario_xlsx",
    "formulario_pdf",
    "vf_formulario_xlsx",
    "vf_formulario_pdf",
    "vf_presentacion_pptx",
    "vf_nota_prensa_docx",
    "minuta_gateway_docx",
  ]),
});
export type DownloadGeneratedType = z.infer<
  typeof downloadGeneratedFileSchema
>["type"];

export const fileIdOnlySchema = z.object({ fileId: idSchema });

export const moveToFolderSchema = z.object({
  fileId: idSchema,
  newFolder: fileFolderSchema,
  newStage: initiativeStageSchema.optional(),
  newLtpPeriod: ltpPeriodSchema.optional(),
});

export function sanitizeFileName(raw: string): string {
  const withoutControl = raw.replace(/[\x00-\x1f]/g, "");
  const trimmed = withoutControl.trim();
  const noPathSeparators = trimmed.replace(/[\/\\]/g, "_");
  const noForbidden = noPathSeparators.replace(/[:*?"<>|]/g, "_");
  const collapsed = noForbidden.replace(/\s+/g, " ");
  const limited = collapsed.slice(0, 200);
  return limited.length > 0 ? limited : "archivo";
}

export { MAX_FILE_SIZE_BYTES };
