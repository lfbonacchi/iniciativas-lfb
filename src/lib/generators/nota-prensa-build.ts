// Arma el input de la nota de prensa a partir de un formId.
// Lee responses del form (localStorage) y deriva los campos Working Backwards
// siguiendo docs/specs/SPEC_NOTA_PRENSA.md §7.

import { getInitiative } from "@/lib/storage/initiatives";
import { getForm } from "@/lib/storage/forms";
import type { FormType, Id } from "@/types";

import type {
  NotaPrensaHito,
  NotaPrensaInput,
  NotaPrensaPersona,
} from "./nota-prensa";

type Responses = Record<string, unknown>;
type Row = Record<string, unknown>;

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function asArray(v: unknown): Row[] {
  if (!Array.isArray(v)) return [];
  return v.filter((r): r is Row => r !== null && typeof r === "object") as Row[];
}

function formLabel(ft: FormType): string {
  switch (ft) {
    case "F1":
      return "Propuesta";
    case "F2":
      return "Dimensionamiento";
    case "F3":
      return "MVP";
    case "F4":
      return "Visión Anual";
    case "F5":
      return "Planificación Anual";
  }
}

function versionLabel(form: { status: string; version: number }): string {
  switch (form.status) {
    case "draft":
      return `Borrador v${form.version}`;
    case "approved":
    case "final":
      return `Versión Final v${form.version}`;
    default:
      return `v${form.version} (${form.status})`;
  }
}

function prioridadOrder(p: string): number {
  if (p === "Alta") return 0;
  if (p === "Media") return 1;
  if (p === "Baja") return 2;
  return 3;
}

// En F1/F2/F4 los dolores están en seccion_3_necesidad_oportunidad (array_rows).
// En F3 están en seccion_3_necesidad_oportunidad.detalle (array_rows dentro de objeto).
function extractDolores(responses: Responses): Row[] {
  const s3 = responses["seccion_3_necesidad_oportunidad"];
  if (Array.isArray(s3)) return asArray(s3);
  const obj = asObject(s3);
  if (Array.isArray(obj.detalle)) return asArray(obj.detalle);
  return [];
}

function extractDescripcion(
  formType: FormType,
  responses: Responses,
): Record<string, unknown> {
  const key =
    formType === "F3" ? "seccion_5_descripcion_solucion" : "seccion_5_descripcion";
  const v = responses[key];
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  // fallback: buscar cualquier "seccion_5_*"
  for (const k of Object.keys(responses)) {
    if (k.startsWith("seccion_5_")) return asObject(responses[k]);
  }
  return {};
}

function extractProposito(responses: Responses): string {
  const v = responses["seccion_2_proposito"];
  if (typeof v === "string") return v.trim();
  const obj = asObject(v);
  const texto = asString(obj.texto) || asString(obj.proposito);
  return texto;
}

function extractCorrientes(formType: FormType, responses: Responses): string[] {
  if (formType === "F1") {
    const rows = asArray(responses["seccion_6_impacto_economico_corrientes"]);
    return rows
      .filter((r) => asString(r.con_impacto).toUpperCase() === "S")
      .map((r) => asString(r.corriente))
      .filter(Boolean);
  }
  // F2/F3: seccion_10_impacto_corrientes_5anios.corrientes_valor
  for (const key of Object.keys(responses)) {
    if (!key.includes("corrientes")) continue;
    const container = asObject(responses[key]);
    const rows = asArray(container.corrientes_valor);
    if (rows.length > 0) {
      return rows
        .filter((r) => {
          const anios = ["anio_1", "anio_2", "anio_3", "anio_4", "anio_5"];
          return anios.some((a) => {
            const n = parseFloat(asString(r[a]));
            return !isNaN(n) && n !== 0;
          });
        })
        .map((r) => asString(r.corriente))
        .filter(Boolean);
    }
  }
  return [];
}

function extractHitos(responses: Responses): NotaPrensaHito[] {
  for (const key of Object.keys(responses)) {
    if (!key.includes("journey") && !key.includes("hitos")) continue;
    const rows = asArray(responses[key]);
    if (rows.length > 0) {
      return rows
        .map((r) => ({
          hito: asString(r.hito),
          fecha: asString(r.fecha),
        }))
        .filter((h) => h.hito || h.fecha)
        .slice(0, 5);
    }
  }
  return [];
}

function extractPersona(
  rows: Row[],
  rolMatches: (rol: string) => boolean,
): NotaPrensaPersona | null {
  const row = rows.find((r) => rolMatches(asString(r.rol).toLowerCase()));
  if (!row) return null;
  const nombre = asString(row.nombre);
  if (!nombre) return null;
  return {
    nombre,
    posicion: asString(row.posicion) || asString(row.area) || asString(row.vp),
  };
}

function extractEquipo(responses: Responses): {
  promotor: NotaPrensaPersona | null;
  sponsor: NotaPrensaPersona | null;
} {
  // Recolectar todas las filas de equipo disponibles
  const allRows: Row[] = [];
  for (const key of Object.keys(responses)) {
    if (!key.includes("equipo") && !key.includes("responsables") && !key.includes("alineacion"))
      continue;
    const v = responses[key];
    if (Array.isArray(v)) {
      allRows.push(...asArray(v));
      continue;
    }
    const obj = asObject(v);
    for (const sub of Object.values(obj)) {
      if (Array.isArray(sub)) allRows.push(...asArray(sub));
    }
  }

  const promotor =
    extractPersona(allRows, (r) => r.includes("promotor")) ??
    extractPersona(allRows, (r) => r.includes("líder") || r.includes("lider"));

  const sponsor = extractPersona(allRows, (r) => r.includes("sponsor"));

  return { promotor, sponsor };
}

