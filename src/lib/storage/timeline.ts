import type {
  Form,
  FormType,
  Gateway,
  Id,
  PortfolioEvent,
  PortfolioEventType,
} from "@/types";
import { err, ok, type Result } from "@/lib/result";

import {
  getCurrentUserFromStore,
  userCanAccessInitiative,
} from "./_security";
import { readStore } from "./_store";

export type TimelineState = "completed" | "in_progress" | "pending";

export interface TimelineBar {
  /** 0-11: month index in the timeline year (Jan..Dec) */
  start_month: number;
  end_month: number;
  state: TimelineState;
}

export interface TimelineGateway {
  number: 1 | 2 | 3;
  /** 0-11 month index */
  month: number;
  /** Pending gateway still open for voting */
  is_pending: boolean;
  /** Gateway was approved */
  is_approved: boolean;
}

export type TimelineRowKey =
  | "etapa1"
  | "etapa2"
  | "etapa3"
  | "ltp"
  | "plan_anual"
  | "seg_q"
  | "sprint_review"
  | "adhoc";

export interface TimelineDot {
  /** 0-11 month index */
  month: number;
  /** day of month for tooltip */
  date_iso: string;
  label: string;
}

export interface TimelineRow {
  key: TimelineRowKey;
  label: string;
  bar: TimelineBar | null;
  gateway: TimelineGateway | null;
  dots: TimelineDot[];
}

export interface TimelineUpcomingEvent {
  id: Id;
  name: string;
  date_iso: string;
  type: PortfolioEventType;
  custom_type_label: string | null;
  status: "scheduled" | "cancelled";
  /** True if synthesized (pending gateway) and not yet persisted */
  is_synthetic: boolean;
}

export interface InitiativeTimeline {
  year: number;
  today_iso: string;
  today_month: number;
  today_day_fraction: number;
  rows: TimelineRow[];
  upcoming: TimelineUpcomingEvent[];
}

const MONTHS_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

export function monthLabel(index: number): string {
  return MONTHS_ES[index] ?? "";
}

function todayParts(): { iso: string; year: number; month: number; dayFrac: number } {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayFrac = (d.getDate() - 1) / daysInMonth;
  const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { iso, year, month, dayFrac };
}

function monthOf(iso: string, year: number): number | null {
  const m = /^(\d{4})-(\d{2})-/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  if (y < year) return -1;
  if (y > year) return 12;
  return mo;
}

function clampMonth(value: number): number {
  if (value < 0) return 0;
  if (value > 11) return 11;
  return value;
}

const STAGE_DEFAULT_SPAN: Record<FormType, { start: number; end: number }> = {
  F1: { start: 0, end: 2 },
  F2: { start: 2, end: 5 },
  F3: { start: 5, end: 8 },
  F4: { start: 5, end: 11 },
  F5: { start: 8, end: 11 },
};

function isFormApproved(f: Form): boolean {
  return (
    f.status === "approved" ||
    f.status === "final" ||
    f.status === "reviewed" ||
    f.status === "closed"
  );
}

function buildStageRow(
  key: "etapa1" | "etapa2" | "etapa3",
  label: string,
  hasStage: boolean,
  form: Form | undefined,
  gateway: Gateway | undefined,
  year: number,
  today: { month: number; iso: string },
): TimelineRow {
  if (!hasStage) {
    return { key, label, bar: null, gateway: null, dots: [] };
  }

  const formType: FormType =
    key === "etapa1" ? "F1" : key === "etapa2" ? "F2" : "F3";
  const defaults = STAGE_DEFAULT_SPAN[formType];

  let state: TimelineState = "pending";
  let startMonth = defaults.start;
  let endMonth = defaults.end;

  if (form) {
    // Para pintar "completado" (verde) necesitamos evidencia real: approved_at
    // presente, en este año, y anterior o igual a hoy. Si no la tenemos, la
    // barra no puede afirmar que está terminada.
    let hasRealCompletion = false;
    if (isFormApproved(form) && form.approved_at && form.approved_at <= today.iso) {
      const m = monthOf(form.approved_at, year);
      if (m !== null && m >= 0 && m <= 11) {
        state = "completed";
        endMonth = m;
        hasRealCompletion = true;
        if (form.created_at) {
          const cm = monthOf(form.created_at, year);
          if (cm !== null && cm >= 0 && cm <= 11 && cm < endMonth) {
            startMonth = cm;
          }
        }
        if (startMonth > endMonth) startMonth = endMonth;
      }
    }
    if (!hasRealCompletion) {
      // Sin evidencia real de cierre: la barra muestra "en proceso" desde
      // el arranque (created_at si cae este año, default.start si no) hasta
      // hoy. Si el arranque quedó en el futuro, es "pendiente" (span por
      // default, sin capar — se ve gris a futuro).
      state = "in_progress";
      endMonth = clampMonth(today.month);
      if (form.created_at) {
        const cm = monthOf(form.created_at, year);
        if (cm !== null && cm >= 0 && cm <= 11) {
          startMonth = cm;
        } else {
          // created_at en otro año: arrastrar el default al mes actual para
          // que la barra no apunte a futuro.
          startMonth = Math.min(defaults.start, endMonth);
        }
      }
      if (startMonth > today.month) {
        // Actividad aún en el futuro (nunca arrancó en este año) → pendiente.
        state = "pending";
        startMonth = defaults.start;
        endMonth = defaults.end;
      } else if (endMonth < startMonth) {
        endMonth = startMonth;
      }
    }
  }

  if (endMonth < startMonth) endMonth = startMonth;

  const gatewayNumber: 1 | 2 | 3 =
    key === "etapa1" ? 1 : key === "etapa2" ? 2 : 3;

  const gatewayInfo: TimelineGateway = {
    number: gatewayNumber,
    month: clampMonth(endMonth),
    is_pending: gateway?.status === "pending",
    is_approved: gateway?.status === "approved",
  };

  return {
    key,
    label,
    bar: { start_month: startMonth, end_month: endMonth, state },
    gateway: gatewayInfo,
    dots: [],
  };
}

