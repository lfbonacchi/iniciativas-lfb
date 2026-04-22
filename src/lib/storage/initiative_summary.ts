import type {
  AdoptionIndicator,
  BudgetLine,
  Deliverable,
  Id,
  ImpactIndicator,
  InitiativeSummary,
  Interdependency,
  ValueStream5YearRow,
} from "@/types";
import { SUMMARY_KEYS } from "@/data/summary_to_responses";

import type { Store } from "./_store";
import { getCorrientesRows, pickYearCell } from "./financials";

function readAll(store: Store, initiativeId: Id, fieldKey: string): unknown[] {
  const formIds = new Set(
    store.forms
      .filter((f) => f.initiative_id === initiativeId)
      .map((f) => f.id),
  );
  return store.form_responses
    .filter((r) => formIds.has(r.form_id) && r.field_key === fieldKey)
    .map((r) => r.value);
}

function readLatest(
  store: Store,
  initiativeId: Id,
  fieldKey: string,
): unknown {
  const formIds = new Set(
    store.forms
      .filter((f) => f.initiative_id === initiativeId)
      .map((f) => f.id),
  );
  const forms = store.forms
    .filter((f) => f.initiative_id === initiativeId)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  for (const form of forms) {
    const r = store.form_responses.find(
      (r) => r.form_id === form.id && r.field_key === fieldKey,
    );
    if (r !== undefined) return r.value;
  }
  // Unused but keeps the set logic if we ever drop the sort.
  void formIds;
  return undefined;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function fmtYearCell(raw: unknown): string {
  if (raw === undefined || raw === null) return "—";
  if (typeof raw === "number") return raw.toString();
  if (typeof raw === "string") {
    const s = raw.trim();
    return s.length > 0 ? s : "—";
  }
  return "—";
}

// Deriva la tabla "Corrientes de valor — 5 años" desde las respuestas del form,
// tomando año 1, 3 y 5 de la misma fila. Si no hay rows con año cargado, se
// usa el valor que venga en SUMMARY_KEYS.value_streams_5y (fallback legacy).
function deriveValueStreams5y(
  store: Store,
  initiativeId: string,
): ValueStream5YearRow[] | null {
  const rows = getCorrientesRows(store, initiativeId);
  if (rows.length === 0) return null;
  const out: ValueStream5YearRow[] = [];
  for (const row of rows) {
    const stream = String(row.corriente ?? row.subcategoria ?? "").trim();
    if (!stream) continue;
    out.push({
      stream,
      year_1: fmtYearCell(pickYearCell(row, 1)),
      year_3: fmtYearCell(pickYearCell(row, 3)),
      year_5: fmtYearCell(pickYearCell(row, 5)),
    });
  }
  return out.length > 0 ? out : null;
}

// Lee el resumen de una iniciativa desde form_responses. Todo el detalle
// (purpose, corrientes 5 años, indicadores, desafíos, etc.) vive en las
// respuestas del form, no en un archivo hardcoded.
export function computeInitiativeSummary(
  store: Store,
  initiativeId: Id,
): InitiativeSummary | null {
  const iniForms = store.forms.filter((f) => f.initiative_id === initiativeId);
  if (iniForms.length === 0) return null;

  const derivedStreams = deriveValueStreams5y(store, initiativeId);

  return {
    initiative_id: initiativeId,
    purpose: asString(readLatest(store, initiativeId, SUMMARY_KEYS.purpose)),
    value_streams_5y:
      derivedStreams ??
      asArray<ValueStream5YearRow>(
        readLatest(store, initiativeId, SUMMARY_KEYS.value_streams_5y),
      ),
    impact_indicators: asArray<ImpactIndicator>(
      readLatest(store, initiativeId, SUMMARY_KEYS.impact_indicators),
    ),
    challenges: asStringArray(
      readLatest(store, initiativeId, SUMMARY_KEYS.challenges),
    ),
    interdependencies: asArray<Interdependency>(
      readLatest(store, initiativeId, SUMMARY_KEYS.interdependencies),
    ),
    deliverables: asArray<Deliverable>(
      readLatest(store, initiativeId, SUMMARY_KEYS.deliverables),
    ),
    adoption_indicators: asArray<AdoptionIndicator>(
      readLatest(store, initiativeId, SUMMARY_KEYS.adoption_indicators),
    ),
    budget_opex: asArray<BudgetLine>(
      readLatest(store, initiativeId, SUMMARY_KEYS.budget_opex),
    ),
    budget_capex: asArray<BudgetLine>(
      readLatest(store, initiativeId, SUMMARY_KEYS.budget_capex),
    ),
  };
}

export function computeAllSummaries(store: Store): InitiativeSummary[] {
  return store.initiatives
    .map((i) => computeInitiativeSummary(store, i.id))
    .filter((s): s is InitiativeSummary => s !== null);
}

// Evita warning TS por `readAll` si no se usa aún (expuesto para extensiones).
void readAll;
