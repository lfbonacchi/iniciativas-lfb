import type {
  Document,
  Form,
  FormType,
  Id,
  InitiativeStage,
  LtpPeriod,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { firstZodErrorMessage } from "@/lib/validations/common";
import {
  getDocumentUrlSchema,
  listDocumentsSchema,
  uploadDocumentSchema,
  type UploadDocumentInput,
} from "@/lib/validations/documents";
import { readStore, writeStore, type Store } from "./_store";
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

// ============================================================================
// Document tree — estructura de carpetas para el tab Documentos
// ============================================================================

export type DocNodeKind = "folder" | "file";
export type DocFileOrigin = "auto" | "manual";

export interface DocFileNode {
  kind: "file";
  id: Id;
  name: string;
  icon: string;
  origin: DocFileOrigin;
  created_at: string;
  author_name: string | null;
  can_regenerate: boolean;
}

export interface DocFolderNode {
  kind: "folder";
  id: string;
  name: string;
  icon: string;
  default_open?: boolean;
  children: DocTreeNode[];
}

export type DocTreeNode = DocFolderNode | DocFileNode;

const STAGE_LABEL: Record<InitiativeStage, string> = {
  proposal: "Etapa 1 — Propuesta",
  dimensioning: "Etapa 2 — Dimensionamiento",
  mvp: "Etapa 3 — MVP",
  ltp_tracking: "LTP y Seguimiento",
};

const STAGE_TO_FORM: Record<
  Exclude<InitiativeStage, "ltp_tracking">,
  FormType
> = {
  proposal: "F1",
  dimensioning: "F2",
  mvp: "F3",
};

const STAGE_GATEWAY_NUMBER: Record<
  Exclude<InitiativeStage, "ltp_tracking">,
  1 | 2 | 3
> = {
  proposal: 1,
  dimensioning: 2,
  mvp: 3,
};

const STAGE_ORDER: InitiativeStage[] = [
  "proposal",
  "dimensioning",
  "mvp",
  "ltp_tracking",
];

const MONTH_NAMES: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

function userName(store: Store, userId: Id | null): string | null {
  if (!userId) return null;
  const u = store.users.find((uu) => uu.id === userId);
  return u?.display_name ?? null;
}

function initiativeHasStage(
  store: Store,
  initiativeId: Id,
  stage: InitiativeStage,
): boolean {
  const ini = store.initiatives.find((i) => i.id === initiativeId);
  if (!ini) return false;
  if (stage === "proposal") return ini.has_etapa1;
  if (stage === "dimensioning") return ini.has_etapa2;
  if (stage === "mvp") return ini.has_etapa3;
  // ltp_tracking se muestra si hay algún form F4/F5 o está en esa etapa.
  return (
    ini.current_stage === "ltp_tracking" ||
    store.forms.some(
      (f) =>
        f.initiative_id === initiativeId &&
        (f.form_type === "F4" || f.form_type === "F5"),
    )
  );
}

function isoForForm(form: Form): string {
  return form.approved_at ?? form.submitted_at ?? form.updated_at;
}

function buildStageFolder(
  store: Store,
  initiativeId: Id,
  stage: Exclude<InitiativeStage, "ltp_tracking">,
  defaultOpen: boolean,
): DocFolderNode {
  const formType = STAGE_TO_FORM[stage];
  const gatewayNumber = STAGE_GATEWAY_NUMBER[stage];
  const form = store.forms.find(
    (f) => f.initiative_id === initiativeId && f.form_type === formType,
  );
  const approved =
    form?.status === "approved" ||
    form?.status === "final" ||
    form?.status === "closed";
  const gateway = store.gateways.find(
    (g) =>
      g.initiative_id === initiativeId &&
      g.gateway_number === gatewayNumber,
  );
  const gatewayDone = gateway && gateway.status !== "pending";

  const authorId = form?.created_by ?? null;
  const authorName = userName(store, authorId);
  const dateIso = form ? isoForForm(form) : new Date().toISOString();

  const children: DocTreeNode[] = [];

  if (form) {
    children.push({
      kind: "file",
      id: `auto-${form.id}-xlsx`,
      name: `${formType}_formulario.xlsx`,
      icon: "📋",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    });
    children.push({
      kind: "file",
      id: `auto-${form.id}-pdf`,
      name: `${formType}_formulario.pdf`,
      icon: "📄",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    });
  }

  if (approved && form) {
    const vfIso = form.approved_at ?? dateIso;
    children.push({
      kind: "file",
      id: `vf-${form.id}-xlsx`,
      name: `${formType}_formulario_VF.xlsx`,
      icon: "📋",
      origin: "auto",
      created_at: vfIso,
      author_name: authorName,
      can_regenerate: true,
    });
    children.push({
      kind: "file",
      id: `vf-${form.id}-pdf`,
      name: `${formType}_formulario_VF.pdf`,
      icon: "📄",
      origin: "auto",
      created_at: vfIso,
      author_name: authorName,
      can_regenerate: true,
    });
    children.push({
      kind: "file",
      id: `vf-${form.id}-pptx`,
      name: `Presentacion_${formType}_VF.pptx`,
      icon: "📊",
      origin: "auto",
      created_at: vfIso,
      author_name: authorName,
      can_regenerate: true,
    });
    children.push({
      kind: "file",
      id: `vf-${form.id}-notaprensa`,
      name: `Notadeprensa_${formType}_VF.docx`,
      icon: "📰",
      origin: "auto",
      created_at: vfIso,
      author_name: authorName,
      can_regenerate: true,
    });
  }

  if (gatewayDone && gateway) {
    children.push({
      kind: "file",
      id: `minuta-${gateway.id}`,
      name: `Minuta_gateway_${gateway.gateway_number}.docx`,
      icon: "📝",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    });
  }

  const manualDocs = store.documents.filter(
    (d) =>
      d.initiative_id === initiativeId &&
      d.stage === stage &&
      d.document_type === "manual_upload",
  );
  const additionalChildren: DocFileNode[] = manualDocs.map((d) => ({
    kind: "file",
    id: d.id,
    name: d.file_path.split("/").pop() ?? "archivo",
    icon: iconForPath(d.file_path),
    origin: "manual",
    created_at: d.created_at,
    author_name: userName(store, d.generated_by),
    can_regenerate: false,
  }));

  children.push({
    kind: "folder",
    id: `${stage}-adicionales`,
    name: "archivos adicionales",
    icon: "📁",
    default_open: additionalChildren.length > 0,
    children: additionalChildren,
  });

  return {
    kind: "folder",
    id: `stage-${stage}`,
    name: STAGE_LABEL[stage],
    icon: "📁",
    default_open: defaultOpen,
    children,
  };
}

function splitLtpPeriod(period: LtpPeriod): {
  year: string;
  monthLabel: string;
  monthKey: string;
} | null {
  const match = /^(\d{2})-(\d{4})$/.exec(period);
  if (!match) return null;
  const mm = match[1] ?? "";
  const yyyy = match[2] ?? "";
  if (!mm || !yyyy) return null;
  return {
    year: yyyy,
    monthKey: mm,
    monthLabel: MONTH_NAMES[mm] ?? mm,
  };
}

function buildLtpFolder(store: Store, initiativeId: Id): DocFolderNode {
  const forms = store.forms.filter(
    (f) =>
      f.initiative_id === initiativeId &&
      (f.form_type === "F4" || f.form_type === "F5"),
  );

  const manualDocs = store.documents.filter(
    (d) =>
      d.initiative_id === initiativeId &&
      d.stage === "ltp_tracking" &&
      d.document_type === "manual_upload",
  );

  const byYear = new Map<string, Map<string, { monthLabel: string; forms: Form[] }>>();
  for (const f of forms) {
    if (!f.ltp_period) continue;
    const parts = splitLtpPeriod(f.ltp_period);
    if (!parts) continue;
    let year = byYear.get(parts.year);
    if (!year) {
      year = new Map();
      byYear.set(parts.year, year);
    }
    let month = year.get(parts.monthKey);
    if (!month) {
      month = { monthLabel: parts.monthLabel, forms: [] };
      year.set(parts.monthKey, month);
    }
    month.forms.push(f);
  }

  const yearKeys = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));
  const yearNodes: DocTreeNode[] = yearKeys.map((year) => {
    const monthsMap = byYear.get(year)!;
    const monthKeys = Array.from(monthsMap.keys()).sort();
    const monthNodes: DocTreeNode[] = monthKeys.map((mk) => {
      const month = monthsMap.get(mk)!;
      const formNodes: DocTreeNode[] = month.forms
        .sort((a, b) => a.form_type.localeCompare(b.form_type))
        .map((f) => buildLtpFormFolder(store, f));
      return {
        kind: "folder",
        id: `ltp-${year}-${mk}`,
        name: month.monthLabel,
        icon: "📁",
        default_open: false,
        children: formNodes,
      };
    });
    return {
      kind: "folder",
      id: `ltp-${year}`,
      name: year,
      icon: "📁",
      default_open: yearKeys[0] === year,
      children: monthNodes,
    };
  });

  if (manualDocs.length > 0) {
    yearNodes.push({
      kind: "folder",
      id: "ltp-adicionales",
      name: "archivos adicionales",
      icon: "📁",
      default_open: true,
      children: manualDocs.map((d) => ({
        kind: "file",
        id: d.id,
        name: d.file_path.split("/").pop() ?? "archivo",
        icon: iconForPath(d.file_path),
        origin: "manual",
        created_at: d.created_at,
        author_name: userName(store, d.generated_by),
        can_regenerate: false,
      })),
    });
  }

  return {
    kind: "folder",
    id: "stage-ltp_tracking",
    name: STAGE_LABEL.ltp_tracking,
    icon: "📁",
    default_open: false,
    children: yearNodes,
  };
}