function buildLtpRows(
  forms: Form[],
  year: number,
  today: { month: number; iso: string },
): { ltp: TimelineRow; planAnual: TimelineRow } {
  const periodMatches = (f: Form): boolean => {
    if (!f.ltp_period) return false;
    return f.ltp_period.endsWith(`-${year}`);
  };

  const f4 = forms.find((f) => f.form_type === "F4" && periodMatches(f));
  const f5 = forms.find((f) => f.form_type === "F5" && periodMatches(f));

  function rowFor(
    key: "ltp" | "plan_anual",
    label: string,
    form: Form | undefined,
  ): TimelineRow {
    if (!form) {
      return { key, label, bar: null, gateway: null, dots: [] };
    }
    const defaults = key === "ltp" ? STAGE_DEFAULT_SPAN.F4 : STAGE_DEFAULT_SPAN.F5;
    let state: TimelineState = "in_progress";
    if (isFormApproved(form)) state = "completed";
    if (form.status === "draft" && !form.submitted_at) state = "in_progress";
    // Si el "approved_at" es posterior a hoy, todavía no está completado.
    if (
      state === "completed" &&
      !!form.approved_at &&
      form.approved_at > today.iso
    ) {
      state = "pending";
    }

    let startMonth = defaults.start;
    let endMonth = defaults.end;
    if (form.ltp_period) {
      const m = /^(\d{2})-(\d{4})$/.exec(form.ltp_period);
      if (m) {
        const periodMonth = Number(m[1]) - 1;
        if (key === "ltp") {
          startMonth = clampMonth(periodMonth);
          endMonth = 11;
        } else {
          startMonth = clampMonth(periodMonth - 3);
          endMonth = 11;
        }
      }
    }
    if (state === "completed") {
      // Solo quedan como "completed" si hay approved_at real en el pasado
      // y cae en este año. Si no, se degrada: pendiente si arranca en futuro,
      // en curso si arranca hoy/antes (y la barra termina en hoy).
      let hasRealCompletion = false;
      if (form.approved_at && form.approved_at <= today.iso) {
        const m = monthOf(form.approved_at, year);
        if (m !== null && m >= 0 && m <= 11) {
          endMonth = m;
          hasRealCompletion = true;
        }
      }
      if (!hasRealCompletion) {
        if (startMonth > today.month) {
          state = "pending";
          // Mantener defaults (futuro) → gris.
        } else {
          state = "in_progress";
          endMonth = clampMonth(today.month);
        }
      }
    }
    if (state === "in_progress") {
      // No adelantar la barra más allá del mes actual.
      if (startMonth > today.month) startMonth = clampMonth(today.month);
      endMonth = clampMonth(today.month);
    }
    if (endMonth < startMonth) endMonth = startMonth;
    return {
      key,
      label,
      bar: { start_month: startMonth, end_month: endMonth, state },
      gateway: null,
      dots: [],
    };
  }

  return {
    ltp: rowFor("ltp", "LTP (Visión Anual)", f4),
    planAnual: rowFor("plan_anual", "Plan Anual (F5)", f5),
  };
}

