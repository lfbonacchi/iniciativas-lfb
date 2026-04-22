import type {
  Document,
  Form,
  FormDefinition,
  FormFieldValue,
  FormResponse,
  Gateway,
  Id,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  generateDocumentSchema,
  markFormReviewedSchema,
  saveFormResponsesSchema,
  submitFormSchema,
  uploadFinalVersionSchema,
  type GenerateDocumentInput,
  type MarkFormReviewedInput,
  type SaveFormResponsesInput,
  type UploadFinalVersionInput,
} from "@/lib/validations/forms";
import { readStore, writeStore, type Store } from "./_store";
import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
  userRolesInInitiative,
} from "./_security";
import { appendAudit } from "./_audit";

export interface FormDetail {
  form: Form;
  definition: FormDefinition | null;
  responses: Record<string, FormFieldValue>;
  completeness: { percent: number; missing_required: string[] };
}

function computeCompleteness(
  definition: FormDefinition | null,
  responses: Record<string, FormFieldValue>,
): { percent: number; missing_required: string[] } {
  if (!definition) return { percent: 0, missing_required: [] };
  const required: string[] = [];
  for (const section of definition.sections_config) {
    for (const field of section.fields) {
      if (field.required) required.push(field.key);
    }
  }
  if (required.length === 0) return { percent: 100, missing_required: [] };
  const missing = required.filter((key) => {
    const v = responses[key];
    return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
  });
  const filled = required.length - missing.length;
  return {
    percent: Math.round((filled / required.length) * 100),
    missing_required: missing,
  };
}

function loadResponses(store: Store, formId: Id): Record<string, FormFieldValue> {
  const out: Record<string, FormFieldValue> = {};
  for (const r of store.form_responses) {
    if (r.form_id === formId) out[r.field_key] = r.value;
  }
  return out;
}

export function getForm(formId: Id): Result<FormDetail> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const definition =
    store.form_definitions.find(
      (d) => d.form_type === form.form_type && d.version === form.version,
    ) ?? null;
  const responses = loadResponses(store, formId);
  return ok({
    form,
    definition,
    responses,
    completeness: computeCompleteness(definition, responses),
  });
}

export function saveFormResponses(
  formId: Id,
  fields: SaveFormResponsesInput["fields"],
): Result<{ updated: number }> {
  const parsed = saveFormResponsesSchema.safeParse({ formId, fields });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === parsed.data.formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  if (form.status === "approved" || form.status === "final" || form.status === "closed") {
    return err("CONFLICT", "El formulario ya fue cerrado y no se puede editar");
  }

  const now = nowIso();
  let updated = 0;
  for (const [key, newValue] of Object.entries(parsed.data.fields) as Array<
    [string, FormFieldValue]
  >) {
    const existing = store.form_responses.find(
      (r) => r.form_id === form.id && r.field_key === key,
    );
    const oldValue: FormFieldValue = existing?.value ?? null;
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

    if (existing) {
      existing.value = newValue;
    } else {
      const r: FormResponse = {
        id: newId("resp"),
        form_id: form.id,
        field_key: key,
        value: newValue,
      };
      store.form_responses.push(r);
    }
    store.form_change_log.push({
      id: newId("fcl"),
      form_id: form.id,
      field_key: key,
      old_value: oldValue,
      new_value: newValue,
      changed_by: user.id,
      changed_at: now,
    });
    updated++;
  }
  if (updated > 0) {
    form.updated_at = now;
    appendAudit(store, {
      user_id: user.id,
      action: "form_response_changed",
      entity_type: "form",
      entity_id: form.id,
      old_data: null,
      new_data: {
        form_type: form.form_type,
        changed_count: updated,
      },
    });
  }
  writeStore(store);
  return ok({ updated });
}

