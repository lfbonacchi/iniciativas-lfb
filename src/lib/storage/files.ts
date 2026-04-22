import type {
  Document,
  DocumentType,
  FileType,
  FileUpload,
  FormResponse,
  FormSnapshot,
  Id,
  InitiativeStage,
  JsonObject,
  JsonValue,
  LtpPeriod,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  downloadGeneratedFileSchema,
  fileIdOnlySchema,
  getFilesSchema,
  moveToFolderSchema,
  sanitizeFileName,
  saveFileMetadataSchema,
  type DownloadGeneratedType,
  type UploadFileInfoInput,
} from "@/lib/validations/files";
import { appendAudit } from "./_audit";
import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
} from "./_security";
import { isClient, readStore, writeStore, type Store } from "./_store";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type FileFolder = string;

export type FileSource = "auto" | "manual";

export interface FileMetadataView {
  id: Id;
  initiative_id: Id;
  source: FileSource;
  document_type: DocumentType | "manual_upload";
  file_name: string;
  file_type: FileType | null;
  mime_type: string | null;
  file_size: number | null;
  stage: InitiativeStage;
  ltp_period: LtpPeriod | null;
  folder: FileFolder;
  file_path: string;
  uploaded_by: Id;
  created_at: string;
  available: boolean;
}

// ---------------------------------------------------------------------------
// Registro en memoria de archivos subidos manualmente (se pierde al recargar)
// ---------------------------------------------------------------------------

interface UploadedFileHandle {
  blob: Blob;
  objectUrl: string;
  fileName: string;
  mimeType: string;
}

const uploadedFileRegistry = new Map<Id, UploadedFileHandle>();

