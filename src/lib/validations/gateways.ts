import { z } from "zod";
import { idSchema } from "./common";

export const getGatewaySchema = z.object({
  gatewayId: idSchema,
});

export const submitVoteSchema = z.object({
  gatewayId: idSchema,
  vote: z.enum(["approved", "feedback", "pause", "reject", "area_change"]),
  feedback: z.string().trim().max(5000).nullable(),
});
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;

export const generateMinutaSchema = z.object({
  gatewayId: idSchema,
});
