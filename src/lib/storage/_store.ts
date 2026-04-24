import type {
  AuditLog,
  Document,
  FileUpload,
  Form,
  FormChangeLog,
  FormDefinition,
  FormResponse,
  FormSnapshot,
  Gateway,
  GatewayVote,
  Id,
  Initiative,
  InitiativeFolder,
  InitiativeMember,
  MesaBloqueante,
  MesaBrainstormNote,
  MesaTemaPendiente,
  Notification,
  PortfolioEvent,
  User,
} from "@/types";
import { getSeedData } from "@/data/seed";

const STORE_KEY = "mandarina-portfolio-v1";
const LEGACY_STORE_KEY = "pae-portfolio-v1";

export interface Store {
  users: User[];
  initiatives: Initiative[];
  initiative_members: InitiativeMember[];
  initiative_folders: InitiativeFolder[];
  form_definitions: FormDefinition[];
  forms: Form[];
  form_responses: FormResponse[];
  form_change_log: FormChangeLog[];
  form_snapshots: FormSnapshot[];
  gateways: Gateway[];
  gateway_votes: GatewayVote[];
  notifications: Notification[];
  documents: Document[];
  file_uploads: FileUpload[];
  audit_log: AuditLog[];
  portfolio_events: PortfolioEvent[];
  mesa_bloqueantes: MesaBloqueante[];
  mesa_temas_pendientes: MesaTemaPendiente[];
  mesa_brainstorm_notes: MesaBrainstormNote[];
  form_comments: FormComment[];
  gateway_extra_approvers: GatewayExtraApprover[];
  gateway_feedback_docs: GatewayFeedbackDoc[];
  gateway_decisions: GatewayDecisionPending[];
  gateway_inline_comments: GatewayInlineComment[];
  gateway_minutas: GatewayMinuta[];
  gateway_revisions: GatewayRevision[];
  initiative_area_changes: InitiativeAreaChange[];
  current_user_id: Id | null;
}

// Cambio de área/VP de una iniciativa. La entrada más reciente por
// initiative_id determina el VP actual (override sobre el sponsor).
export interface InitiativeAreaChange {
  id: Id;
  initiative_id: Id;
  from_vp: string | null;
  to_vp: string;
  changed_by: Id;
  changed_at: string;
  reason: string | null;
}

