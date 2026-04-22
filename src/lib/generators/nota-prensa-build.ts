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

// Working Backwards (estilo AWS): toda la narrativa se escribe como si la
// iniciativa ya estuviera en producción y hubiera generado valor. Tiempos
// verbales en pretérito ("lanzó", "logró", "redujo"), no en futuro.

function derivarBajada(
  initiativeName: string,
  dolores: Row[],
  proposito: string,
): string {
  if (dolores.length > 0) {
    const sorted = [...dolores].sort(
      (a, b) =>
        prioridadOrder(asString(a.prioridad)) -
        prioridadOrder(asString(b.prioridad)),
    );
    const top = sorted[0]!;
    const inicio = asString(top.dato_inicio);
    const target = asString(top.target);
    const metrica = asString(top.metrica);
    if (inicio && target) {
      return `${initiativeName} llevó ${metrica || "su indicador clave"} de ${inicio} a ${target}, transformando la forma en que PAE resuelve este desafío.`;
    }
    const dolor = asString(top.dolor);
    if (dolor) {
      return `${initiativeName} resolvió un desafío que antes impactaba la operación: ${dolor.toLowerCase()}.`;
    }
  }
  const first = proposito.split(/[.!?]/)[0]?.trim();
  if (first) return `${first}. Hoy, ese objetivo es una realidad.`;
  return `${initiativeName} entró en producción y empezó a generar valor para la operación.`;
}

function derivarProblema(dolores: Row[]): string {
  const textos = dolores.map((d) => asString(d.dolor)).filter(Boolean);
  if (textos.length === 0) {
    return "Antes de esta iniciativa, la operación convivía con procesos manuales y decisiones basadas en información parcial que limitaban el desempeño del equipo.";
  }
  if (textos.length === 1) {
    return `Antes de esta iniciativa, el equipo convivía con un desafío concreto: ${textos[0]!.toLowerCase()}. Ese problema impactaba la eficiencia operativa y limitaba el valor que podíamos entregar.`;
  }
  const ultimo = textos.pop()!;
  return `Durante años, el equipo enfrentó varios desafíos que limitaban el rendimiento de la operación: ${textos
    .map((t) => t.toLowerCase())
    .join(", ")} y ${ultimo.toLowerCase()}. Cada uno, por separado, generaba costos e ineficiencias; combinados, frenaban la capacidad de escalar.`;
}

function derivarImpacto(dolores: Row[]): string[] {
  return dolores
    .map((d) => {
      const dolor = asString(d.dolor);
      const inicio = asString(d.dato_inicio);
      const target = asString(d.target);
      const metrica = asString(d.metrica);
      if (!dolor && !metrica) return "";
      const label = dolor || metrica;
      if (inicio && target) {
        return `${label}: pasó de ${inicio} a ${target}${metrica && dolor ? ` (${metrica})` : ""}.`;
      }
      if (target) return `${label}: alcanzó ${target}${metrica && dolor ? ` (${metrica})` : ""}.`;
      return label;
    })
    .filter(Boolean);
}

function derivarCita(formType: FormType, initiativeName: string): string {
  const nombre = initiativeName || "esta iniciativa";
  switch (formType) {
    case "F1":
      return `Cuando propusimos ${nombre}, teníamos claro el problema pero no todavía la solución. Hoy vemos que la apuesta valió la pena: pasamos de un modelo reactivo a uno proactivo, con decisiones basadas en datos y con el equipo realmente empoderado.`;
    case "F2":
      return `El dimensionamiento nos dio la confianza para avanzar y los resultados confirmaron la tesis. ${nombre} no solo fue técnicamente viable, sino que entregó valor antes de lo que esperábamos.`;
    case "F3":
      return `El MVP de ${nombre} superó lo que habíamos planificado. Los aprendizajes que dejó nos permitieron escalar con menos riesgo y más impacto, y marcaron una nueva forma de trabajar en la compañía.`;
    case "F4":
      return `Este año, ${nombre} fue una prioridad estratégica y los entregables se cumplieron. Cerramos el ciclo habiendo movido la aguja en los indicadores que nos habíamos propuesto.`;
    case "F5":
      return `La planificación se transformó en resultados concretos. ${nombre} entregó lo que comprometió y dejó la base para el próximo ciclo con aprendizajes claros y métricas medibles.`;
  }
}

function lead(
  initiativeName: string,
  dimension: string,
  fechaLabel: string,
): string {
  const where = dimension ? ` en el área de ${dimension}` : "";
  return `Buenos Aires, ${fechaLabel} — Pan American Energy anunció hoy el lanzamiento de ${initiativeName}${where}. La iniciativa, desarrollada por el equipo de Transformación Digital junto a los referentes operativos, ya está generando resultados medibles y marca un nuevo estándar en cómo la compañía resuelve este tipo de desafíos.`;
}

function solucionLanzada(proposito: string, estrategia: string): string {
  const parts: string[] = [];
  if (proposito) {
    parts.push(
      `La solución, que hoy está en producción, fue concebida así: ${proposito}`,
    );
  }
  if (estrategia) {
    parts.push(
      `En la práctica, ${estrategia.charAt(0).toLowerCase()}${estrategia.slice(1)}`,
    );
  }
  return parts.join(" ");
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
    lead: lead(
      iniRes.data.name,
      dimension,
      fechaLabel.charAt(0).toUpperCase() + fechaLabel.slice(1),
    ),
    bajada: derivarBajada(iniRes.data.name, dolores, proposito),
    problema: derivarProblema(dolores),
    solucion_descripcion: solucionLanzada(proposito, estrategia),
    impacto_esperado: derivarImpacto(dolores),
    alcance: [alcance, escalabilidad].filter(Boolean).join(" "),
    corrientes_impactadas: extractCorrientes(formType, responses),
    cita_sponsor: derivarCita(formType, iniRes.data.name),
    sponsor,
    promotor,
    proximos_hitos: extractHitos(responses),
  };
}
