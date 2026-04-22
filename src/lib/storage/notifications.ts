import type { Id, Notification } from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  getNotificationsSchema,
  markAsReadSchema,
} from "@/lib/validations/notifications";
import { readStore, writeStore } from "./_store";
import { getCurrentUserFromStore } from "./_security";

export function getNotifications(userId: Id): Result<Notification[]> {
  const parsed = getNotificationsSchema.safeParse({ userId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  // RLS: solo podés ver tus propias notificaciones (salvo AT/admin que ven todas).
  if (
    user.id !== parsed.data.userId &&
    user.global_role !== "area_transformacion" &&
    user.global_role !== "admin"
  ) {
    return err("FORBIDDEN", "No podés ver notificaciones de otros usuarios");
  }

  const list = store.notifications
    .filter((n) => n.user_id === parsed.data.userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return ok(list);
}

export function markAsRead(notificationId: Id): Result<Notification> {
  const parsed = markAsReadSchema.safeParse({ notificationId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const notif = store.notifications.find(
    (n) => n.id === parsed.data.notificationId,
  );
  if (!notif) return err("NOT_FOUND", "Notificación no encontrada");
  if (notif.user_id !== user.id) {
    return err("FORBIDDEN", "No podés marcar como leída una notificación ajena");
  }
  notif.read = true;
  writeStore(store);
  return ok(notif);
}
