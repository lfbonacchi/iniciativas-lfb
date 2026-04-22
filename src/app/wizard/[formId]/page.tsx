"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { F1_SECTIONS } from "@/data/form_definitions/f1";
import { F2_SECTIONS } from "@/data/form_definitions/f2";
import { F3_SECTIONS } from "@/data/form_definitions/f3";
import { F4_SECTIONS } from "@/data/form_definitions/f4";
import { F5_SECTIONS } from "@/data/form_definitions/f5";
import {
  computeCompleteness,
  type WizardSection,
} from "@/data/form_definitions/_shared";
import { getAvailableUsers } from "@/lib/storage/auth";
import {
  getCarryOverSource,
  getForm,
  submitForm,
} from "@/lib/storage/forms";
import { getRawSectionChangeLog } from "@/lib/storage/activity";
import type { FormChangeLog, FormFieldValue, FormType, User } from "@/types";

import { SectionHistory } from "./components/SectionHistory";
import { SectionRenderer } from "./components/SectionRenderer";
import { WizardBottomBar } from "./WizardBottomBar";
import { FormCommentsPanel } from "@/components/forms/FormCommentsPanel";
import { WizardStepper } from "./WizardStepper";
import { useWizardAutoSave } from "./useWizardAutoSave";

type ResponsesMap = Record<string, FormFieldValue>;

// Sección y título por tipo de formulario. F2 aún no tiene definición propia
// (su wizard se construirá luego); cuando esté, basta con sumarlo acá.
const SECTIONS_BY_TYPE: Partial<Record<FormType, readonly WizardSection[]>> = {
  F1: F1_SECTIONS,
  F2: F2_SECTIONS,
  F3: F3_SECTIONS,
  F4: F4_SECTIONS,
  F5: F5_SECTIONS,
};

const FORM_LABEL: Record<FormType, string> = {
  F1: "F1 — Propuesta",
  F2: "F2 — Dimensionamiento",
  F3: "F3 — MVP",
  F4: "F4 — Visión Anual",
  F5: "F5 — Planificación Anual",
};

// F4 y F5 no tienen gateway: envían a revisión del sponsor, no a aprobación.
function submitCopy(formType: FormType): {
  label: string;
  submitting: string;
  success: string;
} {
  if (formType === "F4" || formType === "F5") {
    return {
      label: "Enviar a revisión del sponsor",
      submitting: "Enviando…",
      success: "✓ Formulario enviado a revisión del sponsor.",
    };
  }
  return {
    label: "Enviar a aprobación",
    submitting: "Enviando…",
    success:
      formType === "F1"
        ? "✓ Formulario enviado a aprobación. Se creó el Gateway 1."
        : formType === "F2"
          ? "✓ Formulario enviado a aprobación. Se creó el Gateway 2."
          : "✓ Formulario enviado a aprobación. Se creó el Gateway 3.",
  };
}

