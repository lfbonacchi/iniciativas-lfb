// Definición del F2 — Dimensionamiento para el wizard.
// Hereda campos de F1 VF vía carry-over (secciones con `carries_over: true`
// cuya `key` coincide con la key equivalente en F1). Agrega los campos
// nuevos del Word: síntesis, procesos, alternativas, consideraciones
// digitales, topología de equipo, gestión del cambio detallada, costos
// OPEX/CAPEX, corrientes de valor a 5 años y palancas.

import {
  computeCompleteness,
  isSectionComplete,
  type WizardSection,
} from "./_shared";

const TIPO_INICIATIVA = ["Resultado", "Habilitador", "Plataforma"] as const;
const PRIORIDAD = ["Alta", "Media", "Baja"] as const;
const STAKEHOLDER = ["Usuario", "Interesado", "Sponsor"] as const;

// Filas fijas de corrientes de valor (textual del Word, mismas que F1).
const CORRIENTES_FIJAS = [
  "PRODUCCIÓN (m3)",
  "OPEX (M$ USD)",
  "CAPEX (M$ USD)",
  "PRODUCTIVIDAD (HH)",
  "EXP AL RIESGO (%)",
  "EMISIONES (MTnCO2 Eq)",
  "CONS ENERGÍA (MW)",
] as const;

