"use client";

import { useEffect, useMemo, useState } from "react";

import type { DocFileNode } from "@/lib/storage/documents";
import { resolveFormDoc } from "@/lib/documents/resolve";
import { renderDocAsHtml } from "@/lib/documents/html_form";
import { buildXlsxBlob, downloadBlob } from "@/lib/documents/xlsx_form";
import { downloadPdf } from "@/lib/documents/pdf_form";
import { downloadDocx } from "@/lib/documents/docx_form";

interface Props {
  file: DocFileNode;
  initiativeName: string;
  onClose: () => void;
}

// Determina los formatos disponibles para descarga según el source. Para
// archivos de feedback (gateway_feedback) siempre habilitamos los tres (docx,
// pdf, xlsx) porque la misma estructura intermedia alimenta los tres
// generadores.
type Format = "xlsx" | "pdf" | "docx";

export function DocumentPreviewModal({ file, initiativeName, onClose }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Format | null>(null);

  useEffect(() => {
    const res = resolveFormDoc(file.source, initiativeName, file.author_name);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setHtml(renderDocAsHtml(res.data));
  }, [file, initiativeName]);

  const availableFormats = useMemo<Format[]>(() => {
    const src = file.source;
    if (src.kind === "gateway_feedback" || src.kind === "gateway_minuta") {
      // Feedback y minuta: los tres formatos tienen sentido.
      return ["docx", "pdf", "xlsx"];
    }
    if (src.kind === "form_current" || src.kind === "form_snapshot") {
      return [src.format];
    }
    return [];
  }, [file]);

  const filenameFor = useMemo(
    () =>
      (fmt: Format): string => {
        // Reemplaza la extensión del nombre del archivo por la seleccionada.
        return file.name.replace(/\.[^.]+$/, `.${fmt}`);
      },
    [file.name],
  );

  async function handleDownload(fmt: Format) {
    if (downloading) return;
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
            {availableFormats.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleDownload(fmt)}
                disabled={downloading !== null}
                className="rounded-lg bg-pae-blue px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:opacity-50"
              >
                {downloading === fmt ? "Generando…" : `↓ ${fmt.toUpperCase()}`}
              </button>
            ))}
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
