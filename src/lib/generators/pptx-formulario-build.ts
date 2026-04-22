// Helper: construye el input del generador PPTX de formulario a partir de
// un formId, leyendo responses de localStorage. Devuelve null si no hay data.

import { getInitiative } from "@/lib/storage/initiatives";
import { getForm } from "@/lib/storage/forms";
import { getFormsTabData } from "@/lib/storage/forms_tab";
import type { FormType, Id } from "@/types";

import type { PptxFormularioInput } from "./pptx-formulario";

export function buildPptxInputFromFormId(formId: Id): PptxFormularioInput | null {
  const formRes = getForm(formId);
  if (!formRes.success) return null;
  const iniRes = getInitiative(formRes.data.form.initiative_id);
  if (!iniRes.success) return null;

  const responses = formRes.data.responses;
  const info = responses["seccion_1_info_general"];
  const infoObj =
    info && typeof info === "object" && !Array.isArray(info)
      ? (info as Record<string, unknown>)
      : {};
  const str = (k: string): string | undefined =>
    typeof infoObj[k] === "string" ? (infoObj[k] as string) : undefined;

  const form = formRes.data.form;
  const versionLabel =
    form.status === "draft"
      ? `Borrador v${form.version}`
      : form.status === "approved" || form.status === "final"
        ? `Versión Final v${form.version}`
        : `v${form.version} (${form.status})`;

  return {
    form_type: form.form_type as FormType,
    initiative_name: iniRes.data.name,
    dimension: str("dimension") ?? str("unidad_gestion") ?? "",
    unidad_gestion: str("unidad_gestion"),
    areas_involucradas: str("areas_involucradas"),
    tipo_iniciativa: str("tipo"),
    version_label: versionLabel,
    fecha_iso: form.updated_at,
    ltp_period: form.ltp_period ?? null,
    responses,
  };
}

// Busca el form "activo" de una iniciativa (el de la etapa actual).
// proposal → F1, dimensioning → F2, mvp → F3, ltp_tracking → F5 si existe, si no F4.
// Si no encuentra ninguno, devuelve el más reciente.
export function findActiveFormIdForInitiative(initiativeId: Id): Id | null {
  const res = getFormsTabData(initiativeId);
  if (!res.success) return null;
  // Orden de preferencia por stage.
  const preferred: FormType[] = ["F5", "F4", "F3", "F2", "F1"];
  for (const ft of preferred) {
    const folder = res.data.folders.find((f) => f.form_type === ft);
    const inst = folder?.default_instance;
    if (inst && inst.form_id) return inst.form_id;
  }
  return null;
}