export const F2_SECTIONS: readonly WizardSection[] = [
  // 1. Heredado de F1 — Información general.
  {
    key: "seccion_1_info_general",
    number: 1,
    title: "Información general",
    carries_over: true,
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

  // 2. Heredado de F1 — Propósito.
  {
    key: "seccion_2_proposito",
    number: 2,
    title: "Propósito",
    description:
      "Para [Cliente / Usuario] quienes necesitan / desean [declaración de necesidad u oportunidad]. El [nombre del producto] es una [categoría de producto]. Que [beneficio clave]. A diferencia de [alternativa competitiva primaria] nuestro producto [declaración de diferenciación primaria].",
    carries_over: true,
    shape: "string",
    kind: "textarea",
    rows: 10,
  },

  // 3. NUEVO F2 — Síntesis de la necesidad/oportunidad.
  {
    key: "seccion_3_sintesis_necesidad",
    number: 3,
    title: "Síntesis de la necesidad / oportunidad",
    description:
      "Escribir una síntesis de la necesidad/oportunidad incluyendo lo tangible y lo intangible.",
    shape: "string",
    kind: "textarea",
    rows: 6,
  },

  // 4. Heredado de F1 — Detalle necesidad/oportunidad y prioridad.
  {
    key: "seccion_3_necesidad_oportunidad",
    number: 4,
    title: "Detalle de la necesidad / oportunidad",
    description:
      "Describir las principales necesidades, dolores u oportunidades de usuarios, interesados y/o sponsors. Indicar métrica, valor de inicio, target y prioridad.",
    carries_over: true,
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
      {
        key: "dato_inicio",
        label: "Datos de inicio",
        kind: "text",
        width: "w-32",
      },
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

  // 5. Heredado de F1 — Alineación estratégica.
  {
    key: "seccion_4_alineacion_estrategica",
    number: 5,
    title: "Alineación estratégica",
    description:
      "Cómo se alinea con la estrategia de la compañía (desafíos y proyectos). Indicar si está relacionada a un área, dimensión o producto existente.",
    carries_over: true,
    shape: "string",
    kind: "textarea",
    rows: 8,
  },

  // 6. Mixto: estrategia/alcance/escalabilidad heredados + procesos/alternativas nuevos.
  {
    key: "seccion_5_descripcion",
    number: 6,
    title: "Descripción de la iniciativa",
    carries_over: true,
    shape: "object",
    fields: [
      {
        key: "estrategia_y_beneficios",
        label: "Estrategia de la iniciativa y principales beneficios",
        hint:
          "Describir la solución, sus beneficios, cómo impacta en la operación y los procesos. Detallar la nueva experiencia al usuario y el diferencial.",
        kind: "textarea",
        rows: 6,
      },
      {
        key: "procesos_as_is_to_be",
        label: "Procesos (as-is / to-be)",
        hint:
          "Mapear el proceso 'as is' y 'to be' (concreto y macro). Describir con el detalle necesario para entender el nuevo proceso.",
        kind: "textarea",
        rows: 6,
      },
      {
        key: "alcance",
        label: "Alcance",
        hint:
          "Alcance inicial: qué procesos, sectores o assets se piensan alcanzar preliminarmente.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "escalabilidad",
        label: "Escalabilidad",
        hint:
          "Si la iniciativa es exitosa, qué otros procesos, sectores o assets podría alcanzar.",
        kind: "textarea",
        rows: 4,
      },
      {
        key: "alternativas",
        label: "Alternativas",
        hint:
          "Describir soluciones alternativas y explicar por qué se elige ésta.",
        kind: "textarea",
        rows: 5,
      },
    ],
  },

  // 7. NUEVO F2 — Planificación de la implementación.
  {
    key: "seccion_6_planificacion_implementacion",
    number: 7,
    title: "Planificación de la implementación",
    description:
      "Topología, equipo necesario y equipo de alineación estratégica.",
    shape: "multi_block",
    blocks: [
      {
        type: "text",
        key: "topologia_equipo",
        label: "Topología del equipo",
        hint:
          "Tipo de equipo, gestión y gobierno. Para transformación digital: validar si la iniciativa se puede incorporar al backlog de una dimensión/producto existente o justificar desarrollo en paralelo.",
        rows: 6,
      },
      {
        type: "table",
        key: "equipo_necesario",
        title: "Equipo necesario para el desarrollo de la iniciativa",
        description:
          "Roles y habilidades digitales y de negocio. Validar disponibilidad; si no hay, definir plan de mitigación.",
        columns: [
          { key: "rol", label: "Rol", kind: "text", width: "w-40" },
          { key: "conocimiento", label: "Conocimiento", kind: "text" },
          { key: "nombre", label: "Nombre y apellido (si aplica)", kind: "text" },
          {
            key: "porcentaje",
            label: "% asignación",
            kind: "text",
            width: "w-28",
          },
          { key: "vp", label: "Vicepresidencia", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar rol",
        row_default: {
          rol: "",
          conocimiento: "",
          nombre: "",
          porcentaje: "",
          vp: "",
        },
      },
      {
        type: "table",
        key: "equipo_alineacion",
        title: "Equipo de alineación estratégica",
        description:
          "Sponsor, Business Owner, Portfolio y referentes. Indicar rol, nombre y vicepresidencia.",
        columns: [
          { key: "rol", label: "Rol", kind: "text", width: "w-40" },
          { key: "nombre", label: "Nombre y apellido", kind: "text" },
          { key: "vp", label: "Vicepresidencia", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar miembro",
        row_default: { rol: "", nombre: "", vp: "" },
      },
    ],
  },

  // 8. NUEVO F2 — Consideraciones digitales.
  {
    key: "seccion_7_consideraciones_digitales",
    number: 8,
    title: "Consideraciones digitales (si aplica)",
    shape: "multi_block",
    blocks: [
      {
        type: "text",
        key: "tipo_solucion",
        label: "Tipo de solución",
        hint:
          "Estrategia para el desarrollo digital (enlatado, SaaS, desarrollo interno). Detallar ventajas y desventajas de cada opción.",
        rows: 5,
      },
      {
        type: "text",
        key: "desafios_digitales",
        label: "Desafíos digitales",
        hint:
          "Madurez digital, disponibilidad y calidad de datos, arquitectura, seguridad, ciencia de datos.",
        rows: 5,
      },
      {
        type: "text",
        key: "integracion",
        label: "Integración",
        hint:
          "Cómo se integra a los sistemas y procesos actuales, y su alineación con la estrategia del negocio y digital.",
        rows: 5,
      },
    ],
  },

  // 9. NUEVO F2 — Gestión del cambio detallada.
  {
    key: "seccion_8_gestion_cambio_detallada",
    number: 9,
    title: "Gestión del cambio",
    shape: "multi_block",
    blocks: [
      {
        type: "table",
        key: "areas_relacionadas",
        title: "Áreas relacionadas con la iniciativa",
        description:
          "Áreas usuarias / interesadas o impactadas (beneficiadas por la iniciativa).",
        columns: [
          { key: "area", label: "Área", kind: "text", width: "w-56" },
          { key: "tipo", label: "Tipo de involucramiento", kind: "text" },
        ],
        add_row_label: "+ Agregar área",
        row_default: { area: "", tipo: "" },
      },
      {
        type: "table",
        key: "interdependencias",
        title: "Interdependencias con la iniciativa",
        description:
          "Interdependencias con otras iniciativas, procesos y/o áreas, y sus referentes.",
        columns: [
          {
            key: "nombre",
            label: "Nombre iniciativa / proceso / área",
            kind: "text",
          },
          { key: "referente", label: "Referente", kind: "text", width: "w-56" },
        ],
        add_row_label: "+ Agregar interdependencia",
        row_default: { nombre: "", referente: "" },
      },
      {
        type: "text",
        key: "desafios_riesgos",
        label: "Desafíos / Riesgos",
        hint:
          "Desafíos técnicos, operativos, de gestión, culturales. Soporte necesario de otros equipos. Aprendizajes de cambios similares en el pasado.",
        rows: 6,
      },
      {
        type: "table",
        key: "plan_accion",
        title: "Plan de acción para desafíos / riesgos",
        description:
          "Detallar acciones para abordar los riesgos y desafíos detectados.",
        columns: [
          { key: "riesgo", label: "Riesgo", kind: "text" },
          { key: "accion", label: "Acción", kind: "textarea" },
          {
            key: "resultado",
            label: "Resultado esperado",
            kind: "textarea",
          },
          { key: "fecha", label: "Fecha", kind: "text", width: "w-32" },
          {
            key: "responsable",
            label: "Responsable",
            kind: "text",
            width: "w-40",
          },
        ],
        add_row_label: "+ Agregar acción",
        row_default: {
          riesgo: "",
          accion: "",
          resultado: "",
          fecha: "",
          responsable: "",
        },
      },
    ],
  },

  // 10. NUEVO F2 — Costo de desarrollo y operación.
  {
    key: "seccion_9_costos",
    number: 10,
    title: "Costo de desarrollo y operación del nuevo proceso",
    description:
      "Describir a grandes rasgos los costos de desarrollo y los costos de operación (licencias, nuevo personal operativo, mantenimiento, etc.).",
    shape: "multi_block",
    blocks: [
      {
        type: "text",
        key: "costos_desarrollo",
        label: "Costos de desarrollo (CAPEX)",
        hint:
          "Costos asociados al desarrollo y lanzamiento: equipos, nuevas licencias, hardware, etc.",
        rows: 6,
      },
      {
        type: "text",
        key: "costos_operacion",
        label: "Costos de operación (OPEX)",
        hint:
          "Equipo que va a operar, mantener y dar soporte. Costos de licencia, nube, roles nuevos. Estimar recursos para el piloto y para el caso escalado.",
        rows: 6,
      },
    ],
  },

  // 11. Heredado de F1 — Journey / hitos (misma key que F1 para que carry-over funcione).
  {
    key: "seccion_8_journey_hitos",
    number: 11,
    title: "Journey / hitos",
    description:
      "Roadmap preliminar con los grandes hitos (MVP/piloto y posteriores lanzamientos). Las fechas son preliminares.",
    carries_over: true,
    shape: "array_rows",
    columns: [
      { key: "hito", label: "Hito", kind: "text" },
      { key: "fecha", label: "Fecha", kind: "text", width: "w-40" },
    ],
    add_row_label: "+ Agregar hito",
    row_default: { hito: "", fecha: "" },
  },

  // 12. NUEVO F2 — Impacto económico a 5 años (corrientes + palancas).
  {
    key: "seccion_10_impacto_corrientes_5anios",
    number: 12,
    title: "Impacto económico / estratégico — 5 años",
    description:
      "Estimación de impacto en corrientes de valor a 5 años y palancas de valor por corriente.",
    shape: "multi_block",
    blocks: [
      {
        type: "table",
        key: "corrientes_valor",
        title: "Corrientes de valor",
        description:
          "Estimación de impacto por corriente de valor, año 1 al año 5.",
        columns: [
          {
            key: "corriente",
            label: "Corriente de valor",
            kind: "text",
            width: "w-56",
          },
          { key: "anio_1", label: "Año 1", kind: "text", width: "w-24" },
          { key: "anio_2", label: "Año 2", kind: "text", width: "w-24" },
          { key: "anio_3", label: "Año 3", kind: "text", width: "w-24" },
          { key: "anio_4", label: "Año 4", kind: "text", width: "w-24" },
          { key: "anio_5", label: "Año 5", kind: "text", width: "w-24" },
        ],
        add_row_label: "+ Agregar corriente",
        row_default: {
          corriente: "",
          anio_1: "",
          anio_2: "",
          anio_3: "",
          anio_4: "",
          anio_5: "",
        },
      },
      {
        type: "table",
        key: "palancas_valor",
        title: "Palancas de valor",
        description:
          "Indicadores de palancas de cada corriente de valor a impactar.",
        columns: [
          {
            key: "corriente",
            label: "Corriente",
            kind: "text",
            width: "w-48",
          },
          { key: "palanca", label: "Palanca de valor", kind: "text" },
          { key: "anio_1", label: "Año 1", kind: "text", width: "w-24" },
          { key: "anio_2", label: "Año 2", kind: "text", width: "w-24" },
          { key: "anio_3", label: "Año 3", kind: "text", width: "w-24" },
          { key: "anio_4", label: "Año 4", kind: "text", width: "w-24" },
          { key: "anio_5", label: "Año 5", kind: "text", width: "w-24" },
        ],
        add_row_label: "+ Agregar palanca",
        row_default: {
          corriente: CORRIENTES_FIJAS[0],
          palanca: "",
          anio_1: "",
          anio_2: "",
          anio_3: "",
          anio_4: "",
          anio_5: "",
        },
      },
    ],
  },

  // 13. NUEVO F2 — Equipo Dimensionamiento (3 tablas: equipo, sponsors gate 2, metodología).
  {
    key: "seccion_11_equipo_dimensionamiento",
    number: 13,
    title: "Equipo Dimensionamiento y Gate 2",
    shape: "multi_table",
    tables: [
      {
        key: "dimensionamiento",
        title: "Equipo etapa Dimensionamiento",
        description:
          "Equipo responsable de los análisis y entregables de la segunda etapa de maduración.",
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
        key: "sponsors_gate_2",
        title: "Sponsors Gate 2",
        description:
          "Equipo encargado de tomar la decisión sobre la viabilidad del proyecto y su continuación.",
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
          "Equipo de soporte metodológico, responsable de garantizar el encuadre de la iniciativa con foco en el valor.",
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

export function getF2Section(key: string): WizardSection | undefined {
  return F2_SECTIONS.find((s) => s.key === key);
}

export const isF2SectionComplete = isSectionComplete;

export function computeF2Completeness(
  responses: Readonly<Record<string, unknown>>,
) {
  return computeCompleteness(F2_SECTIONS, responses);
}