// Aplica carry-over automático desde un formulario origen al destino.
// Registra los cambios en form_change_log con changed_by: "system" y
// un audit de alto nivel indicando la fuente del carry-over.
export function applyCarryOverInStore(
  store: Store,
  destinationForm: Form,
  sourceResponses: Readonly<Record<string, FormFieldValue>>,
  sourceFormId: Id,
): number {
  const definition = store.form_definitions.find(
    (d) =>
      d.form_type === destinationForm.form_type &&
      d.version === destinationForm.version,
  );
  if (!definition) return 0;

  const now = nowIso();
  let applied = 0;
  for (const section of definition.sections_config) {
    for (const field of section.fields) {
      if (!field.carry_over_from) continue;
      const sourceKey = field.carry_over_from;
      const sourceValue = sourceResponses[sourceKey];
      if (sourceValue === undefined) continue;

      const existing = store.form_responses.find(
        (r) => r.form_id === destinationForm.id && r.field_key === field.key,
      );
      const oldValue: FormFieldValue = existing?.value ?? null;
      if (JSON.stringify(oldValue) === JSON.stringify(sourceValue)) continue;

      if (existing) {
        existing.value = sourceValue;
      } else {
        store.form_responses.push({
          id: newId("resp"),
          form_id: destinationForm.id,
          field_key: field.key,
          value: sourceValue,
        });
      }
      store.form_change_log.push({
        id: newId("fcl"),
        form_id: destinationForm.id,
        field_key: field.key,
        old_value: oldValue,
        new_value: sourceValue,
        changed_by: "system",
        changed_at: now,
      });
      applied++;
    }
  }

  if (applied > 0) {
    destinationForm.updated_at = now;
    appendAudit(store, {
      user_id: "system",
      action: "form_response_changed",
      entity_type: "form",
      entity_id: destinationForm.id,
      old_data: null,
      new_data: {
        form_type: destinationForm.form_type,
        changed_count: applied,
        source: "carry_over",
        from_form_id: sourceFormId,
      },
    });
  }
  return applied;
}

