import type { Form, FormResponse } from "@/types";

import { getInitiativeSummaries } from "./initiative_summaries";

// Claves canónicas bajo las que guardamos cada bloque del resumen en
// form_responses. Son "derived keys" — no pertenecen a una sección del wizard
// (por ahora). Cuando los forms capturen esta info en el wizard real, se
// reemplazan por las keys de las secciones correspondientes.
export const SUMMARY_KEYS = {
  purpose: "summary_purpose",
  value_streams_5y: "summary_value_streams_5y",
  impact_indicators: "summary_impact_indicators",
  challenges: "summary_challenges",
  interdependencies: "summary_interdependencies",
  deliverables: "summary_deliverables",
  adoption_indicators: "summary_adoption_indicators",
  budget_opex: "summary_budget_opex",
  budget_capex: "summary_budget_capex",
} as const;

// Genera form_responses a partir de las summaries hardcoded, apuntando al
// form más reciente de cada iniciativa. Así los dashboards e iniciativas leen
// todo desde form_responses y no desde un archivo paralelo.
export function buildSummaryResponses(forms: Form[]): FormResponse[] {
  const summaries = getInitiativeSummaries();
  const out: FormResponse[] = [];

  for (const summary of summaries) {
    const iniForms = forms
      .filter((f) => f.initiative_id === summary.initiative_id)
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    const target = iniForms[0];
    if (!target) continue;

    const push = (field_key: string, value: unknown) => {
      out.push({
        id: `resp_${target.id}_${field_key}`,
        form_id: target.id,
        field_key,
        value: value as FormResponse["value"],
      });
    };

    push(SUMMARY_KEYS.purpose, summary.purpose);
    push(SUMMARY_KEYS.value_streams_5y, summary.value_streams_5y);
    push(SUMMARY_KEYS.impact_indicators, summary.impact_indicators);
    push(SUMMARY_KEYS.challenges, summary.challenges);
    push(SUMMARY_KEYS.interdependencies, summary.interdependencies);
    push(SUMMARY_KEYS.deliverables, summary.deliverables);
    push(SUMMARY_KEYS.adoption_indicators, summary.adoption_indicators);
    push(SUMMARY_KEYS.budget_opex, summary.budget_opex);
    push(SUMMARY_KEYS.budget_capex, summary.budget_capex);
  }

  return out;
}
