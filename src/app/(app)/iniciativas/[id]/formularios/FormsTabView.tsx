"use client";

import { useEffect, useMemo, useState } from "react";

import type { FormType } from "@/types";
import {
  getFormsTabData,
  type FormFolderCard,
  type FormInstanceView,
  type FormsTabData,
  type SectionStatus,
} from "@/lib/storage/forms_tab";

import { useInitiativeDetail } from "../DetailContext";

function FolderCard({
  folder,
  isActive,
  onSelect,
}: {
  folder: FormFolderCard;
  isActive: boolean;
  onSelect: () => void;
}) {
  const isLocked = folder.state === "locked";
  const isComplete = folder.state === "complete";
  const instance = folder.default_instance;

  const borderClass = isActive
    ? "border-2 border-pae-blue bg-pae-blue/5"
    : isLocked
      ? "border-2 border-dashed border-pae-border bg-pae-bg"
      : isComplete
        ? "border border-pae-green/40 bg-pae-surface"
        : "border border-pae-border bg-pae-surface";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 rounded-xl px-3 py-3 text-left transition ${borderClass} ${isLocked ? "opacity-80" : "hover:border-pae-blue/60"}`}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={`text-[11px] font-semibold tracking-wide ${isLocked ? "text-pae-text-tertiary" : "text-pae-blue"}`}
        >
          {folder.short_title}
        </span>
        {isComplete && (
          <span className="rounded-full bg-pae-green/10 px-2 py-0.5 text-[9px] font-semibold text-pae-green">
            Completo
          </span>
        )}
        {isActive && !isComplete && (
          <span className="rounded-full bg-pae-blue/10 px-2 py-0.5 text-[9px] font-semibold text-pae-blue">
            Activo
          </span>
        )}
      </div>
      <span
        className={`text-[13px] font-medium ${isLocked ? "text-pae-text-tertiary" : "text-pae-text"}`}
      >
        {folder.subtitle}
      </span>
      {isLocked && folder.required_gateway_label ? (
        <span className="text-[10px] font-medium text-pae-text-tertiary">
          {folder.required_gateway_label}
        </span>
      ) : folder.is_cyclic && folder.years_available.length > 0 ? (
        <span className="text-[10px] text-pae-text-secondary">
          {folder.years_available.length} ciclo
          {folder.years_available.length === 1 ? "" : "s"} ·{" "}
          {folder.years_available[0]}
        </span>
      ) : instance && instance.status !== "not_started" ? (
        <span className="text-[10px] text-pae-text-secondary">
          {instance.completeness.completed_count}/
          {instance.completeness.total_count} secciones
        </span>
      ) : (
        <span className="text-[10px] text-pae-text-tertiary">
          {folder.total_sections} secciones
        </span>
      )}
    </button>
  );
}

function StatusPill({ instance }: { instance: FormInstanceView }) {
  const map: Record<FormInstanceView["status_tone"], string> = {
    complete: "bg-pae-green/10 text-pae-green",
    in_progress: "bg-pae-blue/10 text-pae-blue",
    review: "bg-pae-amber/10 text-pae-amber",
    locked: "bg-pae-text-tertiary/15 text-pae-text-secondary",
    not_started: "bg-pae-text-tertiary/15 text-pae-text-secondary",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${map[instance.status_tone]}`}
    >
      {instance.status_label}
    </span>
  );
}

