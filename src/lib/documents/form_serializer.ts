// Serializa un formulario (WizardSection[] + responses) a una estructura
// intermedia neutra (filas con estilo), que luego se renderiza a XLSX o PDF.
// Es genérico: no conoce F1/F2/.../F5, solo el shape de las secciones.

import type {
  Block,
  ObjectFieldDef,
  TableColumnDef,
  WizardSection,
} from "@/data/form_definitions/_shared";
import type { FormFieldValue } from "@/types";

export interface DocMeta {
  initiative_name: string;
  form_label: string;       // "F1 — Propuesta"
  etapa_label: string;      // "Etapa 1" | "LTP — Junio 2026"
  version_label: string;    // "Borrador" | "PRE-GATEWAY" | "Versión Final"
  fecha: string;            // ISO string
  author_name: string | null;
}

export type CellKind =
  | "title"        // H1, formulario / iniciativa
  | "subtitle"     // H2, metadata
  | "section"      // título de sección
  | "question"     // label/pregunta
  | "answer"       // valor
  | "table-header"
  | "table-cell"
  | "empty";

export interface DocCell {
  value: string;
  kind: CellKind;
  colspan?: number;
}

export type DocRow = DocCell[];

export interface DocTable {
  kind: "table";
  rows: DocRow[];
}

export interface DocStructure {
  meta: DocMeta;
  rows: DocRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function stringifyPrimitive(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function emptyRow(): DocRow {
  return [{ value: "", kind: "empty" }];
}

function sectionTitleRow(num: number, title: string): DocRow {
  return [{ value: `${num}. ${title}`, kind: "section", colspan: 2 }];
}

function qaRow(question: string, answer: string): DocRow {
  return [
    { value: question, kind: "question" },
    { value: answer, kind: "answer" },
  ];
}

function tableHeaderRow(columns: readonly TableColumnDef[]): DocRow {
  return columns.map((c) => ({ value: c.label, kind: "table-header" as const }));
}

function tableBodyRow(
  columns: readonly TableColumnDef[],
  row: unknown,
): DocRow {
  const obj =
    row && typeof row === "object" && !Array.isArray(row)
      ? (row as Record<string, unknown>)
      : {};
  return columns.map((c) => ({
    value: stringifyPrimitive(obj[c.key]),
    kind: "table-cell" as const,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Serializadores por shape
// ─────────────────────────────────────────────────────────────────────────────

function serializeStringSection(
  section: Extract<WizardSection, { shape: "string" }>,
  value: FormFieldValue,
): DocRow[] {
  const text = typeof value === "string" ? value : "";
  return [qaRow(section.description ?? section.title, text)];
}

function serializeObjectFields(
  fields: readonly ObjectFieldDef[],
  value: unknown,
): DocRow[] {
  const obj =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return fields.map((f) => qaRow(f.label, stringifyPrimitive(obj[f.key])));
}

function serializeTable(
  title: string | null,
  columns: readonly TableColumnDef[],
  value: unknown,
): DocRow[] {
  const rows: DocRow[] = [];
  if (title) {
    rows.push([{ value: title, kind: "question", colspan: columns.length }]);
  }
  rows.push(tableHeaderRow(columns));
  const arr = Array.isArray(value) ? value : [];
  if (arr.length === 0) {
    rows.push(
      columns.map((_, i) => ({
        value: i === 0 ? "(sin filas)" : "",
        kind: "table-cell" as const,
      })),
    );
  } else {
    for (const r of arr) rows.push(tableBodyRow(columns, r));
  }
  return rows;
}

function serializeBlock(block: Block, value: unknown): DocRow[] {
  if (block.type === "text") {
    const text = typeof value === "string" ? value : "";
    return [qaRow(block.label, text)];
  }
  return serializeTable(block.title, block.columns, value);
}

function serializeSection(
  section: WizardSection,
  value: FormFieldValue,
): DocRow[] {
  const header = sectionTitleRow(section.number, section.title);
  const rows: DocRow[] = [header];

  if (section.shape === "string") {
    rows.push(...serializeStringSection(section, value));
  } else if (section.shape === "object") {
    rows.push(...serializeObjectFields(section.fields, value));
  } else if (section.shape === "array_rows") {
    rows.push(...serializeTable(null, section.columns, value));
  } else if (section.shape === "multi_table") {
    const obj =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    for (const t of section.tables) {
      rows.push(...serializeTable(t.title, t.columns, obj[t.key]));
      rows.push(emptyRow());
    }
  } else if (section.shape === "object_with_table") {
    const obj =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    rows.push(...serializeObjectFields(section.fields, value));
    rows.push(emptyRow());
    rows.push(
      ...serializeTable(section.table.title, section.table.columns, obj[section.table.key]),
    );
  } else if (section.shape === "multi_block") {
    const obj =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    for (const b of section.blocks) {
      rows.push(...serializeBlock(b, obj[b.key]));
      rows.push(emptyRow());
    }
  }

  rows.push(emptyRow());
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────────────

export function serializeForm(
  sections: readonly WizardSection[],
  responses: Readonly<Record<string, FormFieldValue>>,
  meta: DocMeta,
): DocStructure {
  const rows: DocRow[] = [];

  // Portada / metadata
  rows.push([{ value: meta.initiative_name, kind: "title", colspan: 2 }]);
  rows.push([{ value: meta.form_label, kind: "subtitle", colspan: 2 }]);
  rows.push([{ value: meta.etapa_label, kind: "subtitle", colspan: 2 }]);
  rows.push([
    { value: "Versión", kind: "question" },
    { value: meta.version_label, kind: "answer" },
  ]);
  rows.push([
    { value: "Fecha", kind: "question" },
    { value: formatDate(meta.fecha), kind: "answer" },
  ]);
  rows.push([
    { value: "Autor", kind: "question" },
    { value: meta.author_name ?? "—", kind: "answer" },
  ]);
  rows.push(emptyRow());

  for (const section of sections) {
    rows.push(...serializeSection(section, responses[section.key] ?? null));
  }

  return { meta, rows };
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTimeForFilename(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
      d.getHours(),
    )}-${pad(d.getMinutes())}`;
  } catch {
    return iso.replace(/[:.]/g, "-");
  }
}
