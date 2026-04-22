"use client";

import { useEffect, useMemo, useState } from "react";

import type { DocFileNode } from "@/lib/storage/documents";
import { resolveFormDoc } from "@/lib/documents/resolve";
import { renderDocAsHtml } from "@/lib/documents/html_form";
import { buildXlsxBlob, downloadBlob } from "@/lib/documents/xlsx_form";
import { downloadPdf } from "@/lib/documents/pdf_form";

interface Props {
  file: DocFileNode;
  initiativeName: string;
  onClose: () => void;
}

export function DocumentPreviewModal({ file, initiativeName, onClose }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const res = resolveFormDoc(file.source, initiativeName, file.author_name);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setHtml(renderDocAsHtml(res.data));
  }, [file, initiativeName]);

  const format = useMemo<"xlsx" | "pdf" | null>(() => {
    if (file.source.kind === "form_current" || file.source.kind === "form_snapshot") {
      return file.source.format;
    }
    return null;
  }, [file]);

  async function handleDownload() {
    if (downloading) return;
    const res = resolveFormDoc(file.source, initiativeName, file.author_name);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setDownloading(true);
    try {
      if (format === "pdf") {
        await downloadPdf(res.data, file.name);
      } else {
        const blob = buildXlsxBlob(res.data);
        downloadBlob(blob, file.name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el archivo");
    } finally {
      setDownloading(false);
    }
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
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || !format}
              className="rounded-lg bg-pae-blue px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:opacity-50"
            >
              {downloading ? "Generando…" : `↓ Descargar ${format ?? ""}`}
            </button>
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
          {!error && !html && (
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
    </div>
  );
}
