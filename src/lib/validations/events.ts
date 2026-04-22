import { z } from "zod";
import { idSchema } from "./common";

export const eventTypeSchema = z.enum([
  "gate",
  "sprint_review",
  "seg_q",
  "seg_mensual",
  "ltp_plan",
  "entrega",
  "otro",
]);

export const createEventSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre del evento debe tener al menos 3 caracteres")
      .max(120, "El nombre del evento es demasiado largo"),
    type: eventTypeSchema,
    custom_type_label: z
      .string()
      .trim()
      .max(60, "El tipo personalizado es demasiado largo")
      .nullable()
      .optional(),
    initiative_id: idSchema,
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
    invited_user_ids: z.array(idSchema).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.type === "otro") {
      const label = val.custom_type_label?.trim() ?? "";
      if (label.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["custom_type_label"],
          message: "Indicá el tipo de evento",
        });
      }
    }
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
