"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AddEventModal } from "@/components/events/AddEventModal";
import type {
  InitiativeTimeline,
  TimelineRow,
  TimelineState,
  TimelineUpcomingEvent,
} from "@/lib/storage/timeline";
import { getInitiativeTimeline, monthLabel } from "@/lib/storage/timeline";

import { useInitiativeDetail } from "../DetailContext";

const MONTHS = Array.from({ length: 12 }, (_, i) => monthLabel(i));

function barClasses(state: TimelineState): string {
  switch (state) {
    case "completed":
      return "bg-pae-green/80";
    case "in_progress":
      return "bg-pae-blue/70";
    case "pending":
      return "bg-pae-text-tertiary/40 border border-dashed border-pae-text-tertiary";
  }
}

function barPosition(
  startMonth: number,
  endMonth: number,
): { left: string; width: string } {
  const slot = 100 / 12;
  const left = startMonth * slot;
  const span = Math.max(endMonth + 1 - startMonth, 1);
  const width = span * slot;
  return { left: `${left}%`, width: `${width}%` };
}

function monthCenterPercent(month: number): string {
  const slot = 100 / 12;
  return `${month * slot + slot / 2}%`;
}

function monthEndPercent(month: number): string {
  const slot = 100 / 12;
  return `${(month + 1) * slot}%`;
}

function formatDateShort(iso: string): string {
  const [, month, day] = iso.split("-");
  const idx = Number(month) - 1;
  const label = monthLabel(idx).toLowerCase();
  return `${Number(day)} ${label}`;
}

const EVENT_KIND_LABEL: Record<string, string> = {
  gate: "Gateway",
  sprint_review: "Sprint Review",
  seg_q: "Seguimiento trimestral",
  seg_mensual: "Seguimiento mensual",
  ltp_plan: "Revisión LTP",
  entrega: "Entrega",
  otro: "Otro",
};

function eventTypeLabel(evt: TimelineUpcomingEvent): string {
  if (evt.type === "otro" && evt.custom_type_label) return evt.custom_type_label;
  return EVENT_KIND_LABEL[evt.type] ?? "Evento";
}

function GanttRow({ row }: { row: TimelineRow }) {
  const bar = row.bar;
  const hasBar = Boolean(bar);
  const showBarFallback = !hasBar && row.dots.length === 0;

  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-3 py-2">
      <div className="text-[11px] font-medium text-pae-text">{row.label}</div>
      <div className="relative h-7 rounded-md bg-pae-bg/50">
        {showBarFallback && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] italic text-pae-text-tertiary">
            Sin actividad
          </span>
        )}

        {bar && (
          <div
            className={`absolute top-1.5 h-4 rounded-sm ${barClasses(bar.state)}`}
            style={barPosition(bar.start_month, bar.end_month)}
            title={
              bar.state === "completed"
                ? "Completado"
                : bar.state === "in_progress"
                  ? "En curso"
                  : "Pendiente"
            }
          />
        )}

        {row.gateway && (
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: monthEndPercent(row.gateway.month) }}
            title={
              row.gateway.is_pending
                ? `Gateway ${row.gateway.number} · pendiente`
                : row.gateway.is_approved
                  ? `Gateway ${row.gateway.number} · aprobado`
                  : `Gateway ${row.gateway.number}`
            }
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pae-red text-[9px] font-semibold text-white shadow-sm">
              G{row.gateway.number}
            </span>
          </div>
        )}

        {!hasBar &&
          row.dots.map((d, i) => (
            <div
              key={`${row.key}_${d.date_iso}_${i}`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: monthCenterPercent(d.month) }}
              title={`${d.label} · ${formatDateShort(d.date_iso)}`}
            >
              <span className="block h-2 w-2 rounded-full bg-pae-blue/70" />
            </div>
          ))}
      </div>
    </div>
  );
}

function LegendSwatch({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-4 rounded-sm ${className}`} />
      <span className="text-[11px] text-pae-text-secondary">{label}</span>
    </div>
  );
}

function UpcomingList({
  events,
  onAdd,
}: {
  events: TimelineUpcomingEvent[];
  onAdd: () => void;
}) {
  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-pae-text">
          Próximos eventos
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg border border-pae-border bg-pae-surface px-3 py-1.5 text-[12px] font-medium text-pae-blue transition hover:bg-pae-blue/5"
        >
          + Agregar evento
        </button>
      </div>

      {events.length === 0 ? (
        <p className="mt-6 text-[12px] text-pae-text-tertiary">
          No hay eventos próximos. Usá “+ Agregar evento” para cargar uno.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-pae-border/60">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-pae-text">
                  {e.name}
                </p>
                <p className="text-[11px] text-pae-text-tertiary">
                  {eventTypeLabel(e)}
                  {e.is_synthetic ? " · auto" : ""}
                </p>
              </div>
              <span className="ml-3 shrink-0 text-[11px] font-medium text-pae-text-secondary">
                {formatDateShort(e.date_iso)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EventosTab() {
  const detail = useInitiativeDetail();
  const [timeline, setTimeline] = useState<InitiativeTimeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const result = getInitiativeTimeline(detail.initiative.id);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setTimeline(result.data);
  }, [detail.initiative.id, reloadKey]);

  const initiativeOption = useMemo(
    () => [{ id: detail.initiative.id, name: detail.initiative.name }],
    [detail.initiative.id, detail.initiative.name],
  );

  if (error) {
    return (
      <div className="rounded-xl border border-pae-red/30 bg-pae-red/5 p-4">
        <p className="text-[13px] text-pae-red">{error}</p>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
        <p className="text-[13px] text-pae-text-secondary">Cargando…</p>
      </div>
    );
  }

  const todayLeft = `${((timeline.today_month + timeline.today_day_fraction) * 100) / 12}%`;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-pae-text">
              Línea de tiempo · {detail.initiative.name}
            </h2>
            <p className="mt-0.5 text-[11px] text-pae-text-tertiary">
              Año {timeline.year}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LegendSwatch className="bg-pae-green/80" label="Completado" />
            <LegendSwatch className="bg-pae-blue/70" label="En curso" />
            <LegendSwatch
              className="bg-pae-text-tertiary/40 border border-dashed border-pae-text-tertiary"
              label="Pendiente"
            />
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-pae-red" />
              <span className="text-[11px] text-pae-text-secondary">
                Gateway
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-[2px] border-l-2 border-dashed border-pae-red" />
              <span className="text-[11px] text-pae-text-secondary">Hoy</span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="grid grid-cols-[180px_1fr] items-center gap-3">
            <div />
            <div className="grid grid-cols-12">
              {MONTHS.map((m, i) => (
                <div
                  key={`${m}_${i}`}
                  className="border-l border-dashed border-pae-border/70 px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary first:border-l-0"
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-1">
            <div className="divide-y divide-pae-border/60">
              {timeline.rows.map((row) => (
                <GanttRow key={row.key} row={row} />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0">
              <div className="grid h-full grid-cols-[180px_1fr] gap-3">
                <div />
                <div className="relative h-full">
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-pae-red"
                    style={{ left: todayLeft }}
                    title={`Hoy · ${formatDateShort(timeline.today_iso)}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpcomingList
        events={timeline.upcoming}
        onAdd={() => setModalOpen(true)}
      />

      <AddEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={reload}
        initiatives={initiativeOption}
        defaultInitiativeId={detail.initiative.id}
        lockInitiative
      />
    </div>
  );
}
