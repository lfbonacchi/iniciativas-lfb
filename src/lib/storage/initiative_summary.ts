import type {
  AdoptionIndicator,
  AdoptionTrend,
  BudgetLine,
  Deliverable,
  Form,
  FormResponse,
  Id,
  ImpactIndicator,
  InitiativeSummary,
  Interdependency,
  ValueStream5YearRow,
} from "@/types";
import { SUMMARY_KEYS } from "@/data/summary_to_responses";

import type { Store } from "./_store";
import { getCorrientesRows, pickYearCell } from "./financials";

// ---------------------------------------------------------------------------
// Helpers genéricos
// ---------------------------------------------------------------------------

function formsFor(store: Store, initiativeId: Id): Form[] {
  return store.forms.filter((f) => f.initiative_id === initiativeId);
}

function sortedLatestFirst(forms: Form[]): Form[] {
  return [...forms].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

function sortedEarliestFirst(forms: Form[]): Form[] {
  return [...forms].sort((a, b) => (a.updated_at < b.updated_at ? -1 : 1));
}

// Prioridad por tipo de formulario: F5 > F4 > F3 > F2 > F1. Al empate
// de tipo, el más reciente por updated_at. Esta es la regla general —
// gana el último formulario completado, no el último editado.
const FORM_TYPE_PRIORITY: Record<string, number> = {
  F5: 5,
  F4: 4,
  F3: 3,
  F2: 2,
  F1: 1,
};

function sortedByTypePriority(forms: Form[]): Form[] {
  return [...forms].sort((a, b) => {
    const pa = FORM_TYPE_PRIORITY[a.form_type] ?? 0;
    const pb = FORM_TYPE_PRIORITY[b.form_type] ?? 0;
    if (pa !== pb) return pb - pa;
    return a.updated_at < b.updated_at ? 1 : -1;
  });
}


function responsesOf(store: Store, formId: Id): FormResponse[] {
  return store.form_responses.filter((r) => r.form_id === formId);
}

function findResponse(
  store: Store,
  formId: Id,
  fieldKey: string,
): FormResponse | undefined {
  return store.form_responses.find(
    (r) => r.form_id === formId && r.field_key === fieldKey,
  );
}

function findResponseByPrefix(
  store: Store,
  formId: Id,
  prefix: string,
): FormResponse | undefined {
  return store.form_responses.find(
    (r) => r.form_id === formId && r.field_key.startsWith(prefix),
  );
}

function readLatestByKey(
  store: Store,
  initiativeId: Id,
  fieldKey: string,
): unknown {
  for (const form of sortedLatestFirst(formsFor(store, initiativeId))) {
    const r = findResponse(store, form.id, fieldKey);
    if (r !== undefined) return r.value;
  }
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

function nonEmptyString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

// ---------------------------------------------------------------------------
// value_streams_5y — desde corrientes del form (año 1/3/5)
// ---------------------------------------------------------------------------

function fmtYearCell(raw: unknown): string {
  if (raw === undefined || raw === null) return "—";
  if (typeof raw === "number") return raw.toString();
  if (typeof raw === "string") {
    const s = raw.trim();
    return s.length > 0 ? s : "—";
  }
  return "—";
}

function deriveValueStreams5y(
  store: Store,
  initiativeId: Id,
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

// ---------------------------------------------------------------------------
// purpose — F1 seccion_2_proposito (string). Prioriza el último form que lo
// tenga cargado (F3 hereda vía carry-over y también tiene la misma key).
// ---------------------------------------------------------------------------

function derivePurpose(store: Store, initiativeId: Id): string | null {
  for (const form of sortedByTypePriority(formsFor(store, initiativeId))) {
    const r = findResponse(store, form.id, "seccion_2_proposito");
    if (!r) continue;
    const s = nonEmptyString(r.value);
    if (s) return s;
  }
  return null;
}

// ---------------------------------------------------------------------------
// challenges — F1 seccion_7_gestion_cambio.desafios. F2 puede tener
// "seccion_8_gestion_cambio" como string libre.
// ---------------------------------------------------------------------------

function splitToBullets(text: string): string[] {
  return text
    .split(/\r?\n|•|·|(?:\.\s+)(?=[A-ZÁÉÍÓÚÑ])/)
    .map((s) => s.trim().replace(/^[-–•·.\s]+/, "").trim())
    .filter((s) => s.length > 3);
}

function deriveChallenges(
  store: Store,
  initiativeId: Id,
): string[] | null {
  const forms = sortedByTypePriority(formsFor(store, initiativeId));
  for (const form of forms) {
    // F1: seccion_7_gestion_cambio → { desafios, participacion }
    const r7 = findResponse(store, form.id, "seccion_7_gestion_cambio");
    if (r7 && typeof r7.value === "object" && r7.value !== null) {
      const desafios = (r7.value as { desafios?: unknown }).desafios;
      const s = nonEmptyString(desafios);
      if (s) return splitToBullets(s);
    }
    // F2: seccion_8_gestion_cambio (puede ser string o objeto)
    const r8 = findResponse(store, form.id, "seccion_8_gestion_cambio");
    if (r8) {
      if (typeof r8.value === "string") {
        const s = nonEmptyString(r8.value);
        if (s) return splitToBullets(s);
      } else if (r8.value && typeof r8.value === "object") {
        const desafios = (r8.value as { desafios?: unknown }).desafios;
        const s = nonEmptyString(desafios);
        if (s) return splitToBullets(s);
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// impact_indicators — filas de "necesidad / oportunidad y prioridad".
// Arranca del form más antiguo con data (F1) y actualiza con el más reciente.
// Merge por el texto del dolor/oportunidad (primera columna informativa).
// ---------------------------------------------------------------------------

interface NecesidadRow {
  stakeholder?: unknown;
  dolor?: unknown;
  metrica?: unknown;
  dato_inicio?: unknown;
  target?: unknown;
  prioridad?: unknown;
}

function extractNecesidadRows(value: unknown): NecesidadRow[] {
  if (Array.isArray(value)) {
    return value.filter(
      (r): r is NecesidadRow =>
        typeof r === "object" && r !== null && !Array.isArray(r),
    );
  }
  if (value && typeof value === "object") {
    const detalle = (value as { detalle?: unknown }).detalle;
    if (Array.isArray(detalle)) {
      return detalle.filter(
        (r): r is NecesidadRow =>
          typeof r === "object" && r !== null && !Array.isArray(r),
      );
    }
  }
  return [];
}

function normalizePriority(v: unknown): "Alta" | "Media" | "Baja" {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (s.startsWith("alt")) return "Alta";
  if (s.startsWith("baj")) return "Baja";
  return "Media";
}

function rowKey(r: NecesidadRow): string {
  const dolor = typeof r.dolor === "string" ? r.dolor.trim() : "";
  if (dolor) return dolor.toLowerCase();
  const metrica = typeof r.metrica === "string" ? r.metrica.trim() : "";
  return metrica.toLowerCase();
}

function rowToIndicator(r: NecesidadRow): ImpactIndicator | null {
  const dolor =
    (typeof r.dolor === "string" && r.dolor.trim()) ||
    (typeof r.metrica === "string" && r.metrica.trim()) ||
    (typeof r.stakeholder === "string" && r.stakeholder.trim()) ||
    "";
  if (!dolor) return null;
  return {
    indicator: dolor,
    baseline: typeof r.dato_inicio === "string" ? r.dato_inicio : "",
    target: typeof r.target === "string" ? r.target : "",
    actual: null,
    priority: normalizePriority(r.prioridad),
  };
}

function deriveImpactIndicators(
  store: Store,
  initiativeId: Id,
): ImpactIndicator[] | null {
  // Regla: F1/F2/F3 tienen esta sección. El dato_inicio (baseline) se congela
  // en F3 — es decir, se actualiza F1→F2→F3 y después queda fijo. El resto de
  // los campos (indicator, target, priority) también llegan hasta F3 (no hay
  // sección equivalente en F4/F5). Iteramos earliest→latest dentro de F1-F3
  // para que cada actualización pise a la anterior.
  const forms = sortedEarliestFirst(
    formsFor(store, initiativeId).filter((f) =>
      ["F1", "F2", "F3"].includes(f.form_type),
    ),
  );
  const byKey = new Map<string, ImpactIndicator>();
  const baselineByKey = new Map<string, string>();

  for (const form of forms) {
    const r = findResponse(store, form.id, "seccion_3_necesidad_oportunidad");
    if (!r) continue;
    const rows = extractNecesidadRows(r.value);
    for (const row of rows) {
      const indicator = rowToIndicator(row);
      if (!indicator) continue;
      const key = rowKey(row);
      byKey.set(key, indicator);
      // El baseline se actualiza solo hasta F3 — como solo iteramos F1-F3
      // acá, la última asignación es ya la "congelada" en F3.
      if (indicator.baseline) baselineByKey.set(key, indicator.baseline);
    }
  }

  // Pegamos el baseline congelado (el último no vacío F1-F3).
  for (const [key, ind] of byKey.entries()) {
    const frozen = baselineByKey.get(key);
    if (frozen !== undefined) byKey.set(key, { ...ind, baseline: frozen });
  }

  // Actual: cruzar con F5 indicadores si hay coincidencia de nombre.
  const adoption = deriveAdoptionIndicators(store, initiativeId) ?? [];
  for (const [key, ind] of byKey.entries()) {
    const match = adoption.find(
      (a) =>
        a.indicator.toLowerCase().includes(key) ||
        key.includes(a.indicator.toLowerCase()),
    );
    if (match && match.actual) {
      byKey.set(key, { ...ind, actual: match.actual });
    }
  }
  const out = Array.from(byKey.values());
  return out.length > 0 ? out : null;
}

// ---------------------------------------------------------------------------
// deliverables — F5 entregables_YYYY (más reciente)
// ---------------------------------------------------------------------------

interface EntregableRow {
  entregable?: unknown;
  responsable?: unknown;
  fecha_plan?: unknown;
  estado?: unknown;
  avance?: unknown;
}

function normalizeEstado(
  v: unknown,
): "Completado" | "En curso" | "Planificado" {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (s.startsWith("comp")) return "Completado";
  if (s.startsWith("en cur") || s.startsWith("curso")) return "En curso";
  return "Planificado";
}

function deriveDeliverables(
  store: Store,
  initiativeId: Id,
): Deliverable[] | null {
  const f5s = sortedLatestFirst(
    formsFor(store, initiativeId).filter((f) => f.form_type === "F5"),
  );
  for (const form of f5s) {
    const r =
      findResponseByPrefix(store, form.id, "entregables_") ??
      findResponseByPrefix(store, form.id, "seccion_entregables");
    if (!r || !Array.isArray(r.value)) continue;
    const out: Deliverable[] = [];
    for (const row of r.value as EntregableRow[]) {
      if (typeof row !== "object" || row === null) continue;
      const name = typeof row.entregable === "string" ? row.entregable : "";
      if (!name) continue;
      out.push({
        name,
        responsible: typeof row.responsable === "string" ? row.responsable : "",
        quarter: typeof row.fecha_plan === "string" ? row.fecha_plan : "",
        status: normalizeEstado(row.estado),
        progress: typeof row.avance === "string" ? row.avance : "",
      });
    }
    if (out.length > 0) return out;
  }
  return null;
}

// ---------------------------------------------------------------------------
// adoption_indicators — F5 indicadores_YYYY (más reciente)
// ---------------------------------------------------------------------------

interface IndicadorRow {
  indicador?: unknown;
  tipo?: unknown;
  baseline?: unknown;
  target?: unknown;
  actual?: unknown;
  trend?: unknown;
}

function normalizeTrend(v: unknown): AdoptionTrend {
  const s = typeof v === "string" ? v.trim() : "";
  if (s === "↑" || /up/i.test(s)) return "up";
  if (s === "↓" || /down/i.test(s)) return "down";
  if (s === "✓" || /done/i.test(s)) return "done";
  return "flat";
}

function deriveAdoptionIndicators(
  store: Store,
  initiativeId: Id,
): AdoptionIndicator[] | null {
  const f5s = sortedLatestFirst(
    formsFor(store, initiativeId).filter((f) => f.form_type === "F5"),
  );
  for (const form of f5s) {
    const r =
      findResponseByPrefix(store, form.id, "indicadores_") ??
      findResponseByPrefix(store, form.id, "seccion_indicadores");
    if (!r || !Array.isArray(r.value)) continue;
    const out: AdoptionIndicator[] = [];
    for (const row of r.value as IndicadorRow[]) {
      if (typeof row !== "object" || row === null) continue;
      const name = typeof row.indicador === "string" ? row.indicador : "";
      if (!name) continue;
      out.push({
        indicator: name,
        type: typeof row.tipo === "string" ? row.tipo : "",
        baseline: typeof row.baseline === "string" ? row.baseline : "",
        target: typeof row.target === "string" ? row.target : "",
        actual: typeof row.actual === "string" ? row.actual : "",
        trend: normalizeTrend(row.trend),
      });
    }
    if (out.length > 0) return out;
  }
  return null;
}

// ---------------------------------------------------------------------------
// budget_opex / budget_capex — F4 seccion_7_costos (multi_table) o F2/F3 costos
// ---------------------------------------------------------------------------

interface CostoRow {
  subcategoria?: unknown;
  erogacion_usd?: unknown;
  detalle?: unknown;
}

function costoRowsToBudget(rows: CostoRow[]): BudgetLine[] {
  const out: BudgetLine[] = [];
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const subcategory =
      typeof row.subcategoria === "string" ? row.subcategoria : "";
    if (!subcategory) continue;
    out.push({
      subcategory,
      amount: typeof row.erogacion_usd === "string" ? row.erogacion_usd : "",
      detail: typeof row.detalle === "string" ? row.detalle : "",
    });
  }
  return out;
}

function deriveBudget(
  store: Store,
  initiativeId: Id,
  kind: "opex" | "capex",
): BudgetLine[] | null {
  // "Presupuesto del año" sale solo de F4 (seccion_7_costos). F2/F3 son costos
  // de dimensionamiento/MVP, no del ciclo anual.
  const f4s = sortedLatestFirst(
    formsFor(store, initiativeId).filter((f) => f.form_type === "F4"),
  );
  const f4Key =
    kind === "opex" ? "erogaciones_opex" : "erogaciones_capex";

  for (const form of f4s) {
    const f4Resp = findResponseByPrefix(store, form.id, "seccion_7_costos");
    if (
      f4Resp &&
      typeof f4Resp.value === "object" &&
      f4Resp.value !== null
    ) {
      const arr = (f4Resp.value as Record<string, unknown>)[f4Key];
      if (Array.isArray(arr)) {
        const budget = costoRowsToBudget(arr as CostoRow[]);
        if (budget.length > 0) return budget;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function computeInitiativeSummary(
  store: Store,
  initiativeId: Id,
): InitiativeSummary | null {
  const iniForms = formsFor(store, initiativeId);
  if (iniForms.length === 0) return null;

  // Cada bloque: intenta derivar del form; si no hay data, cae al bridge legacy
  // de initiative_summaries.ts (ya volcado como responses `summary_*`).
  const purpose =
    derivePurpose(store, initiativeId) ??
    asString(readLatestByKey(store, initiativeId, SUMMARY_KEYS.purpose));

  const value_streams_5y =
    deriveValueStreams5y(store, initiativeId) ??
    asArray<ValueStream5YearRow>(
      readLatestByKey(store, initiativeId, SUMMARY_KEYS.value_streams_5y),
    );

  const impact_indicators =
    deriveImpactIndicators(store, initiativeId) ??
    asArray<ImpactIndicator>(
      readLatestByKey(store, initiativeId, SUMMARY_KEYS.impact_indicators),
    );

  const challenges =
    deriveChallenges(store, initiativeId) ??
    asStringArray(readLatestByKey(store, initiativeId, SUMMARY_KEYS.challenges));

  // interdependencies: se queda en el bridge (decisión explícita del usuario)
  const interdependencies = asArray<Interdependency>(
    readLatestByKey(store, initiativeId, SUMMARY_KEYS.interdependencies),
  );

  const deliverables =
    deriveDeliverables(store, initiativeId) ??
    asArray<Deliverable>(
      readLatestByKey(store, initiativeId, SUMMARY_KEYS.deliverables),
    );

  const adoption_indicators =
    deriveAdoptionIndicators(store, initiativeId) ??
    asArray<AdoptionIndicator>(
      readLatestByKey(store, initiativeId, SUMMARY_KEYS.adoption_indicators),
    );

  const budget_opex =
    deriveBudget(store, initiativeId, "opex") ??
    asArray<BudgetLine>(
      readLatestByKey(store, initiativeId, SUMMARY_KEYS.budget_opex),
    );

  const budget_capex =
    deriveBudget(store, initiativeId, "capex") ??
    asArray<BudgetLine>(
      readLatestByKey(store, initiativeId, SUMMARY_KEYS.budget_capex),
    );

  return {
    initiative_id: initiativeId,
    purpose,
    value_streams_5y,
    impact_indicators,
    challenges,
    interdependencies,
    deliverables,
    adoption_indicators,
    budget_opex,
    budget_capex,
  };
}

export function computeAllSummaries(store: Store): InitiativeSummary[] {
  return store.initiatives
    .map((i) => computeInitiativeSummary(store, i.id))
    .filter((s): s is InitiativeSummary => s !== null);
}

// Evita warning por helper sin uso externo.
void responsesOf;
