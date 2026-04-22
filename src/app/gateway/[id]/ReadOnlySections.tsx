"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  FormDefinition,
  FormFieldValue,
  FormSection,
  FormSectionField,
} from "@/types";
import {
  listInlineComments,
  publishSectionComments,
  saveInlineCommentDraft,
  type InlineCommentItem,
} from "@/lib/storage/gateways";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function renderInferredTable(rows: Record<string, unknown>[]): React.ReactNode {
  // Infiere columnas de la unión de keys de todas las filas.
  const colSet = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) colSet.add(k);
  }
  const cols = Array.from(colSet);
  if (cols.length === 0) {
    return <span className="text-pae-text-tertiary italic">Sin datos</span>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-pae-border">
            {cols.map((c) => (
              <th
                key={c}
                className="px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-wide text-pae-text-tertiary"
              >
                {c.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-pae-border/50">
              {cols.map((c) => {
                const cell = r[c];
                const display =
                  cell == null || cell === ""
                    ? "—"
                    : typeof cell === "object"
                      ? JSON.stringify(cell)
                      : String(cell);
                return (
                  <td key={c} className="px-2 py-1 align-top text-pae-text">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderNestedValue(value: unknown): React.ReactNode {
  if (value == null || value === "") {
    return <span className="text-pae-text-tertiary italic">Sin completar</span>;
  }
  if (typeof value === "boolean") return <span>{value ? "Sí" : "No"}</span>;
  if (typeof value === "number") return <span>{value}</span>;
  if (typeof value === "string") {
    return <span className="whitespace-pre-wrap">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-pae-text-tertiary italic">Sin filas</span>;
    }
    if (value.every((x) => isPlainObject(x))) {
      return renderInferredTable(value as Record<string, unknown>[]);
    }
    return <span>{value.map((x) => String(x)).join(", ")}</span>;
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span className="text-pae-text-tertiary italic">Sin datos</span>;
    }
    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="space-y-0.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
              {k.replaceAll("_", " ")}
            </p>
            <div className="pl-2 text-pae-text">{renderNestedValue(v)}</div>
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

function renderValue(field: FormSectionField, value: FormFieldValue): React.ReactNode {
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
  return renderNestedValue(value);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export interface ReadOnlySectionsProps {
  gatewayId: string;
  definition: FormDefinition | null;
  responses: Record<string, FormFieldValue>;
  currentUserId: string | null;
  inputDisabled: boolean;
}

export function ReadOnlySections({
  gatewayId,
  definition,
  responses,
  currentUserId,
  inputDisabled,
}: ReadOnlySectionsProps) {
  // Secciones abiertas por default para ver el formulario completo y poder
  // comentar sin clicks extra. El usuario puede colapsar si molesta.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      if (!definition) return {};
      const initial: Record<string, boolean> = {};
      for (const s of definition.sections_config) initial[s.key] = true;
      return initial;
    },
  );
  const [comments, setComments] = useState<InlineCommentItem[]>([]);
  const [publishMsg, setPublishMsg] = useState<Record<string, string>>({});
  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Si la definición se carga después del mount, abrir todas cuando llegue.
  useEffect(() => {
    if (!definition) return;
    setOpenSections((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next: Record<string, boolean> = {};
      for (const s of definition.sections_config) next[s.key] = true;
      return next;
    });
  }, [definition]);

  const reload = useCallback(() => {
    const res = listInlineComments(gatewayId);
    if (res.success) setComments(res.data);
  }, [gatewayId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const commentsByField = useMemo(() => {
    const m = new Map<string, InlineCommentItem[]>();
    for (const c of comments) {
      const key = `${c.section_key}::${c.field_key}`;
      const arr = m.get(key) ?? [];
      arr.push(c);
      m.set(key, arr);
    }
    return m;
  }, [comments]);

  const myDraftByField = useMemo(() => {
    const m = new Map<string, InlineCommentItem>();
    for (const c of comments) {
      if (c.is_current_user && c.status === "draft") {
        m.set(`${c.section_key}::${c.field_key}`, c);
      }
    }
    return m;
  }, [comments]);

  if (!definition) {
    return (
      <p className="text-[11px] text-pae-text-tertiary">
        No hay definición de formulario disponible.
      </p>
    );
  }

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  function handleDraftChange(
    sectionKey: string,
    fieldKey: string,
    text: string,
  ) {
    // Actualización optimista: reflejamos el texto en la UI inmediatamente.
    setComments((prev) => {
      const key = `${sectionKey}::${fieldKey}`;
      const mine = prev.find(
        (c) => c.is_current_user && `${c.section_key}::${c.field_key}` === key,
      );
      if (mine) {
        return prev.map((c) =>
          c === mine
            ? { ...c, text, status: "draft" as const, published_at: null }
            : c,
        );
      }
      // Placeholder hasta que el save devuelva el id real.
      const tmp: InlineCommentItem = {
        id: `tmp-${key}`,
        gateway_id: gatewayId,
        user_id: currentUserId ?? "me",
        author_name: "Yo",
        section_key: sectionKey,
        field_key: fieldKey,
        text,
        status: "draft",
        updated_at: new Date().toISOString(),
        published_at: null,
        is_current_user: true,
      };
      return [...prev, tmp];
    });

    const timerKey = `${sectionKey}::${fieldKey}`;
    if (autosaveTimers.current[timerKey]) {
      clearTimeout(autosaveTimers.current[timerKey]);
    }
    autosaveTimers.current[timerKey] = setTimeout(() => {
      const res = saveInlineCommentDraft(gatewayId, sectionKey, fieldKey, text);
      if (res.success) reload();
    }, 700);
  }

  function handlePublishSection(sectionKey: string) {
    const res = publishSectionComments(gatewayId, sectionKey);
    if (!res.success) {
      setPublishMsg({ [sectionKey]: res.error.message });
      return;
    }
    setPublishMsg({
      [sectionKey]:
        res.data.published > 0
          ? `Publicados ${res.data.published} comentario(s). PDF actualizado.`
          : "No había comentarios nuevos para enviar.",
    });
    reload();
    // Ocultar mensaje después de 4s.
    setTimeout(() => {
      setPublishMsg((p) => {
        const next = { ...p };
        delete next[sectionKey];
        return next;
      });
    }, 4000);
  }

  return (
    <div className="space-y-2">
      {definition.sections_config.map((section: FormSection) => {
        const open = openSections[section.key] ?? false;
        const sectionHasDrafts = comments.some(
          (c) =>
            c.is_current_user &&
            c.section_key === section.key &&
            c.status === "draft" &&
            c.text.trim().length > 0,
        );

        const SendBtn = (
          <button
            type="button"
            disabled={inputDisabled || !sectionHasDrafts}
            onClick={() => handlePublishSection(section.key)}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-pae-blue px-2.5 text-[10px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enviar comentarios
          </button>
        );

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
              <div className="border-t border-pae-border px-4 py-3 space-y-5">
                {section.fields.map((field) => {
                  const key = `${section.key}::${field.key}`;
                  const fieldComments = commentsByField.get(key) ?? [];
                  const myDraft = myDraftByField.get(key);
                  const publishedComments = fieldComments.filter(
                    (c) => c.status === "published",
                  );
                  return (
                    <div key={field.key}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                        {field.label}
                      </p>
                      <div className="mt-1 rounded-md bg-pae-bg px-3 py-2 text-[11px] text-pae-text">
                        {renderValue(field, responses[field.key] ?? null)}
                      </div>

                      {/* Comentarios publicados (todos los ven) */}
                      {publishedComments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {publishedComments.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-md border-l-2 border-pae-blue bg-pae-blue/5 px-2 py-1.5 text-[11px]"
                            >
                              <span className="font-semibold text-pae-blue">
                                {c.author_name} comentó:
                              </span>{" "}
                              <span className="text-pae-text whitespace-pre-wrap">
                                {c.text}
                              </span>
                              <span className="ml-2 text-[9px] text-pae-text-tertiary">
                                {c.published_at
                                  ? formatDate(c.published_at)
                                  : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input de comentario (draft privado hasta enviar) */}
                      <div className="mt-2">
                        <textarea
                          className="block w-full resize-y rounded-md border border-pae-border bg-pae-bg px-3 py-1.5 text-[11px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none disabled:opacity-60"
                          rows={1}
                          placeholder="Dejá tu comentario (borrador — se publica al apretar 'Enviar comentarios')"
                          value={myDraft?.text ?? ""}
                          disabled={inputDisabled}
                          onChange={(e) =>
                            handleDraftChange(
                              section.key,
                              field.key,
                              e.target.value,
                            )
                          }
                        />
                        {myDraft && myDraft.text.trim().length > 0 && (
                          <p className="mt-0.5 text-[9px] text-pae-text-tertiary">
                            Borrador · se guarda automáticamente
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {publishMsg[section.key] && (
                  <p className="text-[10px] text-pae-green">
                    {publishMsg[section.key]}
                  </p>
                )}

                <div className="flex justify-end">{SendBtn}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