function buildDotRows(
  events: PortfolioEvent[],
  year: number,
): { segQ: TimelineRow; sprint: TimelineRow; adhoc: TimelineRow } {
  const inYear = events.filter((e) => {
    if (e.status === "cancelled") return false;
    const yy = e.date.slice(0, 4);
    return yy === String(year);
  });

  function dotsFor(types: PortfolioEventType[]): TimelineDot[] {
    return inYear
      .filter((e) => types.includes(e.type))
      .map<TimelineDot>((e) => {
        const m = monthOf(e.date, year);
        return {
          month: clampMonth(m ?? 0),
          date_iso: e.date,
          label: e.name,
        };
      });
  }

  const segQ: TimelineRow = {
    key: "seg_q",
    label: "Seguimientos Q",
    bar: null,
    gateway: null,
    dots: dotsFor(["seg_q", "seg_mensual"]),
  };
  const sprint: TimelineRow = {
    key: "sprint_review",
    label: "Sprint Review",
    bar: null,
    gateway: null,
    dots: dotsFor(["sprint_review"]),
  };
  const adhoc: TimelineRow = {
    key: "adhoc",
    label: "Revisión ad-hoc",
    bar: null,
    gateway: null,
    dots: dotsFor(["otro", "entrega", "ltp_plan"]),
  };

  // Si no hay eventos custom, dejamos dots deterministas como demo para Seg Q
  // y Sprint Review (se corresponden con la guía "dots periódicos trimestrales"
  // y "dots más frecuentes" del FUNCIONAMIENTO_APP).
  if (segQ.dots.length === 0) {
    segQ.dots = [2, 5, 8, 11].map((m) => ({
      month: m,
      date_iso: `${year}-${String(m + 1).padStart(2, "0")}-15`,
      label: `Seguimiento trimestral ${monthLabel(m)}`,
    }));
  }
  if (sprint.dots.length === 0) {
    sprint.dots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      .filter((m) => m % 1 === 0)
      .map((m) => ({
        month: m,
        date_iso: `${year}-${String(m + 1).padStart(2, "0")}-10`,
        label: `Sprint Review ${monthLabel(m)}`,
      }));
  }

  return { segQ, sprint, adhoc };
}

export function getInitiativeTimeline(
  initiativeId: Id,
): Result<InitiativeTimeline> {
  const store = readStore();
  const user = getCurrentUserFromStore(store);
  if (!user) return err("AUTH_REQUIRED", "No hay un usuario autenticado");

  const initiative = store.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return err("NOT_FOUND", "Iniciativa no encontrada");
  if (!userCanAccessInitiative(user, initiativeId, store)) {
    return err("FORBIDDEN", "No tenés acceso a esta iniciativa");
  }

  const today = todayParts();
  const year = today.year;

  const initiativeForms = store.forms.filter(
    (f) => f.initiative_id === initiativeId,
  );
  const initiativeGateways = store.gateways.filter(
    (g) => g.initiative_id === initiativeId,
  );
  const events = store.portfolio_events.filter(
    (e) => e.initiative_id === initiativeId,
  );

  const etapa1 = buildStageRow(
    "etapa1",
    "Etapa 1 · Propuesta",
    initiative.has_etapa1,
    initiativeForms.find((f) => f.form_type === "F1"),
    initiativeGateways.find((g) => g.gateway_number === 1),
    year,
    { month: today.month, iso: today.iso },
  );
  const etapa2 = buildStageRow(
    "etapa2",
    "Etapa 2 · Dimensionamiento",
    initiative.has_etapa2,
    initiativeForms.find((f) => f.form_type === "F2"),
    initiativeGateways.find((g) => g.gateway_number === 2),
    year,
    { month: today.month, iso: today.iso },
  );
  const etapa3 = buildStageRow(
    "etapa3",
    "Etapa 3 · MVP",
    initiative.has_etapa3,
    initiativeForms.find((f) => f.form_type === "F3"),
    initiativeGateways.find((g) => g.gateway_number === 3),
    year,
    { month: today.month, iso: today.iso },
  );

  const { ltp, planAnual } = buildLtpRows(initiativeForms, year, {
    month: today.month,
    iso: today.iso,
  });
  const { segQ, sprint, adhoc } = buildDotRows(events, year);

  const rows: TimelineRow[] = [etapa1, etapa2, etapa3, ltp, planAnual, segQ, sprint, adhoc];

  // Upcoming events: portfolio events en el futuro + gateways pendientes.
  const upcoming: TimelineUpcomingEvent[] = [];
  for (const e of events) {
    if (e.status === "cancelled") continue;
    if (e.date < today.iso) continue;
    upcoming.push({
      id: e.id,
      name: e.name,
      date_iso: e.date,
      type: e.type,
      custom_type_label: e.custom_type_label,
      status: e.status,
      is_synthetic: false,
    });
  }
  for (const g of initiativeGateways) {
    if (g.status !== "pending") continue;
    const day = 15;
    const monthOffset = today.month + 1;
    const target = new Date(year, monthOffset, day);
    const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
    upcoming.push({
      id: `synthetic_gate_${g.id}`,
      name: `Gateway ${g.gateway_number} · Reunión de aprobación`,
      date_iso: iso,
      type: "gate",
      custom_type_label: null,
      status: "scheduled",
      is_synthetic: true,
    });
  }
  upcoming.sort((a, b) => a.date_iso.localeCompare(b.date_iso));

  return ok({
    year,
    today_iso: today.iso,
    today_month: today.month,
    today_day_fraction: today.dayFrac,
    rows,
    upcoming: upcoming.slice(0, 8),
  });
}