export default function WizardPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiativeId, setInitiativeId] = useState<string | null>(null);
  const [formType, setFormType] = useState<FormType | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [responses, setResponses] = useState<ResponsesMap>({});
  const [carriedOverKeys, setCarriedOverKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [carryOverSourceType, setCarryOverSourceType] =
    useState<FormType | null>(null);
  const [users, setUsers] = useState<readonly User[]>([]);
  const [activeKey, setActiveKey] = useState<string>("");
  const [historyBySection, setHistoryBySection] = useState<
    Record<string, FormChangeLog[]>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [canComment, setCanComment] = useState(false);

  const autosave = useWizardAutoSave(formId);

  const sections = useMemo<readonly WizardSection[]>(() => {
    if (!formType) return [];
    return SECTIONS_BY_TYPE[formType] ?? [];
  }, [formType]);

  // Carga inicial: form + responses + carry-over merge.
  useEffect(() => {
    const userRes = getAvailableUsers();
    if (userRes.success) setUsers(userRes.data);

    const res = getForm(formId);
    if (!res.success) {
      setError(res.error.message);
      setLoading(false);
      return;
    }
    const ft = res.data.form.form_type as FormType;
    setInitiativeId(res.data.form.initiative_id);
    setFormType(ft);
    setFormStatus(res.data.form.status);
    setCanEdit(res.data.can_edit);
    setCanComment(res.data.can_comment);

    const ownResponses = res.data.responses;

    // Carry-over: traer responses del formulario origen (si aplica) y
    // completar solo las secciones marcadas como `carries_over` que todavía
    // estén vacías en el formulario destino.
    const sectionDefs = SECTIONS_BY_TYPE[ft] ?? [];
    const carryOverRes = getCarryOverSource(formId);
    const mergedResponses: ResponsesMap = { ...ownResponses };
    const carriedKeys = new Set<string>();
    let sourceType: FormType | null = null;

    if (carryOverRes.success && carryOverRes.data) {
      sourceType = carryOverRes.data.source_form_type;
      const sourceResponses = carryOverRes.data.responses;
      for (const section of sectionDefs) {
        if (!section.carries_over) continue;
        const current = mergedResponses[section.key];
        const isEmpty =
          current === undefined ||
          current === null ||
          current === "" ||
          (Array.isArray(current) && current.length === 0) ||
          (typeof current === "object" &&
            !Array.isArray(current) &&
            Object.keys(current as Record<string, unknown>).length === 0);
        if (!isEmpty) continue;
        const sourceValue = sourceResponses[section.key];
        if (sourceValue === undefined) continue;
        mergedResponses[section.key] = sourceValue;
        carriedKeys.add(section.key);
      }
    }

    setResponses(mergedResponses);
    setCarriedOverKeys(carriedKeys);
    setCarryOverSourceType(sourceType);
    setActiveKey(sectionDefs[0]?.key ?? "");
    setLoading(false);
  }, [formId]);

  const refreshHistoryForSection = useCallback(
    (sectionKey: string) => {
      const res = getRawSectionChangeLog(formId, sectionKey);
      if (res.success) {
        setHistoryBySection((prev) => ({ ...prev, [sectionKey]: res.data }));
      }
    },
    [formId],
  );

  useEffect(() => {
    if (!loading && activeKey) refreshHistoryForSection(activeKey);
  }, [activeKey, loading, refreshHistoryForSection, autosave.lastSavedAt]);

  const completeness = useMemo(
    () => computeCompleteness(sections, responses),
    [sections, responses],
  );

  const activeSection = useMemo(
    () => sections.find((s) => s.key === activeKey) ?? sections[0],
    [sections, activeKey],
  );

  const handleSectionChange = useCallback(
    (key: string, next: FormFieldValue) => {
      setResponses((prev) => ({ ...prev, [key]: next }));
      // Al editar, la sección deja de ser "heredada".
      setCarriedOverKeys((prev) => {
        if (!prev.has(key)) return prev;
        const copy = new Set(prev);
        copy.delete(key);
        return copy;
      });
      autosave.scheduleFieldChange(key, next);
    },
    [autosave],
  );

  const handleExit = useCallback(async () => {
    await autosave.flushNow();
    if (initiativeId) {
      router.push(`/iniciativas/${initiativeId}/formularios`);
    } else {
      router.push("/mis-iniciativas");
    }
  }, [autosave, initiativeId, router]);

  const handleSubmit = useCallback(async () => {
    if (!formType) return;
    // Antes de enviar, si hay secciones heredadas sin editar, las persistimos
    // explícitamente para que queden como respuestas propias del destino.
    if (carriedOverKeys.size > 0) {
      for (const key of carriedOverKeys) {
        const value = responses[key];
        if (value !== undefined) autosave.scheduleFieldChange(key, value);
      }
    }
    await autosave.flushNow();
    setSubmitting(true);
    const res = submitForm(formId);
    setSubmitting(false);
    const copy = submitCopy(formType);
    if (!res.success) {
      alert(`No se pudo enviar: ${res.error.message}`);
      return;
    }
    alert(copy.success);
    if (initiativeId) {
      router.push(`/iniciativas/${initiativeId}/formularios`);
    }
  }, [autosave, carriedOverKeys, formId, formType, initiativeId, responses, router]);

  const handlePreview = useCallback(() => {
    alert("Previsualización pendiente de integración.");
  }, []);

  const handleGeneratePptx = useCallback(() => {
    alert("Generación de PPTX pendiente de integración (pptxgenjs).");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pae-bg">
        <p className="text-[13px] text-pae-text-secondary">Cargando…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pae-bg p-6">
        <div className="max-w-md rounded-xl border border-pae-red/30 bg-pae-red/5 p-6 text-center">
          <p className="text-[13px] font-semibold text-pae-red">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/mis-iniciativas")}
            className="mt-4 rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[12px] text-pae-text-secondary hover:border-pae-blue/40 hover:text-pae-blue"
          >
            Volver a mis iniciativas
          </button>
        </div>
      </div>
    );
  }

  if (!formType || sections.length === 0 || !activeSection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pae-bg p-6">
        <div className="max-w-md rounded-xl border border-pae-border bg-pae-surface p-6 text-center">
          <p className="text-[13px] font-semibold text-pae-text">
            Wizard no disponible para {formType ?? "este formulario"}
          </p>
          <p className="mt-2 text-[11px] text-pae-text-secondary">
            El wizard de {formType} se habilitará próximamente.
          </p>
          <button
            type="button"
            onClick={handleExit}
            className="mt-4 rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[12px] text-pae-text-secondary hover:border-pae-blue/40 hover:text-pae-blue"
          >
            Volver al detalle
          </button>
        </div>
      </div>
    );
  }

  const isReadOnly =
    !canEdit ||
    formStatus === "approved" ||
    formStatus === "final" ||
    formStatus === "closed" ||
    formStatus === "reviewed" ||
    formStatus === "in_review" ||
    formStatus === "submitted";
  const canSubmit = completeness.percent === 100 && formStatus === "draft";
  const copy = submitCopy(formType);

  const sectionHistory = historyBySection[activeKey] ?? [];
  const isActiveCarriedOver = carriedOverKeys.has(activeSection.key);

  return (
    <div className="flex min-h-screen flex-col bg-pae-bg">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-pae-border bg-pae-surface px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo-pae.svg"
            alt="Pan American Energy"
            width={88}
            height={35}
            priority
            className="h-8 w-auto"
          />
          <span className="hidden text-[14px] font-medium text-pae-text-secondary sm:inline">
            Gestión de Portfolio
          </span>
        </Link>
        <span className="ml-2 text-[11px] text-pae-text-tertiary">
          Wizard · {FORM_LABEL[formType]}
        </span>
        {isReadOnly && (
          <span className="ml-auto rounded-full bg-pae-amber/10 px-2.5 py-0.5 text-[10px] font-semibold text-pae-amber">
            {!canEdit
              ? "Solo lectura — podés comentar al pie"
              : `Read-only — formulario ${formStatus}`}
          </span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <WizardStepper
          formName={FORM_LABEL[formType]}
          percent={completeness.percent}
          sections={sections}
          activeKey={activeKey}
          completeMap={completeness.by_section}
          carriedOverKeys={carriedOverKeys}
          onSelect={(k) => setActiveKey(k)}
          onExit={handleExit}
        />

        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-8 py-8">
            {carriedOverKeys.size > 0 && carryOverSourceType && (
              <div className="mb-4 rounded-lg border border-pae-amber/40 bg-pae-amber/10 px-4 py-3 text-[12px] text-pae-text">
                <span className="mr-1">⚠</span>
                Revisar y profundizar los textos grises heredados de{" "}
                <span className="font-semibold">{carryOverSourceType} VF</span>{" "}
                con los resultados del{" "}
                {formType === "F2"
                  ? "dimensionamiento"
                  : formType === "F3"
                    ? "MVP"
                    : "ciclo actual"}
                . Los campos con borde azul son nuevos y deben completarse.
              </div>
            )}

            <header className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                Sección {activeSection.number} de {sections.length}
              </p>
              <h1 className="mt-1 flex items-center gap-2 text-[20px] font-semibold text-pae-text">
                {activeSection.number}. {activeSection.title}
                {isActiveCarriedOver && carryOverSourceType ? (
                  <span className="rounded-full bg-pae-text-tertiary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pae-text-secondary">
                    Heredado {carryOverSourceType}
                  </span>
                ) : (
                  activeSection.carries_over === undefined &&
                  carryOverSourceType && (
                    <span className="rounded-full bg-pae-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pae-blue">
                      Nuevo
                    </span>
                  )
                )}
              </h1>
              {activeSection.description && (
                <p className="mt-2 text-[12px] leading-relaxed text-pae-text-secondary">
                  {activeSection.description}
                </p>
              )}
            </header>

            <section
              className={`rounded-xl border p-6 shadow-sm ${
                isActiveCarriedOver
                  ? "border-pae-border bg-pae-bg"
                  : carryOverSourceType
                    ? "border-pae-blue/40 bg-pae-surface"
                    : "border-pae-border bg-pae-surface"
              }`}
            >
              <SectionRenderer
                section={activeSection}
                value={responses[activeSection.key]}
                disabled={isReadOnly}
                onChange={(v) => handleSectionChange(activeSection.key, v)}
                onBlur={autosave.flushOnBlur}
              />
            </section>

            <section className="mt-5 rounded-xl border border-pae-border bg-pae-surface/60 p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                Historial de esta sección
              </h3>
              <div className="mt-2">
                <SectionHistory changes={sectionHistory} users={users} />
              </div>
            </section>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                disabled={activeSection.number === 1}
                onClick={() => {
                  const prev = sections[activeSection.number - 2];
                  if (prev) setActiveKey(prev.key);
                }}
                className="rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[12px] font-medium text-pae-text-secondary transition hover:border-pae-blue/40 hover:text-pae-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Sección anterior
              </button>
              <button
                type="button"
                disabled={activeSection.number === sections.length}
                onClick={() => {
                  const next = sections[activeSection.number];
                  if (next) setActiveKey(next.key);
                }}
                className="rounded-lg bg-pae-blue px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:cursor-not-allowed disabled:bg-pae-blue/40"
              >
                Siguiente sección →
              </button>
            </div>

            <div className="mt-6">
              <FormCommentsPanel formId={formId} canComment={canComment} />
            </div>

            <div className="h-16" aria-hidden />
          </div>

          <WizardBottomBar
            autosave={autosave}
            percent={completeness.percent}
            canSubmit={canSubmit && !isReadOnly}
            submitLabel={copy.label}
            submittingLabel={copy.submitting}
            disabledHint={`Completá todas las secciones (${completeness.percent}%) para ${copy.label.toLowerCase()}`}
            onPreview={handlePreview}
            onGeneratePptx={handleGeneratePptx}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </main>
      </div>
    </div>
  );
}
