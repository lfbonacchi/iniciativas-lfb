// Generador PPTX del resumen de dashboard (portfolio).
// Browser-side vía pptxgenjs. Recibe los datos ya calculados del dashboard
// y produce un .pptx con portada + KPIs + distribución por etapa + corrientes
// de valor + ranking + eventos + cierre.
//
// Este archivo NO se guarda en documentos — es descarga pura (el dashboard
// es distinto para cada usuario, no queda en la carpeta de iniciativa).
//
// Referencia visual: docs/specs/generate_portfolio_pptx_referencia.js

import PptxGenJS from "pptxgenjs";

import type {
  DashboardData,
  DashboardEvent,
  KpiMetrics,
  RankingRow,
  StageDistribution,
  ValueStream,
} from "@/lib/storage/dashboard";
import type { InitiativeStage } from "@/types";

import {
  PAE,
  SLIDE_W,
  SLIDE_H,
  MARGIN,
  CONTENT_W,
  downloadBlob,
} from "./pptx-constants";

const STAGE_LABEL: Record<InitiativeStage, string> = {
  proposal: "Propuesta",
  dimensioning: "Dimensionamiento",
  mvp: "MVP",
  ltp_tracking: "Delivery",
};

function fmtUsd(n: number): string {
  if (!isFinite(n) || n === 0) return "USD 0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `USD ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `USD ${(n / 1_000).toFixed(0)}K`;
  return `USD ${Math.round(n)}`;
}

function fmtNumber(n: number): string {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function shortStageLabel(s: InitiativeStage): string {
  switch (s) {
    case "proposal":
      return "Propuesta";
    case "dimensioning":
      return "Dim.";
    case "mvp":
      return "MVP";
    case "ltp_tracking":
      return "Del.";
  }
}

// ────────────────────────────────────────────────────────────────
// Slides
// ────────────────────────────────────────────────────────────────

type Slide = PptxGenJS.Slide;

function addTitleRow(s: Slide, title: string, subtitle?: string): void {
  s.addText(title, {
    x: MARGIN,
    y: 0.3,
    w: CONTENT_W,
    h: 0.6,
    fontSize: 24,
    fontFace: PAE.FONT,
    color: PAE.DARK,
    bold: true,
    margin: 0,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: MARGIN,
      y: 0.85,
      w: CONTENT_W,
      h: 0.35,
      fontSize: 12,
      fontFace: PAE.FONT,
      color: PAE.TEXT_SECONDARY,
      margin: 0,
    });
  }
}

function addPortada(pres: PptxGenJS, data: DashboardData, fechaLabel: string): void {
  const s = pres.addSlide();
  s.background = { color: PAE.BLUE };

  // Barra roja decorativa superior
  s.addShape("rect", {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.06,
    fill: { color: PAE.RED },
  });

  s.addText("PAN AMERICAN ENERGY", {
    x: 0.8,
    y: 1.2,
    w: 8.4,
    h: 0.5,
    fontSize: 14,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    charSpacing: 4,
    margin: 0,
  });
  s.addText("Portfolio de Transformación Digital", {
    x: 0.8,
    y: 1.8,
    w: 8.4,
    h: 1.2,
    fontSize: 34,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    bold: true,
    margin: 0,
  });
  s.addText(`Resumen ejecutivo — ${fechaLabel}`, {
    x: 0.8,
    y: 3.1,
    w: 8.4,
    h: 0.5,
    fontSize: 16,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    transparency: 30,
    margin: 0,
  });
  s.addShape("line", {
    x: 0.8,
    y: 4.0,
    w: 2.5,
    h: 0,
    line: { color: PAE.GREEN, width: 3 },
  });
  const scopeLabel =
    data.role_key === "at"
      ? "Área de Transformación Digital"
      : data.role_key === "vp"
        ? `Vicepresidencia — ${data.user.vicepresidencia ?? "—"}`
        : data.role_key === "bo"
          ? "Business Owner"
          : "Product Owner";
  s.addText(scopeLabel, {
    x: 0.8,
    y: 4.2,
    w: 6,
    h: 0.4,
    fontSize: 12,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    transparency: 30,
    margin: 0,
  });
  s.addText(data.user.display_name ?? "", {
    x: 0.8,
    y: 4.75,
    w: 6,
    h: 0.35,
    fontSize: 11,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    transparency: 40,
    margin: 0,
  });
}

