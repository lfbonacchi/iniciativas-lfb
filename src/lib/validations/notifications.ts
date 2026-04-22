import { z } from "zod";
import { idSchema } from "./common";

export const getNotificationsSchema = z.object({
  userId: idSchema,
});

export const markAsReadSchema = z.object({
  notificationId: idSchema,
});
