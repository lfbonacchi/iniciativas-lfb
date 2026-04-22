"use client";

import Link from "next/link";

import type {
  AdoptionIndicator,
  AdoptionTrend,
  BudgetLine,
  Deliverable,
  ImpactIndicator,
  InitiativeStage,
  ValueStream5YearRow,
} from "@/types";
import type { InitiativeDetail } from "@/lib/storage/initiative_detail";

import { useInitiativeDetail } from "./DetailContext";

function fmtUsd(v: number): string {
  if (v === 0) return "—";
  if (v >= 1_000_000) return `USD ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `USD ${Math.round(v / 1_000)}K`;
  return `USD ${v}`;
}

function fmtRoi(roi: number): string {
  if (!roi || !isFinite(roi)) return "—";
  return `${roi.toFixed(1)}x`;
}

function fmtHh(hh: number): string {
  if (!hh) return "—";
  if (hh >= 10_000) return `${Math.round(hh / 1000)}K hs`;
  if (hh >= 1000) return `${(hh / 1000).toFixed(1)}K hs`;
  return `${hh} hs`;
}

export default function ResumenTab() {
  const detail = useInitiativeDetail();
  const { summary, is_stage_4_unlocked, is_vp_or_at, vp_at_extras } = detail;
  const showStage4Blocks = is_stage_4_unlocked;
  const hideActualColumn =
    detail.initiative.current_stage === "proposal" ||
    detail.initiative.current_stage === "dimensioning";

  if (!detail.has_form_data) {
    return <EmptyInitiativeState detail={detail} />;
  }

  return (
    <div className="space-y-5">
      {/* Propósito */}
      <Card>
        <SectionTitle>Propósito</SectionTitle>
        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-pae-text-secondary">
          {summary.purpose}
        </p>
      </Card>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Valor esperado" value={fmtUsd(detail.kpis.value_usd)} />
        <KpiCard label="Gasto esperado" value={fmtUsd(detail.kpis.cost_usd)} />
        <KpiCard label="ROI" value={fmtRoi(detail.kpis.roi)} />
        <KpiCard label="HH optimizadas" value={fmtHh(detail.kpis.hh)} />
      </div>

      {/* Bloque ① Corrientes de valor 5 años */}
      <Card>
        <SectionTitle>Corrientes de valor — 5 años</SectionTitle>
        <ValueStreamsTable rows={summary.value_streams_5y} />
      </Card>

      {/* Bloque ② Indicadores de impacto — full width */}
      <Card>
        <SectionTitle>
          Indicadores de impacto
          <span className="ml-2 text-[10px] font-normal text-pae-text-tertiary">
            (de formularios)
          </span>
        </SectionTitle>
        <ImpactIndicatorsTable
          rows={summary.impact_indicators}
          hideActual={hideActualColumn}
        />
        {hideActualColumn && (
          <p className="mt-2 text-[10px] text-pae-text-tertiary">
            Columna &ldquo;Actual&rdquo; vacía en etapas 1-2, se llena desde
            etapa 3.
          </p>
        )}
      </Card>

      {/* Bloque ③④ Desafíos + Interdependencias en 2 columnas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Desafíos y riesgos</SectionTitle>
          <ul className="mt-3 space-y-2">
            {summary.challenges.map((c, i) => (
              <li
                key={i}
                className="flex gap-2 text-[12px] leading-snug text-pae-text-secondary"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-pae-red" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Interdependencias</SectionTitle>
          <ul className="mt-3 space-y-3">
            {detail.resolved_interdependencies.map((dep, i) => (
              <li key={i}>
                {dep.initiative_id ? (
                  <Link
                    href={`/iniciativas/${dep.initiative_id}`}
                    className="text-[12px] font-medium text-pae-blue hover:underline"
                  >
                    {dep.label}
                  </Link>
                ) : (
                  <span className="text-[12px] font-medium text-pae-text">
                    {dep.label}
                  </span>
                )}
                <p className="mt-0.5 text-[11px] leading-snug text-pae-text-tertiary">
                  {dep.ref_note}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Bloques Etapa 4 */}
      {showStage4Blocks && summary.deliverables.length > 0 && (
        <Card>
          <SectionTitle>
            Entregables priorizados
            <span className="ml-2 text-[10px] font-normal text-pae-text-tertiary">
              (de F4/F5)
            </span>
          </SectionTitle>
          <DeliverablesTable rows={summary.deliverables} />
        </Card>
      )}

      {showStage4Blocks && summary.adoption_indicators.length > 0 && (
        <Card>
          <SectionTitle>Indicadores adopción / asertividad</SectionTitle>
          <AdoptionIndicatorsTable rows={summary.adoption_indicators} />
        </Card>
      )}

      {showStage4Blocks &&
        (summary.budget_opex.length > 0 ||
          summary.budget_capex.length > 0) && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle>Presupuesto del año — OPEX</SectionTitle>
              <BudgetTable rows={summary.budget_opex} />
            </Card>
            <Card>
              <SectionTitle>Presupuesto del año — CAPEX</SectionTitle>
              <BudgetTable rows={summary.budget_capex} />
            </Card>
          </div>
        )}

      {/* Sección VP / AT */}
      {is_vp_or_at && vp_at_extras && (
        <>
          <div className="rounded-lg bg-pae-blue/5 px-4 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-blue">
              ▼ Sección adicional — solo VP y Área Transformación
            </p>
          </div>

          <Card>
            <SectionTitle>Objetivos Upstream vs iniciativas</SectionTitle>
            <ObjectivesTable rows={vp_at_extras.objectives} />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle>Corrientes cruzadas</SectionTitle>
              <CrossStreamsTable rows={vp_at_extras.cross_streams} />
            </Card>

            <div className="rounded-xl border-2 border-dashed border-pae-border bg-pae-bg/50 p-5">
              <p className="text-[13px] font-semibold text-pae-text-tertiary">
                Vision House
              </p>
              <p className="mt-1.5 text-[11px] leading-snug text-pae-text-tertiary">
                Post-MVP: objetivos estratégicos y focos del año vinculados a
                las iniciativas del portfolio.
              </p>
            </div>
          </div>

          <Card>
            <SectionTitle>Próximos eventos</SectionTitle>
            <ul className="mt-2 space-y-2">
              {vp_at_extras.upcoming_events.length === 0 && (
                <li className="text-[11px] text-pae-text-tertiary">
                  No hay eventos próximos registrados.
                </li>
              )}
              {vp_at_extras.upcoming_events.map((ev, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-pae-text-tertiary">
                      {ev.date_label}
                    </span>
                    <Link
                      href={`/iniciativas/${ev.initiative_id}`}
                      className="text-pae-text hover:text-pae-blue"
                    >
                      {ev.label}
                    </Link>
                  </div>
                  {ev.has_vote_pending && (
                    <span className="font-semibold text-pae-red">
                      Tu voto
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Estado vacío — iniciativa sin datos cargados
// ============================================================================

function EmptyInitiativeState({ detail }: { detail: InitiativeDetail }) {
  const iniId = detail.initiative.id;
  const docsHref = `/iniciativas/${iniId}/documentos`;
  const formsHref = `/iniciativas/${iniId}/formularios`;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border-2 border-dashed border-pae-blue/30 bg-pae-blue/5 p-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-blue">
          Sin datos cargados
        </p>
        <h2 className="mt-2 text-[18px] font-semibold text-pae-text">
          Todavía no hay información en esta iniciativa
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-[13px] leading-snug text-pae-text-secondary">
          Los dashboards se llenan a medida que se completan los formularios.
          Podés arrancar por el F1 o, si la iniciativa viene de un flujo
          previo, subir los archivos de F2, F3, F4 o F5.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
            Opción 1 · Camino A
          </p>
          <h3 className="mt-2 text-[14px] font-semibold text-pae-text">
            Completar Formulario 1 (Propuesta)
          </h3>
          <p className="mt-2 text-[12px] leading-snug text-pae-text-secondary">
            Para iniciativas nuevas. Arrancá desde la propuesta y avanzá por
            los gateways: F1 → G1 → F2 → G2 → F3 → G3 → F4/F5.
          </p>
          <Link
            href={formsHref}
            className="mt-4 inline-block rounded-lg bg-pae-blue px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-pae-blue/90"
          >
            Ir a Formularios · F1
          </Link>
        </div>

        <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
            Opción 2 · Camino B
          </p>
          <h3 className="mt-2 text-[14px] font-semibold text-pae-text">
            Subir archivos para F2, F3, F4 o F5
          </h3>
          <p className="mt-2 text-[12px] leading-snug text-pae-text-secondary">
            Para iniciativas existentes que ya tienen formularios trabajados
            por fuera. Subí los documentos y la iniciativa queda en la etapa
            correspondiente.
          </p>
          <Link
            href={docsHref}
            className="mt-4 inline-block rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[13px] font-semibold text-pae-blue transition hover:bg-pae-blue/5"
          >
            Ir a Documentos · subir archivos
          </Link>
        </div>
      </div>

      <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
        <p className="text-[12px] text-pae-text-tertiary">
          Una vez que haya datos cargados, este panel muestra propósito,
          corrientes de valor, indicadores de impacto, desafíos,
          interdependencias y, a partir de Delivery, los entregables y
          presupuestos del año.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers de UI
// ============================================================================

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">{children}</div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-semibold text-pae-text">{children}</h2>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-pae-surface p-5 shadow-sm">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-pae-text-tertiary">
        {label}
      </p>
      <p className="mt-2 text-[20px] font-bold tabular-nums text-pae-text">
        {value}
      </p>
    </div>
  );
}

function ThLabel({ children }: { children: React.ReactNode }) {
  return (
    <th className="pb-2 pr-3 text-left text-[9px] font-semibold uppercase tracking-[0.05em] text-pae-text-tertiary">
      {children}
    </th>
  );
}

function Td({
  children,
  bold = false,
  green = false,
  muted = false,
}: {
  children: React.ReactNode;
  bold?: boolean;
  green?: boolean;
  muted?: boolean;
}) {
  const color = green
    ? "text-pae-green"
    : muted
      ? "text-pae-text-tertiary"
      : "text-pae-text-secondary";
  return (
    <td
      className={`py-2 pr-3 text-[11px] ${bold ? "font-semibold" : ""} ${color}`}
    >
      {children}
    </td>
  );
}

function ValueStreamsTable({ rows }: { rows: ValueStream5YearRow[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse">
        <thead className="border-b border-pae-border">
          <tr>
            <ThLabel>Corriente</ThLabel>
            <ThLabel>Año 1</ThLabel>
            <ThLabel>Año 3</ThLabel>
            <ThLabel>Año 5</ThLabel>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={i < rows.length - 1 ? "border-b border-pae-border/60" : ""}
            >
              <Td bold>
                <span className="text-pae-text">{r.stream}</span>
              </Td>
              <Td>{r.year_1}</Td>
              <Td>{r.year_3}</Td>
              <Td green bold>
                {r.year_5}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function priorityTone(
  priority: ImpactIndicator["priority"],
): { bg: string; text: string } {
  switch (priority) {
    case "Alta":
      return { bg: "bg-pae-red/10", text: "text-pae-red" };
    case "Media":
      return { bg: "bg-pae-amber/10", text: "text-pae-amber" };
    case "Baja":
      return {
        bg: "bg-pae-text-tertiary/10",
        text: "text-pae-text-secondary",
      };
  }
}

function ImpactIndicatorsTable({
  rows,
  hideActual,
}: {
  rows: ImpactIndicator[];
  hideActual: boolean;
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse">
        <thead className="border-b border-pae-border">
          <tr>
            <ThLabel>Indicador</ThLabel>
            <ThLabel>Inicio</ThLabel>
            <ThLabel>Target</ThLabel>
            <ThLabel>Actual</ThLabel>
            <ThLabel>Prio</ThLabel>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const tone = priorityTone(r.priority);
            const actual = hideActual ? null : r.actual;
            return (
              <tr
                key={i}
                className={i < rows.length - 1 ? "border-b border-pae-border/60" : ""}
              >
                <Td bold>
                  <span className="text-pae-text">{r.indicator}</span>
                </Td>
                <Td>{r.baseline}</Td>
                <Td>{r.target}</Td>
                <Td
                  green={actual !== null && actual !== "—"}
                  muted={actual === null || actual === "—"}
                  bold={actual !== null && actual !== "—"}
                >
                  {actual ?? "—"}
                </Td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-full px-2 py-[2px] text-[10px] font-medium ${tone.bg} ${tone.text}`}
                  >
                    {r.priority}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function deliverableStatusTone(
  status: Deliverable["status"],
): { bg: string; text: string } {
  switch (status) {
    case "Completado":
      return { bg: "bg-pae-green/10", text: "text-pae-green" };
    case "En curso":
      return { bg: "bg-pae-blue/10", text: "text-pae-blue" };
    case "Planificado":
      return {
        bg: "bg-pae-text-tertiary/10",
        text: "text-pae-text-secondary",
      };
  }
}

