import type { Id } from "@/types";
import { readStore, type Store } from "./_store";

export type ValueStreamKey =
  | "produccion"
  | "opex"
  | "capex"
  | "hh"
  | "intangible";

export interface RawContribution {
  produccion_m3: number;
  hh_hours: number;
  opex_musd: number;
  capex_musd: number;
  emisiones_mtnco2: number;
  energia_mw: number;
  riesgo_pct: number;
}

export interface FinancialOverlay {
  expected_value_usd: number;
  expected_cost_usd: number;
  vicepresidencia: string;
  contribution: Partial<Record<ValueStreamKey, number>>;
  raw: RawContribution;
}

// ---------------------------------------------------------------------------
// Rates (equivalencias a USD). Excepto HH, son placeholders.
// Acción requerida: definir con finanzas las equivalencias reales.
// ---------------------------------------------------------------------------
export const RATES = {
  produccion_usd_per_m3: 60,
  hh_usd_per_hour: 60,
  emisiones_usd_per_mtnco2: 50,
  energia_usd_per_mw: 100_000,
  riesgo_usd_per_pct: 10_000,
  musd_to_usd: 1_000_000,
} as const;

export interface RateRow {
  key: keyof typeof RATES;
  label: string;
  unit: string;
  usd_per_unit: number;
  is_placeholder: boolean;
}

export const RATE_ROWS: readonly RateRow[] = [
  {
    key: "produccion_usd_per_m3",
    label: "Producción",
    unit: "m³",
    usd_per_unit: RATES.produccion_usd_per_m3,
    is_placeholder: true,
  },
  {
    key: "hh_usd_per_hour",
    label: "Productividad (HH)",
    unit: "hora",
    usd_per_unit: RATES.hh_usd_per_hour,
    is_placeholder: false,
  },
  {
    key: "emisiones_usd_per_mtnco2",
    label: "Emisiones",
    unit: "MTn CO₂ eq.",
    usd_per_unit: RATES.emisiones_usd_per_mtnco2,
    is_placeholder: true,
  },
  {
    key: "energia_usd_per_mw",
    label: "Consumo energía",
    unit: "MW",
    usd_per_unit: RATES.energia_usd_per_mw,
    is_placeholder: true,
  },
  {
    key: "riesgo_usd_per_pct",
    label: "Exposición al riesgo",
    unit: "% reducción",
    usd_per_unit: RATES.riesgo_usd_per_pct,
    is_placeholder: true,
  },
  {
    key: "musd_to_usd",
    label: "OPEX / CAPEX",
    unit: "M$ USD → USD",
    usd_per_unit: RATES.musd_to_usd,
    is_placeholder: false,
  },
];

export const HH_USD_RATE = RATES.hh_usd_per_hour;

// ---------------------------------------------------------------------------
// Parser de celdas. Tolera "+1,800" / "-0.9" / "2.1M" / "$60K" / "  3 ".
// ---------------------------------------------------------------------------
function parseCellNumber(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return 0;
  const s = raw
    .trim()
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/,/g, "");
  if (!s) return 0;
  const m = s.match(/^(-|\+)?([0-9]*\.?[0-9]+)([KkMm])?$/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const n = parseFloat(m[2]!);
  if (!Number.isFinite(n)) return 0;
  const suf = m[3]?.toLowerCase();
  const mult = suf === "m" ? 1_000_000 : suf === "k" ? 1_000 : 1;
  return sign * n * mult;
}

// ---------------------------------------------------------------------------
// Derivación desde form_responses. Usa el form más reciente (F5 > F4 > F3 > F2)
// que tenga la sección de corrientes de valor cargada.
// ---------------------------------------------------------------------------

const FORM_PRIORITY: readonly string[] = ["F5", "F4", "F3", "F2"];

export type CorrienteRow = Record<string, unknown>;

// Elige la celda del primer año disponible en la fila.
// Prioridad: anio_1 / ano_1 > menor anio_YYYY / ano_YYYY > anio_2026 fallback.
function firstYearCell(row: CorrienteRow): unknown {
  if (row.anio_1 !== undefined) return row.anio_1;
  if (row.ano_1 !== undefined) return row.ano_1;
  const yearKeys = Object.keys(row)
    .filter((k) => /^(anio|ano)_\d{4}$/.test(k))
    .sort();
  if (yearKeys.length > 0) return row[yearKeys[0]!];
  return undefined;
}