export function registerUploadedBlob(
  fileId: Id,
  blob: Blob,
  fileName: string,
  mimeType: string,
): void {
  if (!isClient()) return;
  const previous = uploadedFileRegistry.get(fileId);
  if (previous) {
    try {
      URL.revokeObjectURL(previous.objectUrl);
    } catch {
      // ignorar
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  uploadedFileRegistry.set(fileId, { blob, objectUrl, fileName, mimeType });
}

export function hasUploadedBlob(fileId: Id): boolean {
  return uploadedFileRegistry.has(fileId);
}

function releaseUploadedBlob(fileId: Id): void {
  const handle = uploadedFileRegistry.get(fileId);
  if (!handle) return;
  try {
    URL.revokeObjectURL(handle.objectUrl);
  } catch {
    // ignorar
  }
  uploadedFileRegistry.delete(fileId);
}

// ---------------------------------------------------------------------------
// Registro de generadores (PPTX/XLSX/PDF/DOCX). Cada módulo que sepa cómo
// generar un tipo llama a registerGenerator al cargarse. Evita que files.ts
// dependa directamente de pptxgenjs/SheetJS/etc.
// ---------------------------------------------------------------------------

export interface GeneratorContext {
  store: Store;
  initiativeId: Id;
  formId: Id;
  type: DownloadGeneratedType;
  responses: Readonly<Record<string, JsonValue>>;
  snapshot: FormSnapshot | null;
}

export interface GeneratorOutput {
  blob: Blob;
  fileName: string;
  mimeType: string;
  fileType: FileType;
}

type GeneratorFn = (ctx: GeneratorContext) => Promise<GeneratorOutput>;

const generators = new Map<DownloadGeneratedType, GeneratorFn>();

export function registerGenerator(
  type: DownloadGeneratedType,
  fn: GeneratorFn,
): void {
  generators.set(type, fn);
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

const STAGE_FOLDER: Record<InitiativeStage, string> = {
  proposal: "Etapa 1",
  dimensioning: "Etapa 2",
  mvp: "Etapa 3",
  ltp_tracking: "LTP y Seguimiento",
};

const LTP_MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

const FILE_TYPE_BY_EXT: Readonly<Record<string, FileType>> = {
  docx: "docx",
  xlsx: "xlsx",
  pdf: "pdf",
  pptx: "pptx",
  png: "png",
  jpg: "jpg",
  jpeg: "jpg",
  mp4: "mp4",
};

const MIME_BY_TYPE: Record<FileType, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  mp4: "video/mp4",
};

function extFromFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

function parseLtpPeriod(period: LtpPeriod): { year: string; month: string } {
  const match = /^(\d{2})-(\d{4})$/.exec(period);
  if (!match) return { year: period, month: "" };
  const monthPart = match[1] ?? "";
  const yearPart = match[2] ?? "";
  const monthIndex = Number.parseInt(monthPart, 10) - 1;
  const monthName = LTP_MONTH_NAMES[monthIndex] ?? monthPart;
  return { year: yearPart, month: monthName };
}

function findInitiativeName(store: Store, initiativeId: Id): string {
  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  return initiative?.name ?? initiativeId;
}

export function buildFilePath(
  store: Store,
  initiativeId: Id,
  stage: InitiativeStage,
  folder: FileFolder,
  fileName: string,
  ltpPeriod: LtpPeriod | null,
): string {
  const name = findInitiativeName(store, initiativeId);
  const safeName = sanitizeFileName(fileName);
  const parts = ["/Iniciativas", name];

  if (stage === "ltp_tracking") {
    const base = "LTP y Seguimiento";
    if (ltpPeriod) {
      const { year, month } = parseLtpPeriod(ltpPeriod);
      parts.push(base, year, month);
      if (folder && folder !== base) parts.push(folder);
    } else {
      parts.push(base);
      if (folder && folder !== base) parts.push(folder);
    }
  } else {
    parts.push(STAGE_FOLDER[stage]);
    if (folder && folder !== STAGE_FOLDER[stage]) parts.push(folder);
  }

  parts.push(safeName);
  return parts.join("/");
}

function fileTypeFromName(fileName: string): FileType | null {
  const ext = extFromFileName(fileName);
  return FILE_TYPE_BY_EXT[ext] ?? null;
}

function documentToView(doc: Document, store: Store): FileMetadataView {
  const fileName = doc.file_path.split("/").pop() ?? "archivo";
  const folder = deriveFolderFromPath(doc.file_path);
  const fileType = fileTypeFromName(fileName);
  return {
    id: doc.id,
    initiative_id: doc.initiative_id,
    source: "auto",
    document_type: doc.document_type,
    file_name: fileName,
    file_type: fileType,
    mime_type: fileType ? MIME_BY_TYPE[fileType] : null,
    file_size: null,
    stage: doc.stage,
    ltp_period: doc.ltp_period,
    folder,
    file_path: doc.file_path,
    uploaded_by: doc.generated_by,
    created_at: doc.created_at,
    available: true,
  };
}

function fileUploadToView(
  upload: FileUpload,
  store: Store,
): FileMetadataView {
  const folderRow = store.initiative_folders.find(
    (f) => f.id === upload.folder_id,
  );
  const stage: InitiativeStage = folderRow?.stage ?? "ltp_tracking";
  const ltpPeriod = folderRow?.ltp_period ?? null;
  const folder = folderRow
    ? deriveFolderFromPath(folderRow.folder_path)
    : "archivos adicionales";
  const filePath = folderRow
    ? `${folderRow.folder_path}/${upload.file_name}`
    : upload.file_name;
  return {
    id: upload.id,
    initiative_id: upload.initiative_id,
    source: "manual",
    document_type: "manual_upload",
    file_name: upload.file_name,
    file_type: upload.file_type,
    mime_type: MIME_BY_TYPE[upload.file_type] ?? null,
    file_size: upload.file_size,
    stage,
    ltp_period: ltpPeriod,
    folder,
    file_path: filePath,
    uploaded_by: upload.uploaded_by,
    created_at: upload.created_at,
    available: uploadedFileRegistry.has(upload.id),
  };
}

function deriveFolderFromPath(filePath: string): string {
  const parts = filePath.split("/").filter((p) => p.length > 0);
  if (parts.length <= 2) return "";
  const last = parts[parts.length - 1] ?? "";
  const maybeFile = last.includes(".") ? parts.slice(0, -1) : parts;
  return maybeFile[maybeFile.length - 1] ?? "";
}

function ensureFolderRow(
  store: Store,
  initiativeId: Id,
  stage: InitiativeStage,
  folder: FileFolder,
  ltpPeriod: LtpPeriod | null,
): string {
  const folderPath = buildFilePath(
    store,
    initiativeId,
    stage,
    folder,
    "",
    ltpPeriod,
  ).replace(/\/$/, "");
  const existing = store.initiative_folders.find(
    (f) =>
      f.initiative_id === initiativeId &&
      f.folder_path === folderPath &&
      f.stage === stage &&
      (f.ltp_period ?? null) === (ltpPeriod ?? null),
  );
  if (existing) return existing.id;
  const id = newId("folder");
  store.initiative_folders.push({
    id,
    initiative_id: initiativeId,
    folder_path: folderPath,
    stage,
    ltp_period: ltpPeriod,
    created_at: nowIso(),
  });
  return id;
}

function triggerBrowserDownload(
  blob: Blob,
  fileName: string,
): Result<true> {
  if (!isClient()) {
    return err(
      "INTERNAL_ERROR",
      "La descarga solo está disponible en el navegador",
    );
  }
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Revocamos en el siguiente tick para que el browser alcance a disparar la descarga.
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignorar
      }
    }, 2000);
  }
  return ok(true);
}

