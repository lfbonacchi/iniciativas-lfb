"use client";

import { useEffect, useMemo, useState } from "react";

import type { DocFileNode } from "@/lib/storage/documents";
import { resolveFormDoc } from "@/lib/documents/resolve";
import { renderDocAsHtml } from "@/lib/documents/html_form";
import { buildXlsxBlob, downloadBlob } from "@/lib/documents/xlsx_form";
import { downloadPdf } from "@/lib/documents/pdf_form";
import { downloadDocx } from "@/lib/documents/docx_form";
import { generateFormularioPPTX } from "@/lib/generators/pptx-formulario";
import { buildPptxInputFromFormId } from "@/lib/generators/pptx-formulario-build";
import { buildNotaPrensaBlob } from "@/lib/generators/nota-prensa";
import { buildNotaPrensaInputFromFormId } from "@/lib/generators/nota-prensa-build";
import { getCurrentUser } from "@/lib/storage/auth";
import {
  getGatewayMinuta,
  listGatewayFeedbackDocs,
  upsertGatewayFeedbackDoc,
  upsertGatewayMinuta,
  type GatewayMinutaDetail,
} from "@/lib/storage/gateways";
import type { MinutaContent } from "@/lib/validations/gateways";

interface Props {
  file: DocFileNode;
  initiativeName: string;
  onClose: () => void;
}

type Format = "xlsx" | "pdf" | "docx" | "pptx" | "press_docx";

type EditorKind = "feedback" | "minuta" | null;

