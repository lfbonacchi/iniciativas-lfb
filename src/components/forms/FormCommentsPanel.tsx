"use client";

import { useCallback, useEffect, useState } from "react";

import {
  addFormComment,
  deleteFormComment,
  listFormComments,
  type FormCommentWithAuthor,
} from "@/lib/storage";
import { getCurrentUser } from "@/lib/storage/auth";

interface FormCommentsPanelProps {
  formId: string;
  /** True si el formulario está en un estado que permite nuevos comentarios. */
  canComment: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FormCommentsPanel({
  formId,
  canComment,
}: FormCommentsPanelProps) {
  const [comments, setComments] = useState<FormCommentWithAuthor[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const reload = useCallback(() => {
    const res = listFormComments(formId);
    if (res.success) {
      setComments(res.data);
      setError(null);
    } else {
      setError(res.error.message);
    }
    setLoading(false);
  }, [formId]);

  useEffect(() => {
    const u = getCurrentUser();
    setCurrentUserId(u.success ? u.data.id : null);
    reload();
  }, [reload]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const clean = text.trim();
    if (clean.length < 2) {
      setError("El comentario no puede estar vacío");
      return;
    }
    setSubmitting(true);
    const res = addFormComment(formId, clean);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setText("");
    setError(null);
    reload();
  }

  function handleDelete(id: string) {
    const res = deleteFormComment(id);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    reload();
  }

  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-pae-text">
          Comentarios
          <span className="ml-2 text-[11px] font-normal text-pae-text-tertiary">
            ({comments.length})
          </span>
        </h3>
        {!canComment && (
          <span className="text-[11px] text-pae-text-tertiary">
            Solo lectura — el formulario no está en proceso
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-[12px] text-pae-text-tertiary">Cargando…</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-[12px] text-pae-text-tertiary">
          Sin comentarios aún. {canComment ? "Sé el primero en dejar una observación." : ""}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-pae-border bg-pae-bg/40 p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-pae-text">
                    {c.author_name}
                    <span className="ml-2 text-[11px] font-normal text-pae-text-tertiary">
                      · {c.author_role_label}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-pae-text-tertiary">
                  {formatDate(c.created_at)}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-line text-[12px] leading-snug text-pae-text-secondary">
                {c.text}
              </p>
              {currentUserId === c.user_id && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-[11px] text-pae-text-tertiary hover:text-pae-red"
                  >
                    Borrar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Dejá tu observación (VP, BO, Sponsor y AT pueden comentar mientras el formulario esté en proceso)."
            className="block w-full rounded-lg border border-pae-border bg-pae-bg px-3 py-2 text-[13px] text-pae-text placeholder:text-pae-text-tertiary focus:border-pae-blue focus:outline-none"
          />
          {error && (
            <p className="rounded-lg bg-pae-red/10 px-3 py-2 text-[12px] text-pae-red">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-pae-blue px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:bg-pae-blue/50"
            >
              {submitting ? "Enviando…" : "Publicar comentario"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