export function submitForm(formId: Id): Result<{ form: Form; gateway: Gateway | null }> {
  const parsed = submitFormSchema.safeParse({ formId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === parsed.data.formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  if (form.status !== "draft") {
    return err("CONFLICT", "El formulario ya fue enviado");
  }

  const definition =
    store.form_definitions.find(
      (d) => d.form_type === form.form_type && d.version === form.version,
    ) ?? null;
  const responses = loadResponses(store, form.id);
  const { missing_required } = computeCompleteness(definition, responses);
  if (missing_required.length > 0) {
    return err(
      "VALIDATION_ERROR",
      `Faltan campos obligatorios: ${missing_required.join(", ")}`,
    );
  }

  const now = nowIso();
  const oldStatus = form.status;
  form.status = form.form_type === "F4" || form.form_type === "F5" ? "submitted" : "in_review";
  form.submitted_at = now;
  form.updated_at = now;

  let gateway: Gateway | null = null;
  if (form.form_type === "F1" || form.form_type === "F2" || form.form_type === "F3") {
    const gateway_number = form.form_type === "F1" ? 1 : form.form_type === "F2" ? 2 : 3;
    gateway = {
      id: newId("gw"),
      form_id: form.id,
      initiative_id: form.initiative_id,
      gateway_number,
      status: "pending",
      requires_unanimity: true,
    };
    store.gateways.push(gateway);

    const approvers = store.initiative_members.filter((m) =>
      ["bo", "sponsor", "ld"].includes(m.role),
    );
    for (const a of approvers) {
      if (a.initiative_id !== form.initiative_id) continue;
      store.notifications.push({
        id: newId("notif"),
        user_id: a.user_id,
        type: "gateway_vote_pending",
        title: "Tu voto pendiente",
        message: `Hay un Gateway ${gateway_number} esperando tu voto`,
        initiative_id: form.initiative_id,
        read: false,
        created_at: now,
      });
    }
  } else {
    const sponsor = store.initiative_members.find(
      (m) => m.initiative_id === form.initiative_id && m.role === "sponsor",
    );
    if (sponsor) {
      store.notifications.push({
        id: newId("notif"),
        user_id: sponsor.user_id,
        type: "form_submitted",
        title: "Formulario enviado",
        message: `${form.form_type} esperando tu revisión`,
        initiative_id: form.initiative_id,
        read: false,
        created_at: now,
      });
    }
  }

  appendAudit(store, {
    user_id: user.id,
    action: "form_submitted",
    entity_type: "form",
    entity_id: form.id,
    old_data: { status: oldStatus },
    new_data: { status: form.status },
  });
  writeStore(store);
  return ok({ form, gateway });
}

export function markFormReviewed(
  formId: Id,
  comment: MarkFormReviewedInput["comment"],
): Result<Form> {
  const parsed = markFormReviewedSchema.safeParse({ formId, comment });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === parsed.data.formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (form.form_type !== "F4" && form.form_type !== "F5") {
    return err("CONFLICT", "Solo F4 y F5 pueden marcarse como revisados");
  }
  const roles = userRolesInInitiative(user, form.initiative_id, store);
  if (!roles.includes("sponsor")) {
    return err("FORBIDDEN", "Solo el Sponsor puede marcar como revisado");
  }
  if (form.status !== "submitted") {
    return err("CONFLICT", "El formulario debe estar en estado 'submitted'");
  }

  const now = nowIso();
  const oldStatus = form.status;
  form.status = "reviewed";
  form.updated_at = now;

  appendAudit(store, {
    user_id: user.id,
    action: "form_reviewed",
    entity_type: "form",
    entity_id: form.id,
    old_data: { status: oldStatus },
    new_data: { status: form.status, comment: parsed.data.comment },
  });
  writeStore(store);
  return ok(form);
}

export function generateDocument(
  formId: Id,
  type: GenerateDocumentInput["type"],
): Result<Document> {
  const parsed = generateDocumentSchema.safeParse({ formId, type });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === parsed.data.formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  if (!userCanAccessInitiative(user, form.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  // STUB: solo crea metadata. La generación binaria (pptxgenjs/SheetJS/etc)
  // se implementa cuando se incorporen las librerías.
  const now = nowIso();
  const stage = form.form_type === "F1"
    ? "proposal"
    : form.form_type === "F2"
      ? "dimensioning"
      : form.form_type === "F3"
        ? "mvp"
        : "ltp_tracking";
  const doc: Document = {
    id: newId("doc"),
    initiative_id: form.initiative_id,
    document_type: parsed.data.type,
    file_path: `/Iniciativas/${form.initiative_id}/${stage}/${parsed.data.type}.bin`,
    stage,
    ltp_period: form.ltp_period,
    generated_by: user.id,
    created_at: now,
  };
  store.documents.push(doc);
  appendAudit(store, {
    user_id: user.id,
    action: "document_generated",
    entity_type: "document",
    entity_id: doc.id,
    old_data: null,
    new_data: { document_type: doc.document_type, file_path: doc.file_path },
  });
  writeStore(store);
  return ok(doc);
}

export function uploadFinalVersion(
  formId: Id,
  file: UploadFinalVersionInput["file"],
): Result<Document> {
  const parsed = uploadFinalVersionSchema.safeParse({ formId, file });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const form = store.forms.find((f) => f.id === parsed.data.formId);
  if (!form) return err("NOT_FOUND", "Formulario no encontrado");
  const roles = userRolesInInitiative(user, form.initiative_id, store);
  if (!roles.includes("po") && !roles.includes("promotor")) {
    return err("FORBIDDEN", "Solo el PO o promotor pueden subir la VF");
  }

  const now = nowIso();
  const stage = form.form_type === "F1"
    ? "proposal"
    : form.form_type === "F2"
      ? "dimensioning"
      : form.form_type === "F3"
        ? "mvp"
        : "ltp_tracking";
  const docType =
    parsed.data.file.type === "xlsx"
      ? "vf_formulario_xlsx"
      : parsed.data.file.type === "pdf"
        ? "vf_formulario_pdf"
        : parsed.data.file.type === "pptx"
          ? "vf_presentacion_pptx"
          : parsed.data.file.type === "docx"
            ? "vf_nota_prensa_docx"
            : "manual_upload";
  const doc: Document = {
    id: newId("doc"),
    initiative_id: form.initiative_id,
    document_type: docType,
    file_path: `/Iniciativas/${form.initiative_id}/${stage}/${parsed.data.file.name}`,
    stage,
    ltp_period: form.ltp_period,
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
    new_data: { document_type: doc.document_type, file_path: doc.file_path },
  });
  writeStore(store);
  return ok(doc);
}