export function DocumentPreviewModal({ file, initiativeName, onClose }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Format | null>(null);
  const [editorOpen, setEditorOpen] = useState<EditorKind>(null);
  const [previewTick, setPreviewTick] = useState(0);

  const currentUserId = useMemo(() => {
    const u = getCurrentUser();
    return u.success ? u.data.id : null;
  }, []);

  const isPptx =
    (file.source.kind === "form_current" ||
      file.source.kind === "form_snapshot") &&
    file.source.format === "pptx";

  const isPressDocx =
    (file.source.kind === "form_current" ||
      file.source.kind === "form_snapshot") &&
    file.source.format === "press_docx";

  useEffect(() => {
    // PPTX / Nota de prensa no tienen preview HTML: solo descarga.
    if (isPptx || isPressDocx) {
      setHtml(null);
      setError(null);
      return;
    }
    const res = resolveFormDoc(file.source, initiativeName, file.author_name);
    if (!res.success) {
      setError(res.error.message);
      setHtml(null);
      return;
    }
    setHtml(renderDocAsHtml(res.data));
    setError(null);
  }, [file, initiativeName, previewTick, isPptx, isPressDocx]);

  const availableFormats = useMemo<Format[]>(() => {
    const src = file.source;
    if (src.kind === "gateway_feedback" || src.kind === "gateway_minuta") {
      return ["docx", "pdf", "xlsx"];
    }
    if (src.kind === "form_current" || src.kind === "form_snapshot") {
      return [src.format];
    }
    return [];
  }, [file]);

  // Determina si el usuario actual puede editar este archivo desde acá.
  // - gateway_feedback: solo si el user_id del source matchea con el actual.
  // - gateway_minuta:  solo PO/Scrum (chequeado server-side al guardar).
  const editorAvailable: EditorKind = useMemo(() => {
    const src = file.source;
    if (src.kind === "gateway_feedback") {
      return currentUserId && src.user_id === currentUserId
        ? "feedback"
        : null;
    }
    if (src.kind === "gateway_minuta") {
      return "minuta";
    }
    return null;
  }, [file, currentUserId]);

  const filenameFor = useMemo(
    () =>
      (fmt: Format): string => file.name.replace(/\.[^.]+$/, `.${fmt}`),
    [file.name],
  );

  async function handleDownload(fmt: Format) {
    if (downloading) return;
    // PPTX: generamos vía pptx-formulario (no pasa por DocStructure).
    if (fmt === "pptx") {
      if (
        file.source.kind !== "form_current" &&
        file.source.kind !== "form_snapshot"
      ) {
        setError("PPTX solo está disponible para formularios.");
        return;
      }
      setDownloading(fmt);
      try {
        const input = buildPptxInputFromFormId(file.source.form_id);
        if (!input) {
          setError("No se pudo leer el formulario para generar el PPTX.");
          return;
        }
        const blob = await generateFormularioPPTX(input);
        downloadBlob(blob, filenameFor("pptx"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al generar el PPTX");
      } finally {
        setDownloading(null);
      }
      return;
    }

    // Nota de prensa (Working Backwards DOCX).
    if (fmt === "press_docx") {
      if (
        file.source.kind !== "form_current" &&
        file.source.kind !== "form_snapshot"
      ) {
        setError("La nota de prensa solo está disponible para formularios.");
        return;
      }
      setDownloading(fmt);
      try {
        const input = buildNotaPrensaInputFromFormId(file.source.form_id);
        if (!input) {
          setError(
            "No se pudo leer el formulario para generar la nota de prensa.",
          );
          return;
        }
        const blob = await buildNotaPrensaBlob(input);
        downloadBlob(blob, file.name);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Error al generar la nota de prensa",
        );
      } finally {
        setDownloading(null);
      }
      return;
    }

    const res = resolveFormDoc(file.source, initiativeName, file.author_name);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setDownloading(fmt);
    try {
      const outName = filenameFor(fmt);
      if (fmt === "pdf") {
        await downloadPdf(res.data, outName);
      } else if (fmt === "xlsx") {
        const blob = buildXlsxBlob(res.data);
        downloadBlob(blob, outName);
      } else if (fmt === "docx") {
        await downloadDocx(res.data, outName);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el archivo");
    } finally {
      setDownloading(null);
    }
  }

  function handlePreviewRefresh() {
    setPreviewTick((x) => x + 1);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-pae-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-pae-border px-5 py-3">
          <div>
            <h2 className="text-[14px] font-semibold text-pae-text">
              {file.name}
            </h2>
            <p className="text-[11px] text-pae-text-secondary">
              Vista previa — {initiativeName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editorAvailable && (
              <button
                type="button"
                onClick={() => setEditorOpen(editorAvailable)}
                className="rounded-lg border border-pae-blue/40 bg-pae-blue/5 px-3 py-2 text-[12px] font-semibold text-pae-blue transition hover:bg-pae-blue/10"
              >
                ✎ Editar
              </button>
            )}
            {availableFormats.map((fmt) => {
              const label = fmt === "press_docx" ? "DOCX" : fmt.toUpperCase();
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleDownload(fmt)}
                  disabled={downloading !== null}
                  className="rounded-lg bg-pae-blue px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:opacity-50"
                >
                  {downloading === fmt ? "Generando…" : `↓ ${label}`}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-pae-border bg-pae-surface px-3 py-2 text-[12px] font-medium text-pae-text-secondary transition hover:border-pae-blue/40 hover:text-pae-blue"
            >
              Cerrar
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-pae-bg p-6">
          {error && (
            <p className="rounded-md bg-pae-red/10 px-3 py-2 text-[12px] text-pae-red">
              {error}
            </p>
          )}
          {!error && !html && isPptx && (
            <div className="rounded-lg border border-pae-border bg-pae-surface px-6 py-10 text-center">
              <p className="text-[28px]">📊</p>
              <p className="mt-2 text-[14px] font-semibold text-pae-text">
                Presentación PPTX
              </p>
              <p className="mx-auto mt-2 max-w-md text-[12px] text-pae-text-secondary">
                Las presentaciones PowerPoint no se previsualizan en el browser.
                Descargalas con el botón ↓ PPTX y abrilas en PowerPoint, Google Slides o Keynote.
              </p>
            </div>
          )}
          {!error && !html && isPressDocx && (
            <div className="rounded-lg border border-pae-border bg-pae-surface px-6 py-10 text-center">
              <p className="text-[28px]">📝</p>
              <p className="mt-2 text-[14px] font-semibold text-pae-text">
                Nota de prensa — Working Backwards
              </p>
              <p className="mx-auto mt-2 max-w-md text-[12px] text-pae-text-secondary">
                Documento editable en Word / Google Docs. Descargalo con ↓ DOCX y
                compartilo con el PO o Scrum Master para ajustar el texto antes
                del gateway. Al regenerarse se sobreescribe.
              </p>
            </div>
          )}
          {!error && !html && !isPptx && !isPressDocx && (
            <p className="text-[12px] text-pae-text-secondary">
              Cargando vista previa…
            </p>
          )}
          {html && (
            <iframe
              title="Vista previa"
              sandbox=""
              srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff;}</style></head><body>${html}</body></html>`}
              className="h-[70vh] w-full rounded-lg border border-pae-border bg-pae-surface"
            />
          )}
        </div>
      </div>

      {editorOpen === "feedback" &&
        file.source.kind === "gateway_feedback" && (
          <FeedbackInlineEditor
            gatewayId={file.source.gateway_id}
            userId={file.source.user_id}
            onClose={() => setEditorOpen(null)}
            onSaved={handlePreviewRefresh}
          />
        )}
      {editorOpen === "minuta" && file.source.kind === "gateway_minuta" && (
        <MinutaInlineEditor
          gatewayId={file.source.gateway_id}
          onClose={() => setEditorOpen(null)}
          onSaved={handlePreviewRefresh}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor inline de feedback (solo el autor puede editarlo desde acá)
// ─────────────────────────────────────────────────────────────────────────────

function FeedbackInlineEditor({
  gatewayId,
  userId,
  onClose,
  onSaved,
}: {
  gatewayId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const res = listGatewayFeedbackDocs(gatewayId);
    if (res.success) {
      const mine = res.data.find((d) => d.user_id === userId);
      setContent(mine?.content ?? "");
    }
    setLoaded(true);
  }, [gatewayId, userId]);

  function handleSave() {
    const res = upsertGatewayFeedbackDoc(gatewayId, content);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setSavedAt(new Date().toISOString());
    setError(null);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-2xl flex-col rounded-[10px] bg-pae-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-pae-border px-5 py-3">
          <p className="text-[13px] font-semibold text-pae-text">
            Editar mi feedback general
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-[16px] text-pae-text-tertiary hover:text-pae-text"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {!loaded ? (
            <p className="text-[12px] text-pae-text-secondary">Cargando…</p>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribí tu feedback libre para este gateway. Se suma a los comentarios inline que ya publicaste."
              className="block h-full w-full resize-none rounded-md border border-pae-border bg-pae-bg p-3 text-[12px] leading-relaxed text-pae-text focus:border-pae-blue focus:outline-none"
            />
          )}
        </div>
        <div className="flex items-center justify-between border-t border-pae-border px-5 py-2 text-[10px] text-pae-text-tertiary">
          <span>
            {savedAt
              ? `Guardado a las ${new Date(savedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
              : "Sin guardar"}
            {error && <span className="ml-2 text-pae-red">· {error}</span>}
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-8 items-center rounded-md bg-pae-blue px-3 text-[11px] font-semibold text-white hover:bg-pae-blue/90"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor inline de minuta (solo PO/Scrum — validado en el storage)
// ─────────────────────────────────────────────────────────────────────────────

const MINUTA_FIELDS: {
  key: keyof MinutaContent;
  label: string;
  type: "date" | "text" | "textarea";
  rows?: number;
}[] = [
  { key: "fecha_reunion", label: "Fecha de reunión", type: "date" },
  {
    key: "participantes",
    label: "Participantes (convocados)",
    type: "textarea",
    rows: 2,
  },
  {
    key: "asistentes",
    label: "Asistentes (presentes)",
    type: "textarea",
    rows: 2,
  },
  { key: "mejoras", label: "Mejoras identificadas", type: "textarea", rows: 3 },
  { key: "acuerdos", label: "Acuerdos", type: "textarea", rows: 3 },
  {
    key: "proximos_pasos",
    label: "Próximos pasos / decisiones",
    type: "textarea",
    rows: 3,
  },
];

function MinutaInlineEditor({
  gatewayId,
  onClose,
  onSaved,
}: {
  gatewayId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState<GatewayMinutaDetail | null>(null);
  const [content, setContent] = useState<MinutaContent>({
    fecha_reunion: "",
    participantes: "",
    asistentes: "",
    mejoras: "",
    acuerdos: "",
    proximos_pasos: "",
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const res = getGatewayMinuta(gatewayId);
    if (res.success) {
      setDetail(res.data);
      setContent(res.data.content);
    } else {
      setError(res.error.message);
    }
  }, [gatewayId]);

  const canEdit = detail?.can_edit ?? false;
  const missing = MINUTA_FIELDS.filter(
    (f) => !(content[f.key] ?? "").trim(),
  );

  function handleChange(key: keyof MinutaContent, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAutosave() {
    const res = upsertGatewayMinuta(gatewayId, content, { strict: false });
    if (res.success) {
      setSavedAt(new Date().toISOString());
      setError(null);
      onSaved();
    } else {
      setError(res.error.message);
    }
  }

  async function handleFinalize() {
    setSaving(true);
    const res = upsertGatewayMinuta(gatewayId, content, { strict: true });
    setSaving(false);
    if (res.success) {
      setSavedAt(new Date().toISOString());
      setError(null);
      onSaved();
    } else {
      setError(res.error.message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-3xl flex-col rounded-[10px] bg-pae-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-pae-border px-5 py-3">
          <p className="text-[13px] font-semibold text-pae-text">
            Editar minuta de gateway
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-[16px] text-pae-text-tertiary hover:text-pae-text"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {!canEdit && (
            <p className="rounded-md bg-pae-amber/10 px-3 py-2 text-[11px] text-pae-amber">
              Solo el PO/Promotor o Scrum Master pueden editar la minuta.
              Podés ver el contenido pero no guardar cambios.
            </p>
          )}
          {MINUTA_FIELDS.map((f) => {
            const value = content[f.key] ?? "";
            const isEmpty = !value.trim();
            return (
              <div key={f.key}>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                  {f.label}
                  {isEmpty && <span className="ml-1 text-pae-red">*</span>}
                </label>
                {f.type === "date" ? (
                  <input
                    type="date"
                    value={value}
                    disabled={!canEdit}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    onBlur={handleAutosave}
                    className="mt-1 w-48 rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-[11px] text-pae-text focus:border-pae-blue focus:outline-none disabled:opacity-60"
                  />
                ) : (
                  <textarea
                    rows={f.rows ?? 3}
                    value={value}
                    disabled={!canEdit}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    onBlur={handleAutosave}
                    className="mt-1 block w-full resize-y rounded-md border border-pae-border bg-pae-bg p-3 text-[12px] leading-relaxed text-pae-text focus:border-pae-blue focus:outline-none disabled:opacity-60"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-pae-border px-5 py-2">
          <span className="text-[10px] text-pae-text-tertiary">
            {savedAt
              ? `Autoguardado a las ${new Date(savedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
              : "Sin cambios sin guardar"}
            {error && <span className="ml-2 text-pae-red">· {error}</span>}
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={handleFinalize}
              disabled={saving || missing.length > 0}
              className="inline-flex h-8 items-center rounded-md bg-pae-green px-3 text-[11px] font-semibold text-white hover:bg-pae-green/90 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                missing.length > 0
                  ? `Faltan: ${missing.map((f) => f.label).join(", ")}`
                  : "Guardar minuta completa"
              }
            >
              {saving
                ? "Guardando…"
                : missing.length > 0
                  ? `Faltan ${missing.length}`
                  : "Finalizar minuta"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
