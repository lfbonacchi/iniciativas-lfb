"use client";

import Image from "next/image";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  F1_SECTIONS,
  computeF1Completeness,
  type F1SectionKey,
} from "@/data/form_definitions/f1";
import { getAvailableUsers } from "@/lib/storage/auth";
import { getForm, submitForm } from "@/lib/storage/forms";
import { getRawSectionChangeLog } from "@/lib/storage/activity";
import type { FormChangeLog, FormFieldValue, User } from "@/types";

import { SectionHistory } from "./components/SectionHistory";
import { SectionRenderer } from "./components/SectionRenderer";
import { WizardBottomBar } from "./WizardBottomBar";
import { WizardStepper } from "./WizardStepper";
import { useWizardAutoSave } from "./useWizardAutoSave";

type ResponsesMap = Record<string, FormFieldValue>;

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
  const [formType, setFormType] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [responses, setResponses] = useState<ResponsesMap>({});
  const [users, setUsers] = useState<readonly User[]>([]);
  const [activeKey, setActiveKey] = useState<F1SectionKey>(
    F1_SECTIONS[0]!.key,
  );
  const [historyBySection, setHistoryBySection] = useState<
    Record<string, FormChangeLog[]>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const autosave = useWizardAutoSave(formId);

  // Carga inicial.
  useEffect(() => {
    const userRes = getAvailableUsers();
    if (userRes.success) setUsers(userRes.data);

    const res = getForm(formId);
    if (!res.success) {
      setError(res.error.message);
      setLoading(false);
      return;
    }
    setInitiativeId(res.data.form.initiative_id);
    setFormType(res.data.form.form_type);
    setFormStatus(res.data.form.status);
    setResponses(res.data.responses);
    setLoading(false);
  }, [formId]);

  // Carga el historial para la sección activa (se refresca cada vez que cambia).
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
    if (!loading) refreshHistoryForSection(activeKey);
  }, [activeKey, loading, refreshHistoryForSection, autosave.lastSavedAt]);

  const completeness = useMemo(() => computeF1Completeness(responses), [
    responses,
  ]);

  const activeSection = useMemo(
    () => F1_SECTIONS.find((s) => s.key === activeKey) ?? F1_SECTIONS[0]!,
    [activeKey],
  );

  const handleSectionChange = useCallback(
    (key: F1SectionKey, next: FormFieldValue) => {
      setResponses((prev) => ({ ...prev, [key]: next }));
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
    await autosave.flushNow();
    setSubmitting(true);
    const res = submitForm(formId);
    setSubmitting(false);
    if (!res.success) {
      alert(`No se pudo enviar a aprobación: ${res.error.message}`);
      return;
    }
    alert("✓ Formulario enviado a aprobación. Se creó el Gateway 1.");
    if (initiativeId) {
      router.push(`/iniciativas/${initiativeId}/formularios`);
    }
  }, [autosave, formId, initiativeId, router]);

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

  if (formType !== "F1") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pae-bg p-6">
        <div className="max-w-md rounded-xl border border-pae-border bg-pae-surface p-6 text-center">
          <p className="text-[13px] font-semibold text-pae-text">
            Wizard disponible solo para F1
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
    formStatus === "approved" ||
    formStatus === "final" ||
    formStatus === "closed" ||
    formStatus === "in_review" ||
    formStatus === "submitted";
  const canSubmit = completeness.percent === 100 && formStatus === "draft";

  const sectionHistory = historyBySection[activeKey] ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-pae-bg">
      {/* Header top bar minimal */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-pae-border bg-pae-surface px-6">
        <div className="flex items-center gap-3">
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
        </div>
        <span className="ml-2 text-[11px] text-pae-text-tertiary">
          Wizard · F1 Propuesta
        </span>
        {isReadOnly && (
          <span className="ml-auto rounded-full bg-pae-amber/10 px-2.5 py-0.5 text-[10px] font-semibold text-pae-amber">
            Read-only — formulario {formStatus}
          </span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <WizardStepper
          formName="F1 — Propuesta"
          percent={completeness.percent}
          sections={F1_SECTIONS}
          activeKey={activeKey}
          completeMap={completeness.by_section}
          onSelect={(k) => setActiveKey(k)}
          onExit={handleExit}
        />

        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-8 py-8">
            <header className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
                Sección {activeSection.number} de {F1_SECTIONS.length}
              </p>
              <h1 className="mt-1 text-[20px] font-semibold text-pae-text">
                {activeSection.number}. {activeSection.title}
              </h1>
              {activeSection.description && (
                <p className="mt-2 text-[12px] leading-relaxed text-pae-text-secondary">
                  {activeSection.description}
                </p>
              )}
            </header>

            <section className="rounded-xl border border-pae-border bg-pae-surface p-6 shadow-sm">
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
                  const prev = F1_SECTIONS[activeSection.number - 2];
                  if (prev) setActiveKey(prev.key);
                }}
                className="rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[12px] font-medium text-pae-text-secondary transition hover:border-pae-blue/40 hover:text-pae-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Sección anterior
              </button>
              <button
                type="button"
                disabled={activeSection.number === F1_SECTIONS.length}
                onClick={() => {
                  const next = F1_SECTIONS[activeSection.number];
                  if (next) setActiveKey(next.key);
                }}
                className="rounded-lg bg-pae-blue px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:cursor-not-allowed disabled:bg-pae-blue/40"
              >
                Siguiente sección →
              </button>
            </div>

            <div className="h-16" aria-hidden />
          </div>

          <WizardBottomBar
            autosave={autosave}
            percent={completeness.percent}
            canSubmit={canSubmit && !isReadOnly}
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
