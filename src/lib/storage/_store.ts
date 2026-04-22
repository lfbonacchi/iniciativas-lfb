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
  current_user_id: Id | null;
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
}

export function resetStore(): void {
  if (!isClient()) return;
  window.localStorage.removeItem(STORE_KEY);
  window.localStorage.removeItem(LEGACY_STORE_KEY);
}
