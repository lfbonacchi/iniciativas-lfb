"use client";

import type { F1Section, F1SectionKey } from "@/data/form_definitions/f1";

type SectionState = "complete" | "active" | "pending";

export function WizardStepper({
  formName,
  percent,
  sections,
  activeKey,
  completeMap,
  onSelect,
  onExit,
}: {
  formName: string;
  percent: number;
  sections: readonly F1Section[];
  activeKey: F1SectionKey;
  completeMap: Record<F1SectionKey, boolean>;
  onSelect: (key: F1SectionKey) => void;
  onExit: () => void;
}) {
  function stateOf(s: F1Section): SectionState {
    if (s.key === activeKey) return "active";
    if (completeMap[s.key]) return "complete";
    return "pending";
  }

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-pae-border bg-pae-surface">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
            Wizard
          </p>
          <h2 className="mt-1 text-[14px] font-semibold text-pae-text">
            {formName}
          </h2>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-md border border-pae-border bg-pae-surface px-2.5 py-1 text-[11px] font-medium text-pae-text-secondary transition hover:border-pae-blue/40 hover:text-pae-blue"
        >
          Salir
        </button>
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-pae-text-secondary">Avance</span>
          <span className="font-semibold text-pae-text">{percent}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-pae-bg">
          <div
            className="h-full rounded-full bg-pae-blue transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="flex-1 overflow-y-auto px-2 pb-6">
        {sections.map((s, idx) => {
          const state = stateOf(s);
          const colors =
            state === "complete"
              ? {
                  circle: "bg-pae-green text-white",
                  label: "text-pae-text",
                  connector: "bg-pae-green/40",
                }
              : state === "active"
                ? {
                    circle: "bg-pae-blue text-white",
                    label: "font-semibold text-pae-blue",
                    connector: "bg-pae-border",
                  }
                : {
                    circle: "bg-pae-red/10 text-pae-red",
                    label: "text-pae-text",
                    connector: "bg-pae-border",
                  };

          return (
            <li key={s.key} className="relative">
              {idx < sections.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-[26px] top-[34px] h-[calc(100%-10px)] w-px ${colors.connector}`}
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(s.key)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition ${
                  state === "active"
                    ? "bg-pae-blue/5"
                    : "hover:bg-pae-bg/60"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${colors.circle}`}
                >
                  {state === "complete" ? "✓" : s.number}
                </span>
                <span className={`text-[12px] leading-tight ${colors.label}`}>
                  {s.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-pae-border px-5 py-3">
        <div className="flex items-center gap-2 text-[10px] text-pae-text-tertiary">
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-pae-green" />
          <span>Completa</span>
          <span className="mx-1">·</span>
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-pae-blue" />
          <span>Activa</span>
          <span className="mx-1">·</span>
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-pae-red/40" />
          <span>Pendiente</span>
        </div>
      </div>
    </aside>
  );
}