function DeliverablesTable({ rows }: { rows: Deliverable[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead className="border-b border-pae-border">
          <tr>
            <ThLabel>Entregable</ThLabel>
            <ThLabel>Responsable</ThLabel>
            <ThLabel>Quarter</ThLabel>
            <ThLabel>Estado</ThLabel>
            <ThLabel>Avance</ThLabel>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const tone = deliverableStatusTone(r.status);
            return (
              <tr
                key={i}
                className={i < rows.length - 1 ? "border-b border-pae-border/60" : ""}
              >
                <Td bold>
                  <span className="text-pae-text">{r.name}</span>
                </Td>
                <Td>{r.responsible}</Td>
                <Td>{r.quarter}</Td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-full px-2 py-[2px] text-[10px] font-medium ${tone.bg} ${tone.text}`}
                  >
                    {r.status}
                  </span>
                </td>
                <Td
                  green={r.progress !== "—" && r.progress !== ""}
                  muted={r.progress === "—"}
                  bold
                >
                  {r.progress}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function trendSymbol(trend: AdoptionTrend): {
  label: string;
  color: string;
} {
  switch (trend) {
    case "up":
      return { label: "↑", color: "text-pae-green" };
    case "flat":
      return { label: "→", color: "text-pae-text-tertiary" };
    case "down":
      return { label: "↓", color: "text-pae-red" };
    case "done":
      return { label: "✓", color: "text-pae-green" };
  }
}

function AdoptionIndicatorsTable({ rows }: { rows: AdoptionIndicator[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead className="border-b border-pae-border">
          <tr>
            <ThLabel>Indicador</ThLabel>
            <ThLabel>Tipo</ThLabel>
            <ThLabel>Inicio</ThLabel>
            <ThLabel>Target</ThLabel>
            <ThLabel>Actual</ThLabel>
            <ThLabel>Trend</ThLabel>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const t = trendSymbol(r.trend);
            return (
              <tr
                key={i}
                className={i < rows.length - 1 ? "border-b border-pae-border/60" : ""}
              >
                <Td bold>
                  <span className="text-pae-text">{r.indicator}</span>
                </Td>
                <Td>{r.type}</Td>
                <Td>{r.baseline}</Td>
                <Td>{r.target}</Td>
                <Td green bold>
                  {r.actual}
                </Td>
                <td className={`py-2 pr-3 text-[12px] font-semibold ${t.color}`}>
                  {t.label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BudgetTable({ rows }: { rows: BudgetLine[] }) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 text-[11px] text-pae-text-tertiary">
        Sin líneas cargadas.
      </p>
    );
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b border-pae-border">
          <tr>
            <ThLabel>Subcategoría</ThLabel>
            <ThLabel>Monto</ThLabel>
            <ThLabel>Detalle</ThLabel>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={i < rows.length - 1 ? "border-b border-pae-border/60" : ""}
            >
              <Td bold>
                <span className="text-pae-text">{r.subcategory}</span>
              </Td>
              <Td bold>{r.amount}</Td>
              <Td muted>{r.detail}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STAGE_CHIP_TONE: Record<
  InitiativeStage,
  { bg: string; text: string; label: string }
> = {
  proposal: { bg: "bg-pae-blue/10", text: "text-pae-blue", label: "Prop." },
  dimensioning: { bg: "bg-pae-blue/10", text: "text-pae-blue", label: "Dim." },
  mvp: { bg: "bg-pae-green/10", text: "text-pae-green", label: "MVP" },
  ltp_tracking: {
    bg: "bg-pae-green/10",
    text: "text-pae-green",
    label: "Delivery",
  },
};

function ObjectivesTable({
  rows,
}: {
  rows: NonNullable<InitiativeDetail["vp_at_extras"]>["objectives"];
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 text-[11px] text-pae-text-tertiary">
        No hay objetivos vinculados.
      </p>
    );
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead className="border-b border-pae-border">
          <tr>
            <ThLabel>Objetivo</ThLabel>
            <ThLabel>Iniciativa</ThLabel>
            <ThLabel>Etapa</ThLabel>
            <ThLabel>Entregable clave</ThLabel>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const tone = STAGE_CHIP_TONE[r.stage];
            return (
              <tr
                key={i}
                className={i < rows.length - 1 ? "border-b border-pae-border/60" : ""}
              >
                <Td bold>
                  <span className="text-pae-text">{r.objective}</span>
                </Td>
                <td className="py-2 pr-3">
                  <Link
                    href={`/iniciativas/${r.initiative_id}`}
                    className="text-[11px] font-medium text-pae-blue hover:underline"
                  >
                    {r.initiative_name}
                  </Link>
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-full px-2 py-[2px] text-[10px] font-medium ${tone.bg} ${tone.text}`}
                  >
                    {tone.label}
                  </span>
                </td>
                <Td muted>{r.deliverable}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CrossStreamsTable({
  rows,
}: {
  rows: NonNullable<InitiativeDetail["vp_at_extras"]>["cross_streams"];
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 text-[11px] text-pae-text-tertiary">
        No hay datos de corrientes cruzadas.
      </p>
    );
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b border-pae-border">
          <tr>
            <ThLabel>Corriente</ThLabel>
            <ThLabel>Iniciativas que aportan</ThLabel>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={i < rows.length - 1 ? "border-b border-pae-border/60" : ""}
            >
              <Td bold>
                <span className="text-pae-text">{r.stream}</span>
              </Td>
              <Td muted>{r.initiatives}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