// Determina si la label indica "M$ USD" (millones), para ajustar el multiplicador.
function labelIsMillions(label: string): boolean {
  return /m\$|\(m\$|m\s?usd|\(m\b/i.test(label);
}

const ARRAY_CONTAINER_KEYS = [
  "corrientes_valor",
  "beneficio_bruto_5_anios",
  "beneficio_bruto_anio",
];

// Extrae filas de corrientes de un valor arbitrario. Soporta:
//  - array directo: [{ corriente, anio_1, ... }, ...]
//  - objeto con corrientes_valor / beneficio_bruto_5_anios / beneficio_bruto_anio
function extractRows(value: unknown): CorrienteRow[] | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.filter(
      (r): r is CorrienteRow =>
        typeof r === "object" && r !== null && !Array.isArray(r),
    );
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ARRAY_CONTAINER_KEYS) {
      const inner = obj[key];
      if (Array.isArray(inner)) {
        return inner.filter(
          (r): r is CorrienteRow =>
            typeof r === "object" && r !== null && !Array.isArray(r),
        );
      }
    }
  }
  return null;
}

// Heurística: field_key tiene que aludir a corrientes/impacto económico.
function isEconomicSectionKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.includes("corriente") ||
    k.includes("impacto_econom") ||
    k.includes("impacto_corrientes") ||
    k.includes("impacto_5") ||
    k.startsWith("seccion_8_impacto") ||
    k.startsWith("seccion_11_impacto") ||
    k.startsWith("seccion_10_impacto") ||
    k.startsWith("seccion_11_corrientes")
  );
}

// Las filas "útiles" tienen al menos una celda de año parseable a número distinto
// de cero. Placeholders del seed_filler (solo corriente/con_impacto/detalle, sin
// años) no califican.
function rowsHaveUsableYearData(rows: CorrienteRow[]): boolean {
  for (const row of rows) {
    const cell = firstYearCell(row);
    if (cell === undefined) continue;
    if (parseCellNumber(cell) !== 0) return true;
  }
  return false;
}

function findCorrientesRows(
  store: Store,
  initiativeId: Id,
): CorrienteRow[] | null {
  const iniForms = store.forms.filter((f) => f.initiative_id === initiativeId);
  for (const type of FORM_PRIORITY) {
    const formsOfType = iniForms
      .filter((f) => f.form_type === type)
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    for (const form of formsOfType) {
      const responses = store.form_responses.filter(
        (r) => r.form_id === form.id && isEconomicSectionKey(r.field_key),
      );
      for (const r of responses) {
        const rows = extractRows(r.value);
        if (rows && rowsHaveUsableYearData(rows)) return rows;
      }
    }
  }
  return null;
}

function sponsorVpFor(store: Store, initiativeId: Id): string | null {
  const changes = store.initiative_area_changes
    .filter((c) => c.initiative_id === initiativeId)
    .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  if (changes.length > 0) return changes[0]!.to_vp;
  const sponsor = store.initiative_members.find(
    (m) => m.initiative_id === initiativeId && m.role === "sponsor",
  );
  if (!sponsor) return null;
  const u = store.users.find((u) => u.id === sponsor.user_id);
  return u?.vicepresidencia ?? null;
}

const RE_PRODUCCION = /PRODUCCI[ÓO]N/i;
const RE_OPEX = /OPEX/i;
const RE_CAPEX = /CAPEX/i;
const RE_HH = /PRODUCTIVIDAD|\bHH\b/i;
const RE_EMISIONES = /EMISIONES/i;
const RE_ENERGIA = /ENERG[ÍI]A/i;
const RE_RIESGO = /RIESGO/i;
const RE_INTANGIBLE = /INTANGIBLE/i;

function emptyRaw(): RawContribution {
  return {
    produccion_m3: 0,
    hh_hours: 0,
    opex_musd: 0,
    capex_musd: 0,
    emisiones_mtnco2: 0,
    energia_mw: 0,
    riesgo_pct: 0,
  };
}

