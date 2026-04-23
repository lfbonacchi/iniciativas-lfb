"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { FormType, Id, InitiativeStage } from "@/types";
import {
  getFormsTabData,
  type FormFolderCard,
  type FormInstanceView,
  type FormsTabData,
  type SectionStatus,
} from "@/lib/storage/forms_tab";
import { uploadDocument } from "@/lib/storage/documents";
import { createCyclicForm } from "@/lib/storage/forms";

import { useInitiativeDetail } from "../DetailContext";

const FORM_TYPE_TO_STAGE: Record<FormType, InitiativeStage> = {
  F1: "proposal",
  F2: "dimensioning",
  F3: "mvp",
  F4: "ltp_tracking",
  F5: "ltp_tracking",
};

const ALLOWED_MIME_TYPES: Record<string, "docx" | "xlsx"> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot > 0 ? name.slice(lastDot + 1).toLowerCase() : "";
  const cleanBase = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
  return ext ? `${cleanBase || "archivo"}.${ext}` : cleanBase || "archivo";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

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
  initiativeId,
  selectedYear,
  onYearChange,
  onUpload,
  onFormCreated,
  isUploading,
}: {
  folder: FormFolderCard;
  instance: FormInstanceView | null;
  initiativeId: Id;
  selectedYear: number | null;
  onYearChange: (year: number) => void;
  onUpload: (folder: FormFolderCard, file: File) => void;
  onFormCreated: () => void;
  isUploading: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    let formId = instance?.form_id ?? null;
    // F4/F5: el form de un ciclo se crea on-demand al abrir el wizard por
    // primera vez (no hay gateway que lo genere automáticamente como con F2/F3).
    if (
      !formId &&
      folder.is_cyclic &&
      selectedYear != null &&
      (folder.form_type === "F4" || folder.form_type === "F5")
    ) {
      const created = createCyclicForm(
        initiativeId,
        folder.form_type,
        selectedYear,
      );
      if (!created.success) {
        alert(created.error.message);
        return;
      }
      formId = created.data.form.id;
      onFormCreated();
    }
    if (!formId) {
      alert("Este formulario todavía no fue creado.");
      return;
    }
    // VF pendiente: antes de abrir el wizard hay que habilitar la edición
    // post-gateway (el storage valida PO/Scrum + estado del gateway).
    if (instance?.vf_pending && instance.vf_gateway_id) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const gw = require("@/lib/storage/gateways") as typeof import("@/lib/storage/gateways");
      const res = gw.enableVFEditing(instance.vf_gateway_id);
      if (!res.success) {
        alert(res.error.message);
        return;
      }
    }
    router.push(`/wizard/${formId}`);
  }

  function handleYaTengo() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onUpload(folder, file);
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
        {instance.vf_pending && (
          <span className="rounded-full bg-pae-amber/15 px-2 py-0.5 text-[10px] font-semibold text-pae-amber">
            VF post-gateway pendiente
          </span>
        )}
        <button
          type="button"
          onClick={handleEditar}
          disabled={instance.is_read_only}
          className={`rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            instance.vf_pending
              ? "bg-pae-amber hover:bg-pae-amber/90"
              : "bg-pae-blue hover:bg-pae-blue/90"
          }`}
        >
          {instance.vf_pending
            ? "Editar VF post-gateway"
            : instance.is_read_only
              ? "Ver formulario"
              : "Editar formulario"}
        </button>
        <button
          type="button"
          onClick={handleYaTengo}
          disabled={instance.is_read_only || isUploading}
          className="rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[12px] font-medium text-pae-text-secondary transition hover:border-pae-blue/40 hover:text-pae-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "Subiendo…" : "Ya tengo archivo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileChange}
        />
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
  const [uploadingType, setUploadingType] = useState<FormType | null>(null);
  const [uploadMessage, setUploadMessage] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [reloadNonce, setReloadNonce] = useState(0);

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
  }, [initiativeId, reloadNonce]);

  async function handleUpload(folder: FormFolderCard, file: File) {
    setUploadMessage(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadMessage({
        tone: "error",
        text: `El archivo supera el máximo de 50MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
      });
      return;
    }

    const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
    const ext = extMatch?.[1]?.toLowerCase() ?? "";
    if (ext !== "docx" && ext !== "xlsx") {
      setUploadMessage({
        tone: "error",
        text: "Solo se permiten archivos Word (.docx) o Excel (.xlsx).",
      });
      return;
    }

    const mimeFileType = ALLOWED_MIME_TYPES[file.type];
    if (!mimeFileType || mimeFileType !== ext) {
      setUploadMessage({
        tone: "error",
        text:
          "El tipo de archivo real no coincide con su extensión (.docx o .xlsx). " +
          "Verificá que el archivo no esté corrupto o renombrado.",
      });
      return;
    }

    if (file.size === 0) {
      setUploadMessage({ tone: "error", text: "El archivo está vacío." });
      return;
    }

    const stage = FORM_TYPE_TO_STAGE[folder.form_type];
    const safeName = sanitizeFileName(file.name);

    setUploadingType(folder.form_type);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = uploadDocument(
        initiativeId,
        stage,
        { name: safeName, type: mimeFileType, size: file.size },
        dataUrl,
      );
      if (!result.success) {
        setUploadMessage({ tone: "error", text: result.error.message });
        return;
      }
      setUploadMessage({
        tone: "success",
        text: `"${safeName}" se guardó en la carpeta de ${folder.short_title}. Miralo en el tab Documentos con el badge "Manual".`,
      });
      setReloadNonce((n) => n + 1);
    } catch (err) {
      setUploadMessage({
        tone: "error",
        text: err instanceof Error ? err.message : "Error subiendo el archivo.",
      });
    } finally {
      setUploadingType(null);
    }
  }

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

      {uploadMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-[12px] ${
            uploadMessage.tone === "success"
              ? "border-pae-green/30 bg-pae-green/5 text-pae-green"
              : "border-pae-red/30 bg-pae-red/5 text-pae-red"
          }`}
        >
          {uploadMessage.text}
        </div>
      )}

      {selectedFolder && (
        <ExpandedFolder
          folder={selectedFolder}
          instance={selectedInstance}
          initiativeId={initiativeId}
          selectedYear={selectedYear}
          onYearChange={(year) =>
            setYearByType((prev) => ({
              ...prev,
              [selectedFolder.form_type]: year,
            }))
          }
          onUpload={handleUpload}
          onFormCreated={() => setReloadNonce((n) => n + 1)}
          isUploading={uploadingType === selectedFolder.form_type}
        />
      )}

      <PermissionsBox permissions={data.permissions} />
    </div>
  );
}
