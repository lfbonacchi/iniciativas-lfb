"use client";

import type { TableColumnDef } from "@/data/form_definitions/f1";

const LABEL_CLASS =
  "block text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary";
const HINT_CLASS = "mt-1 text-[11px] leading-relaxed text-pae-text-secondary";
const INPUT_CLASS =
  "w-full rounded-lg border border-pae-border bg-pae-bg px-3 py-2 text-[12px] text-pae-text outline-none transition focus:border-pae-blue focus:bg-pae-surface focus:ring-1 focus:ring-pae-blue";

export function WizardTextInput({
  label,
  value,
  onChange,
  onBlur,
  hint,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div>
      {label && <label className={LABEL_CLASS}>{label}</label>}
      {hint && <p className={HINT_CLASS}>{hint}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`mt-1 ${INPUT_CLASS}`}
      />
    </div>
  );
}

export function WizardTextarea({
  label,
  value,
  onChange,
  onBlur,
  hint,
  placeholder,
  rows = 5,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  hint?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      {label && <label className={LABEL_CLASS}>{label}</label>}
      {hint && <p className={HINT_CLASS}>{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        className={`mt-1 ${INPUT_CLASS} resize-y`}
      />
    </div>
  );
}

export function WizardSelect({
  label,
  value,
  onChange,
  onBlur,
  options,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: readonly string[];
  hint?: string;
}) {
  return (
    <div>
      {label && <label className={LABEL_CLASS}>{label}</label>}
      {hint && <p className={HINT_CLASS}>{hint}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`mt-1 ${INPUT_CLASS} pr-8`}
      >
        <option value="">— Seleccionar —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface EditableTableRow extends Record<string, string> {}

export function WizardEditableTable({
  columns,
  rows,
  onChange,
  onBlur,
  onAddRow,
  onRemoveRow,
  addRowLabel = "+ Agregar fila",
  lockFirstColumn,
}: {
  columns: readonly TableColumnDef[];
  rows: ReadonlyArray<EditableTableRow>;
  onChange: (rowIndex: number, key: string, value: string) => void;
  onBlur?: () => void;
  onAddRow?: () => void;
  onRemoveRow?: (rowIndex: number) => void;
  addRowLabel?: string;
  /** Para la tabla de Corrientes (filas fijas): bloquea la edición de la 1ra col. */
  lockFirstColumn?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-pae-border">
      <table className="w-full border-collapse text-left">
        <thead className="bg-pae-bg">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-pae-text-tertiary ${c.width ?? ""}`}
              >
                {c.label}
              </th>
            ))}
            {onRemoveRow && (
              <th className="w-10 px-2 py-2" aria-label="Acciones" />
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (onRemoveRow ? 1 : 0)}
                className="px-3 py-6 text-center text-[11px] text-pae-text-tertiary"
              >
                Sin filas. Usá el botón &quot;{addRowLabel}&quot; para empezar.
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t border-pae-border align-top hover:bg-pae-bg/40"
            >
              {columns.map((col, colIdx) => {
                const disabled = lockFirstColumn === true && colIdx === 0;
                const v = row[col.key] ?? "";
                if (disabled) {
                  return (
                    <td
                      key={col.key}
                      className="px-3 py-2 text-[11px] font-medium text-pae-text"
                    >
                      {v}
                    </td>
                  );
                }
                if (col.kind === "select" && col.options) {
                  return (
                    <td key={col.key} className="px-2 py-1.5">
                      <select
                        value={v}
                        onChange={(e) => onChange(i, col.key, e.target.value)}
                        onBlur={onBlur}
                        className={`${INPUT_CLASS} text-[11px]`}
                      >
                        <option value="">—</option>
                        {col.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                }
                if (col.kind === "textarea") {
                  return (
                    <td key={col.key} className="px-2 py-1.5">
                      <textarea
                        value={v}
                        rows={2}
                        onChange={(e) => onChange(i, col.key, e.target.value)}
                        onBlur={onBlur}
                        className={`${INPUT_CLASS} text-[11px] resize-y`}
                      />
                    </td>
                  );
                }
                return (
                  <td key={col.key} className="px-2 py-1.5">
                    <input
                      type="text"
                      value={v}
                      onChange={(e) => onChange(i, col.key, e.target.value)}
                      onBlur={onBlur}
                      className={`${INPUT_CLASS} text-[11px]`}
                    />
                  </td>
                );
              })}
              {onRemoveRow && (
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(i)}
                    aria-label="Eliminar fila"
                    className="rounded p-1 text-pae-text-tertiary transition hover:bg-pae-red/10 hover:text-pae-red"
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {onAddRow && (
        <div className="border-t border-pae-border bg-pae-surface px-3 py-2">
          <button
            type="button"
            onClick={onAddRow}
            className="text-[11px] font-semibold text-pae-blue transition hover:text-pae-blue/80"
          >
            {addRowLabel}
          </button>
        </div>
      )}
    </div>
  );
}