function buildLtpFormFolder(store: Store, form: Form): DocFolderNode {
  const authorName = userName(store, form.created_by);
  const dateIso = isoForForm(form);
  const approved =
    form.status === "approved" ||
    form.status === "final" ||
    form.status === "reviewed" ||
    form.status === "closed";
  const labelByType: Record<"F4" | "F5", string> = {
    F4: "F4 Visión Anual",
    F5: "F5 Planificación Anual",
  };
  const type = form.form_type as "F4" | "F5";
  const children: DocTreeNode[] = [
    {
      kind: "file",
      id: `auto-${form.id}-xlsx`,
      name: `${type}_formulario.xlsx`,
      icon: "📋",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    },
    {
      kind: "file",
      id: `auto-${form.id}-pdf`,
      name: `${type}_formulario.pdf`,
      icon: "📄",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    },
  ];
  if (approved) {
    children.push({
      kind: "file",
      id: `vf-${form.id}-xlsx`,
      name: `${type}_formulario_VF.xlsx`,
      icon: "📋",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    });
    children.push({
      kind: "file",
      id: `vf-${form.id}-pdf`,
      name: `${type}_formulario_VF.pdf`,
      icon: "📄",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    });
    children.push({
      kind: "file",
      id: `vf-${form.id}-pptx`,
      name: `Presentacion_${type}_VF.pptx`,
      icon: "📊",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    });
    children.push({
      kind: "file",
      id: `vf-${form.id}-notaprensa`,
      name: `Notadeprensa_${type}_VF.docx`,
      icon: "📰",
      origin: "auto",
      created_at: dateIso,
      author_name: authorName,
      can_regenerate: true,
    });
  }

  return {
    kind: "folder",
    id: `ltp-form-${form.id}`,
    name: labelByType[type],
    icon: "📁",
    default_open: false,
    children,
  };
}

function iconForPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".xlsx")) return "📋";
  if (lower.endsWith(".pdf")) return "📄";
  if (lower.endsWith(".pptx")) return "📊";
  if (lower.endsWith(".docx")) return "📝";
  if (lower.endsWith(".png") || lower.endsWith(".jpg")) return "🖼";
  if (lower.endsWith(".mp4")) return "🎥";
  return "📎";
}

export function getDocumentTree(
  initiativeId: Id,
): Result<{ tree: DocTreeNode[]; initiative_name: string }> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const tree: DocTreeNode[] = [];

  const currentStageIndex = STAGE_ORDER.indexOf(initiative.current_stage);

  for (const stage of ["proposal", "dimensioning", "mvp"] as const) {
    if (!initiativeHasStage(store, initiativeId, stage)) continue;
    const idx = STAGE_ORDER.indexOf(stage);
    const isCurrent = stage === initiative.current_stage;
    const defaultOpen = isCurrent || idx === currentStageIndex;
    tree.push(buildStageFolder(store, initiativeId, stage, defaultOpen));
  }

  if (initiativeHasStage(store, initiativeId, "ltp_tracking")) {
    const ltp = buildLtpFolder(store, initiativeId);
    if (initiative.current_stage === "ltp_tracking") {
      ltp.default_open = true;
    }
    tree.push(ltp);
  }

  // Carpetas comunes (vacías por ahora — el modelo no persiste reuniones
  // ni feedback de gateways como documentos propios todavía).
  tree.push({
    kind: "folder",
    id: "reuniones",
    name: "Reuniones y minutas",
    icon: "📁",
    default_open: false,
    children: [],
  });

  tree.push({
    kind: "folder",
    id: "feedback-gateways",
    name: "Feedback de gateways",
    icon: "📁",
    default_open: false,
    children: buildGatewayFeedbackNodes(store, initiativeId),
  });

  return ok({ tree, initiative_name: initiative.name });
}

function buildGatewayFeedbackNodes(
  store: Store,
  initiativeId: Id,
): DocTreeNode[] {
  const gateways = store.gateways.filter(
    (g) => g.initiative_id === initiativeId && g.status !== "pending",
  );
  return gateways.map((g) => ({
    kind: "file",
    id: `feedback-${g.id}`,
    name: `Feedback_gateway_${g.gateway_number}.docx`,
    icon: "📝",
    origin: "auto",
    created_at: new Date().toISOString(),
    author_name: null,
    can_regenerate: true,
  }));
}