// Comentario inline a nivel de campo en la vista read-only del gateway.
// status="draft" → solo lo ve el autor. status="published" → lo ven todos.
// Un usuario puede tener un comentario por campo; re-guardar reemplaza.
export interface GatewayInlineComment {
  id: Id;
  gateway_id: Id;
  user_id: Id;
  section_key: string;
  field_key: string;
  text: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// Minuta de reunión de gateway, editable por PO y Scrum.
// deadline_at = submitted_at (o approved_at) + 3 días.
export interface GatewayMinuta {
  id: Id;
  gateway_id: Id;
  initiative_id: Id;
  content: string;
  created_by: Id;
  created_at: string;
  updated_at: string;
  deadline_at: string;
}

// Tracking de revisiones: si el gateway pidió "necesita cambios" se
// encadena un nuevo gateway de la misma etapa con revision_number++.
export interface GatewayRevision {
  id: Id;
  initiative_id: Id;
  gateway_number: 1 | 2 | 3;
  revision_number: number;
  gateway_id: Id;
  created_at: string;
}

// Aprobadores agregados al gateway por AT/VP/PO/SM además de los
// aprobadores naturales (sponsor/bo/ld). Required = true suma al total
// de votos requerido para unanimidad; required = false es opcional
// (puede votar pero su voto no bloquea).
export interface GatewayExtraApprover {
  id: Id;
  gateway_id: Id;
  user_id: Id;
  required: boolean;
  added_by: Id;
  added_at: string;
}

// Documento de feedback que un usuario genera desde el gateway.
// Se guarda como DOCX lógico en "archivos adicionales" de la etapa/mes.
export interface GatewayFeedbackDoc {
  id: Id;
  gateway_id: Id;
  initiative_id: Id;
  user_id: Id;
  content: string;
  created_at: string;
  updated_at: string;
}

// Decisión de voto en ventana de 60 segundos para permitir undo.
// Si no se confirma/deshace en ese tiempo, al leerse se materializa.
export interface GatewayDecisionPending {
  id: Id;
  gateway_id: Id;
  user_id: Id;
  vote: string; // GatewayVoteValue
  feedback_text: string | null;
  created_at: string;
  expires_at: string;
}

export interface FormComment {
  id: Id;
  form_id: Id;
  user_id: Id;
  text: string;
  created_at: string;
}

function emptyStore(): Store {
  return {
    users: [],
    initiatives: [],
    initiative_members: [],
    initiative_folders: [],
    form_definitions: [],
    forms: [],
    form_responses: [],
    form_change_log: [],
    form_snapshots: [],
    gateways: [],
    gateway_votes: [],
    notifications: [],
    documents: [],
    file_uploads: [],
    audit_log: [],
    portfolio_events: [],
    mesa_bloqueantes: [],
    mesa_temas_pendientes: [],
    mesa_brainstorm_notes: [],
    form_comments: [],
    gateway_extra_approvers: [],
    gateway_feedback_docs: [],
    gateway_decisions: [],
    gateway_inline_comments: [],
    gateway_minutas: [],
    gateway_revisions: [],
    initiative_area_changes: [],
    current_user_id: null,
  };
}

function bootstrapStore(): Store {
  const seed = getSeedData();
  const store = emptyStore();
  store.users = seed.users;
  store.form_definitions = seed.form_definitions;
  return store;
}

export function seedStore(): Store {
  const seed = getSeedData();
  const current = isClient() ? readStore() : emptyStore();
  const next: Store = {
    users: seed.users,
    initiatives: seed.initiatives,
    initiative_members: seed.initiative_members,
    initiative_folders: seed.initiative_folders,
    form_definitions: seed.form_definitions,
    forms: seed.forms,
    form_responses: seed.form_responses,
    form_change_log: seed.form_change_log,
    form_snapshots: seed.form_snapshots,
    gateways: seed.gateways,
    gateway_votes: seed.gateway_votes,
    notifications: seed.notifications,
    documents: seed.documents,
    file_uploads: seed.file_uploads,
    audit_log: seed.audit_log,
    portfolio_events: current.portfolio_events,
    mesa_bloqueantes: current.mesa_bloqueantes,
    mesa_temas_pendientes: current.mesa_temas_pendientes,
    mesa_brainstorm_notes: current.mesa_brainstorm_notes,
    form_comments: current.form_comments ?? [],
    gateway_extra_approvers: current.gateway_extra_approvers ?? [],
    gateway_feedback_docs: current.gateway_feedback_docs ?? [],
    gateway_decisions: current.gateway_decisions ?? [],
    gateway_inline_comments: current.gateway_inline_comments ?? [],
    gateway_minutas: current.gateway_minutas ?? [],
    gateway_revisions: current.gateway_revisions ?? [],
    initiative_area_changes: current.initiative_area_changes ?? [],
    current_user_id: current.current_user_id,
  };
  writeStore(next);
  return next;
}

export function isClient(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function normalizeStore(raw: Partial<Store>): Store {
  const merged = { ...emptyStore(), ...raw } as Store;
  // Migración defensiva: eventos guardados antes de agregar attendance/status/original_date
  merged.portfolio_events = (merged.portfolio_events ?? []).map((e) => ({
    ...e,
    attendance: e.attendance ?? {},
    status: e.status ?? "scheduled",
    original_date: e.original_date ?? null,
  }));
  merged.mesa_bloqueantes = merged.mesa_bloqueantes ?? [];
  merged.mesa_temas_pendientes = merged.mesa_temas_pendientes ?? [];
  merged.mesa_brainstorm_notes = merged.mesa_brainstorm_notes ?? [];
  merged.form_comments = merged.form_comments ?? [];
  merged.gateway_extra_approvers = merged.gateway_extra_approvers ?? [];
  merged.gateway_feedback_docs = merged.gateway_feedback_docs ?? [];
  merged.gateway_decisions = merged.gateway_decisions ?? [];
  merged.gateway_inline_comments = merged.gateway_inline_comments ?? [];
  merged.gateway_minutas = merged.gateway_minutas ?? [];
  merged.gateway_revisions = merged.gateway_revisions ?? [];
  merged.initiative_area_changes = merged.initiative_area_changes ?? [];
  return merged;
}

export function readStore(): Store {
  if (!isClient()) return emptyStore();
  let raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    // Migración desde el prefijo anterior pae- → mandarina-
    const legacy = window.localStorage.getItem(LEGACY_STORE_KEY);
    if (legacy) {
      window.localStorage.setItem(STORE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_STORE_KEY);
      raw = legacy;
    }
  }
  if (!raw) {
    const seeded = bootstrapStore();
    writeStore(seeded);
    return seeded;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Store inválido");
    }
    return normalizeStore(parsed as Partial<Store>);
  } catch {
    const seeded = bootstrapStore();
    writeStore(seeded);
    return seeded;
  }
}

export function writeStore(store: Store): void {
  if (!isClient()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  // Sync to DB in background — fire and forget
  if (typeof fetch !== "undefined") {
    fetch("/api/store/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    }).catch(() => {
      // Silently ignore sync errors — data is safe in localStorage
    });
  }
}

export function resetStore(): void {
  if (!isClient()) return;
  window.localStorage.removeItem(STORE_KEY);
  window.localStorage.removeItem(LEGACY_STORE_KEY);
}
