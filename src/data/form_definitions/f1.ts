// Definición del F1 — Propuesta para el wizard.
// Refleja textualmente los campos del Word original
// docs/formularios-referencia/F1_Propuesta.docx.

import {
  computeCompleteness,
  isSectionComplete,
  type WizardSection,
} from "./_shared";

// Aliases retrocompatibles (referenciados desde el wizard y otros módulos).
export type F1Section = WizardSection;
export type F1SectionKey = string;
export type {
  ObjectFieldDef,
  TableColumnDef,
  StringSection as F1StringSection,
  ObjectSection as F1ObjectSection,
  TableSection as F1TableSection,
  MultiTableSection as F1MultiTableSection,
  ObjectWithTableSection as F1ObjectWithTableSection,
} from "./_shared";

// Opciones tomadas del seed y de la convención PAE.
const TIPO_INICIATIVA = ["Resultado", "Habilitador", "Plataforma"] as const;
const PRIORIDAD = ["Alta", "Media", "Baja"] as const;
const STAKEHOLDER = ["Usuario", "Interesado", "Sponsor"] as const;
const SN = ["S", "N"] as const;

// Filas fijas de la tabla de corrientes de valor (textual del Word).
const CORRIENTES_FIJAS = [
  "PRODUCCIÓN (m3)",
  "OPEX (M$ USD)",
  "CAPEX (M$ USD)",
  "PRODUCTIVIDAD (HH)",
  "EXP AL RIESGO (%)",
  "EMISIONES (MTnCO2 Eq)",
  "CONS ENERGÍA (MW)",
] as const;

