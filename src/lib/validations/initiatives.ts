import { z } from "zod";
import { idSchema, initiativeStageSchema, initiativeStatusSchema } from "./common";

export const createInitiativeSchema = z.object({
  name: z.string().trim().min(3).max(200),
});
export type CreateInitiativeInput = z.infer<typeof createInitiativeSchema>;

export const importInitiativeSchema = z.object({
  name: z.string().trim().min(3).max(200),
  stage: initiativeStageSchema,
});
export type ImportInitiativeInput = z.infer<typeof importInitiativeSchema>;

export const listInitiativesFiltersSchema = z
  .object({
    stage: initiativeStageSchema.optional(),
    status: initiativeStatusSchema.optional(),
    vp_user_id: idSchema.optional(),
    bo_user_id: idSchema.optional(),
  })
  .optional();
export type ListInitiativesFilters = z.infer<typeof listInitiativesFiltersSchema>;

export const getInitiativeSchema = z.object({
  id: idSchema,
});