function ProgressBar({
  completed,
  total,
  percent,
}: {
  completed: number;
  total: number;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-pae-text-secondary">
        <span>
          {completed} de {total} secciones completas
        </span>
        <span className="font-medium text-pae-text">{percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-pae-bg">
        <div
          className="h-full rounded-full bg-pae-blue transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SectionRow({ section }: { section: SectionStatus }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${section.is_complete ? "bg-pae-green/15 text-pae-green" : "bg-pae-red/10 text-pae-red"}`}
        aria-hidden
      >
        {section.is_complete ? "✓" : "○"}
      </span>
      <span className="text-[11px] font-medium text-pae-text-tertiary">
        {String(section.number).padStart(2, "0")}
      </span>
      <span className="flex-1 text-[12px] text-pae-text">{section.title}</span>
      <span
        className={`text-[10px] font-medium ${section.is_complete ? "text-pae-green" : "text-pae-red"}`}
      >
        {section.is_complete ? "Completa" : "Pendiente"}
      </span>
    </div>
  );
}

function YearSelector({
  folder,
  selectedYear,
  onChange,
}: {
  folder: FormFolderCard;
  selectedYear: number | null;
  onChange: (year: number) => void;
}) {
  if (!folder.is_cyclic || folder.years_available.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-medium text-pae-text-secondary">
        Ciclo:
      </span>
      {folder.years_available.map((year) => {
        const isSelected = year === selectedYear;
        const instance = folder.instances_by_year[String(year)];
        const isReadOnly = instance?.is_read_only;
        return (
          <button
            key={year}
            type="button"
            onClick={() => onChange(year)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
              isSelected
                ? "border-pae-blue bg-pae-blue text-white"
                : "border-pae-border bg-pae-surface text-pae-text-secondary hover:border-pae-blue/40 hover:text-pae-blue"
            }`}
          >
            {year}
            {isReadOnly && !isSelected && (
              <span className="ml-1 text-[9px] text-pae-text-tertiary">
                · read-only
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ExpandedFolder({
  folder,
  instance,
  selectedYear,
  onYearChange,
}: {
  folder: FormFolderCard;
  instance: FormInstanceView | null;
  selectedYear: number | null;
  onYearChange: (year: number) => void;
}) {
  const isLocked = folder.state === "locked";

  if (isLocked) {
    return (
      <div className="rounded-xl border border-dashed border-pae-border bg-pae-bg px-5 py-6 text-center">
        <p className="text-[13px] font-medium text-pae-text-secondary">
          Formulario bloqueado
        </p>
        <p className="mt-1 text-[11px] text-pae-text-tertiary">
          {folder.required_gateway_label ??
            "Se habilita cuando el formulario anterior esté aprobado."}
        </p>
      </div>
    );
  }

  if (!instance) return null;

  function handleEditar() {
    alert(
      `Abriendo wizard para ${instance?.full_title ?? folder.short_title} (pendiente integración).`,
    );
  }

  function handleYaTengo() {
    alert(
      `Subir archivo para ${instance?.full_title ?? folder.short_title} (pendiente integración).`,
    );
  }

  function handleXlsx() {
    alert(
      `Generando XLSX de ${instance?.full_title ?? folder.short_title} (pendiente integración).`,
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-pae-border bg-pae-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold text-pae-text">
            {instance.full_title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusPill instance={instance} />
            {instance.is_read_only && (
              <span className="rounded-full bg-pae-text-tertiary/15 px-2 py-0.5 text-[10px] font-semibold text-pae-text-secondary">
                Read-only
              </span>
            )}
            {instance.last_editor_name && instance.last_edited_label ? (
              <span className="text-[11px] text-pae-text-tertiary">
                Última edición: {instance.last_editor_name} ·{" "}
                {instance.last_edited_label}
              </span>
            ) : (
              <span className="text-[11px] text-pae-text-tertiary">
                Sin ediciones registradas
              </span>
            )}
          </div>
        </div>
        {folder.is_cyclic && (
          <YearSelector
            folder={folder}
            selectedYear={selectedYear}
            onChange={onYearChange}
          />
        )}
      </div>

      <ProgressBar
        completed={instance.completeness.completed_count}
        total={instance.completeness.total_count}
        percent={instance.completeness.percent}
      />

      <div>
        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
          Secciones
        </h4>
        <div className="divide-y divide-pae-border/60">
          {instance.sections.map((s) => (
            <SectionRow key={s.number} section={s} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-pae-border pt-4">
        <button
          type="button"
          onClick={handleEditar}
          disabled={instance.is_read_only}
          className="rounded-lg bg-pae-blue px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {instance.is_read_only ? "Ver formulario" : "Editar formulario"}
        </button>
        <button
          type="button"
          onClick={handleYaTengo}
          disabled={instance.is_read_only}
          className="rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[12px] font-medium text-pae-text-secondary transition hover:border-pae-blue/40 hover:text-pae-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ya tengo archivo
        </button>
        <button
          type="button"
          onClick={handleXlsx}
          className="rounded-lg bg-pae-green/10 px-4 py-2 text-[12px] font-semibold text-pae-green transition hover:bg-pae-green/20"
        >
          ↓ Descargar XLSX
        </button>
      </div>
    </div>
  );
}

function PermissionsBox({
  permissions,
}: {
  permissions: FormsTabData["permissions"];
}) {
  const rows: { title: string; items: string[]; tone: string }[] = [
    {
      title: "Editan",
      items: permissions.editors,
      tone: "text-pae-blue",
    },
    {
      title: "Comentan",
      items: permissions.commenters,
      tone: "text-pae-amber",
    },
    {
      title: "Aprueban",
      items: permissions.approvers,
      tone: "text-pae-green",
    },
  ];
  return (
    <div className="rounded-xl border border-pae-border bg-pae-bg p-4">
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-pae-text-tertiary">
        Permisos sobre el formulario
      </h4>
      <div className="grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.title}>
            <p className={`text-[12px] font-semibold ${row.tone}`}>
              {row.title}
            </p>
            {row.items.length === 0 ? (
              <p className="mt-1 text-[11px] italic text-pae-text-tertiary">
                Sin asignados.
              </p>
            ) : (
              <ul className="mt-1 space-y-0.5 text-[11px] text-pae-text-secondary">
                {row.items.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormsTabView() {
  const detail = useInitiativeDetail();
  const initiativeId = detail.initiative.id;

  const [data, setData] = useState<FormsTabData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FormType | null>(null);
  const [yearByType, setYearByType] = useState<Partial<Record<FormType, number>>>(
    {},
  );

  useEffect(() => {
    const result = getFormsTabData(initiativeId);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setData(result.data);
    setSelectedType(result.data.active_folder_type);
    const initialYears: Partial<Record<FormType, number>> = {};
    for (const folder of result.data.folders) {
      if (folder.is_cyclic && folder.default_year != null) {
        initialYears[folder.form_type] = folder.default_year;
      }
    }
    setYearByType(initialYears);
  }, [initiativeId]);

  const selectedFolder = useMemo(() => {
    if (!data || !selectedType) return null;
    return data.folders.find((f) => f.form_type === selectedType) ?? null;
  }, [data, selectedType]);

  const selectedInstance = useMemo(() => {
    if (!selectedFolder) return null;
    if (selectedFolder.is_cyclic) {
      const y = yearByType[selectedFolder.form_type] ?? selectedFolder.default_year;
      if (y == null) return selectedFolder.default_instance;
      return selectedFolder.instances_by_year[String(y)] ?? null;
    }
    return selectedFolder.default_instance;
  }, [selectedFolder, yearByType]);

  if (error) {
    return (
      <div className="rounded-xl border border-pae-red/30 bg-pae-red/5 p-4">
        <p className="text-[13px] text-pae-red">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-pae-surface p-6 shadow-sm">
        <p className="text-[14px] text-pae-text-secondary">Cargando…</p>
      </div>
    );
  }

  const selectedYear =
    selectedFolder && selectedFolder.is_cyclic
      ? yearByType[selectedFolder.form_type] ?? selectedFolder.default_year ?? null
      : null;

  return (
    <div className="space-y-5 rounded-xl bg-pae-surface p-6 shadow-sm">
      <div>
        <h2 className="text-[14px] font-semibold text-pae-text">
          Formularios — {data.initiative_name}
        </h2>
        <p className="mt-1 text-[11px] text-pae-text-secondary">
          F4 y F5 se completan múltiples veces (ciclo anual). Los ciclos
          anteriores quedan read-only.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {data.folders.map((folder) => (
          <FolderCard
            key={folder.form_type}
            folder={folder}
            isActive={selectedType === folder.form_type}
            onSelect={() => setSelectedType(folder.form_type)}
          />
        ))}
      </div>

      {selectedFolder && (
        <ExpandedFolder
          folder={selectedFolder}
          instance={selectedInstance}
          selectedYear={selectedYear}
          onYearChange={(year) =>
            setYearByType((prev) => ({
              ...prev,
              [selectedFolder.form_type]: year,
            }))
          }
        />
      )}

      <PermissionsBox permissions={data.permissions} />
    </div>
  );
}
