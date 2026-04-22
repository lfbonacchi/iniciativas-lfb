// Puente entre las definiciones del wizard (src/data/form_definitions/*) y
// la forma mínima de FormDefinition que consume ReadOnlySections. En Fase 2-4
// el store no persiste form_definitions: las secciones están hardcodeadas en
// módulos TS. Este módulo produce una FormDefinition sintética para la vista
// read-only del gateway, donde cada sección expone un único campo (la key de
// la sección) y renderValue se encarga de mostrar el blob correspondiente.
//
// Además, normalizeResponsesForSections reconstruye el valor de cada sección
// cuando el seed/storage persiste datos con keys distintas a las de la
// definición (p.ej. el F3 seed usa `descripcion_mvp` en vez de `descripcion`
// dentro de la sección 6). El mapeo es shape-aware y tolerante a
// inconsistencias comunes.

import { F1_SECTIONS } from "@/data/form_definitions/f1";
import { F2_SECTIONS } from "@/data/form_definitions/f2";
import { F3_SECTIONS } from "@/data/form_definitions/f3";
import { F4_SECTIONS } from "@/data/form_definitions/f4";
import { F5_SECTIONS } from "@/data/form_definitions/f5";
import type { WizardSection } from "@/data/form_definitions/_shared";
import type { FormDefinition, FormFieldValue, FormType } from "@/types";

const SECTIONS_BY_TYPE: Partial<Record<FormType, readonly WizardSection[]>> = {
  F1: F1_SECTIONS,
  F2: F2_SECTIONS,
  F3: F3_SECTIONS,
  F4: F4_SECTIONS,
  F5: F5_SECTIONS,
};

export function getWizardSections(
  formType: FormType,
): readonly WizardSection[] | null {
  return SECTIONS_BY_TYPE[formType] ?? null;
}

