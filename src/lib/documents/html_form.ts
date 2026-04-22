// Renderiza la estructura serializada como HTML. Reutilizable para:
// - Preview dentro de la app (tabla HTML)
// - Input de html2pdf.js para generar PDF

import type { DocCell, DocStructure } from "./form_serializer";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cellStyle(kind: DocCell["kind"]): string {
  const base = "padding:6px 10px;vertical-align:top;border:1px solid #DDDDDD;font-family:Inter,Arial,sans-serif;";
  if (kind === "title")
    return base + "font-size:20px;font-weight:700;color:#003DA5;border:none;padding:12px 0;";
  if (kind === "subtitle")
    return base + "font-size:13px;font-weight:600;color:#666;border:none;padding:2px 0;";
  if (kind === "section")
    return base + "font-size:14px;font-weight:700;color:#fff;background:#003DA5;padding:10px;";
  if (kind === "question")
    return base + "font-size:12px;font-weight:600;color:#333;background:#EBF0F7;width:30%;";
  if (kind === "answer")
    return base + "font-size:12px;color:#333;white-space:pre-wrap;";
  if (kind === "table-header")
    return base + "font-size:11px;font-weight:700;color:#fff;background:#003DA5;";
  if (kind === "table-cell")
    return base + "font-size:11px;color:#333;white-space:pre-wrap;";
  return base + "border:none;padding:4px 0;";
}

export function renderDocAsHtml(doc: DocStructure, logoDataUrl?: string): string {
  const lines: string[] = [];
  lines.push(`<div style="font-family:Inter,Arial,sans-serif;color:#333;padding:24px;max-width:980px;margin:0 auto;background:#fff;">`);

  // Header con logo
  lines.push(`<div style="display:flex;align-items:center;gap:16px;border-bottom:4px solid #C8102E;padding-bottom:12px;margin-bottom:16px;">`);
  if (logoDataUrl) {
    lines.push(
      `<img src="${escapeHtml(logoDataUrl)}" alt="PAE" style="height:40px;width:auto;"/>`,
    );
  } else {
    lines.push(
      `<div style="font-weight:800;font-size:22px;color:#003DA5;">PAE</div>`,
    );
  }
  lines.push(
    `<div style="font-size:13px;color:#666;">Gestión de Portfolio</div>`,
  );
  lines.push(`</div>`);

  // Tabla principal
  lines.push(`<table style="border-collapse:collapse;width:100%;">`);
  for (const row of doc.rows) {
    lines.push(`<tr>`);
    for (const cell of row) {
      const colspan = cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : "";
      lines.push(
        `<td${colspan} style="${cellStyle(cell.kind)}">${escapeHtml(cell.value)}</td>`,
      );
    }
    lines.push(`</tr>`);
  }
  lines.push(`</table>`);
  lines.push(`</div>`);
  return lines.join("");
}
