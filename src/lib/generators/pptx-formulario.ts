// Generador PPTX de formulario individual (F1..F5).
// Browser-side via pptxgenjs. Lee responses del form (localStorage) y renderiza
// slides siguiendo el brandbook PAE y el spec SPEC_PPTX_FORMULARIO.md.
//
// Estrategia:
//  - Portada fija por formType (badge de etapa + metadata)
//  - Por cada sección del WizardSection[], decide layout según:
//      • override por section.key (dolores, corrientes, journey, equipo)
//      • fallback genérico según section.shape (string, object, array_rows, etc.)
//  - Slide de cierre "Próximos Pasos" por formType.
// Template = estructura fija por etapa (misma cantidad de slides siempre);
// los campos vacíos se muestran como "—" en vez de omitir la sección,
// para que el documento siempre tenga la misma forma y sea comparable.
//
// Referencia visual: docs/specs/generate_pptx_formulario.js

import PptxGenJS from "pptxgenjs";

import type {
  Block,
  ObjectFieldDef,
  TableColumnDef,
  WizardSection,
} from "@/data/form_definitions/_shared";
import { F1_SECTIONS } from "@/data/form_definitions/f1";
import { F2_SECTIONS } from "@/data/form_definitions/f2";
import { F3_SECTIONS } from "@/data/form_definitions/f3";
import { F4_SECTIONS } from "@/data/form_definitions/f4";
import { F5_SECTIONS } from "@/data/form_definitions/f5";
import type { FormFieldValue, FormType } from "@/types";

import {
  PAE,
  SLIDE_W,
  SLIDE_H,
  MARGIN,
  CONTENT_W,
  sanitizeText,
  safeFileSegment,
  downloadBlob,
} from "./pptx-constants";

// ────────────────────────────────────────────────────────────────
// Tipos de entrada
// ────────────────────────────────────────────────────────────────

export interface PptxFormularioInput {
  form_type: FormType;
  initiative_name: string;
  dimension: string;
  unidad_gestion?: string;
  areas_involucradas?: string;
  tipo_iniciativa?: string;
  version_label: string; // "Borrador", "PRE-GATEWAY v1", "Versión Final v2"
  fecha_iso: string;
  ltp_period: string | null;
  responses: Record<string, FormFieldValue>;
}

// ────────────────────────────────────────────────────────────────
// Mapping formType → WizardSection[] + metadata de etapa
// ────────────────────────────────────────────────────────────────

const SECTIONS_BY_TYPE: Record<FormType, readonly WizardSection[]> = {
  F1: F1_SECTIONS,
  F2: F2_SECTIONS,
  F3: F3_SECTIONS,
  F4: F4_SECTIONS,
  F5: F5_SECTIONS,
};

interface StageMeta {
  badgeText: string;
  badgeColor: string;
  formLabel: string;
  gatewayNumber: 1 | 2 | 3 | null;
}

function stageMeta(formType: FormType, ltpPeriod: string | null): StageMeta {
  switch (formType) {
    case "F1":
      return {
        badgeText: "ETAPA 1 — PROPUESTA",
        badgeColor: PAE.RED,
        formLabel: "Propuesta",
        gatewayNumber: 1,
      };
    case "F2":
      return {
        badgeText: "ETAPA 2 — DIMENSIONAMIENTO",
        badgeColor: PAE.BLUE,
        formLabel: "Dimensionamiento",
        gatewayNumber: 2,
      };
    case "F3":
      return {
        badgeText: "ETAPA 3 — MVP",
        badgeColor: PAE.GREEN,
        formLabel: "MVP",
        gatewayNumber: 3,
      };
    case "F4":
      return {
        badgeText: `F4 — VISIÓN ANUAL${ltpPeriod ? ` ${ltpPeriod}` : ""}`,
        badgeColor: PAE.GREEN,
        formLabel: "Visión Anual",
        gatewayNumber: null,
      };
    case "F5":
      return {
        badgeText: `F5 — PLANIFICACIÓN ANUAL${ltpPeriod ? ` ${ltpPeriod}` : ""}`,
        badgeColor: PAE.BLUE,
        formLabel: "Planificación Anual",
        gatewayNumber: null,
      };
  }
}

function fechaLabel(fechaIso: string): string {
  try {
    const d = new Date(fechaIso);
    return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  } catch {
    return fechaIso.substring(0, 10);
  }
}

// ────────────────────────────────────────────────────────────────
// Helpers de datos (responses → shapes)
// ────────────────────────────────────────────────────────────────