function derivarBajada(dolores: Row[], proposito: string): string {
  if (dolores.length > 0) {
    const sorted = [...dolores].sort(
      (a, b) =>
        prioridadOrder(asString(a.prioridad)) -
        prioridadOrder(asString(b.prioridad)),
    );
    const top = sorted[0]!;
    const dolor = asString(top.dolor);
    const inicio = asString(top.dato_inicio);
    const target = asString(top.target);
    const metrica = asString(top.metrica);
    if (dolor && (inicio || target)) {
      return `${dolor}: mejora de ${inicio || "—"} a ${target || "—"}${metrica ? ` en ${metrica}` : ""}.`;
    }
    if (dolor) return dolor;
  }
  const first = proposito.split(/[.!?]/)[0]?.trim();
  return first ? `${first}.` : "";
}

function derivarProblema(dolores: Row[]): string {
  const textos = dolores.map((d) => asString(d.dolor)).filter(Boolean);
  if (textos.length === 0) return "";
  if (textos.length === 1) {
    return `El principal desafío identificado es: ${textos[0]!.toLowerCase()}.`;
  }
  const ultimo = textos.pop()!;
  return `Los principales desafíos identificados son: ${textos
    .map((t) => t.toLowerCase())
    .join(", ")} y ${ultimo.toLowerCase()}. Estos generan un impacto negativo medible en las operaciones que esta iniciativa busca resolver.`;
}

function derivarImpacto(dolores: Row[]): string[] {
  return dolores
    .map((d) => {
      const dolor = asString(d.dolor);
      const inicio = asString(d.dato_inicio);
      const target = asString(d.target);
      const metrica = asString(d.metrica);
      if (!dolor) return "";
      const rango = inicio && target ? `: de ${inicio} a ${target}` : "";
      const m = metrica ? ` (${metrica})` : "";
      return `${dolor}${rango}${m}`;
    })
    .filter(Boolean);
}

function derivarCita(formType: FormType, initiativeName: string): string {
  const nombre = initiativeName || "esta iniciativa";
  switch (formType) {
    case "F1":
      return `Esta iniciativa representa un paso importante en nuestra estrategia de transformación digital. ${nombre} nos permite abordar un desafío operativo clave con un enfoque basado en datos y orientado al valor.`;
    case "F2":
      return `Tras el análisis de dimensionamiento, estamos convencidos de que ${nombre} es técnicamente viable y genera un retorno significativo. El siguiente paso es validarlo con un MVP controlado.`;
    case "F3":
      return `Los resultados del MVP de ${nombre} nos dan la confianza para avanzar con el despliegue completo. Los aprendizajes obtenidos nos permiten escalar con menor riesgo y mayor impacto.`;
    case "F4":
      return `Para este año, ${nombre} es una prioridad estratégica. Los entregables planificados nos acercan a los objetivos de eficiencia y transformación que nos hemos propuesto.`;
    case "F5":
      return `La planificación anual de ${nombre} define entregables concretos y medibles. El seguimiento periódico nos permite ajustar el rumbo y asegurar el valor entregado.`;
  }
}

export function buildNotaPrensaInputFromFormId(formId: Id): NotaPrensaInput | null {
  const formRes = getForm(formId);
  if (!formRes.success) return null;
  const iniRes = getInitiative(formRes.data.form.initiative_id);
  if (!iniRes.success) return null;

  const form = formRes.data.form;
  const responses = formRes.data.responses as Responses;
  const formType = form.form_type as FormType;

  const info = asObject(responses["seccion_1_info_general"]);
  const dimension = asString(info.dimension) || asString(info.unidad_gestion);
  const unidadGestion = asString(info.unidad_gestion);

  const proposito = extractProposito(responses);
  const dolores = extractDolores(responses);
  const descripcion = extractDescripcion(formType, responses);

  const estrategia =
    asString(descripcion.estrategia_y_beneficios) ||
    asString(descripcion.estrategia) ||
    asString(descripcion.descripcion);
  const alcance = asString(descripcion.alcance);
  const escalabilidad = asString(descripcion.escalabilidad);

  const { promotor, sponsor } = extractEquipo(responses);

  const fechaLabel = new Date(form.updated_at).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return {
    form_type: formType,
    form_label: formLabel(formType),
    initiative_name: iniRes.data.name,
    dimension,
    unidad_gestion: unidadGestion,
    fecha_label: fechaLabel.charAt(0).toUpperCase() + fechaLabel.slice(1),
    version_label: versionLabel(form),

    proposito,
    bajada: derivarBajada(dolores, proposito),
    problema: derivarProblema(dolores),
    solucion_descripcion: estrategia,
    impacto_esperado: derivarImpacto(dolores),
    alcance: [alcance, escalabilidad].filter(Boolean).join(" "),
    corrientes_impactadas: extractCorrientes(formType, responses),
    cita_sponsor: derivarCita(formType, iniRes.data.name),
    sponsor,
    promotor,
    proximos_hitos: extractHitos(responses),
  };
}
