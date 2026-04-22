import { z } from "zod";
import { idSchema } from "./common";

export const switchUserSchema = z.object({
  userId: idSchema,
});
export type SwitchUserInput = z.infer<typeof switchUserSchema>;