function readString(responses: Record<string, FormFieldValue>, key: string): string {
  const v = responses[key];
  if (typeof v === "string") return v;
  return "";
}

function readObject(
  responses: Record<string, FormFieldValue>,
  key: string,
): Record<string, unknown> {
  const v = responses[key];
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function readArray(
  responses: Record<string, FormFieldValue>,
  key: string,
): Array<Record<string, unknown>> {
  const v = responses[key];
  if (Array.isArray(v)) return v as Array<Record<string, unknown>>;
  return [];
}

function emptyOrDash(v: string): string {
  return v && v.trim().length > 0 ? v : "—";
}

// ────────────────────────────────────────────────────────────────
// Helpers de layout (reutilizables)
// ────────────────────────────────────────────────────────────────

type Slide = PptxGenJS.Slide;

function addFooter(slide: Slide, n: number, total: number): void {
  slide.addShape("line", {
    x: MARGIN,
    y: SLIDE_H - 0.45,
    w: CONTENT_W,
    h: 0,
    line: { color: PAE.MID_GRAY, width: 0.5 },
  });
  slide.addText("Pan American Energy — Transformación Digital", {
    x: MARGIN,
    y: SLIDE_H - 0.4,
    w: 5,
    h: 0.3,
    fontSize: 7,
    fontFace: PAE.FONT,
    color: PAE.TEXT_MUTED,
    margin: 0,
  });
  slide.addText(`${n} / ${total}`, {
    x: SLIDE_W - MARGIN - 1.5,
    y: SLIDE_H - 0.4,
    w: 1.5,
    h: 0.3,
    fontSize: 7,
    fontFace: PAE.FONT,
    color: PAE.TEXT_MUTED,
    align: "right",
    margin: 0,
  });
}

function addSectionHeader(slide: Slide, num: number, title: string): void {
  slide.addShape("ellipse", {
    x: MARGIN,
    y: 0.35,
    w: 0.35,
    h: 0.35,
    fill: { color: PAE.BLUE },
  });
  slide.addText(String(num), {
    x: MARGIN,
    y: 0.35,
    w: 0.35,
    h: 0.35,
    fontSize: 12,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    align: "center",
    valign: "middle",
    bold: true,
    margin: 0,
  });
  slide.addText(title, {
    x: MARGIN + 0.5,
    y: 0.3,
    w: CONTENT_W - 0.5,
    h: 0.45,
    fontSize: 20,
    fontFace: PAE.FONT,
    color: PAE.DARK,
    bold: true,
    margin: 0,
  });
}

function addSlideTitle(slide: Slide, title: string, subtitle?: string): void {
  slide.addText(title, {
    x: MARGIN,
    y: 0.3,
    w: CONTENT_W,
    h: 0.55,
    fontSize: 22,
    fontFace: PAE.FONT,
    color: PAE.DARK,
    bold: true,
    margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: MARGIN,
      y: 0.85,
      w: CONTENT_W,
      h: 0.35,
      fontSize: 11,
      fontFace: PAE.FONT,
      color: PAE.TEXT_SECONDARY,
      margin: 0,
    });
  }
}

type TableCell = { text: string; options: PptxGenJS.TableCellProps };

function headerCell(text: string, bg: string, align: "left" | "center" | "right" = "left"): TableCell {
  return {
    text,
    options: {
      fill: { color: bg },
      color: PAE.WHITE,
      bold: true,
      fontSize: 9,
      fontFace: PAE.FONT,
      align,
      valign: "middle",
    },
  };
}

function bodyCell(
  text: string,
  altRow: boolean,
  opts?: Partial<PptxGenJS.TableCellProps>,
): TableCell {
  return {
    text: emptyOrDash(text),
    options: {
      fill: { color: altRow ? PAE.LIGHT_GRAY : PAE.WHITE },
      color: PAE.TEXT_PRIMARY,
      fontSize: 8,
      fontFace: PAE.FONT,
      valign: "middle",
      ...opts,
    },
  };
}

// ────────────────────────────────────────────────────────────────
// Renderers específicos por sección conocida
// ────────────────────────────────────────────────────────────────

