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
  User,
} from "@/types";

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
    current_user_id: null,
  };
}

function bootstrapStore(): Store {
  const store = emptyStore();
  const users: User[] = [
    {
      id: "u-po",
      azure_oid: null,
      email: "ana.po@pae.com",
      display_name: "Ana Pérez (PO)",
      job_title: "Product Owner",
      department: "Transformación Digital",
      vicepresidencia: "Operaciones Upstream",
      global_role: "user",
      is_vp: false,
    },
    {
      id: "u-bo",
      azure_oid: null,
      email: "luis.bo@pae.com",
      display_name: "Luis García (BO)",
      job_title: "Gerente de Operaciones",
      department: "Operaciones",
      vicepresidencia: "Operaciones Upstream",
      global_role: "user",
      is_vp: false,
    },
    {
      id: "u-vp",
      azure_oid: null,
      email: "sara.vp@pae.com",
      display_name: "Sara Méndez (VP)",
      job_title: "VP Operaciones Upstream",
      department: "Operaciones",
      vicepresidencia: "Operaciones Upstream",
      global_role: "user",
      is_vp: true,
    },
    {
      id: "u-at",
      azure_oid: null,
      email: "marcos.at@pae.com",
      display_name: "Marcos Romero (AT)",
      job_title: "Gerente Transformación Digital",
      department: "Transformación Digital",
      vicepresidencia: "Transformación Digital",
      global_role: "area_transformacion",
      is_vp: false,
    },
  ];
  store.users = users;
  store.current_user_id = users[0]?.id ?? null;
  return store;
}

export function isClient(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
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
    return { ...emptyStore(), ...(parsed as Partial<Store>) } as Store;
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
