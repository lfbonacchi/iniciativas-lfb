import type { Document, Id, InitiativeStage } from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  getDocumentUrlSchema,
  listDocumentsSchema,
  uploadDocumentSchema,
  type UploadDocumentInput,
} from "@/lib/validations/documents";
import { readStore, writeStore } from "./_store";
import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
} from "./_security";
import { appendAudit } from "./_audit";

export function listDocuments(
  initiativeId: Id,
  stage?: InitiativeStage,
): Result<Document[]> {
  const parsed = listDocumentsSchema.safeParse({ initiativeId, stage });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  if (!userCanAccessInitiative(user, parsed.data.initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  let docs = store.documents.filter(
    (d) => d.initiative_id === parsed.data.initiativeId,
  );
  if (parsed.data.stage) {
    docs = docs.filter((d) => d.stage === parsed.data.stage);
  }
  return ok(docs);
}

export function uploadDocument(
  initiativeId: Id,
  stage: InitiativeStage,
  file: UploadDocumentInput["file"],
): Result<Document> {
  const parsed = uploadDocumentSchema.safeParse({ initiativeId, stage, file });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  if (!userCanAccessInitiative(user, parsed.data.initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const now = nowIso();
  const doc: Document = {
    id: newId("doc"),
    initiative_id: parsed.data.initiativeId,
    document_type: "manual_upload",
    file_path: `/Iniciativas/${parsed.data.initiativeId}/${parsed.data.stage}/archivos adicionales/${parsed.data.file.name}`,
    stage: parsed.data.stage,
    ltp_period: null,
    generated_by: user.id,
    created_at: now,
  };
  store.documents.push(doc);
  appendAudit(store, {
    user_id: user.id,
    action: "document_uploaded",
    entity_type: "document",
    entity_id: doc.id,
    old_data: null,
    new_data: { file_name: parsed.data.file.name, stage: parsed.data.stage },
  });
  writeStore(store);
  return ok(doc);
}

export function getDocumentUrl(
  documentId: Id,
): Result<{ url: string; document: Document }> {
  const parsed = getDocumentUrlSchema.safeParse({ documentId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const doc = store.documents.find((d) => d.id === parsed.data.documentId);
  if (!doc) return err("NOT_FOUND", "Documento no encontrado");
  if (!userCanAccessInitiative(user, doc.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  // STUB: en Fase 2-4 no hay binarios reales. La URL es lógica.
  // Cuando se implemente la generación binaria, se devolverá un blob URL o data URL.
  return ok({ url: doc.file_path, document: doc });
}
