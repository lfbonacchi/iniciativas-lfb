"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  listGatewayFeedbackDocs,
  upsertGatewayFeedbackDoc,
  type FeedbackDocListItem,
} from "@/lib/storage/gateways";

interface FeedbackDocsPanelProps {
  gatewayId: string;
  currentUserId: string | null;
  gatewayResolved: boolean;
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

export function FeedbackDocsPanel({
  gatewayId,
  currentUserId,
  gatewayResolved,
}: FeedbackDocsPanelProps) {
  const [docs, setDocs] = useState<FeedbackDocListItem[]>([]);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(() => {
    const res = listGatewayFeedbackDocs(gatewayId);
    if (res.success) setDocs(res.data);
  }, [gatewayId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const myDoc = docs.find((d) => d.user_id === currentUserId) ?? null;
  const openDoc = openDocId ? docs.find((d) => d.id === openDocId) : null;
  const canEdit =
    !gatewayResolved &&
    !!openDoc &&
    openDoc.user_id === currentUserId;

  useEffect(() => {
    if (openDoc) setDraftText(openDoc.content);
  }, [openDoc]);

  function scheduleAutosave(next: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const res = upsertGatewayFeedbackDoc(gatewayId, next);
      if (res.success) {
        setSavedAt(new Date().toISOString());
        reload();
      }
    }, 800);
  }

  function openExistingDoc(id: string) {
    setOpenDocId(id);
    setSavedAt(null);
  }

  function openNewFeedback() {
    if (myDoc) {
      setOpenDocId(myDoc.id);
      return;
    }
    // Crea inmediatamente un doc vacío → arranca editable.
    const res = upsertGatewayFeedbackDoc(gatewayId, "");
    if (res.success) {
      reload();
      setOpenDocId(res.data.id);
    } else {
      alert(res.error.message);
    }
  }

  function closePopup() {
    setOpenDocId(null);
    setSavedAt(null);
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-pae-text">
          Feedback de aprobadores ({docs.length})
        </p>
        {!gatewayResolved && (
          <button
            type="button"
            onClick={openNewFeedback}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-pae-green px-3 text-[11px] font-semibold text-white transition hover:bg-pae-green/90"
          >
            + Agregar feedback
          </button>
        )}
      </div>
      <p className="mt-1 text-[10px] text-pae-text-tertiary">
        Cada usuario puede crear un documento de feedback. Se guarda en
        archivos adicionales de la etapa y se le notifica al PO.
      </p>

      {docs.length > 0 && (
        <div className="mt-3 space-y-1">
          {docs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => openExistingDoc(d.id)}
              className="flex w-full items-center justify-between rounded-md border border-pae-border bg-pae-bg px-3 py-2 text-left transition hover:bg-pae-surface"
            >
              <span className="flex items-center gap-2 text-[11px] text-pae-text">
                📝 <span className="font-medium">{d.file_name}</span>
                <span className="text-pae-text-tertiary">
                  — {d.author_name}
                </span>
              </span>
              <span className="text-[10px] text-pae-text-tertiary">
                {formatDate(d.updated_at)}
              </span>
            </button>
          ))}
        </div>
      )}

      {openDoc && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
          onClick={closePopup}
        >
          <div
            className="flex h-[80vh] w-full max-w-2xl flex-col rounded-[10px] bg-pae-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-pae-border px-5 py-3">
              <div>
                <p className="text-[13px] font-semibold text-pae-text">
                  📝 {openDoc.file_name}
                </p>
                <p className="text-[10px] text-pae-text-tertiary">
                  {openDoc.author_name} · Actualizado{" "}
                  {formatDate(openDoc.updated_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={closePopup}
                className="text-[16px] text-pae-text-tertiary hover:text-pae-text"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {canEdit ? (
                <textarea
                  value={draftText}
                  onChange={(e) => {
                    setDraftText(e.target.value);
                    scheduleAutosave(e.target.value);
                  }}
                  placeholder="Escribí tu feedback acá. Se autoguarda."
                  className="block h-full w-full resize-none rounded-md border border-pae-border bg-pae-bg p-3 text-[12px] leading-relaxed text-pae-text focus:border-pae-blue focus:outline-none"
                />
              ) : (
                <div className="whitespace-pre-wrap text-[12px] text-pae-text">
                  {openDoc.content || (
                    <span className="italic text-pae-text-tertiary">
                      Sin contenido.
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-pae-border px-5 py-2 text-[10px] text-pae-text-tertiary">
              <span>
                {canEdit
                  ? savedAt
                    ? `Autoguardado ${formatDate(savedAt)}`
                    : "Se autoguarda al escribir"
                  : "Solo lectura (creado por otro usuario)"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
