"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Id, Initiative, InitiativeStage } from "@/types";
import { listInitiatives } from "@/lib/storage/initiatives";
import { uploadDocument } from "@/lib/storage/documents";

import { useUploadDocument } from "./UploadDocumentContext";

const STAGE_LABEL: Record<InitiativeStage, string> = {
  proposal: "Etapa 1 — Propuesta",
  dimensioning: "Etapa 2 — Dimensionamiento",
  mvp: "Etapa 3 — MVP",
  ltp_tracking: "LTP y Seguimiento",
};

const STAGE_ORDER: InitiativeStage[] = [
  "proposal",
  "dimensioning",
  "mvp",
  "ltp_tracking",
];

const ACCEPTED_EXTENSIONS = [
  ".docx",
  ".xlsx",
  ".pdf",
  ".pptx",
  ".png",
  ".jpg",
  ".mp4",
];

function allowedStagesFor(initiative: Initiative): InitiativeStage[] {
  const stages: InitiativeStage[] = [];
  if (initiative.has_etapa1) stages.push("proposal");
  if (initiative.has_etapa2) stages.push("dimensioning");
  if (initiative.has_etapa3) stages.push("mvp");
  if (initiative.current_stage === "ltp_tracking") {
    stages.push("ltp_tracking");
  }
  // Asegurar que la etapa actual esté incluida si por alguna razón no lo está.
  if (!stages.includes(initiative.current_stage)) {
    stages.push(initiative.current_stage);
  }
  return stages.sort(
    (a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b),
  );
}

function fileTypeFromName(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = name.slice(dot + 1).toLowerCase();
  if (["docx", "xlsx", "pdf", "pptx", "png", "jpg", "mp4"].includes(ext)) {
    return ext;
  }
  return null;
}