function addKpis(pres: PptxGenJS, kpis: KpiMetrics): void {
  const s = pres.addSlide();
  s.background = { color: PAE.WHITE };
  addTitleRow(s, "Métricas clave del portfolio", "Estado consolidado de todas las iniciativas activas");

  const items = [
    { label: "Iniciativas activas", value: String(kpis.total_initiatives), accent: PAE.BLUE },
    { label: "Valor esperado total", value: fmtUsd(kpis.total_value_usd), accent: PAE.GREEN },
    { label: "Gasto acumulado", value: fmtUsd(kpis.total_cost_usd), accent: PAE.BLUE },
    { label: "Gates pendientes", value: String(kpis.gates_pending), accent: PAE.RED },
  ];
  const cardW = (CONTENT_W - 0.6) / 4;
  const cardH = 2.2;
  const y = 1.6;

  items.forEach((kpi, i) => {
    const x = MARGIN + i * (cardW + 0.2);
    s.addShape("rect", {
      x,
      y,
      w: cardW,
      h: cardH,
      fill: { color: PAE.BG_LIGHT },
      line: { color: PAE.MID_GRAY, width: 0.5 },
    });
    s.addShape("rect", {
      x,
      y,
      w: cardW,
      h: 0.05,
      fill: { color: kpi.accent },
    });
    s.addText(kpi.value, {
      x: x + 0.15,
      y: y + 0.6,
      w: cardW - 0.3,
      h: 0.9,
      fontSize: 28,
      fontFace: PAE.FONT,
      color: PAE.DARK,
      bold: true,
      align: "center",
      margin: 0,
    });
    s.addText(kpi.label, {
      x: x + 0.15,
      y: y + 1.55,
      w: cardW - 0.3,
      h: 0.4,
      fontSize: 11,
      fontFace: PAE.FONT,
      color: PAE.TEXT_SECONDARY,
      align: "center",
      margin: 0,
    });
  });

  // Insight
  const roi =
    kpis.total_cost_usd > 0
      ? (kpis.total_value_usd / kpis.total_cost_usd).toFixed(1)
      : "—";
  s.addShape("rect", {
    x: MARGIN,
    y: 4.1,
    w: CONTENT_W,
    h: 0.8,
    fill: { color: PAE.BG_LIGHT },
  });
  s.addText(
    `ROI promedio del portfolio: ${roi}x   |   ${kpis.gates_pending} gate(s) pendiente(s) de votación`,
    {
      x: MARGIN + 0.2,
      y: 4.1,
      w: CONTENT_W - 0.4,
      h: 0.8,
      fontSize: 12,
      fontFace: PAE.FONT,
      color: PAE.TEXT_PRIMARY,
      valign: "middle",
      margin: 0,
    },
  );
}