export function buildSyntheticFormDefinition(
  formType: FormType,
  formId: string,
  version: number,
): FormDefinition | null {
  const sections = SECTIONS_BY_TYPE[formType];
  if (!sections) return null;
  return {
    id: `syn-${formId}`,
    form_type: formType,
    version,
    sections_config: sections.map((s) => ({
      key: s.key,
      title: `${s.number}. ${s.title}`,
      order: s.number,
      description: s.description,
      fields: [
        {
          key: s.key,
          label: s.title,
          type: "textarea" as const,
          required: false,
        },
      ],
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalización de respuestas
// ─────────────────────────────────────────────────────────────────────────────

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (
    typeof v === "object" &&
    v !== null &&
    Object.keys(v as Record<string, unknown>).length === 0
  ) {
    return true;
  }
  return false;
}

// Busca en responses una clave que matchee `candidate` con tolerancia a
// variaciones comunes del seed:
//   1) exacto                → responses[candidate]
//   2) candidate + suffix    → "descripcion" encuentra "descripcion_mvp"
//   3) prefix + candidate    → "bloqueantes" encuentra "aprendizajes_bloqueantes"
//   4) candidate contiene K  → "equipo_execute_operate" encuentra "equipo"
//                              (solo si K es un token "significativo", >=4 chars)
//   5) K contiene candidate  → "resultados_esperados" encuentra
//                              "resultados_esperados_vs_obtenidos"
// Se prefiere exacto, luego los demás en orden. Siempre ignorando valores vacíos.
function findResponseKey(
  responses: Readonly<Record<string, FormFieldValue>>,
  candidate: string,
): string | null {
  if (candidate in responses && !isEmpty(responses[candidate])) {
    return candidate;
  }
  const lowered = candidate.toLowerCase();
  const keys = Object.keys(responses).filter((k) => !isEmpty(responses[k]));
  // (2) prefijo con "_"
  const prefix = keys.find((k) => k.toLowerCase().startsWith(lowered + "_"));
  if (prefix) return prefix;
  // (3) sufijo con "_"
  const suffix = keys.find((k) => k.toLowerCase().endsWith("_" + lowered));
  if (suffix) return suffix;
  // (5) el candidate es prefijo del response key (sin el underscore)
  const startsWith = keys.find((k) => k.toLowerCase().startsWith(lowered));
  if (startsWith) return startsWith;
  // (4) el response key es un prefijo significativo del candidate
  const containedInCandidate = keys.find((k) => {
    const kl = k.toLowerCase();
    if (kl.length < 4) return false;
    return lowered.startsWith(kl + "_") || lowered === kl;
  });
  if (containedInCandidate) return containedInCandidate;
  // (fallback) contains como token
  const contains = keys.find((k) => {
    const kl = k.toLowerCase();
    return kl.includes("_" + lowered) || kl.includes(lowered + "_");
  });
  return contains ?? null;
}

function pickValue(
  responses: Readonly<Record<string, FormFieldValue>>,
  candidate: string,
): FormFieldValue | undefined {
  const key = findResponseKey(responses, candidate);
  if (!key) return undefined;
  return responses[key];
}

function aggregateSectionValue(
  section: WizardSection,
  responses: Readonly<Record<string, FormFieldValue>>,
): FormFieldValue | null {
  // 1) Match directo por section.key
  const direct = pickValue(responses, section.key);
  if (direct !== undefined && !isEmpty(direct)) return direct;

  // 2) Intento "sin prefijo seccion_N_": buscar por la key "limpia".
  const cleanKey = section.key.replace(/^seccion_\d+_?/i, "");
  if (cleanKey && cleanKey !== section.key) {
    const alt = pickValue(responses, cleanKey);
    if (alt !== undefined && !isEmpty(alt)) return alt;
  }

  // 3) Reconstrucción por shape a partir de child keys.
  if (section.shape === "string") {
    // Ya cubierto en (1)/(2): si no hay, no hay.
    return null;
  }

  if (section.shape === "object") {
    const obj: Record<string, unknown> = {};
    for (const f of section.fields) {
      const v = pickValue(responses, f.key);
      if (v !== undefined && !isEmpty(v)) obj[f.key] = v;
    }
    return Object.keys(obj).length > 0 ? (obj as FormFieldValue) : null;
  }

  if (section.shape === "array_rows") {
    // No hay child keys acá — ya lo intentamos en (1)/(2).
    return null;
  }

  if (section.shape === "multi_table") {
    const obj: Record<string, unknown> = {};
    for (const t of section.tables) {
      const v = pickValue(responses, t.key);
      if (v !== undefined && !isEmpty(v)) obj[t.key] = v;
    }
    return Object.keys(obj).length > 0 ? (obj as FormFieldValue) : null;
  }

  if (section.shape === "object_with_table") {
    const obj: Record<string, unknown> = {};
    for (const f of section.fields) {
      const v = pickValue(responses, f.key);
      if (v !== undefined && !isEmpty(v)) obj[f.key] = v;
    }
    const tv = pickValue(responses, section.table.key);
    if (tv !== undefined && !isEmpty(tv)) obj[section.table.key] = tv;
    return Object.keys(obj).length > 0 ? (obj as FormFieldValue) : null;
  }

  if (section.shape === "multi_block") {
    const obj: Record<string, unknown> = {};
    for (const b of section.blocks) {
      const v = pickValue(responses, b.key);
      if (v !== undefined && !isEmpty(v)) obj[b.key] = v;
    }
    return Object.keys(obj).length > 0 ? (obj as FormFieldValue) : null;
  }

  return null;
}

// Devuelve un nuevo objeto de responses donde cada section.key apunta al
// mejor valor disponible (directo o reconstruido por shape).
export function normalizeResponsesForSections(
  formType: FormType,
  responses: Readonly<Record<string, FormFieldValue>>,
): Record<string, FormFieldValue> {
  const sections = SECTIONS_BY_TYPE[formType];
  if (!sections) return { ...responses };
  const out: Record<string, FormFieldValue> = { ...responses };
  for (const s of sections) {
    const current = out[s.key];
    if (current !== undefined && !isEmpty(current)) continue;
    const v = aggregateSectionValue(s, responses);
    if (v !== null) out[s.key] = v;
  }
  return out;
}
