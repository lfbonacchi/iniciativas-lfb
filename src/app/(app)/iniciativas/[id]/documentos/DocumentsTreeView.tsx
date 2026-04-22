"use client";

import { useEffect, useMemo, useState } from "react";

import type { Id } from "@/types";
import {
  getDocumentTree,
  type DocTreeNode,
  type DocFolderNode,
  type DocFileNode,
} from "@/lib/storage/documents";
import { useUploadDocument } from "@/components/shell/UploadDocumentContext";
import { resolveFormDoc } from "@/lib/documents/resolve";
import { buildXlsxBlob, downloadBlob } from "@/lib/documents/xlsx_form";
import { downloadPdf } from "@/lib/documents/pdf_form";

import { useInitiativeDetail } from "../DetailContext";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

function collectDefaultOpen(nodes: DocTreeNode[], out: Set<string>): void {
  for (const node of nodes) {
    if (node.kind === "folder") {
      if (node.default_open) out.add(node.id);
      collectDefaultOpen(node.children, out);
    }
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function OriginBadge({ origin }: { origin: DocFileNode["origin"] }) {
  if (origin === "auto") {
    return (
      <span className="rounded-full bg-pae-green/10 px-2 py-0.5 text-[10px] font-semibold text-pae-green">
        Auto
      </span>
    );
  }
  return (
    <span className="rounded-full bg-pae-text-tertiary/15 px-2 py-0.5 text-[10px] font-semibold text-pae-text-secondary">
      Manual
    </span>
  );
}

function FileRow({
  file,
  depth,
  initiativeName,
  onPreview,
}: {
  file: DocFileNode;
  depth: number;
  initiativeName: string;
  onPreview: (file: DocFileNode) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = file.author_name
    ? `${file.author_name} · ${formatDate(file.created_at)}`
    : formatDate(file.created_at);

  const canGenerate =
    file.source.kind === "form_current" || file.source.kind === "form_snapshot";

  async function handleDownload() {
    if (downloading) return;
    if (!canGenerate) {
      alert(`${file.name} aún no tiene generador asociado.`);
      return;
    }
    setError(null);
    const res = resolveFormDoc(file.source, initiativeName, file.author_name);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setDownloading(true);
    try {
      const format =
        file.source.kind === "form_current" || file.source.kind === "form_snapshot"
          ? file.source.format
          : "xlsx";
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
      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-pae-bg"
      style={{ paddingLeft: `${depth * 20 + 28}px` }}
    >
      <span className="text-[14px]" aria-hidden>
        {file.icon}
      </span>
      <span className="flex-1 truncate text-[12px] text-pae-blue">
        {file.name}
      </span>
      <span className="hidden text-[11px] text-pae-text-tertiary sm:block">
        {meta}
      </span>
      <OriginBadge origin={file.origin} />
      {canGenerate && (
        <button
          type="button"
          onClick={() => onPreview(file)}
          className="rounded-md border border-pae-border bg-pae-surface px-2 py-1 text-[10px] font-medium text-pae-text-secondary transition hover:border-pae-blue/40 hover:text-pae-blue"
        >
          👁 Ver
        </button>
      )}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        title={error ?? undefined}
        className="rounded-md bg-pae-blue/10 px-2 py-1 text-[10px] font-medium text-pae-blue transition hover:bg-pae-blue/20 disabled:opacity-60"
      >
        {downloading ? "…" : "↓ Descargar"}
      </button>
      {error && (
        <span className="text-[10px] text-pae-red" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function FolderRow({
  folder,
  depth,
  openSet,
  toggle,
  initiativeName,
  onPreview,
}: {
  folder: DocFolderNode;
  depth: number;
  openSet: Set<string>;
  toggle: (id: string) => void;
  initiativeName: string;
  onPreview: (file: DocFileNode) => void;
}) {
  const isOpen = openSet.has(folder.id);
  const childCount = folder.children.length;

  return (
    <div>
      <button
        type="button"
        onClick={() => toggle(folder.id)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-pae-bg"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <span className="w-3 text-[11px] text-pae-text-tertiary">
          {isOpen ? "▾" : "▸"}
        </span>
        <span className="text-[14px]" aria-hidden>
          {folder.icon}
        </span>
        <span className="flex-1 text-[13px] font-medium text-pae-text">
          {folder.name}
        </span>
        <span className="text-[11px] text-pae-text-tertiary">
          {childCount > 0
            ? `${childCount} ${childCount === 1 ? "item" : "items"}`
            : "vacío"}
        </span>
      </button>
      {isOpen && (
        <div>
          {folder.children.length === 0 ? (
            <p
              className="py-1.5 text-[11px] italic text-pae-text-tertiary"
              style={{ paddingLeft: `${depth * 20 + 48}px` }}
            >
              Sin archivos todavía.
            </p>
          ) : (
            folder.children.map((child) =>
              child.kind === "folder" ? (
                <FolderRow
                  key={child.id}
                  folder={child}
                  depth={depth + 1}
                  openSet={openSet}
                  toggle={toggle}
                  initiativeName={initiativeName}
                  onPreview={onPreview}
                />
              ) : (
                <FileRow
                  key={child.id}
                  file={child}
                  depth={depth + 1}
                  initiativeName={initiativeName}
                  onPreview={onPreview}
                />
              ),
            )
          )}
        </div>
      )}
    </div>
  );
}

export function DocumentsTreeView() {
  const detail = useInitiativeDetail();
  const initiativeId: Id = detail.initiative.id;
  const { openUpload, registerOnUploaded } = useUploadDocument();

  const [tree, setTree] = useState<DocTreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);
  const [previewFile, setPreviewFile] = useState<DocFileNode | null>(null);

  useEffect(() => {
    const result = getDocumentTree(initiativeId);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setTree(result.data.tree);
    const defaults = new Set<string>();
    collectDefaultOpen(result.data.tree, defaults);
    setOpenSet(defaults);
  }, [initiativeId, reloadKey]);

  useEffect(() => {
    const unsubscribe = registerOnUploaded(() => {
      setReloadKey((k) => k + 1);
    });
    return unsubscribe;
  }, [registerOnUploaded]);

  const counts = useMemo(() => {
    let files = 0;
    const walk = (nodes: DocTreeNode[]) => {
      for (const n of nodes) {
        if (n.kind === "file") files += 1;
        else walk(n.children);
      }
    };
    walk(tree);
    return files;
  }, [tree]);

  function toggle(id: string) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleUploadClick() {
    openUpload({
      initiativeId,
      stage: detail.initiative.current_stage,
    });
  }

  return (
    <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-pae-border pb-4">
        <div>
          <h2 className="text-[14px] font-semibold text-pae-text">
            Documentos — {detail.initiative.name}
          </h2>
          <p className="mt-1 text-[11px] text-pae-text-secondary">
            Estructura sincronizada con SharePoint · {counts}{" "}
            {counts === 1 ? "archivo" : "archivos"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleUploadClick}
          className="rounded-lg bg-pae-blue px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90"
        >
          + Subir archivo
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-md bg-pae-red/10 px-3 py-2 text-[12px] text-pae-red">
          {error}
        </p>
      ) : (
        <div className="mt-3 space-y-0.5">
          {tree.map((node) =>
            node.kind === "folder" ? (
              <FolderRow
                key={node.id}
                folder={node}
                depth={0}
                openSet={openSet}
                toggle={toggle}
                initiativeName={detail.initiative.name}
                onPreview={setPreviewFile}
              />
            ) : (
              <FileRow
                key={node.id}
                file={node}
                depth={0}
                initiativeName={detail.initiative.name}
                onPreview={setPreviewFile}
              />
            ),
          )}
        </div>
      )}

      {previewFile && (
        <DocumentPreviewModal
          file={previewFile}
          initiativeName={detail.initiative.name}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <div className="mt-5 flex items-center gap-4 border-t border-pae-border pt-4 text-[11px] text-pae-text-secondary">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-pae-green/10 px-2 py-0.5 text-[10px] font-semibold text-pae-green">
            Auto
          </span>
          Generado por el sistema
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-pae-text-tertiary/15 px-2 py-0.5 text-[10px] font-semibold text-pae-text-secondary">
            Manual
          </span>
          Subido por un usuario
        </span>
      </div>
    </div>
  );
}
