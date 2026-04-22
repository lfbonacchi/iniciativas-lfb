"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AddBloqueanteModal } from "@/components/mesa/AddBloqueanteModal";
import type { MesaDeTrabajo } from "@/lib/storage/mesa_de_trabajo";
import {
  addTemaPendiente,
  getMesaDeTrabajo,
  saveBrainstormNote,
  toggleBloqueanteResolved,
  toggleTemaPendiente,
} from "@/lib/storage/mesa_de_trabajo";

import { useInitiativeDetail } from "../DetailContext";

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`border-b border-pae-border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.05em] text-pae-text-tertiary ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function KpiTable({ kpis }: { kpis: MesaDeTrabajo["kpis"] }) {
  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[14px] font-semibold text-pae-text">
          Indicadores de impacto — target vs actual
        </h2>
        <p className="text-[11px] text-pae-text-tertiary">
          Dolor/oportunidad = KPI
        </p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <TableHeader>KPI</TableHeader>
              <TableHeader>Target</TableHeader>
              <TableHeader>Actual</TableHeader>
              <TableHeader>Trend</TableHeader>
            </tr>
          </thead>
          <tbody>
            {kpis.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-[12px] text-pae-text-tertiary"
                >
                  No hay indicadores cargados en el formulario.
                </td>
              </tr>
            )}
            {kpis.map((k) => (
              <tr
                key={k.key}
                className="border-b border-pae-border/60 hover:bg-pae-bg"
              >
                <td className="px-3 py-2.5 text-[12px] text-pae-text">
                  {k.indicator}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text-secondary">
                  {k.target}
                </td>
                <td className="px-3 py-2.5 text-[12px] font-semibold text-pae-green">
                  {k.actual}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-green">
                  {k.trend_label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-pae-text-tertiary">
        Los datos vienen de los formularios de cada etapa.
      </p>
    </section>
  );
}

function AvanceBars({ rows }: { rows: MesaDeTrabajo["avance"] }) {
  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h2 className="text-[14px] font-semibold text-pae-text">
        Indicadores de avance
      </h2>
      <div className="mt-4 space-y-4">
        {rows.length === 0 && (
          <p className="text-[12px] text-pae-text-tertiary">
            No hay indicadores de avance cargados.
          </p>
        )}
        {rows.map((r) => (
          <div key={r.indicator}>
            <div className="mb-1 flex items-baseline justify-between text-[11px]">
              <span className="font-medium text-pae-text">
                {r.indicator}:{" "}
                <span className="text-pae-text-secondary">
                  {r.actual} / {r.target}
                </span>
              </span>
              <span className="font-semibold text-pae-green tabular-nums">
                {r.percent !== null ? `${r.percent}%` : "—"}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-pae-bg">
              <div
                className="h-2 rounded-full bg-pae-green"
                style={{ width: `${r.percent ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[10px] text-pae-text-tertiary">
        📊 MVP no incluye graficador — posibilidad futura.
      </p>
    </section>
  );
}

