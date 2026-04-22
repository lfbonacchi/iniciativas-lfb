import type { Id } from "./common";

export interface ValueStream5YearRow {
  stream: string;
  year_1: string;
  year_3: string;
  year_5: string;
}

export interface ImpactIndicator {
  indicator: string;
  baseline: string;
  target: string;
  actual: string | null;
  priority: "Alta" | "Media" | "Baja";
}

export interface Interdependency {
  initiative_id: Id | null;
  label: string;
  ref_note: string;
}

export interface Deliverable {
  name: string;
  responsible: string;
  quarter: string;
  status: "Completado" | "En curso" | "Planificado";
  progress: string;
}

export type AdoptionTrend = "up" | "flat" | "down" | "done";

export interface AdoptionIndicator {
  indicator: string;
  type: string;
  baseline: string;
  target: string;
  actual: string;
  trend: AdoptionTrend;
}

export interface BudgetLine {
  subcategory: string;
  amount: string;
  detail: string;
}

export interface InitiativeSummary {
  initiative_id: Id;
  purpose: string;
  value_streams_5y: ValueStream5YearRow[];
  impact_indicators: ImpactIndicator[];
  challenges: string[];
  interdependencies: Interdependency[];
  deliverables: Deliverable[];
  adoption_indicators: AdoptionIndicator[];
  budget_opex: BudgetLine[];
  budget_capex: BudgetLine[];
}
