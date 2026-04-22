import type {
  Form,
  FormStatus,
  FormType,
  Id,
  LtpPeriod,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";

import { readStore, type Store } from "./_store";
import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
} from "./_security";

export type FolderTone = "complete" | "active" | "locked";

export interface SectionStatus {
  number: number;
  title: string;
  is_complete: boolean;
}

export interface FormInstanceView {
  form_id: Id | null;
  year: number | null;
  ltp_period: LtpPeriod | null;
  cycle_label: string | null;
  full_title: string;
  status: FormStatus | "not_started";
  status_label: string;
  status_tone: "complete" | "in_progress" | "locked" | "review" | "not_started";
  completeness: {
    percent: number;
    completed_count: number;
    total_count: number;
  };
  last_editor_name: string | null;
  last_edited_label: string | null;
  sections: SectionStatus[];
  is_read_only: boolean;
  action_hint: string;
}

export interface FormFolderCard {
  form_type: FormType;
  short_title: string;
  subtitle: string;
  state: FolderTone;
  required_gateway_label: string | null;
  is_cyclic: boolean;
  years_available: number[];
  default_year: number | null;
  instances_by_year: Record<string, FormInstanceView>;
  default_instance: FormInstanceView | null;
  total_sections: number;
}

export interface FormsTabPermissions {
  editors: string[];
  commenters: string[];
  approvers: string[];
}

export interface FormsTabData {
  initiative_id: Id;
  initiative_name: string;
  folders: FormFolderCard[];
  active_folder_type: FormType;
  permissions: FormsTabPermissions;
}

interface SectionDef {
  number: number;
  title: string;
}

const SECTIONS: Record<FormType, SectionDef[]> = {
  F1: [
    { number: 1, title: "Información general" },
    { number: 2, title: "Propósito" },
    { number: 3, title: "Necesidad u oportunidad" },
    { number: 4, title: "Alineación estratégica" },
    { number: 5, title: "Descripción de la iniciativa" },
    { number: 6, title: "Impacto económico — corrientes de valor" },
    { number: 7, title: "Gestión del cambio" },
    { number: 8, title: "Journey e hitos" },
    { number: 9, title: "Equipo" },
  ],
  F2: [
    { number: 1, title: "Información general" },
    { number: 2, title: "Síntesis de la necesidad" },
    { number: 3, title: "Procesos as-is / to-be" },
    { number: 4, title: "Alternativas evaluadas" },
    { number: 5, title: "Descripción de la solución" },
    { number: 6, title: "Topología del equipo" },
    { number: 7, title: "Consideraciones digitales" },
    { number: 8, title: "Gestión del cambio detallada" },
    { number: 9, title: "Costos OPEX / CAPEX" },
    { number: 10, title: "Corrientes de valor a 5 años" },
    { number: 11, title: "Journey actualizado" },
    { number: 12, title: "Riesgos y dependencias" },
  ],
  F3: [
    { number: 1, title: "Información general" },
    { number: 2, title: "Propósito" },
    { number: 3, title: "Necesidad, oportunidad y prioridad" },
    { number: 4, title: "Alineación estratégica" },
    { number: 5, title: "Descripción de la solución" },
    { number: 6, title: "Descripción del MVP" },
    { number: 7, title: "Conformación del equipo de desarrollo" },
    { number: 8, title: "Consideraciones digitales" },
    { number: 9, title: "Gestión del cambio" },
    { number: 10, title: "Costo de desarrollo y operación" },
    { number: 11, title: "Impacto económico / estratégico" },
    { number: 12, title: "Equipo" },
  ],
  F4: [
    { number: 1, title: "Información general" },
    { number: 2, title: "Propósito" },
    { number: 3, title: "Necesidad y/o oportunidad" },
    { number: 4, title: "Prioridades estratégicas del año" },
    { number: 5, title: "Descripción de la solución a desarrollar" },
    { number: 6, title: "Planificación de la implementación" },
    { number: 7, title: "Costo de desarrollo y operación" },
    { number: 8, title: "Impacto económico" },
  ],
  F5: [
    { number: 1, title: "Información general" },
    { number: 2, title: "Propósito" },
    { number: 3, title: "Necesidad y/o oportunidad" },
    { number: 4, title: "Prioridades estratégicas" },
    { number: 5, title: "Descripción solución a desarrollar" },
    { number: 6, title: "Indicadores de seguimiento" },
    { number: 7, title: "Planificación de la implementación" },
    { number: 8, title: "Costo de desarrollo y operación" },
    { number: 9, title: "Impacto económico" },
  ],
};