function BloqueantesCard({
  mesa,
  onChange,
}: {
  mesa: MesaDeTrabajo;
  onChange: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleToggle(id: string) {
    const r = toggleBloqueanteResolved(id);
    if (r.success) onChange();
  }

  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-pae-text">
            Identificación de bloqueantes
          </h2>
          <p className="mt-0.5 text-[11px] text-pae-text-tertiary">
            Tickear para marcar como desbloqueado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-pae-blue px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90"
        >
          + Agregar bloqueante
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <TableHeader>Estado</TableHeader>
              <TableHeader>Bloqueante</TableHeader>
              <TableHeader>Involucrados</TableHeader>
              <TableHeader>Prioridad</TableHeader>
            </tr>
          </thead>
          <tbody>
            {mesa.bloqueantes.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-[12px] text-pae-text-tertiary"
                >
                  No hay bloqueantes registrados.
                </td>
              </tr>
            )}
            {mesa.bloqueantes.map((b) => (
              <tr
                key={b.id}
                className="border-b border-pae-border/60 hover:bg-pae-bg"
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={b.resolved}
                    onChange={() => handleToggle(b.id)}
                    aria-label={
                      b.resolved
                        ? "Marcar como no resuelto"
                        : "Marcar como desbloqueado"
                    }
                    className="h-4 w-4 accent-pae-green"
                  />
                </td>
                <td
                  className={`px-3 py-2.5 text-[12px] ${
                    b.resolved
                      ? "text-pae-text-tertiary line-through"
                      : "text-pae-text"
                  }`}
                >
                  {b.name}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-pae-text-secondary">
                  {b.involucrados_names.length > 0
                    ? b.involucrados_names.join(", ")
                    : "—"}
                </td>
                <td className="px-3 py-2.5">
                  {b.is_priority ? (
                    <span className="inline-block rounded-full bg-pae-red/10 px-2 py-[2px] text-[11px] font-semibold text-pae-red">
                      Sí
                    </span>
                  ) : (
                    <span className="text-[12px] text-pae-text-tertiary">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddBloqueanteModal
        open={modalOpen}
        initiativeId={mesa.initiative_id}
        availableUsers={mesa.available_users}
        onClose={() => setModalOpen(false)}
        onAdded={onChange}
      />
    </section>
  );
}

function BrainstormCard({
  mesa,
  onSaved,
}: {
  mesa: MesaDeTrabajo;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(mesa.brainstorm?.content ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(
    mesa.brainstorm?.updated_at ?? null,
  );
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(mesa.brainstorm?.content ?? "");
    setSavedAt(mesa.brainstorm?.updated_at ?? null);
  }, [mesa.brainstorm?.content, mesa.brainstorm?.updated_at]);

  const persist = useCallback(
    (content: string) => {
      setSaving(true);
      const r = saveBrainstormNote({
        initiative_id: mesa.initiative_id,
        content,
      });
      setSaving(false);
      if (r.success) {
        setSavedAt(r.data.updated_at);
        onSaved();
      }
    },
    [mesa.initiative_id, onSaved],
  );

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist(next), 1000);
  }

  function formatSaved(iso: string | null): string {
    if (!iso) return "Sin cambios todavía.";
    try {
      const d = new Date(iso);
      return `Guardado ${d.toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      })}`;
    } catch {
      return "Guardado.";
    }
  }

  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h2 className="text-[14px] font-semibold text-pae-text">Brainstorm</h2>
      {!open ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 rounded-lg bg-pae-blue/10 px-3 py-1.5 text-[12px] font-semibold text-pae-blue hover:bg-pae-blue/15"
          >
            📝 Abrir notas
          </button>
          <p className="mt-3 text-[11px] text-pae-text-tertiary">
            Abre un block de notas que se guarda como documento en la carpeta
            LTP.
          </p>
          {savedAt && (
            <p className="mt-2 text-[11px] text-pae-text-secondary">
              {formatSaved(savedAt)}
            </p>
          )}
        </>
      ) : (
        <>
          <textarea
            value={value}
            onChange={onChange}
            placeholder="Escribí ideas, hipótesis, recordatorios…"
            className="mt-3 block h-40 w-full resize-y rounded-lg border border-pae-border bg-pae-bg px-3 py-2 text-[13px] text-pae-text focus:border-pae-blue focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-pae-text-tertiary">
            <span>
              {saving ? "Guardando…" : formatSaved(savedAt)}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-pae-text-secondary hover:bg-pae-bg hover:text-pae-text"
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function TemasCard({
  mesa,
  onChange,
}: {
  mesa: MesaDeTrabajo;
  onChange: () => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const r = addTemaPendiente({
      initiative_id: mesa.initiative_id,
      text,
    });
    if (!r.success) {
      setError(r.error.message);
      return;
    }
    setError(null);
    setText("");
    onChange();
  }

  function handleToggle(id: string) {
    const r = toggleTemaPendiente(id);
    if (r.success) onChange();
  }

  return (
    <section className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <h2 className="text-[14px] font-semibold text-pae-text">
        Temas pendientes
      </h2>
      <ul className="mt-3 space-y-1.5">
        {mesa.temas_pendientes.length === 0 && (
          <li className="text-[12px] text-pae-text-tertiary">
            No hay temas pendientes.
          </li>
        )}
        {mesa.temas_pendientes.map((t) => (
          <li key={t.id} className="flex items-start gap-2">
            <input
              id={`tema-${t.id}`}
              type="checkbox"
              checked={t.done}
              onChange={() => handleToggle(t.id)}
              className="mt-0.5 h-4 w-4 accent-pae-green"
            />
            <label
              htmlFor={`tema-${t.id}`}
              className={`cursor-pointer text-[12px] ${
                t.done
                  ? "text-pae-green line-through"
                  : "text-pae-text"
              }`}
            >
              {t.text}
            </label>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nuevo tema…"
          maxLength={200}
          className="block h-8 flex-1 rounded-lg border border-pae-border bg-pae-bg px-3 text-[13px] text-pae-text focus:border-pae-blue focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-lg bg-pae-blue px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-pae-blue/90 disabled:bg-pae-blue/50"
        >
          + Agregar tema
        </button>
      </form>
      {error && (
        <p className="mt-2 text-[11px] text-pae-red">{error}</p>
      )}
    </section>
  );
}

function Placeholders() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-dashed border-pae-border bg-pae-bg/60 p-5">
        <h3 className="text-[13px] font-semibold text-pae-text-secondary">
          Plan de gestión del cambio
        </h3>
        <p className="mt-1 text-[11px] text-pae-text-tertiary">
          MVP no incluye — se desarrolla post-MVP.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-pae-border bg-pae-bg/60 p-5">
        <h3 className="text-[13px] font-semibold text-pae-text-secondary">
          Seguimiento presupuesto (SAP)
        </h3>
        <p className="mt-1 text-[11px] text-pae-text-tertiary">
          MVP no incluye — conexión SAP futura.
        </p>
        <button
          type="button"
          disabled
          title="Disponible en fase futura"
          className="mt-3 cursor-not-allowed rounded-lg border border-pae-border bg-pae-surface px-3 py-1.5 text-[12px] font-medium text-pae-text-tertiary"
        >
          🔗 Conectar con SAP
        </button>
      </div>
    </div>
  );
}

export default function MesaDeTrabajoTab() {
  const detail = useInitiativeDetail();
  const [mesa, setMesa] = useState<MesaDeTrabajo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!detail.is_stage_4_unlocked) return;
    const result = getMesaDeTrabajo(detail.initiative.id);
    if (!result.success) {
      setError(result.error.message);
      setMesa(null);
      return;
    }
    setError(null);
    setMesa(result.data);
  }, [detail.initiative.id, detail.is_stage_4_unlocked, reloadKey]);

  const content = useMemo(() => {
    if (!detail.is_stage_4_unlocked) {
      return (
        <div className="rounded-xl border border-pae-amber/30 bg-pae-amber/5 p-6">
          <p className="text-[13px] font-semibold text-pae-amber-dark">
            🔒 Mesa de trabajo bloqueada
          </p>
          <p className="mt-2 text-[12px] text-pae-text-secondary">
            Esta pestaña se habilita en etapa Delivery (cuando F3 está aprobado
            o F4 existe).
          </p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="rounded-xl border border-pae-red/30 bg-pae-red/5 p-4">
          <p className="text-[13px] text-pae-red">{error}</p>
        </div>
      );
    }
    if (!mesa) {
      return (
        <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
          <p className="text-[13px] text-pae-text-secondary">Cargando…</p>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <KpiTable kpis={mesa.kpis} />
          <AvanceBars rows={mesa.avance} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr_1fr]">
          <BloqueantesCard mesa={mesa} onChange={reload} />
          <BrainstormCard mesa={mesa} onSaved={reload} />
          <TemasCard mesa={mesa} onChange={reload} />
        </div>
        <Placeholders />
      </div>
    );
  }, [detail.is_stage_4_unlocked, error, mesa, reload]);

  return content;
}
