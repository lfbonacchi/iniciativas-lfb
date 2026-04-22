// Definición de la estructura del F1 — Propuesta para el wizard.
// Refleja textualmente los campos del Word original
// docs/formularios-referencia/F1_Propuesta.docx.
//
// Cada sección se persiste como un único FormResponse (clave = key de sección)
// cuyo valor es un blob (string, objeto o array) que replica la forma usada
// en src/data/seed.ts.

export type F1SectionKey =
  | "seccion_1_info_general"
  | "seccion_2_proposito"
  | "seccion_3_necesidad_oportunidad"
  | "seccion_4_alineacion_estrategica"
  | "seccion_5_descripcion"
  | "seccion_6_impacto_economico_corrientes"
  | "seccion_7_gestion_cambio"
  | "seccion_8_journey_hitos"
  | "seccion_9_equipo";

export type SectionValueShape =
  | "string"
  | "object"
  | "array_rows";

export interface TableColumnDef {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select";
  options?: readonly string[];
  width?: string; // tailwind width class (ej: "w-40")
}

export interface ObjectFieldDef {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select";
  hint?: string;
  placeholder?: string;
  options?: readonly string[];
  rows?: number;
}

export interface F1StringSection {
  key: F1SectionKey;
  number: number;
  title: string;
  description?: string;
  shape: "string";
  kind: "textarea";
  placeholder?: string;
  rows?: number;
}

export interface F1ObjectSection {
  key: F1SectionKey;
  number: number;
  title: string;
  description?: string;
  shape: "object";
  fields: readonly ObjectFieldDef[];
}

export interface F1TableSection {
  key: F1SectionKey;
  number: number;
  title: string;
  description?: string;
  shape: "array_rows";
  columns: readonly TableColumnDef[];
  min_rows?: number;
  fixed_rows?: ReadonlyArray<Readonly<Record<string, string>>>;
  add_row_label?: string;
  row_default?: Readonly<Record<string, string>>;
}

export interface F1MultiTableSection {
  key: F1SectionKey;
  number: number;
  title: string;
  description?: string;
  shape: "multi_table";
  tables: ReadonlyArray<{
    key: string;
    title: string;
    description?: string;
    columns: readonly TableColumnDef[];
    add_row_label?: string;
    row_default?: Readonly<Record<string, string>>;
  }>;
}

export interface F1ObjectWithTableSection {
  key: F1SectionKey;
  number: number;
  title: string;
  description?: string;
  shape: "object_with_table";
  fields: readonly ObjectFieldDef[];
  table: {
    key: string;
    title: string;
    description?: string;
    columns: readonly TableColumnDef[];
    add_row_label?: string;
    row_default?: Readonly<Record<string, string>>;
  };
}

export type F1Section =
  | F1StringSection
  | F1ObjectSection
  | F1TableSection
  | F1MultiTableSection
  | F1ObjectWithTableSection;

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

export const F1_SECTIONS: readonly F1Section[] = [
  {
    key: "seccion_1_info_general",
    number: 1,
    title: "Información general",
    shape: "object",
    fields: [
      {
        key: "nombre",
        label: "Nombre de la iniciativa",
        kind: "text",
      },
      {
        key: "unidad_gestion",
        label: "Unidad de Gestión",
        kind: "text",
      },
      {
        key: "areas_involucradas",
        label: "Áreas involucradas",
        kind: "text",
      },
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
      {
        key: "dolor",
        label: "Dolor / oportunidad",
        kind: "textarea",
      },
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
        hint: "Describir a grandes rasgos el lineamiento de la solución tentativa propuesta, sus principales beneficios, cómo impacta en la operación y los procesos. Describir con el detalle necesario para entender la estrategia de solución, el diferencial con la situación actual en relación con el problema/oportunidad y si hay alguna alternativa comparable.",
        kind: "textarea",
        rows: 6,
      },
      {
        key: "alcance",
        label: "Alcance",
        hint: "Describir el alcance inicial de la iniciativa, qué procesos, sectores o assets se piensan alcanzar preliminarmente.",
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
        hint: "Describir en caso de ser exitosa esta iniciativa cuál sería la potencialidad de escalado: qué otros procesos, sectores o assets podría alcanzar.",
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
      {
        key: "corriente",
        label: "Corriente de valor",
        kind: "text",
        width: "w-56",
      },
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
        hint: "Indicar los desafíos técnicos, operativos, de gestión, culturales que podrían surgir en el desarrollo y/o implementación de esta iniciativa. Detallar acciones para abordarlas.",
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
        {
          key: "tipo",
          label: "Tipo de involucramiento",
          kind: "text",
        },
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
      "Realizar un roadmap preliminar con los grandes hitos de desarrollo de la iniciativa, como el desarrollo e implementación del MVP / piloto, sus posteriores lanzamientos o hitos relevantes. Importante: estas fechas son preliminares y se pueden ver afectadas por cambios en los alcances, detección de bloqueantes y nuevas necesidades más prioritarias que puedan surgir.",
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

export function getF1Section(key: F1SectionKey): F1Section | undefined {
  return F1_SECTIONS.find((s) => s.key === key);
}

// Devuelve true si la sección tiene contenido "suficiente" para considerarse
// completada (a efectos del stepper y del % de avance).
export function isF1SectionComplete(
  section: F1Section,
  value: unknown,
): boolean {
  if (value === null || value === undefined) return false;

  if (section.shape === "string") {
    return typeof value === "string" && value.trim().length > 0;
  }

  if (section.shape === "object") {
    if (typeof value !== "object" || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    return section.fields.every((f) => {
      const v = obj[f.key];
      return typeof v === "string" && v.trim().length > 0;
    });
  }

  if (section.shape === "array_rows") {
    if (!Array.isArray(value) || value.length === 0) return false;
    return value.every((row) => {
      if (typeof row !== "object" || row === null) return false;
      const r = row as Record<string, unknown>;
      return section.columns.some(
        (c) => typeof r[c.key] === "string" && (r[c.key] as string).trim().length > 0,
      );
    });
  }

  if (section.shape === "object_with_table") {
    if (typeof value !== "object" || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    const fieldsOk = section.fields.every((f) => {
      const v = obj[f.key];
      return typeof v === "string" && v.trim().length > 0;
    });
    const tableValue = obj[section.table.key];
    const tableOk = Array.isArray(tableValue) && tableValue.length > 0;
    return fieldsOk && tableOk;
  }

  if (section.shape === "multi_table") {
    if (typeof value !== "object" || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    return section.tables.every((t) => {
      const arr = obj[t.key];
      return Array.isArray(arr) && arr.length > 0;
    });
  }

  return false;
}

export function computeF1Completeness(
  responses: Readonly<Record<string, unknown>>,
): {
  percent: number;
  completed_count: number;
  total_count: number;
  by_section: Record<F1SectionKey, boolean>;
} {
  const by_section = {} as Record<F1SectionKey, boolean>;
  let completed = 0;
  for (const section of F1_SECTIONS) {
    const ok = isF1SectionComplete(section, responses[section.key]);
    by_section[section.key] = ok;
    if (ok) completed++;
  }
  const total = F1_SECTIONS.length;
  return {
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed_count: completed,
    total_count: total,
    by_section,
  };
}