const FORM_TITLE: Record<FormType, { short: string; subtitle: string }> = {
  F1: { short: "F1", subtitle: "Propuesta" },
  F2: { short: "F2", subtitle: "Dimensionamiento" },
  F3: { short: "F3", subtitle: "MVP" },
  F4: { short: "F4", subtitle: "Visión LTP" },
  F5: { short: "F5", subtitle: "Plan Anual" },
};

const FORM_ORDER: FormType[] = ["F1", "F2", "F3", "F4", "F5"];

const STATUS_LABEL: Record<FormStatus | "not_started", string> = {
  draft: "En borrador",
  submitted: "Enviado",
  in_review: "En revisión",
  approved: "Aprobado",
  final: "Versión final",
  reviewed: "Revisado",
  closed: "Cerrado",
  not_started: "No iniciado",
};

const STATUS_TONE: Record<
  FormStatus | "not_started",
  "complete" | "in_progress" | "locked" | "review" | "not_started"
> = {
  draft: "in_progress",
  submitted: "review",
  in_review: "review",
  approved: "complete",
  final: "complete",
  reviewed: "complete",
  closed: "complete",
  not_started: "not_started",
};

function countResponses(store: Store, formId: Id): number {
  return store.form_responses.reduce(
    (acc, r) => (r.form_id === formId ? acc + 1 : acc),
    0,
  );
}

function buildSections(
  formType: FormType,
  form: Form | null,
  store: Store,
): SectionStatus[] {
  const defs = SECTIONS[formType];
  const responsesCount = form ? countResponses(store, form.id) : 0;
  const complete = form?.status === "approved" ||
    form?.status === "final" ||
    form?.status === "reviewed" ||
    form?.status === "closed";
  const completedCount = complete
    ? defs.length
    : Math.min(responsesCount, defs.length);
  return defs.map((s) => ({
    number: s.number,
    title: s.title,
    is_complete: s.number <= completedCount,
  }));
}

