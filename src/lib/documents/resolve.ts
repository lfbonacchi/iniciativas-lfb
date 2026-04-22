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
import {
  getGatewayMinuta,
  listGatewayFeedbackDocs,
  listInlineComments,
} from "@/lib/storage/gateways";
import type { DocFileSource } from "@/lib/storage/documents";
import {
  serializeForm,
  type DocCell,
  type DocMeta,
  type DocRow,
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

  if (source.kind === "gateway_feedback") {
    return resolveGatewayFeedback(source, initiative_name, author_name);
  }

  if (source.kind === "gateway_minuta") {
    return resolveGatewayMinuta(source, initiative_name, author_name);
  }

  return err(
    "VALIDATION_ERROR",
    "Este archivo aún no tiene generador (pendiente).",
  );
}

function resolveGatewayMinuta(
  source: Extract<DocFileSource, { kind: "gateway_minuta" }>,
  initiative_name: string,
  author_name: string | null,
): Result<DocStructure> {
  const res = getGatewayMinuta(source.gateway_id);
  if (!res.success) return err(res.error.code, res.error.message);
  if (!res.data.minuta) {
    return err(
      "NOT_FOUND",
      "La minuta todavía no se creó. Volvé al gateway para completarla.",
    );
  }

  const c = res.data.content;
  const rows: DocRow[] = [];
  rows.push([cell(initiative_name, "title", 2)]);
  rows.push([cell("Minuta de reunión de gateway", "subtitle", 2)]);
  rows.push([
    cell("Fecha de reunión", "question"),
    cell(c.fecha_reunion || "—", "answer"),
  ]);
  rows.push([
    cell("Última actualización", "question"),
    cell(
      new Date(res.data.minuta.updated_at).toLocaleDateString("es-AR"),
      "answer",
    ),
  ]);
  rows.push([{ value: "", kind: "empty" }]);

  rows.push([cell("Participantes", "section", 2)]);
  rows.push([
    cell("Convocados", "question"),
    cell(c.participantes || "—", "answer"),
  ]);
  rows.push([
    cell("Asistentes", "question"),
    cell(c.asistentes || "—", "answer"),
  ]);
  rows.push([{ value: "", kind: "empty" }]);

  rows.push([cell("Mejoras identificadas", "section", 2)]);
  rows.push([cell("Mejoras", "question"), cell(c.mejoras || "—", "answer")]);
  rows.push([{ value: "", kind: "empty" }]);

  rows.push([cell("Acuerdos", "section", 2)]);
  rows.push([cell("Acuerdos", "question"), cell(c.acuerdos || "—", "answer")]);
  rows.push([{ value: "", kind: "empty" }]);

  rows.push([cell("Próximos pasos / decisiones", "section", 2)]);
  rows.push([
    cell("Decisiones", "question"),
    cell(c.proximos_pasos || "—", "answer"),
  ]);

  const meta: DocMeta = {
    initiative_name,
    form_label: "Minuta de gateway",
    etapa_label: "Gateway",
    version_label: res.data.is_complete ? "Final" : "Borrador",
    fecha: res.data.minuta.updated_at,
    author_name: author_name ?? null,
  };
  return ok({ meta, rows });
}

function cell(value: string, kind: DocCell["kind"], colspan?: number): DocCell {
  return colspan ? { value, kind, colspan } : { value, kind };
}

function resolveGatewayFeedback(
  source: Extract<DocFileSource, { kind: "gateway_feedback" }>,
  initiative_name: string,
  author_name: string | null,
): Result<DocStructure> {
  const inlineRes = listInlineComments(source.gateway_id);
  if (!inlineRes.success) return err(inlineRes.error.code, inlineRes.error.message);
  const freeRes = listGatewayFeedbackDocs(source.gateway_id);
  if (!freeRes.success) return err(freeRes.error.code, freeRes.error.message);

  const inline = inlineRes.data
    .filter((c) => c.user_id === source.user_id && c.status === "published")
    .sort((a, b) => a.section_key.localeCompare(b.section_key));
  const freeDocs = freeRes.data.filter((d) => d.user_id === source.user_id);

  if (inline.length === 0 && freeDocs.length === 0) {
    return err(
      "NOT_FOUND",
      "Este usuario no publicó comentarios para este gateway",
    );
  }

  const authorName = inline[0]?.author_name ?? freeDocs[0]?.author_name ?? author_name ?? "Usuario";
  const latestIso =
    inline
      .map((c) => c.published_at ?? c.updated_at)
      .concat(freeDocs.map((d) => d.updated_at))
      .sort()
      .reverse()[0] ?? new Date().toISOString();

  const rows: DocRow[] = [];
  rows.push([cell(initiative_name, "title", 2)]);
  rows.push([cell(`Feedback de ${authorName}`, "subtitle", 2)]);
  rows.push([
    cell("Fecha", "question"),
    cell(new Date(latestIso).toLocaleDateString("es-AR"), "answer"),
  ]);
  rows.push([{ value: "", kind: "empty" }]);

  // Agrupar comentarios inline por sección.
  const bySection = new Map<string, typeof inline>();
  for (const c of inline) {
    const arr = bySection.get(c.section_key) ?? [];
    arr.push(c);
    bySection.set(c.section_key, arr);
  }

  if (bySection.size > 0) {
    rows.push([cell("Comentarios por sección", "section", 2)]);
    let sectionN = 0;
    for (const [sectionKey, comments] of bySection.entries()) {
      sectionN++;
      rows.push([cell(`${sectionN}. ${sectionKey}`, "section", 2)]);
      for (const c of comments) {
        rows.push([
          cell(`Campo: ${c.field_key}`, "question"),
          cell(c.text, "answer"),
        ]);
      }
      rows.push([{ value: "", kind: "empty" }]);
    }
  }

  if (freeDocs.length > 0) {
    rows.push([cell("Feedback general", "section", 2)]);
    for (const d of freeDocs) {
      rows.push([cell("Contenido", "question"), cell(d.content, "answer")]);
    }
  }

  const meta: DocMeta = {
    initiative_name,
    form_label: `Feedback de ${authorName}`,
    etapa_label: "Gateway",
    version_label: "Última actualización",
    fecha: latestIso,
    author_name: authorName,
  };

  return ok({ meta, rows });
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
