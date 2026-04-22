"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getFormEditors,
  grantFormEditAccess,
  revokeFormEditAccess,
  type DelegatedEditor,
  type FormEditorsSnapshot,
} from "@/lib/storage";

interface DelegatedEditorsPanelProps {
  initiativeId: string;
}

export function DelegatedEditorsPanel({
  initiativeId,
}: DelegatedEditorsPanelProps) {
  const [snapshot, setSnapshot] = useState<FormEditorsSnapshot | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    const res = getFormEditors(initiativeId);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setError(null);
    setSnapshot(res.data);
    setSelected("");
  }, [initiativeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!snapshot) {
    return (
      <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
        <p className="text-[12px] text-pae-text-secondary">
          {error ?? "Cargando editores delegados…"}
        </p>
      </section>
    );
  }

  const { editors, candidates, can_manage } = snapshot;

  function handleGrant() {
    if (!selected || busy) return;
    setBusy(true);
    const res = grantFormEditAccess(initiativeId, selected);
    setBusy(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    reload();
  }

  function handleRevoke(userId: string) {
    if (busy) return;
    const ed = editors.find((e) => e.user_id === userId);
    if (!ed) return;
    if (
      !window.confirm(
        `¿Revocar edición a ${ed.display_name}? Podrá seguir viendo la iniciativa y comentar.`,
      )
    ) {
      return;
    }
    setBusy(true);
    const res = revokeFormEditAccess(initiativeId, userId);
    setBusy(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    reload();
  }

  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-pae-text">
            Editores de formularios
          </h2>
          <p className="mt-1 text-[12px] text-pae-text-secondary">
            Por defecto, pueden editar el PO, Promotor, Líder de Dimensión y
            Scrum Master. El PO puede delegar edición a cualquier miembro.
            Cada cambio queda registrado en el control de cambios.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="text-[9px] font-semibold uppercase tracking-[0.05em] text-pae-text-tertiary">
              <th className="border-b border-pae-border px-3 py-2">Usuario</th>
              <th className="border-b border-pae-border px-3 py-2">Rol</th>
              <th className="border-b border-pae-border px-3 py-2">VP</th>
              <th className="border-b border-pae-border px-3 py-2 text-right">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {editors.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-3 text-[12px] text-pae-text-tertiary"
                  colSpan={4}
                >
                  Todavía no hay editores asignados.
                </td>
              </tr>
            ) : (
              editors.map((ed) => (
                <EditorRow
                  key={ed.user_id}
                  editor={ed}
                  canManage={can_manage}
                  busy={busy}
                  onRevoke={() => handleRevoke(ed.user_id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {can_manage && (
        <div className="mt-4 rounded-lg border border-pae-border bg-pae-bg/40 p-3">
          <p className="text-[12px] font-semibold text-pae-text">
            Delegar edición
          </p>
          <p className="mt-1 text-[11px] text-pae-text-tertiary">
            Seleccioná miembros de la iniciativa o de afuera de la iniciativa
            para que se sumen a tu equipo y puedan editar las etapas en
            conjunto (tus líderes tienen opción de comentar). Tus VP pueden
            comentar para hacer cambios.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="h-9 min-w-[280px] flex-1 rounded-lg border border-pae-border bg-pae-surface px-3 text-[13px] text-pae-text focus:border-pae-blue focus:outline-none"
            >
              <option value="">— Elegí un usuario —</option>
              {candidates.length === 0 && (
                <option value="" disabled>
                  No hay candidatos disponibles
                </option>
              )}
              {candidates.map((c) => (
                <option key={c.user_id} value={c.user_id}>
                  {c.display_name} · {c.job_title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleGrant}
              disabled={!selected || busy}
              className="rounded-lg bg-pae-blue px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:bg-pae-blue/40"
            >
              Dar edición
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-pae-red/10 px-3 py-2 text-[12px] text-pae-red">
          {error}
        </p>
      )}
    </section>
  );
}

function EditorRow({
  editor,
  canManage,
  busy,
  onRevoke,
}: {
  editor: DelegatedEditor;
  canManage: boolean;
  busy: boolean;
  onRevoke: () => void;
}) {
  return (
    <tr>
      <td className="border-b border-pae-border/60 px-3 py-2 text-[12px] text-pae-text">
        <div className="font-medium">{editor.display_name}</div>
        <div className="text-[11px] text-pae-text-tertiary">
          {editor.job_title}
        </div>
      </td>
      <td className="border-b border-pae-border/60 px-3 py-2 text-[12px] text-pae-text-secondary">
        {editor.role_label}
      </td>
      <td className="border-b border-pae-border/60 px-3 py-2 text-[11px] text-pae-text-tertiary">
        {editor.vicepresidencia || "—"}
      </td>
      <td className="border-b border-pae-border/60 px-3 py-2 text-right">
        {editor.is_natural_editor ? (
          <span className="text-[11px] text-pae-text-tertiary">
            Rol natural
          </span>
        ) : canManage ? (
          <button
            type="button"
            onClick={onRevoke}
            disabled={busy}
            className="text-[11px] font-semibold text-pae-red hover:underline disabled:text-pae-text-tertiary"
          >
            Revocar
          </button>
        ) : (
          <span className="text-[11px] text-pae-text-tertiary">Delegado</span>
        )}
      </td>
    </tr>
  );
}
