import type { Id } from "@/types";

export type ValueStreamKey =
  | "produccion"
  | "opex"
  | "capex"
  | "hh"
  | "intangible";

export interface FinancialOverlay {
  expected_value_usd: number;
  expected_cost_usd: number;
  vicepresidencia: string;
  contribution: Partial<Record<ValueStreamKey, number>>;
}

export const HH_USD_RATE = 60;

export const FINANCIAL_OVERLAY: Record<Id, FinancialOverlay> = {
  "ini-001": {
    expected_value_usd: 1_200_000,
    expected_cost_usd: 180_000,
    vicepresidencia: "VP Upstream",
    contribution: { produccion: 8_000_000, opex: 2_100_000, hh: 2_400 },
  },
  "ini-002": {
    expected_value_usd: 3_500_000,
    expected_cost_usd: 420_000,
    vicepresidencia: "VP Operaciones",
    contribution: { opex: 3_100_000, intangible: 900_000 },
  },
  "ini-003": {
    expected_value_usd: 950_000,
    expected_cost_usd: 95_000,
    vicepresidencia: "VP Perforación",
    contribution: { opex: 850_000, hh: 6_000, produccion: 12_000 },
  },
  "ini-004": {
    expected_value_usd: 5_200_000,
    expected_cost_usd: 620_000,
    vicepresidencia: "VP Upstream",
    contribution: { produccion: 4_400_000, opex: 3_100_000, hh: 8_000 },
  },
  "ini-005": {
    expected_value_usd: 2_800_000,
    expected_cost_usd: 450_000,
    vicepresidencia: "VP Transformación",
    contribution: { opex: 1_400_000, intangible: 1_100_000 },
  },
  "ini-006": {
    expected_value_usd: 1_800_000,
    expected_cost_usd: 240_000,
    vicepresidencia: "VP Transformación",
    contribution: { opex: 900_000, intangible: 700_000, hh: 4_000 },
  },
  "ini-007": {
    expected_value_usd: 2_100_000,
    expected_cost_usd: 310_000,
    vicepresidencia: "VP Operaciones",
    contribution: { opex: 1_500_000, capex: 380_000 },
  },
  "ini-008": {
    expected_value_usd: 650_000,
    expected_cost_usd: 150_000,
    vicepresidencia: "VP Perforación",
    contribution: { intangible: 500_000 },
  },
};

export function getOverlay(id: Id): FinancialOverlay {
  return (
    FINANCIAL_OVERLAY[id] ?? {
      expected_value_usd: 0,
      expected_cost_usd: 0,
      vicepresidencia: "VP Upstream",
      contribution: {},
    }
  );
}
