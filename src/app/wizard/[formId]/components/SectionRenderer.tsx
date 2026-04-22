"use client";

import type {
  F1Section,
  TableColumnDef,
} from "@/data/form_definitions/f1";
import type { FormFieldValue } from "@/types";

import {
  WizardEditableTable,
  WizardSelect,
  WizardTextInput,
  WizardTextarea,
  type EditableTableRow,
} from "./WizardInputs";

// Helpers para castear safely los valores persistidos al shape esperado.

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asObject(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const result: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string") result[k] = val;
  }
  return result;
}

function asRows(v: unknown): EditableTableRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => {
      const out: EditableTableRow = {};
      for (const [k, val] of Object.entries(r)) {
        out[k] = typeof val === "string" ? val : val == null ? "" : String(val);
      }
      return out;
    });
}

function defaultRow(
  columns: readonly TableColumnDef[],
  override?: Readonly<Record<string, string>>,
): EditableTableRow {
  const row: EditableTableRow = {};
  for (const c of columns) row[c.key] = "";
  if (override) Object.assign(row, override);
  return row;
}

interface SectionRendererProps {
  section: F1Section;
  value: FormFieldValue | undefined;
  disabled: boolean;
  onChange: (next: FormFieldValue) => void;
  onBlur: () => void;
}

export function SectionRenderer({
  section,
  value,
  disabled,
  onChange,
  onBlur,
}: SectionRendererProps) {
  if (disabled) {
    return (
      <fieldset disabled className="space-y-6 opacity-70">
        <InnerRenderer
          section={section}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      </fieldset>
    );
  }
  return (
    <InnerRenderer
      section={section}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
    />
  );
}

