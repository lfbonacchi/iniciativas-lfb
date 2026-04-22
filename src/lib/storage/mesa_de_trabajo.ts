import type {
  AdoptionTrend,
  Id,
  MesaBloqueante,
  MesaBrainstormNote,
  MesaTemaPendiente,
  User,
} from "@/types";
import type { ImpactIndicator } from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { getInitiativeSummary } from "@/data/initiative_summaries";

import { newId, nowIso } from "./_ids";
import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
} from "./_security";
import { readStore, writeStore, type Store } from "./_store";

export interface MesaKpiRow {
  key: string;
  indicator: string;
  target: string;
  actual: string;
  trend: AdoptionTrend;
  trend_label: string;
}

export interface MesaAvanceRow {
  indicator: string;
  target: string;
  actual: string;
  percent: number | null;
}

export interface MesaBloqueanteRow extends MesaBloqueante {
  involucrados_names: string[];
}

export interface MesaDeTrabajo {
  initiative_id: Id;
  can_edit: boolean;
  kpis: MesaKpiRow[];
  avance: MesaAvanceRow[];
  bloqueantes: MesaBloqueanteRow[];
  temas_pendientes: MesaTemaPendiente[];
  brainstorm: MesaBrainstormNote | null;
  available_users: { id: Id; display_name: string }[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

function parseNumeric(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!cleaned) return null;
  const n = parseFloat(cleaned[0]);
  return Number.isFinite(n) ? n : null;
}

function inferTrend(target: string, actual: string | null): AdoptionTrend {
  if (!actual || actual === "—") return "flat";
  const t = parseNumeric(target);
  const a = parseNumeric(actual);
  if (t === null || a === null) return "flat";
  if (t === 0) return a === 0 ? "done" : "up";
  const ratio = a / t;
  if (ratio >= 1) return "done";
  if (ratio >= 0.5) return "up";
  return "flat";
}

const TREND_LABEL: Record<AdoptionTrend, string> = {
  up: "↑ mejorando",
  flat: "→ estable",
  down: "↓ bajando",
  done: "✓ alcanzado",
};

function kpisFromImpactIndicators(
  indicators: readonly ImpactIndicator[],
): MesaKpiRow[] {
  return indicators.map((ind) => ({
    key: slugify(ind.indicator) || `kpi_${ind.priority}`,
    indicator: ind.indicator,
    target: ind.target,
    actual: ind.actual ?? "—",
    trend: inferTrend(ind.target, ind.actual),
    trend_label: TREND_LABEL[inferTrend(ind.target, ind.actual)],
  }));
}

function avanceFromAdoption(
  rows: readonly {
    indicator: string;
    target: string;
    actual: string;
  }[],
): MesaAvanceRow[] {
  return rows.map((r) => {
    const t = parseNumeric(r.target);
    const a = parseNumeric(r.actual);
    const percent =
      t !== null && a !== null && t !== 0
        ? Math.min(100, Math.max(0, Math.round((a / t) * 100)))
        : null;
    return {
      indicator: r.indicator,
      target: r.target,
      actual: r.actual,
      percent,
    };
  });
}

function hydrateBloqueantes(
  list: readonly MesaBloqueante[],
  users: readonly User[],
): MesaBloqueanteRow[] {
  return list.map((b) => ({
    ...b,
    involucrados_names: b.involucrados
      .map((uid) => users.find((u) => u.id === uid)?.display_name ?? null)
      .filter((x): x is string => x !== null),
  }));
}

export function getMesaDeTrabajo(
  initiativeId: Id,
): Result<MesaDeTrabajo> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  const summary = getInitiativeSummary(initiativeId);
  if (!summary) {
    return err("NOT_FOUND", "No hay resumen disponible para esta iniciativa");
  }

  const bloqueantes = store.mesa_bloqueantes
    .filter((b) => b.initiative_id === initiativeId)
    .sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
      return a.created_at.localeCompare(b.created_at);
    });

  const temas = store.mesa_temas_pendientes
    .filter((t) => t.initiative_id === initiativeId)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.created_at.localeCompare(b.created_at);
    });

  const brainstorm =
    store.mesa_brainstorm_notes.find(
      (n) => n.initiative_id === initiativeId,
    ) ?? null;

  const available_users = [...store.users]
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .map((u) => ({ id: u.id, display_name: u.display_name }));

  const mesa: MesaDeTrabajo = {
    initiative_id: initiativeId,
    can_edit: true,
    kpis: kpisFromImpactIndicators(summary.impact_indicators),
    avance: avanceFromAdoption(summary.adoption_indicators),
    bloqueantes: hydrateBloqueantes(bloqueantes, store.users),
    temas_pendientes: temas,
    brainstorm,
    available_users,
  };
  return ok(mesa);
}

