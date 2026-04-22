import type {
  AuditAction,
  AuditEntityType,
  AuditLog,
  Id,
  JsonObject,
} from "@/types";
import type { Store } from "./_store";
import { newId, nowIso } from "./_ids";

export function appendAudit(
  store: Store,
  entry: {
    user_id: Id;
    action: AuditAction;
    entity_type: AuditEntityType;
    entity_id: Id;
    old_data: JsonObject | null;
    new_data: JsonObject | null;
  },
): void {
  const log: AuditLog = {
    id: newId("audit"),
    user_id: entry.user_id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    old_data: entry.old_data,
    new_data: entry.new_data,
    timestamp: nowIso(),
  };
  store.audit_log.push(log);
}