function computeOverlay(store: Store, initiativeId: Id): FinancialOverlay {
  const vp = sponsorVpFor(store, initiativeId) ?? "Sin asignar";
  const raw = emptyRaw();
  const rows = findCorrientesRows(store, initiativeId);

  // Si la label marca "M$" / "M USD" → el número está en millones → ×1M.
  // Si no, está en unidad base (USD directo, m3, HH, etc).
  let opex_usd_direct = 0;
  let capex_usd_direct = 0;
  let intangible_usd_direct = 0;

  if (rows) {
    for (const row of rows) {
      const corriente = String(
        (row.corriente as unknown) ?? (row.subcategoria as unknown) ?? "",
      );
      if (!corriente) continue;
      const cell = firstYearCell(row);
      const n = parseCellNumber(cell);
      if (n === 0) continue;
      const abs = Math.abs(n);
      const millions = labelIsMillions(corriente);
      if (RE_OPEX.test(corriente)) {
        if (millions) raw.opex_musd += abs;
        else opex_usd_direct += abs;
      } else if (RE_CAPEX.test(corriente)) {
        if (millions) raw.capex_musd += abs;
        else capex_usd_direct += abs;
      } else if (RE_PRODUCCION.test(corriente)) raw.produccion_m3 += n;
      else if (RE_HH.test(corriente)) raw.hh_hours += abs;
      else if (RE_EMISIONES.test(corriente)) raw.emisiones_mtnco2 += abs;
      else if (RE_ENERGIA.test(corriente)) raw.energia_mw += abs;
      else if (RE_RIESGO.test(corriente)) raw.riesgo_pct += abs;
      else if (RE_INTANGIBLE.test(corriente)) {
        intangible_usd_direct += millions ? abs * RATES.musd_to_usd : abs;
      }
    }
  }

  const produccion_usd = raw.produccion_m3 * RATES.produccion_usd_per_m3;
  const hh_usd = raw.hh_hours * RATES.hh_usd_per_hour;
  const opex_usd = raw.opex_musd * RATES.musd_to_usd + opex_usd_direct;
  const capex_usd = raw.capex_musd * RATES.musd_to_usd + capex_usd_direct;
  const intangible_usd =
    raw.emisiones_mtnco2 * RATES.emisiones_usd_per_mtnco2 +
    raw.energia_mw * RATES.energia_usd_per_mw +
    raw.riesgo_pct * RATES.riesgo_usd_per_pct +
    intangible_usd_direct;

  const contribution: Partial<Record<ValueStreamKey, number>> = {};
  if (produccion_usd > 0) contribution.produccion = produccion_usd;
  if (raw.hh_hours > 0) contribution.hh = raw.hh_hours;
  if (opex_usd > 0) contribution.opex = opex_usd;
  if (capex_usd > 0) contribution.capex = capex_usd;
  if (intangible_usd > 0) contribution.intangible = intangible_usd;

  const expected_value_usd = produccion_usd + hh_usd + intangible_usd;
  const expected_cost_usd = opex_usd + capex_usd;

  return {
    expected_value_usd,
    expected_cost_usd,
    vicepresidencia: vp,
    contribution,
    raw,
  };
}

export function getOverlay(id: Id): FinancialOverlay {
  return computeOverlay(readStore(), id);
}

// Devuelve las filas de corrientes del form más reciente con data útil, para
// que otros módulos (detalle de iniciativa, etc.) rendericen la tabla 5 años.
export function getCorrientesRows(
  store: Store,
  initiativeId: Id,
): CorrienteRow[] {
  return findCorrientesRows(store, initiativeId) ?? [];
}

// Pick "la mejor" celda de un año dado (1, 3 o 5) de una fila. Busca anio_N /
// ano_N, y si no hay, cae al año YYYY correspondiente relativo al mínimo año.
export function pickYearCell(
  row: CorrienteRow,
  yearIndex: 1 | 3 | 5,
): unknown {
  const primary =
    row[`anio_${yearIndex}` as keyof CorrienteRow] ??
    row[`ano_${yearIndex}` as keyof CorrienteRow];
  if (primary !== undefined) return primary;
  const yearKeys = Object.keys(row)
    .filter((k) => /^(anio|ano)_\d{4}$/.test(k))
    .sort();
  if (yearKeys.length === 0) return undefined;
  const baseYear = parseInt(yearKeys[0]!.replace(/^(anio|ano)_/, ""), 10);
  const targetKey = yearKeys.find((k) => {
    const y = parseInt(k.replace(/^(anio|ano)_/, ""), 10);
    return y - baseYear === yearIndex - 1;
  });
  return targetKey ? row[targetKey] : undefined;
}
