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

export const saveMinutaSchema = z.object({
  gatewayId: idSchema,
  content: z.string().max(30000),
});
export type SaveMinutaInput = z.infer<typeof saveMinutaSchema>;

export const resubmitVFSchema = z.object({
  gatewayId: idSchema,
});