function InnerRenderer({
  section,
  value,
  onChange,
  onBlur,
}: Omit<SectionRendererProps, "disabled">) {
  if (section.shape === "string") {
    return (
      <WizardTextarea
        value={asString(value)}
        placeholder={section.placeholder}
        rows={section.rows}
        onChange={(v) => onChange(v)}
        onBlur={onBlur}
      />
    );
  }

  if (section.shape === "object") {
    const current = asObject(value);
    const setField = (k: string, v: string) => {
      onChange({ ...current, [k]: v });
    };
    return (
      <div className="space-y-5">
        {section.fields.map((f) => {
          const v = current[f.key] ?? "";
          if (f.kind === "select" && f.options) {
            return (
              <WizardSelect
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={v}
                options={f.options}
                onChange={(nv) => setField(f.key, nv)}
                onBlur={onBlur}
              />
            );
          }
          if (f.kind === "textarea") {
            return (
              <WizardTextarea
                key={f.key}
                label={f.label}
                hint={f.hint}
                placeholder={f.placeholder}
                rows={f.rows}
                value={v}
                onChange={(nv) => setField(f.key, nv)}
                onBlur={onBlur}
              />
            );
          }
          return (
            <WizardTextInput
              key={f.key}
              label={f.label}
              hint={f.hint}
              placeholder={f.placeholder}
              value={v}
              onChange={(nv) => setField(f.key, nv)}
              onBlur={onBlur}
            />
          );
        })}
      </div>
    );
  }

  if (section.shape === "array_rows") {
    const rows: EditableTableRow[] = (() => {
      const parsed = asRows(value);
      if (parsed.length > 0) return parsed;
      if (section.fixed_rows) {
        return section.fixed_rows.map((r) => ({ ...r }));
      }
      return [];
    })();

    const updateCell = (i: number, k: string, v: string) => {
      const next = rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r));
      onChange(next as unknown as FormFieldValue);
    };
    const addRow = () => {
      const next = [...rows, defaultRow(section.columns, section.row_default)];
      onChange(next as unknown as FormFieldValue);
    };
    const removeRow = (i: number) => {
      const next = rows.filter((_, idx) => idx !== i);
      onChange(next as unknown as FormFieldValue);
    };

    const isFixedRows = Boolean(section.fixed_rows);
    return (
      <WizardEditableTable
        columns={section.columns}
        rows={rows}
        onChange={updateCell}
        onBlur={onBlur}
        onAddRow={isFixedRows ? undefined : addRow}
        onRemoveRow={isFixedRows ? undefined : removeRow}
        addRowLabel={section.add_row_label}
        lockFirstColumn={isFixedRows}
      />
    );
  }

  if (section.shape === "object_with_table") {
    const current = asObject(value);
    const rowsValue = (value as Record<string, unknown> | undefined)?.[
      section.table.key
    ];
    const tableRows = asRows(rowsValue);

    const setField = (k: string, v: string) => {
      const next: Record<string, unknown> = {
        ...(value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {}),
        [k]: v,
      };
      onChange(next as FormFieldValue);
    };
    const setTable = (nextRows: EditableTableRow[]) => {
      const next: Record<string, unknown> = {
        ...(value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {}),
        [section.table.key]: nextRows,
      };
      onChange(next as FormFieldValue);
    };

    return (
      <div className="space-y-6">
        {section.fields.map((f) => {
          const v = current[f.key] ?? "";
          if (f.kind === "textarea") {
            return (
              <WizardTextarea
                key={f.key}
                label={f.label}
                hint={f.hint}
                rows={f.rows}
                value={v}
                onChange={(nv) => setField(f.key, nv)}
                onBlur={onBlur}
              />
            );
          }
          return (
            <WizardTextInput
              key={f.key}
              label={f.label}
              hint={f.hint}
              value={v}
              onChange={(nv) => setField(f.key, nv)}
              onBlur={onBlur}
            />
          );
        })}

        <div>
          <h4 className="text-[13px] font-semibold text-pae-text">
            {section.table.title}
          </h4>
          {section.table.description && (
            <p className="mt-1 mb-3 text-[11px] text-pae-text-secondary">
              {section.table.description}
            </p>
          )}
          <WizardEditableTable
            columns={section.table.columns}
            rows={tableRows}
            onChange={(i, k, v) => {
              const next = tableRows.map((r, idx) =>
                idx === i ? { ...r, [k]: v } : r,
              );
              setTable(next);
            }}
            onBlur={onBlur}
            onAddRow={() => {
              setTable([
                ...tableRows,
                defaultRow(section.table.columns, section.table.row_default),
              ]);
            }}
            onRemoveRow={(i) =>
              setTable(tableRows.filter((_, idx) => idx !== i))
            }
            addRowLabel={section.table.add_row_label}
          />
        </div>
      </div>
    );
  }

  if (section.shape === "multi_table") {
    const current =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

    const updateTable = (tableKey: string, nextRows: EditableTableRow[]) => {
      onChange({ ...current, [tableKey]: nextRows } as FormFieldValue);
    };

    return (
      <div className="space-y-8">
        {section.tables.map((t) => {
          const rows = asRows(current[t.key]);
          return (
            <div key={t.key}>
              <h4 className="text-[13px] font-semibold text-pae-text">
                {t.title}
              </h4>
              {t.description && (
                <p className="mt-1 mb-3 text-[11px] text-pae-text-secondary">
                  {t.description}
                </p>
              )}
              <WizardEditableTable
                columns={t.columns}
                rows={rows}
                onChange={(i, k, v) => {
                  const next = rows.map((r, idx) =>
                    idx === i ? { ...r, [k]: v } : r,
                  );
                  updateTable(t.key, next);
                }}
                onBlur={onBlur}
                onAddRow={() =>
                  updateTable(t.key, [
                    ...rows,
                    defaultRow(t.columns, t.row_default),
                  ])
                }
                onRemoveRow={(i) =>
                  updateTable(
                    t.key,
                    rows.filter((_, idx) => idx !== i),
                  )
                }
                addRowLabel={t.add_row_label}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