function addStageDistribution(pres: PptxGenJS, dist: StageDistribution): void {
  const s = pres.addSlide();
  s.background = { color: PAE.WHITE };
  addTitleRow(s, "Distribución por etapa", "Pipeline de maduración de iniciativas");

  const stages: InitiativeStage[] = [
    "proposal",
    "dimensioning",
    "mvp",
    "ltp_tracking",
  ];
  const labels = stages.map((st) => STAGE_LABEL[st]);
  const values = stages.map((st) => dist.by_stage[st] ?? 0);

  s.addChart(
    pres.ChartType.bar,
    [{ name: "Iniciativas", labels, values }],
    {
      x: MARGIN,
      y: 1.4,
      w: 5.2,
      h: 3.6,
      barDir: "bar",
      chartColors: [PAE.BLUE],
      catAxisLabelColor: PAE.TEXT_PRIMARY,
      catAxisLabelFontSize: 11,
      valAxisLabelColor: PAE.TEXT_SECONDARY,
      valAxisLabelFontSize: 9,
      valGridLine: { color: PAE.MID_GRAY, size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelColor: PAE.DARK,
      dataLabelFontSize: 12,
      showLegend: false,
      valAxisHidden: true,
    },
  );

  // Side panel
  const panelX = 6.3;
  s.addShape("rect", {
    x: panelX,
    y: 1.4,
    w: 3.1,
    h: 3.6,
    fill: { color: PAE.BG_LIGHT },
  });
  s.addText("Estado consolidado", {
    x: panelX + 0.2,
    y: 1.55,
    w: 2.8,
    h: 0.4,
    fontSize: 14,
    fontFace: PAE.FONT,
    color: PAE.DARK,
    bold: true,
    margin: 0,
  });

  const totalActive =
    values.reduce((a, b) => a + b, 0);
  const estados = [
    { label: "En progreso", count: totalActive, color: PAE.GREEN },
    { label: "Pausadas", count: dist.paused, color: PAE.AMBER },
    { label: "Rechazadas", count: dist.rejected, color: PAE.TEXT_MUTED },
  ];
  estados.forEach((e, i) => {
    const ey = 2.15 + i * 0.85;
    s.addShape("rect", {
      x: panelX + 0.2,
      y: ey,
      w: 0.12,
      h: 0.55,
      fill: { color: e.color },
    });
    s.addText(String(e.count), {
      x: panelX + 0.4,
      y: ey - 0.05,
      w: 0.8,
      h: 0.5,
      fontSize: 26,
      fontFace: PAE.FONT,
      color: e.color,
      bold: true,
      margin: 0,
    });
    s.addText(e.label, {
      x: panelX + 0.4,
      y: ey + 0.3,
      w: 2.5,
      h: 0.3,
      fontSize: 11,
      fontFace: PAE.FONT,
      color: PAE.TEXT_SECONDARY,
      margin: 0,
    });
  });
}

function addValueStreams(pres: PptxGenJS, streams: readonly ValueStream[]): void {
  const s = pres.addSlide();
  s.background = { color: PAE.WHITE };
  addTitleRow(s, "Corrientes de valor", "Beneficio bruto proyectado — año 1 consolidado");

  if (streams.length === 0) {
    s.addText("Sin corrientes de valor cargadas en el período seleccionado.", {
      x: MARGIN,
      y: 2.5,
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

  const labels = streams.map((v) => v.label);
  const values = streams.map((v) => Number(v.value_usd_y1) / 1_000_000);

  s.addChart(
    pres.ChartType.bar,
    [{ name: "Beneficio bruto (M USD)", labels, values }],
    {
      x: MARGIN,
      y: 1.35,
      w: CONTENT_W,
      h: 3.6,
      barDir: "col",
      chartColors: [PAE.GREEN, PAE.BLUE, PAE.BLUE, PAE.RED, PAE.AMBER, PAE.MID_GRAY],
      catAxisLabelColor: PAE.TEXT_PRIMARY,
      catAxisLabelFontSize: 11,
      valAxisLabelColor: PAE.TEXT_SECONDARY,
      valAxisLabelFontSize: 9,
      valGridLine: { color: PAE.MID_GRAY, size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelColor: PAE.DARK,
      dataLabelFontSize: 11,
      showLegend: false,
    },
  );
}

function addRanking(pres: PptxGenJS, ranking: readonly RankingRow[]): void {
  const s = pres.addSlide();
  s.background = { color: PAE.WHITE };
  addTitleRow(s, "Ranking de iniciativas", "Ordenado por ROI descendente");

  const header = [
    hdr("INICIATIVA", "left"),
    hdr("ETAPA", "center"),
    hdr("VALOR ESP.", "right"),
    hdr("GASTO", "right"),
    hdr("ROI", "center"),
    hdr("GATE", "center"),
  ];

  const rows: Array<Array<{ text: string; options: PptxGenJS.TableCellProps }>> = [header];
  const limit = Math.min(ranking.length, 12);
  for (let i = 0; i < limit; i++) {
    const r = ranking[i]!;
    const alt = i % 2 === 1;
    const bg = alt ? PAE.BG_LIGHT : PAE.WHITE;
    rows.push([
      cell(r.initiative_name, bg, { bold: true }),
      cell(shortStageLabel(r.stage), bg, { align: "center", color: PAE.BLUE }),
      cell(fmtUsd(r.expected_value_usd), bg, { align: "right" }),
      cell(fmtUsd(r.expected_cost_usd), bg, { align: "right" }),
      cell(isFinite(r.roi) ? `${fmtNumber(r.roi)}x` : "—", bg, {
        align: "center",
        bold: true,
      }),
      cell(r.has_pending_gate ? "Pendiente" : "—", bg, {
        align: "center",
        color: r.has_pending_gate ? PAE.RED : PAE.TEXT_MUTED,
        bold: r.has_pending_gate,
      }),
    ]);
  }

  s.addTable(rows, {
    x: MARGIN,
    y: 1.35,
    w: CONTENT_W,
    colW: [3.3, 0.9, 1.4, 1.2, 0.9, 1.1],
    border: { pt: 0.5, color: PAE.MID_GRAY },
    fontSize: 9,
    fontFace: PAE.FONT,
    autoPage: false,
  });

  if (ranking.length > limit) {
    s.addText(`+ ${ranking.length - limit} iniciativa(s) adicional(es) no mostradas por espacio`, {
      x: MARGIN,
      y: SLIDE_H - 0.55,
      w: CONTENT_W,
      h: 0.3,
      fontSize: 8,
      fontFace: PAE.FONT,
      color: PAE.TEXT_MUTED,
      italic: true,
      margin: 0,
    });
  }
}

function hdr(text: string, align: "left" | "center" | "right"): {
  text: string;
  options: PptxGenJS.TableCellProps;
} {
  return {
    text,
    options: {
      fill: { color: PAE.BLUE },
      color: PAE.WHITE,
      bold: true,
      fontSize: 10,
      fontFace: PAE.FONT,
      align,
      valign: "middle",
    },
  };
}

function cell(
  text: string,
  bg: string,
  opts?: Partial<PptxGenJS.TableCellProps>,
): { text: string; options: PptxGenJS.TableCellProps } {
  return {
    text,
    options: {
      fill: { color: bg },
      color: PAE.TEXT_PRIMARY,
      fontSize: 9,
      fontFace: PAE.FONT,
      valign: "middle",
      ...opts,
    },
  };
}

function addEvents(pres: PptxGenJS, events: readonly DashboardEvent[]): void {
  const s = pres.addSlide();
  s.background = { color: PAE.WHITE };
  addTitleRow(s, "Próximos eventos", "Hitos, gates y revisiones programados");

  const visibles = events.slice(0, 5);
  if (visibles.length === 0) {
    s.addText("Sin eventos próximos en el período.", {
      x: MARGIN,
      y: 2.6,
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
  s.addShape("line", {
    x: MARGIN + 0.2,
    y: timelineY + 0.6,
    w: CONTENT_W - 0.4,
    h: 0,
    line: { color: PAE.MID_GRAY, width: 2 },
  });

  const stepW = (CONTENT_W - 0.4) / visibles.length;
  visibles.forEach((evt, i) => {
    const x = MARGIN + 0.2 + i * stepW + stepW / 2;
    const color =
      evt.kind === "gate"
        ? PAE.RED
        : evt.kind === "ltp_plan"
          ? PAE.GREEN
          : PAE.BLUE;
    const tipoLabel =
      evt.kind === "gate"
        ? "Gateway"
        : evt.kind === "sprint_review"
          ? "Sprint Rev"
          : evt.kind === "ltp_plan"
            ? "LTP Plan"
            : evt.kind === "seguimiento"
              ? "Seguimiento"
              : "Entrega";
    const fecha = formatShortDate(evt.date);

    s.addShape("ellipse", {
      x: x - 0.2,
      y: timelineY + 0.4,
      w: 0.4,
      h: 0.4,
      fill: { color },
    });
    s.addText(tipoLabel, {
      x: x - stepW / 2,
      y: timelineY + 1.1,
      w: stepW,
      h: 0.3,
      fontSize: 11,
      fontFace: PAE.FONT,
      color: PAE.DARK,
      bold: true,
      align: "center",
      margin: 0,
    });
    s.addText(evt.initiative_name, {
      x: x - stepW / 2,
      y: timelineY + 1.4,
      w: stepW,
      h: 0.3,
      fontSize: 9,
      fontFace: PAE.FONT,
      color: PAE.BLUE,
      align: "center",
      margin: 0,
    });
    s.addText(fecha, {
      x: x - stepW / 2,
      y: timelineY + 1.7,
      w: stepW,
      h: 0.25,
      fontSize: 9,
      fontFace: PAE.FONT,
      color: PAE.TEXT_SECONDARY,
      align: "center",
      margin: 0,
    });
  });
}

function addClosing(pres: PptxGenJS, fechaLabel: string): void {
  const s = pres.addSlide();
  s.background = { color: PAE.DARK };
  s.addShape("rect", {
    x: 0,
    y: SLIDE_H - 0.06,
    w: SLIDE_W,
    h: 0.06,
    fill: { color: PAE.RED },
  });
  s.addText("PAN AMERICAN ENERGY", {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 0.5,
    fontSize: 14,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    charSpacing: 4,
    transparency: 40,
    margin: 0,
  });
  s.addText("Plataforma de Gestión de Portfolio", {
    x: 0.8,
    y: 2.1,
    w: 8.4,
    h: 1.0,
    fontSize: 30,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    bold: true,
    margin: 0,
  });
  s.addShape("line", {
    x: 0.8,
    y: 3.3,
    w: 2,
    h: 0,
    line: { color: PAE.GREEN, width: 3 },
  });
  s.addText("Generado automáticamente desde la plataforma", {
    x: 0.8,
    y: 3.6,
    w: 8.4,
    h: 0.4,
    fontSize: 12,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    transparency: 40,
    margin: 0,
  });
  s.addText(`Transformación Digital — ${fechaLabel}`, {
    x: 0.8,
    y: 4.0,
    w: 8.4,
    h: 0.4,
    fontSize: 12,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    transparency: 50,
    margin: 0,
  });
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  } catch {
    return iso.substring(0, 10);
  }
}

function fechaLabelNow(): string {
  const d = new Date();
  const s = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ────────────────────────────────────────────────────────────────
// Función principal
// ────────────────────────────────────────────────────────────────

export async function generateDashboardPPTX(data: DashboardData): Promise<Blob> {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Plataforma PAE — Gestión de Portfolio";
  pres.title = "Portfolio Transformación Digital — Resumen";

  const fecha = fechaLabelNow();

  addPortada(pres, data, fecha);
  addKpis(pres, data.kpis);
  addStageDistribution(pres, data.stage_distribution);
  addValueStreams(pres, data.value_streams);
  addRanking(pres, data.ranking);
  addEvents(pres, data.events);
  addClosing(pres, fecha);

  const buf = (await pres.write({ outputType: "arraybuffer" })) as ArrayBuffer;
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

export function getDashboardFileName(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `PAE_Portfolio_Dashboard_${yyyy}-${mm}.pptx`;
}

export async function downloadDashboardPPTX(data: DashboardData): Promise<void> {
  const blob = await generateDashboardPPTX(data);
  downloadBlob(blob, getDashboardFileName());
}
