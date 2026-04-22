import type { Id, User } from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import { switchUserSchema } from "@/lib/validations/auth";
import { readStore, resetStore, seedStore, writeStore } from "./_store";

export function getCurrentUser(): Result<User> {
  const store = readStore();
  if (!store.current_user_id) {
    return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  }
  const user = store.users.find((u) => u.id === store.current_user_id);
  if (!user) {
    return err("AUTH_REQUIRED", "Usuario actual no encontrado");
  }
  return ok(user);
}

export function getAvailableUsers(): Result<User[]> {
  return ok(readStore().users);
}

export function loadSeedData(): Result<{ loaded: true }> {
  seedStore();
  return ok({ loaded: true });
}

export function clearAllData(): Result<{ cleared: true }> {
  resetStore();
  return ok({ cleared: true });
}

export function switchUser(userId: Id): Result<User> {
  const parsed = switchUserSchema.safeParse({ userId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = store.users.find((u) => u.id === parsed.data.userId);
  if (!user) {
    return err("NOT_FOUND", "Usuario no encontrado");
  }
  store.current_user_id = user.id;
  writeStore(store);
  return ok(user);
}