function isDocumentType(value: string): value is DocumentType {
  return (
    value === "formulario_xlsx" ||
    value === "formulario_pdf" ||
    value === "vf_formulario_xlsx" ||
    value === "vf_formulario_pdf" ||
    value === "vf_presentacion_pptx" ||
    value === "vf_nota_prensa_docx" ||
    value === "minuta_gateway_docx" ||
    value === "manual_upload"
  );
}

function buildResponsesMap(
  store: Store,
  formId: Id,
): Readonly<Record<string, JsonValue>> {
  const map: Record<string, JsonValue> = {};
  store.form_responses
    .filter((r: FormResponse) => r.form_id === formId)
    .forEach((r) => {
      map[r.field_key] = r.value as JsonValue;
    });
  return map;
}

function findFinalSnapshot(
  store: Store,
  formId: Id,
): FormSnapshot | null {
  const snapshots = store.form_snapshots
    .filter((s) => s.form_id === formId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return (
    snapshots.find((s) => s.snapshot_type === "final") ??
    snapshots.find((s) => s.snapshot_type === "submitted") ??
    null
  );
}

// Fallback genérico cuando no hay generador registrado para el tipo pedido.
// Produce un blob de texto con las respuestas serializadas en JSON — permite
// que las descargas funcionen end-to-end sin bloquear la integración con las
// librerías de generación (pptxgenjs, SheetJS, etc).
function fallbackGenerator(ctx: GeneratorContext): GeneratorOutput {
  const { type, responses, snapshot, store, formId } = ctx;
  const form = store.forms.find((f) => f.id === formId);
  const initiativeName = findInitiativeName(store, ctx.initiativeId);

  const payload = {
    initiative: initiativeName,
    form_id: formId,
    form_type: form?.form_type ?? null,
    document_type: type,
    generated_at: nowIso(),
    source: snapshot ? "form_snapshot" : "form_responses",
    responses: snapshot?.responses_data ?? responses,
  } as const;

  const extByType: Record<DownloadGeneratedType, FileType> = {
    formulario_xlsx: "xlsx",
    formulario_pdf: "pdf",
    vf_formulario_xlsx: "xlsx",
    vf_formulario_pdf: "pdf",
    vf_presentacion_pptx: "pptx",
    vf_nota_prensa_docx: "docx",
    minuta_gateway_docx: "docx",
  };
  const ext = extByType[type];
  const baseName = snapshot ? `VF_${form?.form_type ?? "formulario"}` : `${form?.form_type ?? "formulario"}_${type}`;
  const fileName = `${baseName}.${ext}`;

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "text/plain;charset=utf-8" });
  return {
    blob,
    fileName,
    mimeType: "text/plain;charset=utf-8",
    fileType: ext,
  };
}