function guardAccess(
  initiativeId: Id,
  store: Store,
): Result<User> {
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }
  return ok(user);
}

export function addBloqueante(input: {
  initiative_id: Id;
  name: string;
  involucrados: Id[];
  is_priority: boolean;
}): Result<MesaBloqueante> {
  const name = input.name.trim();
  if (!name) return err("VALIDATION_ERROR", "El nombre es obligatorio");
  if (name.length > 200) {
    return err("VALIDATION_ERROR", "El nombre es demasiado largo");
  }
  const store = readStore();
  const auth = guardAccess(input.initiative_id, store);
  if (!auth.success) return auth;

  const validInvolucrados = input.involucrados.filter((uid) =>
    store.users.some((u) => u.id === uid),
  );

  const bloqueante: MesaBloqueante = {
    id: newId("bloq"),
    initiative_id: input.initiative_id,
    name,
    involucrados: validInvolucrados,
    is_priority: input.is_priority,
    resolved: false,
    created_at: nowIso(),
    created_by: auth.data.id,
  };
  store.mesa_bloqueantes.push(bloqueante);
  writeStore(store);
  return ok(bloqueante);
}

export function toggleBloqueanteResolved(
  bloqueanteId: Id,
): Result<MesaBloqueante> {
  const store = readStore();
  const bloq = store.mesa_bloqueantes.find((b) => b.id === bloqueanteId);
  if (!bloq) return err("NOT_FOUND", "Bloqueante no encontrado");
  const auth = guardAccess(bloq.initiative_id, store);
  if (!auth.success) return auth;
  bloq.resolved = !bloq.resolved;
  writeStore(store);
  return ok(bloq);
}

export function addTemaPendiente(input: {
  initiative_id: Id;
  text: string;
}): Result<MesaTemaPendiente> {
  const text = input.text.trim();
  if (!text) return err("VALIDATION_ERROR", "El tema no puede estar vacío");
  if (text.length > 200) {
    return err("VALIDATION_ERROR", "El tema es demasiado largo");
  }
  const store = readStore();
  const auth = guardAccess(input.initiative_id, store);
  if (!auth.success) return auth;

  const tema: MesaTemaPendiente = {
    id: newId("tema"),
    initiative_id: input.initiative_id,
    text,
    done: false,
    created_at: nowIso(),
    created_by: auth.data.id,
  };
  store.mesa_temas_pendientes.push(tema);
  writeStore(store);
  return ok(tema);
}

export function toggleTemaPendiente(
  temaId: Id,
): Result<MesaTemaPendiente> {
  const store = readStore();
  const tema = store.mesa_temas_pendientes.find((t) => t.id === temaId);
  if (!tema) return err("NOT_FOUND", "Tema no encontrado");
  const auth = guardAccess(tema.initiative_id, store);
  if (!auth.success) return auth;
  tema.done = !tema.done;
  writeStore(store);
  return ok(tema);
}

export function saveBrainstormNote(input: {
  initiative_id: Id;
  content: string;
}): Result<MesaBrainstormNote> {
  if (input.content.length > 50000) {
    return err("VALIDATION_ERROR", "La nota es demasiado larga");
  }
  const store = readStore();
  const auth = guardAccess(input.initiative_id, store);
  if (!auth.success) return auth;

  const existing = store.mesa_brainstorm_notes.find(
    (n) => n.initiative_id === input.initiative_id,
  );
  const now = nowIso();
  if (existing) {
    existing.content = input.content;
    existing.updated_at = now;
    existing.updated_by = auth.data.id;
    writeStore(store);
    return ok(existing);
  }
  const note: MesaBrainstormNote = {
    initiative_id: input.initiative_id,
    content: input.content,
    updated_at: now,
    updated_by: auth.data.id,
  };
  store.mesa_brainstorm_notes.push(note);
  writeStore(store);
  return ok(note);
}
