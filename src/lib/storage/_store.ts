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
  Notification,
  PortfolioEvent,
  User,
} from "@/types";
import { getSeedData } from "@/data/seed";

const STORE_KEY = "pae-portfolio-v1";

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
  current_user_id: Id | null;
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
  return merged;
}

export function readStore(): Store {
  if (!isClient()) return emptyStore();
  const raw = window.localStorage.getItem(STORE_KEY);
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
}