function typeToAutoFolder(
  type: DownloadGeneratedType,
  stage: InitiativeStage,
): FileFolder {
  if (stage === "ltp_tracking") {
    // Dentro de LTP guardamos en F4/F5 por tipo
    if (type === "vf_formulario_xlsx" || type === "vf_formulario_pdf") {
      return "Formulario 4 - Vision Anual";
    }
    return "Formulario 5 - Planificacion Anual";
  }
  return STAGE_FOLDER[stage];
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function saveFileMetadata(
  initiativeId: Id,
  stage: InitiativeStage,
  folder: FileFolder,
  fileInfo: UploadFileInfoInput,
  options?: { ltpPeriod?: LtpPeriod | null },
): Result<FileMetadataView> {
  const parsed = saveFileMetadataSchema.safeParse({
    initiativeId,
    stage,
    folder,
    fileInfo,
    ltpPeriod: options?.ltpPeriod ?? undefined,
  });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }

  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanAccessInitiative(user, parsed.data.initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const safeName = sanitizeFileName(parsed.data.fileInfo.file_name);
  const ltpPeriod = parsed.data.ltpPeriod ?? null;
  const now = nowIso();

  if (parsed.data.fileInfo.is_auto) {
    const documentType = parsed.data.fileInfo.document_type ?? "formulario_xlsx";
    if (!isDocumentType(documentType)) {
      return err("VALIDATION_ERROR", "document_type inválido");
    }
    const filePath = buildFilePath(
      store,
      parsed.data.initiativeId,
      parsed.data.stage,
      parsed.data.folder,
      safeName,
      ltpPeriod,
    );
    const doc: Document = {
      id: newId("doc"),
      initiative_id: parsed.data.initiativeId,
      document_type: documentType,
      file_path: filePath,
      stage: parsed.data.stage,
      ltp_period: ltpPeriod,
      generated_by: user.id,
      created_at: now,
    };
    store.documents.push(doc);
    ensureFolderRow(
      store,
      parsed.data.initiativeId,
      parsed.data.stage,
      parsed.data.folder,
      ltpPeriod,
    );
    appendAudit(store, {
      user_id: user.id,
      action: "document_generated",
      entity_type: "document",
      entity_id: doc.id,
      old_data: null,
      new_data: toJsonObject({
        file_name: safeName,
        stage: parsed.data.stage,
        folder: String(parsed.data.folder),
        document_type: documentType,
      }),
    });
    writeStore(store);
    return ok(documentToView(doc, store));
  }

  // Manual upload: crear FileUpload
  const folderId = ensureFolderRow(
    store,
    parsed.data.initiativeId,
    parsed.data.stage,
    parsed.data.folder,
    ltpPeriod,
  );
  const upload: FileUpload = {
    id: newId("file"),
    initiative_id: parsed.data.initiativeId,
    folder_id: folderId,
    file_name: safeName,
    file_type: parsed.data.fileInfo.file_type,
    file_size: parsed.data.fileInfo.file_size,
    uploaded_by: user.id,
    created_at: now,
  };
  store.file_uploads.push(upload);
  appendAudit(store, {
    user_id: user.id,
    action: "file_uploaded",
    entity_type: "file_upload",
    entity_id: upload.id,
    old_data: null,
    new_data: toJsonObject({
      file_name: safeName,
      stage: parsed.data.stage,
      folder: String(parsed.data.folder),
      file_type: parsed.data.fileInfo.file_type,
      file_size: parsed.data.fileInfo.file_size,
    }),
  });
  writeStore(store);
  return ok(fileUploadToView(upload, store));
}

export function getFiles(
  initiativeId: Id,
  stage?: InitiativeStage,
  folder?: FileFolder,
): Result<FileMetadataView[]> {
  const parsed = getFilesSchema.safeParse({ initiativeId, stage, folder });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanAccessInitiative(user, parsed.data.initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const docs: FileMetadataView[] = store.documents
    .filter((d) => d.initiative_id === parsed.data.initiativeId)
    .map((d) => documentToView(d, store));
  const uploads: FileMetadataView[] = store.file_uploads
    .filter((u) => u.initiative_id === parsed.data.initiativeId)
    .map((u) => fileUploadToView(u, store));

  let result = [...docs, ...uploads];
  if (parsed.data.stage) {
    result = result.filter((f) => f.stage === parsed.data.stage);
  }
  if (parsed.data.folder) {
    result = result.filter((f) => f.folder === parsed.data.folder);
  }
  result.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return ok(result);
}

export async function downloadGeneratedFile(
  initiativeId: Id,
  formId: Id,
  type: DownloadGeneratedType,
): Promise<Result<FileMetadataView>> {
  const parsed = downloadGeneratedFileSchema.safeParse({
    initiativeId,
    formId,
    type,
  });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanAccessInitiative(user, parsed.data.initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const form = store.forms.find((f) => f.id === parsed.data.formId);
  if (!form || form.initiative_id !== parsed.data.initiativeId) {
    return err("NOT_FOUND", "Formulario no encontrado");
  }

  const isVf =
    parsed.data.type === "vf_formulario_xlsx" ||
    parsed.data.type === "vf_formulario_pdf" ||
    parsed.data.type === "vf_presentacion_pptx" ||
    parsed.data.type === "vf_nota_prensa_docx";

  const snapshot = isVf ? findFinalSnapshot(store, parsed.data.formId) : null;
  const responses = snapshot
    ? (snapshot.responses_data as Readonly<Record<string, JsonValue>>)
    : buildResponsesMap(store, parsed.data.formId);

  const ctx: GeneratorContext = {
    store,
    initiativeId: parsed.data.initiativeId,
    formId: parsed.data.formId,
    type: parsed.data.type,
    responses,
    snapshot,
  };

  let output: GeneratorOutput;
  const generator = generators.get(parsed.data.type);
  try {
    output = generator ? await generator(ctx) : fallbackGenerator(ctx);
  } catch {
    return err(
      "INTERNAL_ERROR",
      "Error al generar el archivo. Intentá de nuevo.",
    );
  }

  const safeName = sanitizeFileName(output.fileName);
  const downloadResult = triggerBrowserDownload(output.blob, safeName);
  if (!downloadResult.success) return downloadResult;

  const stage = inferStageFromForm(form);
  const folder = typeToAutoFolder(parsed.data.type, stage);
  const ltpPeriod = form.ltp_period ?? null;

  const filePath = buildFilePath(
    store,
    parsed.data.initiativeId,
    stage,
    folder,
    safeName,
    ltpPeriod,
  );

  const doc: Document = {
    id: newId("doc"),
    initiative_id: parsed.data.initiativeId,
    document_type: parsed.data.type,
    file_path: filePath,
    stage,
    ltp_period: ltpPeriod,
    generated_by: user.id,
    created_at: nowIso(),
  };
  store.documents.push(doc);
  ensureFolderRow(
    store,
    parsed.data.initiativeId,
    stage,
    folder,
    ltpPeriod,
  );
  appendAudit(store, {
    user_id: user.id,
    action: "document_generated",
    entity_type: "document",
    entity_id: doc.id,
    old_data: null,
    new_data: toJsonObject({
      form_id: parsed.data.formId,
      document_type: parsed.data.type,
      file_name: safeName,
      via_snapshot: snapshot !== null,
    }),
  });
  appendAudit(store, {
    user_id: user.id,
    action: "document_downloaded",
    entity_type: "document",
    entity_id: doc.id,
    old_data: null,
    new_data: toJsonObject({ file_name: safeName }),
  });
  writeStore(store);
  return ok(documentToView(doc, store));
}

function inferStageFromForm(form: {
  form_type: string;
  ltp_period: string | null;
}): InitiativeStage {
  if (form.form_type === "F1") return "proposal";
  if (form.form_type === "F2") return "dimensioning";
  if (form.form_type === "F3") return "mvp";
  return "ltp_tracking";
}

export function downloadUploadedFile(fileId: Id): Result<FileMetadataView> {
  const parsed = fileIdOnlySchema.safeParse({ fileId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const upload = store.file_uploads.find((f) => f.id === parsed.data.fileId);
  if (!upload) return err("NOT_FOUND", "Archivo no encontrado");
  if (!userCanAccessInitiative(user, upload.initiative_id, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const handle = uploadedFileRegistry.get(parsed.data.fileId);
  if (!handle) {
    return err(
      "NOT_FOUND",
      "Archivo no disponible — subir de nuevo (los archivos manuales solo persisten durante la sesión)",
    );
  }

  const downloadResult = triggerBrowserDownload(handle.blob, handle.fileName);
  if (!downloadResult.success) return downloadResult;

  appendAudit(store, {
    user_id: user.id,
    action: "file_downloaded",
    entity_type: "file_upload",
    entity_id: upload.id,
    old_data: null,
    new_data: toJsonObject({ file_name: upload.file_name }),
  });
  writeStore(store);
  return ok(fileUploadToView(upload, store));
}

export function moveToFolder(
  fileId: Id,
  newFolder: FileFolder,
  options?: { newStage?: InitiativeStage; newLtpPeriod?: LtpPeriod | null },
): Result<FileMetadataView> {
  const parsed = moveToFolderSchema.safeParse({
    fileId,
    newFolder,
    newStage: options?.newStage,
    newLtpPeriod: options?.newLtpPeriod ?? undefined,
  });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const doc = store.documents.find((d) => d.id === parsed.data.fileId);
  if (doc) {
    if (!userCanAccessInitiative(user, doc.initiative_id, store)) {
      return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
    }
    const previousPath = doc.file_path;
    const stage = parsed.data.newStage ?? doc.stage;
    const ltpPeriod =
      parsed.data.newLtpPeriod !== undefined
        ? parsed.data.newLtpPeriod
        : doc.ltp_period;
    const fileName = doc.file_path.split("/").pop() ?? "archivo";
    doc.file_path = buildFilePath(
      store,
      doc.initiative_id,
      stage,
      parsed.data.newFolder,
      fileName,
      ltpPeriod,
    );
    doc.stage = stage;
    doc.ltp_period = ltpPeriod;
    ensureFolderRow(
      store,
      doc.initiative_id,
      stage,
      parsed.data.newFolder,
      ltpPeriod,
    );
    appendAudit(store, {
      user_id: user.id,
      action: "document_moved",
      entity_type: "document",
      entity_id: doc.id,
      old_data: toJsonObject({ file_path: previousPath }),
      new_data: toJsonObject({
        file_path: doc.file_path,
        folder: String(parsed.data.newFolder),
      }),
    });
    writeStore(store);
    return ok(documentToView(doc, store));
  }

  const upload = store.file_uploads.find((f) => f.id === parsed.data.fileId);
  if (upload) {
    if (!userCanAccessInitiative(user, upload.initiative_id, store)) {
      return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
    }
    const previousFolderId = upload.folder_id;
    const previousFolder = store.initiative_folders.find(
      (f) => f.id === previousFolderId,
    );
    const stage = parsed.data.newStage ?? previousFolder?.stage ?? "ltp_tracking";
    const ltpPeriod =
      parsed.data.newLtpPeriod !== undefined
        ? parsed.data.newLtpPeriod
        : (previousFolder?.ltp_period ?? null);
    upload.folder_id = ensureFolderRow(
      store,
      upload.initiative_id,
      stage,
      parsed.data.newFolder,
      ltpPeriod,
    );
    appendAudit(store, {
      user_id: user.id,
      action: "file_moved",
      entity_type: "file_upload",
      entity_id: upload.id,
      old_data: toJsonObject({
        folder_id: previousFolderId,
        folder_path: previousFolder?.folder_path ?? null,
      }),
      new_data: toJsonObject({
        folder_id: upload.folder_id,
        folder: String(parsed.data.newFolder),
      }),
    });
    writeStore(store);
    return ok(fileUploadToView(upload, store));
  }

  return err("NOT_FOUND", "Archivo no encontrado");
}

export function deleteFileMetadata(fileId: Id): Result<{ id: Id }> {
  const parsed = fileIdOnlySchema.safeParse({ fileId });
  if (!parsed.success) {
    return err("VALIDATION_ERROR", firstZodErrorMessage(parsed.error));
  }
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const doc = store.documents.find((d) => d.id === parsed.data.fileId);
  if (doc) {
    if (!userCanAccessInitiative(user, doc.initiative_id, store)) {
      return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
    }
    store.documents = store.documents.filter((d) => d.id !== doc.id);
    appendAudit(store, {
      user_id: user.id,
      action: "document_deleted",
      entity_type: "document",
      entity_id: doc.id,
      old_data: toJsonObject({
        file_path: doc.file_path,
        document_type: doc.document_type,
      }),
      new_data: null,
    });
    writeStore(store);
    return ok({ id: doc.id });
  }

  const upload = store.file_uploads.find((f) => f.id === parsed.data.fileId);
  if (upload) {
    if (!userCanAccessInitiative(user, upload.initiative_id, store)) {
      return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
    }
    store.file_uploads = store.file_uploads.filter((f) => f.id !== upload.id);
    releaseUploadedBlob(upload.id);
    appendAudit(store, {
      user_id: user.id,
      action: "file_deleted",
      entity_type: "file_upload",
      entity_id: upload.id,
      old_data: toJsonObject({
        file_name: upload.file_name,
        file_size: upload.file_size,
      }),
      new_data: null,
    });
    writeStore(store);
    return ok({ id: upload.id });
  }

  return err("NOT_FOUND", "Archivo no encontrado");
}

const APP_STORAGE_PREFIX = "mandarina";

export function clearAllData(): Result<{ cleared_keys: number }> {
  if (!isClient()) {
    return err(
      "INTERNAL_ERROR",
      "Solo disponible en el navegador",
    );
  }

  // Liberar blobs en memoria antes de limpiar.
  uploadedFileRegistry.forEach((handle) => {
    try {
      URL.revokeObjectURL(handle.objectUrl);
    } catch {
      // ignorar
    }
  });
  uploadedFileRegistry.clear();

  // Registrar el clear en audit antes de limpiar (solo informativo — se borra junto con todo).
  try {
    const store = readStore();
    const user = getCurrentUserFromStore(store);
    if (user) {
      appendAudit(store, {
        user_id: user.id,
        action: "memory_cleared",
        entity_type: "initiative",
        entity_id: user.id,
        old_data: null,
        new_data: null,
      });
      writeStore(store);
    }
  } catch {
    // si el store está corrupto, seguir adelante con el clear
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    const lower = key.toLowerCase();
    if (
      lower.startsWith(`${APP_STORAGE_PREFIX}_`) ||
      lower.startsWith(`${APP_STORAGE_PREFIX}-`)
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      // ignorar
    }
  });

  return ok({ cleared_keys: keysToRemove.length });
}

function toJsonObject(input: Record<string, unknown>): JsonObject {
  const out: Record<string, JsonValue> = {};
  for (const [k, v] of Object.entries(input)) {
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[k] = v as JsonValue;
    } else if (Array.isArray(v)) {
      out[k] = v.map((x) =>
        x === null ||
        typeof x === "string" ||
        typeof x === "number" ||
        typeof x === "boolean"
          ? (x as JsonValue)
          : JSON.stringify(x),
      );
    } else if (typeof v === "object") {
      out[k] = JSON.stringify(v);
    } else {
      out[k] = String(v);
    }
  }
  return out as JsonObject;
}