export function UploadDocumentModal() {
  const { isOpen, defaults, closeUpload, notifyUploaded } = useUploadDocument();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [initiativeId, setInitiativeId] = useState<Id | "">("");
  const [stage, setStage] = useState<InitiativeStage | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Cargar iniciativas activas al abrir.
    const result = listInitiatives({ status: "in_progress" });
    if (result.success) {
      setInitiatives(result.data);
      const preselect =
        defaults.initiativeId &&
        result.data.find((i) => i.id === defaults.initiativeId);
      const chosen = preselect ?? result.data[0] ?? null;
      if (chosen) {
        setInitiativeId(chosen.id);
        const allowed = allowedStagesFor(chosen);
        const stageDefault =
          defaults.stage && allowed.includes(defaults.stage)
            ? defaults.stage
            : chosen.current_stage;
        setStage(stageDefault);
      } else {
        setInitiativeId("");
        setStage("");
      }
    } else {
      setInitiatives([]);
      setInitiativeId("");
      setStage("");
    }
  }, [isOpen, defaults.initiativeId, defaults.stage]);

  const selectedInitiative = useMemo(
    () => initiatives.find((i) => i.id === initiativeId) ?? null,
    [initiatives, initiativeId],
  );

  const allowedStages = useMemo(
    () => (selectedInitiative ? allowedStagesFor(selectedInitiative) : []),
    [selectedInitiative],
  );

  const stageIsOutdated = useMemo(() => {
    if (!selectedInitiative || !stage) return false;
    return (
      STAGE_ORDER.indexOf(stage) <
      STAGE_ORDER.indexOf(selectedInitiative.current_stage)
    );
  }, [selectedInitiative, stage]);

  function handleChangeInitiative(newId: Id) {
    setInitiativeId(newId);
    const ini = initiatives.find((i) => i.id === newId);
    if (ini) setStage(ini.current_stage);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedInitiative) {
      setError("Elegí un proyecto.");
      return;
    }
    if (!stage) {
      setError("Elegí una etapa.");
      return;
    }
    if (!file) {
      setError("Seleccioná un archivo.");
      return;
    }
    const ext = fileTypeFromName(file.name);
    if (!ext) {
      setError(
        `Extensión no permitida. Aceptadas: ${ACCEPTED_EXTENSIONS.join(", ")}`,
      );
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("El archivo supera 50MB.");
      return;
    }

    setSubmitting(true);
    const result = uploadDocument(selectedInitiative.id, stage, {
      name: file.name,
      type: ext as "docx" | "xlsx" | "pdf" | "pptx" | "png" | "jpg" | "mp4",
      size: file.size,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setSuccess(
      `Archivo subido a ${STAGE_LABEL[stage]} › archivos adicionales.`,
    );
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    notifyUploaded();
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-doc-title"
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg rounded-xl bg-pae-surface p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="upload-doc-title"
              className="text-[16px] font-semibold text-pae-text"
            >
              Subir documento
            </h2>
            <p className="mt-1 text-[12px] text-pae-text-secondary">
              El archivo se guarda en la carpeta{" "}
              <span className="font-medium text-pae-text">
                archivos adicionales
              </span>{" "}
              de la etapa elegida.
            </p>
          </div>
          <button
            type="button"
            onClick={closeUpload}
            className="rounded-md px-2 py-1 text-[14px] text-pae-text-tertiary transition hover:bg-pae-bg hover:text-pae-text"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-pae-text">
              Proyecto
            </label>
            {initiatives.length === 0 ? (
              <p className="mt-2 rounded-md bg-pae-bg px-3 py-2 text-[12px] text-pae-text-secondary">
                No hay iniciativas activas disponibles.
              </p>
            ) : (
              <select
                value={initiativeId}
                onChange={(e) => handleChangeInitiative(e.target.value)}
                className="mt-2 w-full rounded-lg border border-pae-border bg-pae-bg px-3 py-2 text-[13px] text-pae-text focus:border-pae-blue focus:outline-none"
              >
                {initiatives.map((ini) => (
                  <option key={ini.id} value={ini.id}>
                    {ini.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-medium text-pae-text">
              Etapa
            </label>
            <div className="mt-2 flex items-start gap-3">
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as InitiativeStage)}
                disabled={!selectedInitiative}
                className="flex-1 rounded-lg border border-pae-border bg-pae-bg px-3 py-2 text-[13px] text-pae-text focus:border-pae-blue focus:outline-none disabled:opacity-60"
              >
                {allowedStages.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABEL[s]}
                    {selectedInitiative && s === selectedInitiative.current_stage
                      ? " (actual)"
                      : ""}
                  </option>
                ))}
              </select>
              {stageIsOutdated && (
                <div className="flex-1 rounded-md border border-pae-red/30 bg-pae-red/5 px-3 py-2 text-[11px] leading-snug text-pae-red">
                  ⚠ Esta etapa está desactualizada. La iniciativa ya está en{" "}
                  <span className="font-semibold">
                    {selectedInitiative
                      ? STAGE_LABEL[selectedInitiative.current_stage]
                      : ""}
                  </span>
                  .
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-pae-text">
              Archivo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={handleFileChange}
              className="mt-2 block w-full text-[12px] text-pae-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-pae-blue/10 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-pae-blue hover:file:bg-pae-blue/20"
            />
            <p className="mt-1 text-[11px] text-pae-text-tertiary">
              Hasta 50MB. Extensiones aceptadas:{" "}
              {ACCEPTED_EXTENSIONS.join(", ")}.
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-pae-red/10 px-3 py-2 text-[12px] text-pae-red">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md bg-pae-green/10 px-3 py-2 text-[12px] text-pae-green">
              {success}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeUpload}
              disabled={submitting}
              className="rounded-lg border border-pae-border bg-pae-surface px-4 py-2 text-[13px] font-medium text-pae-text-secondary transition hover:bg-pae-bg disabled:opacity-50"
            >
              {success ? "Cerrar" : "Cancelar"}
            </button>
            <button
              type="submit"
              disabled={submitting || initiatives.length === 0}
              className="rounded-lg bg-pae-blue px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-pae-blue/90 disabled:opacity-50"
            >
              {submitting ? "Subiendo…" : "Subir archivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
