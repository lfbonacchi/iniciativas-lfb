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
  contentDataUrl?: string,
): Result<Document> {
  const parsed = uploadDocumentSchema.safeParse({
    initiativeId,
    stage,
    file,
    contentDataUrl,
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
    content_data_url: parsed.data.contentDataUrl,
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
  // Para manual_upload guardamos el data URL del contenido real.
  // Para el resto, la URL es lógica (generación on-demand desde forms).
  const url = doc.content_data_url ?? doc.file_path;
  return ok({ url, document: doc });
}

// ============================================================================
// Document tree — estructura de carpetas para el tab Documentos
// ============================================================================

export type DocNodeKind = "folder" | "file";
export type DocFileOrigin = "auto" | "manual";

// Origen de datos del archivo, usado por la UI para generar el XLSX/PDF al
// momento de descargar/previsualizar. Esta distinción reemplaza los binarios
// físicos que no existen en Fase 2-4.
export type DocFileSource =
  | { kind: "form_current"; form_id: Id; format: "xlsx" | "pdf" }
  | {
      kind: "form_snapshot";
      form_id: Id;
      snapshot_id: Id;
      snapshot_type: "submitted" | "final";
      format: "xlsx" | "pdf";
    }
  | { kind: "manual"; document_id: Id } // upload de usuario (stub en Fase 2-4)
  | {
      // DOCX de feedback de gateway: agrega todos los comentarios publicados
      // inline + bloque libre (feedback doc) del usuario.
      kind: "gateway_feedback";
      gateway_id: Id;
      user_id: Id;
      format: "xlsx" | "pdf" | "docx";
    }
  | {
      // Minuta de reunión del gateway (editable por PO/Scrum).
      kind: "gateway_minuta";
      gateway_id: Id;
      format: "xlsx" | "pdf" | "docx";
    }
  | { kind: "stub" };                    // notas de prensa pendientes

export interface DocFileNode {
  kind: "file";
  id: string;
  name: string;
  icon: string;
  origin: DocFileOrigin;
  created_at: string;
  author_name: string | null;
  can_regenerate: boolean;
  source: DocFileSource;
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

function buildFormFiles(
  store: Store,
  form: Form | undefined,
  fileStem: string, // "ETAPA_1_formulario" | "F4_formulario" ...
): { vf: DocFileNode[]; preGateway: DocFileNode[]; current: DocFileNode[]; history: DocFileNode[] } {
  if (!form) return { vf: [], preGateway: [], current: [], history: [] };

  const authorName = userName(store, form.created_by);
  const snapshots = store.form_snapshots
    .filter((s) => s.form_id === form.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const latestFinal = snapshots.find((s) => s.snapshot_type === "final") ?? null;
  const latestSubmitted =
    snapshots.find((s) => s.snapshot_type === "submitted") ?? null;

  const vf: DocFileNode[] = [];
  if (latestFinal) {
    const baseName = `VF${fileStem}`;
    vf.push(
      {
        kind: "file",
        id: `final-${latestFinal.id}-xlsx`,
        name: `${baseName}.xlsx`,
        icon: "📋",
        origin: "auto",
        created_at: latestFinal.created_at,
        author_name: authorName,
        can_regenerate: false,
        source: {
          kind: "form_snapshot",
          form_id: form.id,
          snapshot_id: latestFinal.id,
          snapshot_type: "final",
          format: "xlsx",
        },
      },
      {
        kind: "file",
        id: `final-${latestFinal.id}-pdf`,
        name: `${baseName}.pdf`,
        icon: "📄",
        origin: "auto",
        created_at: latestFinal.created_at,
        author_name: authorName,
        can_regenerate: false,
        source: {
          kind: "form_snapshot",
          form_id: form.id,
          snapshot_id: latestFinal.id,
          snapshot_type: "final",
          format: "pdf",
        },
      },
    );
  }

  const preGateway: DocFileNode[] = [];
  if (latestSubmitted) {
    const baseName = `${fileStem}_PRE-GATEWAY`;
    preGateway.push(
      {
        kind: "file",
        id: `submitted-${latestSubmitted.id}-xlsx`,
        name: `${baseName}.xlsx`,
        icon: "📋",
        origin: "auto",
        created_at: latestSubmitted.created_at,
        author_name: authorName,
        can_regenerate: false,
        source: {
          kind: "form_snapshot",
          form_id: form.id,
          snapshot_id: latestSubmitted.id,
          snapshot_type: "submitted",
          format: "xlsx",
        },
      },
      {
        kind: "file",
        id: `submitted-${latestSubmitted.id}-pdf`,
        name: `${baseName}.pdf`,
        icon: "📄",
        origin: "auto",
        created_at: latestSubmitted.created_at,
        author_name: authorName,
        can_regenerate: false,
        source: {
          kind: "form_snapshot",
          form_id: form.id,
          snapshot_id: latestSubmitted.id,
          snapshot_type: "submitted",
          format: "pdf",
        },
      },
    );
  }

  // Archivo activo: se genera on-demand con el estado actual del form.
  const current: DocFileNode[] = [
    {
      kind: "file",
      id: `current-${form.id}-xlsx`,
      name: `${fileStem}.xlsx`,
      icon: "📋",
      origin: "auto",
      created_at: form.updated_at,
      author_name: authorName,
      can_regenerate: true,
      source: { kind: "form_current", form_id: form.id, format: "xlsx" },
    },
    {
      kind: "file",
      id: `current-${form.id}-pdf`,
      name: `${fileStem}.pdf`,
      icon: "📄",
      origin: "auto",
      created_at: form.updated_at,
      author_name: authorName,
      can_regenerate: true,
      source: { kind: "form_current", form_id: form.id, format: "pdf" },
    },
  ];

  // Historial: snapshots anteriores que ya no son "el último de su tipo".
  const history: DocFileNode[] = [];
  const olderFinals = snapshots
    .filter((s) => s.snapshot_type === "final" && s.id !== latestFinal?.id)
    .map((s) => ({
      kind: "file" as const,
      id: `final-${s.id}-xlsx`,
      name: `VF${fileStem}_v${s.version_number}_${formatTimestampForFilename(s.created_at)}.xlsx`,
      icon: "📋",
      origin: "auto" as const,
      created_at: s.created_at,
      author_name: authorName,
      can_regenerate: false,
      source: {
        kind: "form_snapshot" as const,
        form_id: form.id,
        snapshot_id: s.id,
        snapshot_type: "final" as const,
        format: "xlsx" as const,
      },
    }));
  const olderSubmitted = snapshots
    .filter(
      (s) => s.snapshot_type === "submitted" && s.id !== latestSubmitted?.id,
    )
    .map((s) => ({
      kind: "file" as const,
      id: `submitted-${s.id}-xlsx`,
      name: `${fileStem}_PRE-GATEWAY_v${s.version_number}_${formatTimestampForFilename(s.created_at)}.xlsx`,
      icon: "📋",
      origin: "auto" as const,
      created_at: s.created_at,
      author_name: authorName,
      can_regenerate: false,
      source: {
        kind: "form_snapshot" as const,
        form_id: form.id,
        snapshot_id: s.id,
        snapshot_type: "submitted" as const,
        format: "xlsx" as const,
      },
    }));
  history.push(...olderFinals, ...olderSubmitted);

  return { vf, preGateway, current, history };
}

function formatTimestampForFilename(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
      d.getHours(),
    )}-${pad(d.getMinutes())}`;
  } catch {
    return iso.replace(/[:.]/g, "-");
  }
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
  const gateway = store.gateways.find(
    (g) =>
      g.initiative_id === initiativeId &&
      g.gateway_number === gatewayNumber,
  );
  const gatewayDone = gateway && gateway.status !== "pending";

  const authorId = form?.created_by ?? null;
  const authorName = userName(store, authorId);
  const dateIso = form ? isoForForm(form) : new Date().toISOString();

  const stageNumber = gatewayNumber; // 1 / 2 / 3
  const fileStem = `ETAPA_${stageNumber}_formulario`;
  const { vf, preGateway, current, history } = buildFormFiles(
    store,
    form,
    fileStem,
  );

  const children: DocTreeNode[] = [];
  // Orden: VF arriba, PRE-GATEWAY, archivo activo.
  children.push(...vf, ...preGateway, ...current);

  if (gatewayDone && gateway) {
    // Si hay minuta guardada, usamos sus timestamps y el source real para que
    // el preview/descarga produzca el DOCX de verdad. Si no, queda como stub.
    const minuta = store.gateway_minutas.find(
      (m) => m.gateway_id === gateway.id,
    );
    if (minuta) {
      const minutaAuthor = userName(store, minuta.created_by) ?? authorName;
      children.push({
        kind: "file",
        id: `minuta-${gateway.id}`,
        name: `Minuta_gateway_${gateway.gateway_number}.docx`,
        icon: "📝",
        origin: "auto",
        created_at: minuta.updated_at,
        author_name: minutaAuthor,
        can_regenerate: true,
        source: {
          kind: "gateway_minuta",
          gateway_id: gateway.id,
          format: "docx",
        },
      });
    } else {
      children.push({
        kind: "file",
        id: `minuta-${gateway.id}`,
        name: `Minuta_gateway_${gateway.gateway_number}.docx`,
        icon: "📝",
        origin: "auto",
        created_at: dateIso,
        author_name: authorName,
        can_regenerate: true,
        source: { kind: "stub" },
      });
    }
  }

  const manualDocs = store.documents.filter(
    (d) =>
      d.initiative_id === initiativeId &&
      d.stage === stage &&
      d.document_type === "manual_upload",
  );
  const additionalChildren: DocFileNode[] = [
    // Docs generados dinámicamente: feedback inline (por aprobador) y
    // feedback doc libre (por usuario) del gateway de esta etapa.
    ...buildStageFeedbackNodes(store, initiativeId, stage, gatewayNumber),
    ...manualDocs
      // Excluimos los registros que ya generamos dinámicamente arriba para
      // no duplicarlos (el publishSectionComments también los agrega a
      // store.documents como manual_upload con el mismo file_path).
      .filter((d) => !isFeedbackFilePath(d.file_path))
      .map<DocFileNode>((d) => ({
        kind: "file",
        id: d.id,
        name: d.file_path.split("/").pop() ?? "archivo",
        icon: iconForPath(d.file_path),
        origin: "manual",
        created_at: d.created_at,
        author_name: userName(store, d.generated_by),
        can_regenerate: false,
        source: { kind: "manual", document_id: d.id },
      })),
  ];

  if (history.length > 0) {
    children.push({
      kind: "folder",
      id: `${stage}-versiones-anteriores`,
      name: "versiones anteriores",
      icon: "📁",
      default_open: false,
      children: history,
    });
  }

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
      children: manualDocs.map<DocFileNode>((d) => ({
        kind: "file",
        id: d.id,
        name: d.file_path.split("/").pop() ?? "archivo",
        icon: iconForPath(d.file_path),
        origin: "manual",
        created_at: d.created_at,
        author_name: userName(store, d.generated_by),
        can_regenerate: false,
        source: { kind: "manual", document_id: d.id },
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
  const labelByType: Record<"F4" | "F5", string> = {
    F4: "F4 Visión Anual",
    F5: "F5 Planificación Anual",
  };
  const type = form.form_type as "F4" | "F5";
  const fileStem = `${type}_formulario`;
  const { vf, preGateway, current, history } = buildFormFiles(
    store,
    form,
    fileStem,
  );

  const children: DocTreeNode[] = [...vf, ...preGateway, ...current];

  if (history.length > 0) {
    children.push({
      kind: "folder",
      id: `ltp-form-${form.id}-versiones-anteriores`,
      name: "versiones anteriores",
      icon: "📁",
      default_open: false,
      children: history,
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

function isFeedbackFilePath(path: string): boolean {
  return /_feedback(E\d+)?\.docx$/i.test(path) ||
    /_feedbackform\.pdf$/i.test(path);
}

// Archivos de feedback (DOCX) de todos los aprobadores que comentaron,
// para el gateway de esta etapa. Se generan on-the-fly desde el store:
// - gateway_inline_comments (published) → un DOCX por usuario con todos sus
//   comentarios publicados
// - gateway_feedback_docs → el contenido libre que el usuario escribió en
//   el popup "Agregar feedback" del panel de documentos del gateway
function buildStageFeedbackNodes(
  store: Store,
  initiativeId: Id,
  stage: InitiativeStage,
  gatewayNumber: 1 | 2 | 3,
): DocFileNode[] {
  const gateway = store.gateways.find(
    (g) =>
      g.initiative_id === initiativeId && g.gateway_number === gatewayNumber,
  );
  if (!gateway) return [];

  const out: DocFileNode[] = [];

  // Un archivo por usuario que haya publicado comentarios inline. Agrupamos
  // por user_id. Filename: {nombre}_feedbackE{N}.docx
  const publishedByUser = new Map<
    Id,
    { latest: string; count: number }
  >();
  for (const c of store.gateway_inline_comments) {
    if (c.gateway_id !== gateway.id) continue;
    if (c.status !== "published") continue;
    const entry = publishedByUser.get(c.user_id);
    const latest = c.published_at ?? c.updated_at;
    if (!entry) {
      publishedByUser.set(c.user_id, { latest, count: 1 });
    } else {
      entry.count += 1;
      if (latest > entry.latest) entry.latest = latest;
    }
  }
  for (const [userId, info] of publishedByUser.entries()) {
    const u = store.users.find((uu) => uu.id === userId);
    const displayName = u?.display_name ?? "Usuario";
    const slug = displayName
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    const fileName = `${slug || "usuario"}_feedbackE${gatewayNumber}.docx`;
    out.push({
      kind: "file",
      id: `fb-inline-${gateway.id}-${userId}`,
      name: fileName,
      icon: "📝",
      origin: "auto",
      created_at: info.latest,
      author_name: displayName,
      can_regenerate: true,
      source: {
        kind: "gateway_feedback",
        gateway_id: gateway.id,
        user_id: userId,
        format: "pdf",
      },
    });
  }

  void stage;
  return out;
}

function buildGatewayFeedbackNodes(
  store: Store,
  initiativeId: Id,
): DocTreeNode[] {
  const gateways = store.gateways.filter(
    (g) => g.initiative_id === initiativeId && g.status !== "pending",
  );
  return gateways.map<DocFileNode>((g) => ({
    kind: "file",
    id: `feedback-${g.id}`,
    name: `Feedback_gateway_${g.gateway_number}.docx`,
    icon: "📝",
    origin: "auto",
    created_at: new Date().toISOString(),
    author_name: null,
    can_regenerate: true,
    source: { kind: "stub" },
  }));
}
