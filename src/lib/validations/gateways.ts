import { z } from "zod";
import { idSchema } from "./common";

export const getGatewaySchema = z.object({
  gatewayId: idSchema,
});

export const submitVoteSchema = z.object({
  gatewayId: idSchema,
  vote: z.enum([
    "approved",
    "approved_with_changes",
    "feedback",
    "pause",
    "reject",
    "area_change",
  ]),
  feedback: z.string().trim().max(5000).nullable(),
});
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;

export const generateMinutaSchema = z.object({
  gatewayId: idSchema,
});

export const addExtraApproverSchema = z.object({
  gatewayId: idSchema,
  userId: idSchema,
  required: z.boolean(),
});
export type AddExtraApproverInput = z.infer<typeof addExtraApproverSchema>;

export const saveFeedbackDocSchema = z.object({
  gatewayId: idSchema,
  content: z.string().trim().max(20000),
});
export type SaveFeedbackDocInput = z.infer<typeof saveFeedbackDocSchema>;

export const pendingDecisionSchema = z.object({
  gatewayId: idSchema,
  vote: z.enum([
    "approved",
    "approved_with_changes",
    "feedback",
    "pause",
    "reject",
  ]),
  feedback: z.string().trim().max(5000).nullable(),
});
export type PendingDecisionInput = z.infer<typeof pendingDecisionSchema>;

export const saveInlineCommentSchema = z.object({
  gatewayId: idSchema,
  sectionKey: z.string().trim().min(1).max(200),
  fieldKey: z.string().trim().min(1).max(200),
  text: z.string().max(5000),
});
export type SaveInlineCommentInput = z.infer<typeof saveInlineCommentSchema>;

export const publishSectionCommentsSchema = z.object({
  gatewayId: idSchema,
  sectionKey: z.string().trim().min(1).max(200),
});

// Minuta estructurada — 6 campos obligatorios. El valor se persiste como
// JSON en GatewayMinuta.content para preservar la compatibilidad del store.
export const minutaContentSchema = z.object({
  fecha_reunion: z
    .string()
    .trim()
    .min(1, "La fecha de reunión es obligatoria")
    .max(50),
  participantes: z
    .string()
    .trim()
    .min(1, "Los participantes son obligatorios")
    .max(2000),
  asistentes: z
    .string()
    .trim()
    .min(1, "Los asistentes son obligatorios")
    .max(2000),
  mejoras: z.string().trim().min(1, "Mejoras es obligatorio").max(10000),
  acuerdos: z.string().trim().min(1, "Acuerdos es obligatorio").max(10000),
  proximos_pasos: z
    .string()
    .trim()
    .min(1, "Próximos pasos es obligatorio")
    .max(10000),
});
export type MinutaContent = z.infer<typeof minutaContentSchema>;

export const saveMinutaSchema = z.object({
  gatewayId: idSchema,
  content: minutaContentSchema,
});
export type SaveMinutaInput = z.infer<typeof saveMinutaSchema>;

// Para guardados parciales (borrador): acepta campos vacíos.
export const saveMinutaDraftSchema = z.object({
  gatewayId: idSchema,
  content: z.object({
    fecha_reunion: z.string().max(50),
    participantes: z.string().max(2000),
    asistentes: z.string().max(2000),
    mejoras: z.string().max(10000),
    acuerdos: z.string().max(10000),
    proximos_pasos: z.string().max(10000),
  }),
});

export const resubmitVFSchema = z.object({
  gatewayId: idSchema,
});