function renderDoloresTable(
  slide: Slide,
  rows: Array<Record<string, unknown>>,
  columns: readonly TableColumnDef[],
): void {
  // Columnas esperadas: stakeholder, dolor, metrica, dato_inicio, target, prioridad
  const colKeys = columns.map((c) => c.key);
  const header = columns.map((c) => headerCell(c.label, PAE.BLUE));
  const data = rows.length === 0 ? [emptyRow(colKeys.length)] : rows.map((r, i) => {
    const alt = i % 2 === 0;
    return colKeys.map((k) => {
      const val = sanitizeText(r[k]);
      if (k === "prioridad") {
        const color = val === "Alta" ? PAE.RED : val === "Baja" ? PAE.GREEN : PAE.BLUE;
        return bodyCell(val, alt, { color, bold: true, align: "center" });
      }
      if (k === "target") {
        return bodyCell(val, alt, { color: PAE.GREEN, bold: true, align: "center" });
      }
      if (k === "dato_inicio") {
        return bodyCell(val, alt, { align: "center" });
      }
      return bodyCell(val, alt);
    });
  });

  slide.addTable([header, ...data], {
    x: MARGIN,
    y: 1.0,
    w: CONTENT_W,
    border: { type: "solid", pt: 0.5, color: PAE.MID_GRAY },
    fontSize: 8,
    fontFace: PAE.FONT,
    autoPage: false,
  });
}

function emptyRow(cols: number): TableCell[] {
  const row: TableCell[] = [];
  for (let i = 0; i < cols; i++) {
    row.push({
      text: i === 0 ? "— Sin datos cargados —" : "",
      options: {
        fill: { color: PAE.WHITE },
        color: PAE.TEXT_MUTED,
        italic: true,
        fontSize: 8,
        fontFace: PAE.FONT,
        valign: "middle",
      },
    });
  }
  return row;
}