function computeCompleteness(sections: SectionStatus[]): {
  percent: number;
  completed_count: number;
  total_count: number;
} {
  const total = sections.length;
  const done = sections.filter((s) => s.is_complete).length;
  return {
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    completed_count: done,
    total_count: total,
  };
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function userName(store: Store, userId: Id | null | undefined): string | null {
  if (!userId || userId === "system") return null;
  const u = store.users.find((uu) => uu.id === userId);
  return u?.display_name ?? null;
}

function lastEditorOfForm(
  store: Store,
  formId: Id,
  fallbackUserId: Id,
  fallbackIso: string,
): { name: string | null; date_label: string | null } {
  const logs = store.form_change_log
    .filter((l) => l.form_id === formId && l.changed_by !== "system")
    .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  const last = logs[0];
  if (last) {
    return {
      name: userName(store, last.changed_by),
      date_label: formatDate(last.changed_at),
    };
  }
  return {
    name: userName(store, fallbackUserId),
    date_label: formatDate(fallbackIso),
  };
}

function parseYear(period: LtpPeriod | null): number | null {
  if (!period) return null;
  const match = /^\d{2}-(\d{4})$/.exec(period);
  if (!match) return null;
  const y = parseInt(match[1] ?? "", 10);
  return Number.isFinite(y) ? y : null;
}

function emptyInstance(formType: FormType, year: number | null): FormInstanceView {
  const sections = SECTIONS[formType].map((s) => ({
    number: s.number,
    title: s.title,
    is_complete: false,
  }));
  const titleBase = `${FORM_TITLE[formType].short} — ${FORM_TITLE[formType].subtitle}`;
  const full_title = year != null ? `${titleBase} ${year}` : titleBase;
  return {
    form_id: null,
    year,
    ltp_period: null,
    cycle_label: year != null ? `Ciclo ${year}` : null,
    full_title,
    status: "not_started",
    status_label: STATUS_LABEL.not_started,
    status_tone: "not_started",
    completeness: computeCompleteness(sections),
    last_editor_name: null,
    last_edited_label: null,
    sections,
    is_read_only: false,
    action_hint: "Iniciar formulario",
  };
}

function buildInstance(
  form: Form,
  store: Store,
  isReadOnly: boolean,
): FormInstanceView {
  const sections = buildSections(form.form_type, form, store);
  const completeness = computeCompleteness(sections);
  const year = parseYear(form.ltp_period);
  const titleBase = `${FORM_TITLE[form.form_type].short} — ${FORM_TITLE[form.form_type].subtitle}`;
  const full_title = year != null ? `${titleBase} ${year}` : titleBase;
  const editor = lastEditorOfForm(
    store,
    form.id,
    form.created_by,
    form.updated_at,
  );
  const isClosed =
    form.status === "approved" ||
    form.status === "final" ||
    form.status === "reviewed" ||
    form.status === "closed";
  const actionHint = isClosed || isReadOnly
    ? "Ver en modo lectura"
    : "Continuar edición";
  return {
    form_id: form.id,
    year,
    ltp_period: form.ltp_period,
    cycle_label: year != null ? `Ciclo ${year}` : null,
    full_title,
    status: form.status,
    status_label: STATUS_LABEL[form.status],
    status_tone: STATUS_TONE[form.status],
    completeness,
    last_editor_name: editor.name,
    last_edited_label: editor.date_label,
    sections,
    is_read_only: isReadOnly,
    action_hint: actionHint,
  };
}

function previousFormApproved(
  store: Store,
  initiativeId: Id,
  prevType: FormType,
): boolean {
  return store.forms.some(
    (f) =>
      f.initiative_id === initiativeId &&
      f.form_type === prevType &&
      (f.status === "approved" ||
        f.status === "final" ||
        f.status === "closed"),
  );
}

function buildLinearFolder(
  store: Store,
  initiativeId: Id,
  formType: FormType,
): FormFolderCard {
  const form =
    store.forms.find(
      (f) => f.initiative_id === initiativeId && f.form_type === formType,
    ) ?? null;

  let locked = false;
  let requiredGatewayLabel: string | null = null;
  if (formType === "F2") {
    locked = !previousFormApproved(store, initiativeId, "F1");
    if (locked) requiredGatewayLabel = "Post Gateway 1";
  } else if (formType === "F3") {
    locked = !previousFormApproved(store, initiativeId, "F2");
    if (locked) requiredGatewayLabel = "Post Gateway 2";
  }

  const instance = form
    ? buildInstance(form, store, false)
    : emptyInstance(formType, null);

  let state: FolderTone = "active";
  if (locked && !form) {
    state = "locked";
  } else if (
    form &&
    (form.status === "approved" ||
      form.status === "final" ||
      form.status === "closed")
  ) {
    state = "complete";
  } else if (form) {
    state = "active";
  } else {
    state = "locked";
  }

  return {
    form_type: formType,
    short_title: FORM_TITLE[formType].short,
    subtitle: FORM_TITLE[formType].subtitle,
    state,
    required_gateway_label: requiredGatewayLabel,
    is_cyclic: false,
    years_available: [],
    default_year: null,
    instances_by_year: {},
    default_instance: instance,
    total_sections: SECTIONS[formType].length,
  };
}

function buildCyclicFolder(
  store: Store,
  initiativeId: Id,
  formType: "F4" | "F5",
): FormFolderCard {
  const existing = store.forms.filter(
    (f) => f.initiative_id === initiativeId && f.form_type === formType,
  );

  const yearMap = new Map<number, Form>();
  for (const f of existing) {
    const y = parseYear(f.ltp_period);
    if (y == null) continue;
    const prior = yearMap.get(y);
    if (!prior || f.updated_at > prior.updated_at) {
      yearMap.set(y, f);
    }
  }

  const years = Array.from(yearMap.keys()).sort((a, b) => b - a);

  let locked = false;
  let requiredLabel: string | null = null;
  if (existing.length === 0) {
    if (formType === "F4") {
      const ini = store.initiatives.find((i) => i.id === initiativeId);
      const inLtp = ini?.current_stage === "ltp_tracking";
      const f3Approved = previousFormApproved(store, initiativeId, "F3");
      if (!inLtp && !f3Approved) {
        locked = true;
        requiredLabel = "Post Gateway 3";
      }
    } else {
      const f4Any = store.forms.some(
        (f) => f.initiative_id === initiativeId && f.form_type === "F4",
      );
      if (!f4Any) {
        locked = true;
        requiredLabel = "Requiere F4";
      }
    }
  }

  const instancesByYear: Record<string, FormInstanceView> = {};
  const currentYear = new Date().getFullYear();

  for (const y of years) {
    const form = yearMap.get(y)!;
    const isLatestYear = y === years[0];
    const isClosed =
      form.status === "approved" ||
      form.status === "final" ||
      form.status === "reviewed" ||
      form.status === "closed";
    const isReadOnly = !isLatestYear || isClosed;
    instancesByYear[String(y)] = buildInstance(form, store, isReadOnly);
  }

  let defaultYear: number | null = null;
  if (years.length > 0) {
    const inProgress = years.find((y) => {
      const f = yearMap.get(y);
      return (
        f &&
        (f.status === "draft" ||
          f.status === "submitted" ||
          f.status === "in_review")
      );
    });
    defaultYear = inProgress ?? years[0] ?? null;
  } else if (!locked) {
    defaultYear = currentYear;
    instancesByYear[String(currentYear)] = emptyInstance(formType, currentYear);
  }

  const defaultInstance =
    defaultYear != null ? instancesByYear[String(defaultYear)] ?? null : null;

  let state: FolderTone = "active";
  if (locked) {
    state = "locked";
  } else {
    const hasOpen = Object.values(instancesByYear).some(
      (i) => i.status_tone === "in_progress" || i.status_tone === "review",
    );
    const allComplete =
      Object.keys(instancesByYear).length > 0 &&
      Object.values(instancesByYear).every((i) => i.status_tone === "complete");
    if (hasOpen) state = "active";
    else if (allComplete) state = "complete";
    else state = "active";
  }

  return {
    form_type: formType,
    short_title: FORM_TITLE[formType].short,
    subtitle: FORM_TITLE[formType].subtitle,
    state,
    required_gateway_label: requiredLabel,
    is_cyclic: true,
    years_available: years.length > 0 ? years : defaultYear != null ? [defaultYear] : [],
    default_year: defaultYear,
    instances_by_year: instancesByYear,
    default_instance: defaultInstance,
    total_sections: SECTIONS[formType].length,
  };
}

function resolveActiveFolder(folders: FormFolderCard[]): FormType {
  const firstInProgress = folders.find(
    (f) => f.default_instance?.status_tone === "in_progress" ||
      f.default_instance?.status_tone === "review",
  );
  if (firstInProgress) return firstInProgress.form_type;
  const firstNotStarted = folders.find(
    (f) =>
      f.state !== "locked" &&
      f.default_instance?.status_tone === "not_started",
  );
  if (firstNotStarted) return firstNotStarted.form_type;
  const lastComplete = [...folders]
    .reverse()
    .find((f) => f.state === "complete");
  if (lastComplete) return lastComplete.form_type;
  return "F1";
}

function buildPermissions(
  store: Store,
  initiativeId: Id,
): FormsTabPermissions {
  const members = store.initiative_members.filter(
    (m) => m.initiative_id === initiativeId,
  );

  const editors: string[] = [];
  const commenters: string[] = [];
  const approvers: string[] = [];

  for (const m of members) {
    const u = store.users.find((uu) => uu.id === m.user_id);
    if (!u) continue;
    const label = `${u.display_name} (${roleLabel(m.role)})`;
    if (["po", "promotor", "ld", "sm", "equipo"].includes(m.role)) {
      if (m.role === "equipo" && !m.can_edit) continue;
      editors.push(label);
    }
    if (["sponsor", "bo"].includes(m.role)) {
      commenters.push(label);
    }
    if (["bo", "sponsor", "ld"].includes(m.role)) {
      approvers.push(label);
    }
  }

  return { editors, commenters, approvers };
}

function roleLabel(role: string): string {
  switch (role) {
    case "po":
      return "PO";
    case "promotor":
      return "Promotor";
    case "ld":
      return "LD";
    case "bo":
      return "BO";
    case "sponsor":
      return "Sponsor";
    case "sm":
      return "SM";
    case "equipo":
      return "Equipo";
    default:
      return role;
  }
}

export function getFormsTabData(initiativeId: Id): Result<FormsTabData> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const folders: FormFolderCard[] = FORM_ORDER.map((t) =>
    t === "F4" || t === "F5"
      ? buildCyclicFolder(store, initiativeId, t)
      : buildLinearFolder(store, initiativeId, t),
  );

  const activeType = resolveActiveFolder(folders);

  return ok({
    initiative_id: initiativeId,
    initiative_name: initiative.name,
    folders,
    active_folder_type: activeType,
    permissions: buildPermissions(store, initiativeId),
  });
}
