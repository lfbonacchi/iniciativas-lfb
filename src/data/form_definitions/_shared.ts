// Tipos y helpers compartidos para las definiciones de wizard (F1..F5).
// Cada sección se persiste como un único FormResponse (clave = key de sección)
// cuyo valor es un blob (string, objeto o array), replicando el shape usado
// en src/data/seed.ts.

export type SectionValueShape =
  | "string"
  | "object"
  | "array_rows"
  | "multi_table"
  | "object_with_table"
  | "multi_block";

export interface TableColumnDef {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select";
  options?: readonly string[];
  width?: string;
}

export interface ObjectFieldDef {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select";
  hint?: string;
  placeholder?: string;
  options?: readonly string[];
  rows?: number;
}

interface BaseSection {
  key: string;
  number: number;
  title: string;
  description?: string;
  // Si es true, al abrir el wizard la sección se pre-carga con el valor
  // de la MISMA `key` en el formulario origen (F2 VF para F3, F3 VF o F4
  // del año anterior para F4, F4 del ciclo actual o F5 del año anterior
  // para F5). El resolver vive en el wizard (no en la definición).
  carries_over?: boolean;
}

export interface StringSection extends BaseSection {
  shape: "string";
  kind: "textarea";
  placeholder?: string;
  rows?: number;
}

export interface ObjectSection extends BaseSection {
  shape: "object";
  fields: readonly ObjectFieldDef[];
}

export interface TableSection extends BaseSection {
  shape: "array_rows";
  columns: readonly TableColumnDef[];
  fixed_rows?: ReadonlyArray<Readonly<Record<string, string>>>;
  add_row_label?: string;
  row_default?: Readonly<Record<string, string>>;
}

export interface MultiTableSection extends BaseSection {
  shape: "multi_table";
  tables: ReadonlyArray<{
    key: string;
    title: string;
    description?: string;
    columns: readonly TableColumnDef[];
    add_row_label?: string;
    row_default?: Readonly<Record<string, string>>;
  }>;
}

export interface ObjectWithTableSection extends BaseSection {
  shape: "object_with_table";
  fields: readonly ObjectFieldDef[];
  table: {
    key: string;
    title: string;
    description?: string;
    columns: readonly TableColumnDef[];
    add_row_label?: string;
    row_default?: Readonly<Record<string, string>>;
  };
}

// Bloques para secciones con contenido heterogéneo (textareas + tablas)
// como "Planificación de la Implementación" de F4/F5.
export interface TextBlock {
  type: "text";
  key: string;
  label: string;
  hint?: string;
  rows?: number;
}
export interface TableBlock {
  type: "table";
  key: string;
  title: string;
  description?: string;
  columns: readonly TableColumnDef[];
  add_row_label?: string;
  row_default?: Readonly<Record<string, string>>;
}
export type Block = TextBlock | TableBlock;

export interface MultiBlockSection extends BaseSection {
  shape: "multi_block";
  blocks: readonly Block[];
}

export type WizardSection =
  | StringSection
  | ObjectSection
  | TableSection
  | MultiTableSection
  | ObjectWithTableSection
  | MultiBlockSection;

// Completitud a nivel sección: devuelve true si la sección tiene contenido
// "suficiente" para contar como completada (stepper y % de avance).
export function isSectionComplete(
  section: WizardSection,
  value: unknown,
): boolean {
  if (value === null || value === undefined) return false;

  if (section.shape === "string") {
    return typeof value === "string" && value.trim().length > 0;
  }

  if (section.shape === "object") {
    if (typeof value !== "object" || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    return section.fields.every((f) => {
      const v = obj[f.key];
      return typeof v === "string" && v.trim().length > 0;
    });
  }

  if (section.shape === "array_rows") {
    if (!Array.isArray(value) || value.length === 0) return false;
    return value.every((row) => {
      if (typeof row !== "object" || row === null) return false;
      const r = row as Record<string, unknown>;
      return section.columns.some(
        (c) =>
          typeof r[c.key] === "string" &&
          (r[c.key] as string).trim().length > 0,
      );
    });
  }

  if (section.shape === "object_with_table") {
    if (typeof value !== "object" || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    const fieldsOk = section.fields.every((f) => {
      const v = obj[f.key];
      return typeof v === "string" && v.trim().length > 0;
    });
    const tableValue = obj[section.table.key];
    const tableOk = Array.isArray(tableValue) && tableValue.length > 0;
    return fieldsOk && tableOk;
  }

  if (section.shape === "multi_table") {
    if (typeof value !== "object" || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    return section.tables.every((t) => {
      const arr = obj[t.key];
      return Array.isArray(arr) && arr.length > 0;
    });
  }

  if (section.shape === "multi_block") {
    if (typeof value !== "object" || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    return section.blocks.every((b) => {
      const v = obj[b.key];
      if (b.type === "text") {
        return typeof v === "string" && v.trim().length > 0;
      }
      return Array.isArray(v) && v.length > 0;
    });
  }

  return false;
}

export function computeCompleteness(
  sections: readonly WizardSection[],
  responses: Readonly<Record<string, unknown>>,
): {
  percent: number;
  completed_count: number;
  total_count: number;
  by_section: Record<string, boolean>;
} {
  const by_section: Record<string, boolean> = {};
  let completed = 0;
  for (const section of sections) {
    const ok = isSectionComplete(section, responses[section.key]);
    by_section[section.key] = ok;
    if (ok) completed++;
  }
  const total = sections.length;
  return {
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed_count: completed,
    total_count: total,
    by_section,
  };
}