function renderCorrientesSN(
  slide: Slide,
  rows: Array<Record<string, unknown>>,
): void {
  // Cards 3 x N con dot S/N.
  const cardW = (CONTENT_W - 0.6) / 3;
  const cardH = 1.1;
  const startY = 1.05;

  rows.slice(0, 9).forEach((cv, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = MARGIN + col * (cardW + 0.3);
    const y = startY + row * (cardH + 0.2);
    const impacto = sanitizeText(cv["con_impacto"]).toUpperCase();
    const name = sanitizeText(cv["corriente"]);
    const detalle = sanitizeText(cv["detalle"]);
    const has = impacto === "S";

    slide.addShape("rect", {
      x,
      y,
      w: cardW,
      h: cardH,
      fill: { color: has ? PAE.LIGHT_GRAY : PAE.WHITE },
      line: { color: PAE.MID_GRAY, width: 0.5 },
    });
    slide.addShape("ellipse", {
      x: x + 0.15,
      y: y + 0.15,
      w: 0.2,
      h: 0.2,
      fill: { color: has ? PAE.GREEN : PAE.MID_GRAY },
    });
    slide.addText(has ? "S" : "N", {
      x: x + 0.15,
      y: y + 0.15,
      w: 0.2,
      h: 0.2,
      fontSize: 8,
      fontFace: PAE.FONT,
      color: PAE.WHITE,
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    slide.addText(name || "—", {
      x: x + 0.45,
      y: y + 0.1,
      w: cardW - 0.6,
      h: 0.45,
      fontSize: 10,
      fontFace: PAE.FONT,
      color: has ? PAE.TEXT_PRIMARY : PAE.TEXT_MUTED,
      bold: has,
      valign: "middle",
      margin: 0,
    });
    if (has && detalle) {
      slide.addText(detalle, {
        x: x + 0.45,
        y: y + 0.55,
        w: cardW - 0.6,
        h: cardH - 0.6,
        fontSize: 8,
        fontFace: PAE.FONT,
        color: PAE.TEXT_SECONDARY,
        valign: "top",
        margin: 0,
      });
    } else if (has) {
      slide.addText("Con impacto esperado", {
        x: x + 0.45,
        y: y + 0.6,
        w: cardW - 0.6,
        h: 0.3,
        fontSize: 8,
        fontFace: PAE.FONT,
        color: PAE.GREEN,
        margin: 0,
      });
    }
  });

  slide.addText(
    "En Etapa 2 (Dimensionamiento) se detallan valores cuantificados a 5 años por corriente y palanca de valor.",
    {
      x: MARGIN,
      y: SLIDE_H - 0.75,
      w: CONTENT_W,
      h: 0.25,
      fontSize: 8,
      fontFace: PAE.FONT,
      color: PAE.TEXT_MUTED,
      italic: true,
      margin: 0,
    },
  );
}

function renderJourneyTimeline(
  slide: Slide,
  rows: Array<Record<string, unknown>>,
): void {
  if (rows.length === 0) {
    slide.addText("— Sin hitos cargados —", {
      x: MARGIN,
      y: 2.3,
      w: CONTENT_W,
      h: 0.4,
      fontSize: 12,
      fontFace: PAE.FONT,
      color: PAE.TEXT_MUTED,
      italic: true,
      align: "center",
      margin: 0,
    });
    return;
  }

  const timelineY = 2.0;
  const timelineW = CONTENT_W - 0.5;
  const stepW = timelineW / rows.length;

  slide.addShape("line", {
    x: MARGIN + 0.25,
    y: timelineY + 0.5,
    w: timelineW,
    h: 0,
    line: { color: PAE.BLUE, width: 2 },
  });

  rows.forEach((h, i) => {
    const x = MARGIN + 0.25 + i * stepW;
    const dotColor = i === 0 ? PAE.GREEN : i < 2 ? PAE.BLUE : PAE.TEXT_MUTED;
    const isAbove = i % 2 === 0;
    const textY = isAbove ? timelineY - 0.8 : timelineY + 0.85;
    const fecha = sanitizeText(h["fecha"]);
    const hito = sanitizeText(h["hito"]);

    slide.addShape("ellipse", {
      x: x - 0.12,
      y: timelineY + 0.38,
      w: 0.24,
      h: 0.24,
      fill: { color: dotColor },
      line: { color: PAE.WHITE, width: 2 },
    });
    slide.addShape("line", {
      x,
      y: isAbove ? timelineY + 0.38 : timelineY + 0.62,
      w: 0,
      h: 0.3,
      line: { color: PAE.MID_GRAY, width: 0.5 },
    });

    slide.addText(
      [
        {
          text: fecha || "—",
          options: { fontSize: 8, bold: true, color: PAE.BLUE, breakLine: true },
        },
        { text: hito || "—", options: { fontSize: 8, color: PAE.TEXT_PRIMARY } },
      ],
      {
        x: x - stepW * 0.4,
        y: textY,
        w: stepW * 0.8,
        h: 0.7,
        fontFace: PAE.FONT,
        align: "center",
        valign: isAbove ? "bottom" : "top",
        margin: 0,
      },
    );
  });

  slide.addText(
    "Fechas preliminares sujetas a cambios por alcance, bloqueantes o prioridades.",
    {
      x: MARGIN,
      y: SLIDE_H - 0.75,
      w: CONTENT_W,
      h: 0.25,
      fontSize: 8,
      fontFace: PAE.FONT,
      color: PAE.TEXT_MUTED,
      italic: true,
      margin: 0,
    },
  );
}

// Renderiza tabla genérica (para array_rows con columnas arbitrarias).
function renderGenericTable(
  slide: Slide,
  rows: Array<Record<string, unknown>>,
  columns: readonly TableColumnDef[],
  headerColor: string = PAE.BLUE,
  startY: number = 1.0,
): void {
  const header = columns.map((c) => headerCell(c.label, headerColor));
  const data =
    rows.length === 0
      ? [emptyRow(columns.length)]
      : rows.map((r, i) =>
          columns.map((c) => bodyCell(sanitizeText(r[c.key]), i % 2 === 0)),
        );

  slide.addTable([header, ...data], {
    x: MARGIN,
    y: startY,
    w: CONTENT_W,
    border: { type: "solid", pt: 0.5, color: PAE.MID_GRAY },
    fontSize: 8,
    fontFace: PAE.FONT,
    autoPage: false,
  });
}

function renderTextBlock(
  slide: Slide,
  text: string,
  startY: number = 1.0,
  height: number = SLIDE_H - 1.5,
): void {
  slide.addShape("rect", {
    x: MARGIN,
    y: startY,
    w: 0.05,
    h: height,
    fill: { color: PAE.BLUE },
  });
  slide.addText(emptyOrDash(text), {
    x: MARGIN + 0.2,
    y: startY,
    w: CONTENT_W - 0.25,
    h: height,
    fontSize: 12,
    fontFace: PAE.FONT,
    color: text ? PAE.TEXT_PRIMARY : PAE.TEXT_MUTED,
    lineSpacingMultiple: 1.35,
    valign: "top",
    italic: !text,
    margin: 0,
  });
}

function renderObjectFields(
  slide: Slide,
  data: Record<string, unknown>,
  fields: readonly ObjectFieldDef[],
  startY: number = 1.0,
): void {
  // Si hay 2 campos → 2 cols, si hay más → lista vertical label + value.
  const availableH = SLIDE_H - startY - 0.5;
  const rowH = Math.max(0.45, Math.min(1.2, availableH / Math.max(1, fields.length)));

  fields.forEach((f, i) => {
    const y = startY + i * rowH;
    slide.addText(f.label.toUpperCase(), {
      x: MARGIN,
      y,
      w: 2.8,
      h: 0.3,
      fontSize: 9,
      fontFace: PAE.FONT,
      color: PAE.TEXT_MUTED,
      bold: true,
      margin: 0,
    });
    slide.addText(emptyOrDash(sanitizeText(data[f.key])), {
      x: MARGIN + 2.9,
      y,
      w: CONTENT_W - 2.9,
      h: rowH - 0.05,
      fontSize: 11,
      fontFace: PAE.FONT,
      color: PAE.TEXT_PRIMARY,
      valign: "top",
      lineSpacingMultiple: 1.25,
      margin: 0,
    });
  });
}

function renderMultiBlock(
  slide: Slide,
  data: Record<string, unknown>,
  blocks: readonly Block[],
  startY: number = 1.0,
): void {
  // Renderiza el PRIMER block visible; si hay más, se muestra hint al pie.
  // (Secciones muy largas se paginan en el caller — acá un resumen.)
  if (blocks.length === 0) return;
  const available = SLIDE_H - startY - 0.8;
  const blockH = available / Math.min(blocks.length, 3);

  blocks.slice(0, 3).forEach((b, i) => {
    const y = startY + i * blockH;
    slide.addText(b.type === "text" ? b.label : b.title, {
      x: MARGIN,
      y,
      w: CONTENT_W,
      h: 0.3,
      fontSize: 11,
      fontFace: PAE.FONT,
      color: PAE.BLUE,
      bold: true,
      margin: 0,
    });
    if (b.type === "text") {
      slide.addText(emptyOrDash(sanitizeText(data[b.key])), {
        x: MARGIN,
        y: y + 0.35,
        w: CONTENT_W,
        h: blockH - 0.4,
        fontSize: 10,
        fontFace: PAE.FONT,
        color: PAE.TEXT_PRIMARY,
        lineSpacingMultiple: 1.25,
        valign: "top",
        margin: 0,
      });
    } else {
      const rows = Array.isArray(data[b.key])
        ? (data[b.key] as Array<Record<string, unknown>>)
        : [];
      const preview = rows.length > 0 ? `${rows.length} fila${rows.length === 1 ? "" : "s"} cargada(s)` : "— Sin filas —";
      slide.addText(preview, {
        x: MARGIN,
        y: y + 0.35,
        w: CONTENT_W,
        h: blockH - 0.4,
        fontSize: 10,
        fontFace: PAE.FONT,
        color: rows.length > 0 ? PAE.TEXT_SECONDARY : PAE.TEXT_MUTED,
        italic: rows.length === 0,
        valign: "top",
        margin: 0,
      });
    }
  });

  if (blocks.length > 3) {
    slide.addText(`+ ${blocks.length - 3} bloque(s) adicional(es) en el formulario completo`, {
      x: MARGIN,
      y: SLIDE_H - 0.75,
      w: CONTENT_W,
      h: 0.25,
      fontSize: 8,
      fontFace: PAE.FONT,
      color: PAE.TEXT_MUTED,
      italic: true,
      margin: 0,
    });
  }
}

// Renderiza multi_table en slides múltiples (una tabla por slide si es grande,
// o todas en la misma si son chicas). Devuelve cuántos slides se agregaron.
function renderMultiTable(
  pres: PptxGenJS,
  section: WizardSection & { shape: "multi_table" },
  data: Record<string, unknown>,
  totalSlides: number,
  baseNum: number,
  footerIndex: { current: number },
): void {
  // Una tabla por slide — más legible.
  section.tables.forEach((t, idx) => {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, baseNum, `${section.title} — ${t.title}`);
    const rows = Array.isArray(data[t.key])
      ? (data[t.key] as Array<Record<string, unknown>>)
      : [];
    const color =
      idx === 0 ? PAE.BLUE : idx === 1 ? PAE.RED : PAE.GREEN;
    renderGenericTable(slide, rows, t.columns, color, 1.05);
    if (t.description) {
      slide.addText(t.description, {
        x: MARGIN,
        y: SLIDE_H - 0.75,
        w: CONTENT_W,
        h: 0.25,
        fontSize: 8,
        fontFace: PAE.FONT,
        color: PAE.TEXT_MUTED,
        italic: true,
        margin: 0,
      });
    }
    addFooter(slide, footerIndex.current, totalSlides);
    footerIndex.current++;
  });
}

// ────────────────────────────────────────────────────────────────
// Slide 1 — Portada
// ────────────────────────────────────────────────────────────────

function addPortada(pres: PptxGenJS, input: PptxFormularioInput, meta: StageMeta): void {
  const slide = pres.addSlide();
  slide.background = { color: PAE.DARK };

  // Barra superior roja
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.06,
    fill: { color: PAE.RED },
  });

  // Badge de etapa
  slide.addShape("roundRect", {
    x: MARGIN,
    y: 1.0,
    w: 2.2,
    h: 0.38,
    fill: { color: meta.badgeColor },
    rectRadius: 0.05,
    line: { type: "none" },
  });
  slide.addText(meta.badgeText, {
    x: MARGIN,
    y: 1.0,
    w: 2.2,
    h: 0.38,
    fontSize: 9,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    bold: true,
    align: "center",
    valign: "middle",
    margin: 0,
  });

  // Título
  slide.addText(input.initiative_name, {
    x: MARGIN,
    y: 1.55,
    w: 7,
    h: 1.3,
    fontSize: 30,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    bold: true,
    margin: 0,
  });

  // Metadata
  slide.addText(
    [
      {
        text: `Dimensión: ${input.dimension || "—"}`,
        options: { fontSize: 12, color: PAE.MID_GRAY, breakLine: true },
      },
      ...(input.unidad_gestion
        ? [
            {
              text: `UG: ${input.unidad_gestion}`,
              options: { fontSize: 11, color: PAE.TEXT_MUTED, breakLine: true },
            },
          ]
        : []),
      ...(input.tipo_iniciativa
        ? [
            {
              text: `Tipo: ${input.tipo_iniciativa}  |  ${fechaLabel(input.fecha_iso)}  |  ${input.version_label}`,
              options: { fontSize: 11, color: PAE.TEXT_MUTED },
            },
          ]
        : [
            {
              text: `${fechaLabel(input.fecha_iso)}  |  ${input.version_label}`,
              options: { fontSize: 11, color: PAE.TEXT_MUTED },
            },
          ]),
    ],
    {
      x: MARGIN,
      y: 3.1,
      w: 7,
      h: 1.0,
      fontFace: PAE.FONT,
      margin: 0,
    },
  );

  // Línea verde decorativa
  slide.addShape("rect", {
    x: SLIDE_W - 0.4,
    y: 0.8,
    w: 0.05,
    h: 3.5,
    fill: { color: PAE.GREEN },
  });

  // Footer
  slide.addText("Pan American Energy", {
    x: MARGIN,
    y: SLIDE_H - 0.7,
    w: 4,
    h: 0.4,
    fontSize: 14,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    bold: true,
    margin: 0,
  });
  slide.addText("Plataforma de Gestión de Portfolio — Transformación Digital", {
    x: MARGIN,
    y: SLIDE_H - 0.35,
    w: 5.5,
    h: 0.3,
    fontSize: 8,
    fontFace: PAE.FONT,
    color: PAE.TEXT_MUTED,
    margin: 0,
  });

  if (meta.gatewayNumber) {
    slide.addText(`Gateway ${meta.gatewayNumber}`, {
      x: SLIDE_W - MARGIN - 2,
      y: SLIDE_H - 0.7,
      w: 2,
      h: 0.4,
      fontSize: 11,
      fontFace: PAE.FONT,
      color: PAE.TEXT_MUTED,
      align: "right",
      margin: 0,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// Slide N — Cierre "Próximos Pasos"
// ────────────────────────────────────────────────────────────────

const PROXIMOS_PASOS: Record<FormType, string[]> = {
  F1: [
    "Presentación en reunión de Gateway 1 con sponsors y stakeholders",
    "Obtener aprobación unánime para avanzar a Etapa 2 — Dimensionamiento",
    "Definir líder de siguiente etapa (Promotor, LD o PO)",
    "Asignar equipo de dimensionamiento y aprobadores para Gateway 2",
    "Iniciar relevamiento técnico detallado y estudio de factibilidad",
  ],
  F2: [
    "Presentación en reunión de Gateway 2 con sponsors y aprobadores",
    "Obtener aprobación para avanzar a Etapa 3 — MVP",
    "Confirmar Product Owner para la etapa MVP",
    "Definir alcance y métricas del piloto / MVP",
    "Iniciar desarrollo del Mínimo Producto Viable",
  ],
  F3: [
    "Presentación de resultados del MVP en Gateway 3",
    "Decisión: escalar, iterar, pausar o cancelar",
    "Si aprobado: iniciar Delivery y plan de rollout",
    "Activar ciclo anual F4 — Visión Anual",
    "Configurar indicadores de seguimiento continuo",
  ],
  F4: [
    "Validar visión anual con sponsors y stakeholders",
    "Asignar recursos y confirmar % de dedicación",
    "Iniciar planificación detallada en F5",
    "Configurar seguimiento periódico de indicadores",
    "Programar próxima revisión del ciclo anual",
  ],
  F5: [
    "Iniciar ejecución del primer entregable planificado",
    "Configurar seguimiento mensual de indicadores",
    "Alinear equipo con roles y % de dedicación",
    "Revisar riesgos y plan de mitigación",
    "Actualizar avance y estado en la plataforma",
  ],
};

function addProximosPasos(
  pres: PptxGenJS,
  input: PptxFormularioInput,
  meta: StageMeta,
): void {
  const slide = pres.addSlide();
  slide.background = { color: PAE.DARK };

  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.06,
    fill: { color: PAE.RED },
  });

  slide.addText("Próximos Pasos", {
    x: MARGIN,
    y: 0.7,
    w: CONTENT_W,
    h: 0.6,
    fontSize: 26,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    bold: true,
    margin: 0,
  });

  const steps = PROXIMOS_PASOS[input.form_type];
  steps.forEach((step, i) => {
    const y = 1.55 + i * 0.6;
    slide.addShape("ellipse", {
      x: MARGIN,
      y,
      w: 0.3,
      h: 0.3,
      fill: { color: i === 0 ? PAE.RED : PAE.BLUE },
    });
    slide.addText(String(i + 1), {
      x: MARGIN,
      y,
      w: 0.3,
      h: 0.3,
      fontSize: 11,
      fontFace: PAE.FONT,
      color: PAE.WHITE,
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    slide.addText(step, {
      x: MARGIN + 0.5,
      y,
      w: CONTENT_W - 0.5,
      h: 0.32,
      fontSize: 12,
      fontFace: PAE.FONT,
      color: PAE.WHITE,
      valign: "middle",
      margin: 0,
    });
  });

  slide.addShape("rect", {
    x: SLIDE_W - 0.4,
    y: 0.8,
    w: 0.05,
    h: 3.5,
    fill: { color: PAE.GREEN },
  });

  slide.addText("Pan American Energy", {
    x: MARGIN,
    y: SLIDE_H - 0.7,
    w: 4,
    h: 0.4,
    fontSize: 14,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    bold: true,
    margin: 0,
  });
  slide.addText(
    `${input.initiative_name} — ${meta.formLabel} — ${fechaLabel(input.fecha_iso)}`,
    {
      x: MARGIN,
      y: SLIDE_H - 0.35,
      w: 7,
      h: 0.3,
      fontSize: 8,
      fontFace: PAE.FONT,
      color: PAE.TEXT_MUTED,
      margin: 0,
    },
  );
}

// ────────────────────────────────────────────────────────────────
// Render de una sección (despacha según key + shape)
// ────────────────────────────────────────────────────────────────

// Override por section.key — renderers especiales.
function renderSectionSpecial(
  slide: Slide,
  section: WizardSection,
  responses: Record<string, FormFieldValue>,
): boolean {
  // Dolores / indicadores de impacto
  if (
    section.key === "seccion_3_necesidad_oportunidad" &&
    section.shape === "array_rows"
  ) {
    addSectionHeader(slide, section.number, "Indicadores de Impacto");
    renderDoloresTable(slide, readArray(responses, section.key), section.columns);
    return true;
  }

  // Corrientes de valor S/N (F1)
  if (
    section.key === "seccion_6_impacto_economico_corrientes" &&
    section.shape === "array_rows"
  ) {
    addSectionHeader(slide, section.number, "Impacto Económico — Corrientes de Valor");
    renderCorrientesSN(slide, readArray(responses, section.key));
    return true;
  }

  // Journey / hitos (F1)
  if (
    section.key === "seccion_8_journey_hitos" &&
    section.shape === "array_rows"
  ) {
    addSectionHeader(slide, section.number, "Journey / Hitos Preliminares");
    renderJourneyTimeline(slide, readArray(responses, section.key));
    return true;
  }

  return false;
}

function renderSectionGeneric(
  slide: Slide,
  section: WizardSection,
  responses: Record<string, FormFieldValue>,
): void {
  addSectionHeader(slide, section.number, section.title);

  if (section.shape === "string") {
    renderTextBlock(slide, readString(responses, section.key), 1.0, SLIDE_H - 1.6);
    return;
  }

  if (section.shape === "object") {
    renderObjectFields(slide, readObject(responses, section.key), section.fields, 1.05);
    return;
  }

  if (section.shape === "array_rows") {
    renderGenericTable(
      slide,
      readArray(responses, section.key),
      section.columns,
      PAE.BLUE,
      1.05,
    );
    return;
  }

  if (section.shape === "object_with_table") {
    const data = readObject(responses, section.key);
    // Fields arriba (compacto), tabla abajo.
    let y = 1.0;
    const fieldH = 0.9;
    section.fields.forEach((f) => {
      slide.addText(f.label.toUpperCase(), {
        x: MARGIN,
        y,
        w: CONTENT_W,
        h: 0.25,
        fontSize: 9,
        fontFace: PAE.FONT,
        color: PAE.RED,
        bold: true,
        margin: 0,
      });
      slide.addText(emptyOrDash(sanitizeText(data[f.key])), {
        x: MARGIN,
        y: y + 0.28,
        w: CONTENT_W,
        h: fieldH - 0.3,
        fontSize: 10,
        fontFace: PAE.FONT,
        color: PAE.TEXT_PRIMARY,
        lineSpacingMultiple: 1.2,
        valign: "top",
        margin: 0,
      });
      y += fieldH;
    });
    // Tabla
    slide.addText(section.table.title, {
      x: MARGIN,
      y,
      w: CONTENT_W,
      h: 0.25,
      fontSize: 10,
      fontFace: PAE.FONT,
      color: PAE.BLUE,
      bold: true,
      margin: 0,
    });
    const rows = Array.isArray(data[section.table.key])
      ? (data[section.table.key] as Array<Record<string, unknown>>)
      : [];
    renderGenericTable(slide, rows, section.table.columns, PAE.BLUE, y + 0.3);
    return;
  }

  if (section.shape === "multi_block") {
    renderMultiBlock(slide, readObject(responses, section.key), section.blocks, 1.05);
    return;
  }
}

// ────────────────────────────────────────────────────────────────
// Función principal
// ────────────────────────────────────────────────────────────────

export async function generateFormularioPPTX(
  input: PptxFormularioInput,
): Promise<Blob> {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Plataforma PAE — Gestión de Portfolio";
  const meta = stageMeta(input.form_type, input.ltp_period);
  pres.title = `${meta.formLabel} — ${input.initiative_name}`;
  pres.subject = `Formulario ${input.form_type}${meta.gatewayNumber ? ` para Gateway ${meta.gatewayNumber}` : ""}`;

  const sections = SECTIONS_BY_TYPE[input.form_type];

  // Contamos slides antes para footer "N / total".
  // 1 portada + N sections (multi_table expande por cada sub-tabla) + 1 cierre.
  let totalSections = 0;
  for (const s of sections) {
    if (s.shape === "multi_table") totalSections += s.tables.length;
    else totalSections += 1;
  }
  const TOTAL = 1 + totalSections + 1;

  // Slide 1 — Portada (sin footer)
  addPortada(pres, input, meta);

  // Slides 2..N-1 — Secciones
  const footerIndex = { current: 2 };
  for (const section of sections) {
    if (section.shape === "multi_table") {
      renderMultiTable(pres, section, readObject(input.responses, section.key), TOTAL, section.number, footerIndex);
      continue;
    }
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    const handled = renderSectionSpecial(slide, section, input.responses);
    if (!handled) {
      renderSectionGeneric(slide, section, input.responses);
    }
    addFooter(slide, footerIndex.current, TOTAL);
    footerIndex.current++;
  }

  // Slide final — Próximos Pasos
  addProximosPasos(pres, input, meta);

  const buf = (await pres.write({ outputType: "arraybuffer" })) as ArrayBuffer;
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

export function getFormularioFileName(input: PptxFormularioInput): string {
  const meta = stageMeta(input.form_type, input.ltp_period);
  const safe = safeFileSegment(input.initiative_name);
  const period = input.ltp_period ? `_${input.ltp_period}` : "";
  const label = safeFileSegment(meta.formLabel, 20);
  return `PAE_${input.form_type}_${label}_${safe}${period}.pptx`;
}

// Conveniencia: genera y descarga.
export async function downloadFormularioPPTX(input: PptxFormularioInput): Promise<void> {
  const blob = await generateFormularioPPTX(input);
  downloadBlob(blob, getFormularioFileName(input));
}
