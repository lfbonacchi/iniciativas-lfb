"use client";

import { useState } from "react";

import type {
  FormDefinition,
  FormFieldValue,
  FormSection,
  FormSectionField,
} from "@/types";
import type { GatewayApprover } from "@/lib/storage/gateways";

function renderValue(field: FormSectionField, value: FormFieldValue): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-pae-text-tertiary italic">Sin completar</span>;
  }
  if (field.type === "table" && Array.isArray(value) && field.table_columns) {
    if (value.length === 0) {
      return <span className="text-pae-text-tertiary italic">Sin filas</span>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-pae-border">
              {field.table_columns.map((c) => (
                <th
                  key={c.key}
                  className="px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-wide text-pae-text-tertiary"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row, i) => {
              const r = row as Record<string, unknown>;
              return (
                <tr key={i} className="border-b border-pae-border/50">
                  {field.table_columns!.map((c) => (
                    <td key={c.key} className="px-2 py-1 text-pae-text">
                      {r[c.key] != null && r[c.key] !== "" ? String(r[c.key]) : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return <span>{value.map(String).join(", ")}</span>;
  }
  if (typeof value === "boolean") {
    return <span>{value ? "Sí" : "No"}</span>;
  }
  return <span className="whitespace-pre-wrap">{String(value)}</span>;
}

function parseFeedbackBySection(
  feedback: string | null,
): Record<string, string> {
  if (!feedback) return {};
  try {
    const parsed = JSON.parse(feedback) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim()) out[k] = v;
      }
      return out;
    }
  } catch {
    // fallback: plain string → attribute to "_general"
  }
  return { _general: feedback };
}

export interface ReadOnlySectionsProps {
  definition: FormDefinition | null;
  responses: Record<string, FormFieldValue>;
  approvers: GatewayApprover[];
  currentUserId: string | null;
  feedbackBySection: Record<string, string>;
  onFeedbackChange: (sectionKey: string, value: string) => void;
  inputDisabled: boolean;
}

export function ReadOnlySections({
  definition,
  responses,
  approvers,
  currentUserId,
  feedbackBySection,
  onFeedbackChange,
  inputDisabled,
}: ReadOnlySectionsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  if (!definition) {
    return (
      <p className="text-[11px] text-pae-text-tertiary">
        No hay definición de formulario disponible.
      </p>
    );
  }

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const approversById = new Map(approvers.map((a) => [a.user_id, a]));

  return (
    <div className="space-y-2">
      {definition.sections_config.map((section: FormSection) => {
        const open = openSections[section.key] ?? false;
        const othersFeedback = approvers
          .filter((a) => !a.is_current_user && a.feedback_text)
          .map((a) => {
            const parsed = parseFeedbackBySection(a.feedback_text);
            const text = parsed[section.key];
            return text ? { approver: a, text } : null;
          })
          .filter((x): x is { approver: GatewayApprover; text: string } => x !== null);

        return (
          <div
            key={section.key}
            className="rounded-[10px] border border-pae-border bg-pae-surface"
          >
            <button
              type="button"
              onClick={() => toggle(section.key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[12px] font-semibold text-pae-text">
                {section.title}
              </span>
              <span className="text-[11px] text-pae-text-secondary">
                {open ? "▾" : "▸"}
              </span>
            </button>
            {open && (
              <div className="border-t border-pae-border px-4 py-3 space-y-4">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      {field.label}
                    </p>
                    <div className="mt-1 rounded-md bg-pae-bg px-3 py-2 text-[11px] text-pae-text">
                      {renderValue(field, responses[field.key] ?? null)}
                    </div>
                  </div>
                ))}

                {othersFeedback.length > 0 && (
                  <div className="rounded-md bg-pae-bg/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                      Feedback de otros
                    </p>
                    <div className="mt-2 space-y-2">
                      {othersFeedback.map(({ approver, text }) => (
                        <div key={approver.user_id} className="flex gap-2">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pae-blue/15 text-[10px] font-semibold text-pae-blue">
                            {approver.display_name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-semibold text-pae-text">
                              {approver.display_name}{" "}
                              <span className="font-normal text-pae-text-tertiary">
                                · {approver.role_label}
                              </span>
                            </p>
                            <p className="text-[11px] text-pae-text whitespace-pre-wrap">
                              {text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                    Tu feedback
                  </p>
                  <textarea
                    className="mt-1 w-full resize-y rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none disabled:opacity-60"
                    rows={2}
                    placeholder="Escribí tu feedback para esta sección..."
                    value={feedbackBySection[section.key] ?? ""}
                    disabled={inputDisabled}
                    onChange={(e) => onFeedbackChange(section.key, e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
