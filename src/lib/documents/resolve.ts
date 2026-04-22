// Dado un DocFileSource (del árbol de documentos), resuelve al DocStructure
// listo para entrar al generador XLSX/PDF. Centraliza la lógica de:
//  - qué responses usar (actuales vs snapshot)
//  - armar la metadata (versión, etapa, autor)

import { F1_SECTIONS } from "@/data/form_definitions/f1";
import { F2_SECTIONS } from "@/data/form_definitions/f2";
import { F3_SECTIONS } from "@/data/form_definitions/f3";
import { F4_SECTIONS } from "@/data/form_definitions/f4";
import { F5_SECTIONS } from "@/data/form_definitions/f5";
import type { WizardSection } from "@/data/form_definitions/_shared";
import type { FormType, Id } from "@/types";
import { err, ok, type Result } from "@/lib/result";
import { getForm } from "@/lib/storage/forms";
import { getFormSnapshot } from "@/lib/storage/form_snapshots";
import type { DocFileSource } from "@/lib/storage/documents";
import {
  serializeForm,
  type DocMeta,
  type DocStructure,
} from "./form_serializer";

const SECTIONS_BY_TYPE: Partial<Record<FormType, readonly WizardSection[]>> = {
  F1: F1_SECTIONS,
  F2: F2_SECTIONS,
  F3: F3_SECTIONS,
  F4: F4_SECTIONS,
  F5: F5_SECTIONS,
};

const FORM_LABEL: Record<FormType, string> = {
  F1: "F1 — Propuesta",
  F2: "F2 — Dimensionamiento",
  F3: "F3 — MVP",
  F4: "F4 — Visión Anual",
  F5: "F5 — Planificación Anual",
};

function etapaLabel(formType: FormType, ltpPeriod: string | null): string {
  if (formType === "F1") return "Etapa 1 — Propuesta";
  if (formType === "F2") return "Etapa 2 — Dimensionamiento";
  if (formType === "F3") return "Etapa 3 — MVP";
  if (ltpPeriod) {
    const m = /^(\d{2})-(\d{4})$/.exec(ltpPeriod);
    if (m) {
      const months: Record<string, string> = {
        "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
        "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
        "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
      };
      return `LTP — ${months[m[1] ?? ""] ?? m[1]} ${m[2]}`;
    }
  }
  return "LTP y Seguimiento";
}

function buildMeta(
  formType: FormType,
  initiative_name: string,
  ltpPeriod: string | null,
  versionLabel: string,
  fecha: string,
  author_name: string | null,
): DocMeta {
  return {
    initiative_name,
    form_label: FORM_LABEL[formType],
    etapa_label: etapaLabel(formType, ltpPeriod),
    version_label: versionLabel,
    fecha,
    author_name,
  };
}

// Resuelve un source hasta producir el DocStructure para pasar a xlsx/pdf.
export function resolveFormDoc(
  source: DocFileSource,
  initiative_name: string,
  author_name: string | null,
): Result<DocStructure> {
  if (source.kind === "form_current") {
    const res = getForm(source.form_id);
    if (!res.success) return err(res.error.code, res.error.message);
    const sections = SECTIONS_BY_TYPE[res.data.form.form_type] ?? [];
    const meta = buildMeta(
      res.data.form.form_type,
      initiative_name,
      res.data.form.ltp_period,
      "Borrador (estado actual)",
      res.data.form.updated_at,
      author_name,
    );
    return ok(serializeForm(sections, res.data.responses, meta));
  }

  if (source.kind === "form_snapshot") {
    const formRes = getForm(source.form_id);
    if (!formRes.success) return err(formRes.error.code, formRes.error.message);
    const snapRes = getFormSnapshot(source.snapshot_id);
    if (!snapRes.success) return err(snapRes.error.code, snapRes.error.message);

    const versionLabel =
      source.snapshot_type === "final"
        ? `Versión Final (v${snapRes.data.version_number})`
        : `PRE-GATEWAY (v${snapRes.data.version_number})`;
    const sections = SECTIONS_BY_TYPE[formRes.data.form.form_type] ?? [];
    const meta = buildMeta(
      formRes.data.form.form_type,
      initiative_name,
      formRes.data.form.ltp_period,
      versionLabel,
      snapRes.data.created_at,
      author_name,
    );
    return ok(serializeForm(sections, snapRes.data.responses_data, meta));
  }

  return err(
    "VALIDATION_ERROR",
    "Este archivo aún no tiene generador (pendiente).",
  );
}

export function suggestedFilename(
  source: DocFileSource,
  fallbackName: string,
): string {
  return fallbackName;
}

export function resolveFormIdForSource(source: DocFileSource): Id | null {
  if (source.kind === "form_current" || source.kind === "form_snapshot") {
    return source.form_id;
  }
  return null;
}
