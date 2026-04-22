import { z } from "zod";

export const idSchema = z.string().min(1);

export const isoDateSchema = z.string().datetime();

export const ltpPeriodSchema = z
  .string()
  .regex(/^\d{2}-\d{4}$/, "Formato esperado: MM-YYYY (ej: 06-2026)");

export const initiativeStageSchema = z.enum([
  "proposal",
  "dimensioning",
  "mvp",
  "ltp_tracking",
]);

export const initiativeStatusSchema = z.enum([
  "in_progress",
  "pending",
  "paused",
  "rejected",
  "area_change",
]);

export const formTypeSchema = z.enum(["F1", "F2", "F3", "F4", "F5"]);

export const fileTypeSchema = z.enum([
  "docx",
  "xlsx",
  "pdf",
  "pptx",
  "png",
  "jpg",
  "mp4",
]);

export const fileMetaSchema = z.object({
  name: z.string().min(1).max(255),
  type: fileTypeSchema,
  size: z
    .number()
    .int()
    .min(1)
    .max(50 * 1024 * 1024, "Máximo 50MB"),
});
export type FileMeta = z.infer<typeof fileMetaSchema>;

export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export function firstZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos";
}