export const F1_SECTIONS: readonly WizardSection[] = [
  {
    key: "seccion_1_info_general",
    number: 1,
    title: "Información general",
    shape: "object",
    fields: [
      { key: "nombre", label: "Nombre de la iniciativa", kind: "text" },
      { key: "unidad_gestion", label: "Unidad de Gestión", kind: "text" },
      { key: "areas_involucradas", label: "Áreas involucradas", kind: "text" },
      {
        key: "tipo",
        label: "Tipo de iniciativa",
        kind: "select",
        options: TIPO_INICIATIVA,
      },
    ],
  },
  {
    key: "seccion_2_proposito",
    number: 2,
    title: "Propósito",
    description:
      "Para [Cliente / Usuario] quienes necesitan / desean [declaración de necesidad u oportunidad]. El [nombre del producto] es una [categoría de producto]. Que [beneficio clave, razón de peso para desarrollar o comprar]. A diferencia de [alternativa competitiva primaria] nuestro producto [declaración de diferenciación primaria].",
    shape: "string",
    kind: "textarea",
    rows: 10,
    placeholder:
      "Para los ingenieros de producción quienes necesitan…\n\nEl sistema X es una plataforma de…\n\nQue permite…\n\nA diferencia del proceso actual que…, nuestro producto…",
  },
  {
    key: "seccion_3_necesidad_oportunidad",
    number: 3,
    title: "Necesidad / oportunidad y prioridad",
    description:
      "Describir las principales necesidades, dolores o oportunidades de nuestros principales usuarios, interesados y/o sponsor para visibilizar el impacto de la iniciativa. Indicar con qué indicador se podría medir, valor de inicio, valor target y la prioridad entre ellos.",
    shape: "array_rows",
    columns: [
      {
        key: "stakeholder",
        label: "Stakeholder",
        kind: "select",
        options: STAKEHOLDER,
        width: "w-36",
      },
      { key: "dolor", label: "Dolor / oportunidad", kind: "textarea" },
      { key: "metrica", label: "Métrica", kind: "text", width: "w-40" },
      { key: "dato_inicio", label: "Datos de inicio", kind: "text", width: "w-32" },
      { key: "target", label: "Métrica target", kind: "text", width: "w-32" },
      {
        key: "prioridad",
        label: "Prioridad",
        kind: "select",
        options: PRIORIDAD,
        width: "w-28",
      },
    ],
    add_row_label: "+ Agregar fila",
    row_default: {
      stakeholder: "Usuario",
      dolor: "",
      metrica: "",
      dato_inicio: "",
      target: "",
      prioridad: "Media",
    },
  },
  {
    key: "seccion_4_alineacion_estrategica",
    number: 4,
    title: "Alineación estratégica",
    description:
      "Describir cómo esta iniciativa se alinea con la estrategia de la compañía (Desafío y Proyecto). Indicar si esta iniciativa está relacionada a una dimensión o producto existente.",
    shape: "string",
    kind: "textarea",
    rows: 8,
  },
  {
    key: "seccion_5_descripcion",
    number: 5,
    title: "Descripción de la iniciativa",
    shape: "object",
    fields: [
      {
        key: "estrategia_y_beneficios",
        label: "Estrategia de la iniciativa y principales beneficios",
        hint:
          "Describir a grandes rasgos el lineamiento de la solución tentativa propuesta, sus principales beneficios, cómo impacta en la operación y los procesos.",
        kind: "textarea",
        rows: 6,
      },
      {
        key: "alcance",
        label: "Alcance",
        hint:
          "Describir el alcance inicial de la iniciativa, qué procesos, sectores o assets se piensan alcanzar preliminarmente.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "interdependencias",
        label: "Interdependencias",
        hint: "Explicar las interdependencias que hay con otras iniciativas y áreas.",
        kind: "textarea",
        rows: 4,
      },
      {
        key: "escalabilidad",
        label: "Escalabilidad",
        hint:
          "Describir en caso de ser exitosa esta iniciativa cuál sería la potencialidad de escalado: qué otros procesos, sectores o assets podría alcanzar.",
        kind: "textarea",
        rows: 4,
      },
    ],
  },
  {
    key: "seccion_6_impacto_economico_corrientes",
    number: 6,
    title: "Impacto económico / estratégico (Corrientes de Valor)",
    description:
      "Indicar a qué corrientes de valor se piensan impactar con la implementación de esta iniciativa.",
    shape: "array_rows",
    columns: [
      { key: "corriente", label: "Corriente de valor", kind: "text", width: "w-56" },
      {
        key: "con_impacto",
        label: "¿Con impacto? (S/N)",
        kind: "select",
        options: SN,
        width: "w-28",
      },
      { key: "detalle", label: "Detalle", kind: "textarea" },
    ],
    fixed_rows: CORRIENTES_FIJAS.map((c) => ({
      corriente: c,
      con_impacto: "N",
      detalle: "",
    })),
  },
  {
    key: "seccion_7_gestion_cambio",
    number: 7,
    title: "Gestión del cambio",
    shape: "object_with_table",
    fields: [
      {
        key: "desafios",
        label: "Desafíos",
        hint:
          "Indicar los desafíos técnicos, operativos, de gestión, culturales que podrían surgir en el desarrollo y/o implementación de esta iniciativa. Detallar acciones para abordarlas.",
        kind: "textarea",
        rows: 6,
      },
    ],
    table: {
      key: "participacion",
      title: "Participación en el desarrollo e implementación de la iniciativa",
      description:
        'Indicar qué áreas van a ser "Involucradas" (parte de la definición y desarrollo de la iniciativa) e "Interesadas" (áreas que van a ser beneficiadas por la iniciativa).',
      columns: [
        { key: "area", label: "Área", kind: "text", width: "w-56" },
        { key: "tipo", label: "Tipo de involucramiento", kind: "text" },
      ],
      add_row_label: "+ Agregar fila",
      row_default: { area: "", tipo: "" },
    },
  },
  {
    key: "seccion_8_journey_hitos",
    number: 8,
    title: "Journey / hitos",
    description:
      "Realizar un roadmap preliminar con los grandes hitos de desarrollo de la iniciativa, como el desarrollo e implementación del MVP / piloto, sus posteriores lanzamientos o hitos relevantes.",
    shape: "array_rows",
    columns: [
      { key: "hito", label: "Hito", kind: "text" },
      { key: "fecha", label: "Fecha", kind: "text", width: "w-40" },
    ],
    add_row_label: "+ Agregar hito",
    row_default: { hito: "", fecha: "" },
  },
  {
    key: "seccion_9_equipo",
    number: 9,
    title: "Equipo de trabajo para el armado de la Etapa Propuesta y paso de gate",
    shape: "multi_table",
    tables: [
      {
        key: "propuesta",
        title: "Equipo etapa Propuesta",
        description:
          "Equipo responsable de hacer los análisis y los entregables necesarios de la primera etapa de maduración, Propuesta.",
        columns: [
          { key: "rol", label: "Rol", kind: "text", width: "w-40" },
          { key: "nombre", label: "Nombre y apellido", kind: "text" },
          { key: "posicion", label: "Posición", kind: "text" },
          { key: "vp", label: "Vicepresidencia", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar miembro",
        row_default: { rol: "", nombre: "", posicion: "", vp: "" },
      },
      {
        key: "gate_1",
        title: "Responsables gate 1",
        description:
          "Equipo encargado de tomar la decisión sobre la viabilidad de la iniciativa y su continuación.",
        columns: [
          { key: "rol", label: "Rol", kind: "text", width: "w-40" },
          { key: "nombre", label: "Nombre y apellido", kind: "text" },
          { key: "posicion", label: "Posición", kind: "text" },
          { key: "area", label: "Área", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar miembro",
        row_default: { rol: "", nombre: "", posicion: "", area: "" },
      },
      {
        key: "metodologia",
        title: "Equipo metodología",
        description:
          "Equipo de soporte metodológico, responsable de garantizar y salvaguardar el encuadre de la iniciativa con foco en el valor.",
        columns: [
          { key: "rol", label: "Rol", kind: "text", width: "w-40" },
          { key: "nombre", label: "Nombre y apellido", kind: "text" },
          { key: "posicion", label: "Posición", kind: "text" },
          { key: "vp", label: "Vicepresidencia", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar miembro",
        row_default: { rol: "", nombre: "", posicion: "", vp: "" },
      },
    ],
  },
];

export function getF1Section(key: string): WizardSection | undefined {
  return F1_SECTIONS.find((s) => s.key === key);
}

export const isF1SectionComplete = isSectionComplete;

export function computeF1Completeness(
  responses: Readonly<Record<string, unknown>>,
) {
  const res = computeCompleteness(F1_SECTIONS, responses);
  return {
    percent: res.percent,
    completed_count: res.completed_count,
    total_count: res.total_count,
    by_section: res.by_section as Record<F1SectionKey, boolean>,
  };
}
