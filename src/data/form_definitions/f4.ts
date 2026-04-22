// Definición del F4 — Visión Anual para el wizard.
// Refleja textualmente los campos del Word original
// docs/formularios-referencia/F4_Vision_Anual.docx.
//
// Carry-over: hereda del F4 del año anterior (mismo ciclo). Si es el primer
// ciclo de F4 para la iniciativa, hereda de F3 VF. El resolver vive en el
// wizard; acá solo se marca `carries_over: true` en las secciones aplicables.
//
// A diferencia de F1/F2/F3, F4 NO tiene gateway formal. El sponsor marca
// "reviewed". El wizard cambia el CTA a "Enviar a revisión del sponsor".

import type { WizardSection } from "./_shared";
import { computeCompleteness } from "./_shared";

const TIPO_INICIATIVA = ["Habilitadora", "Resultado"] as const;
const PRIORIDAD = ["Alta", "Media", "Baja"] as const;
const STAKEHOLDER = ["Usuario", "Interesado", "Sponsor"] as const;

export const F4_SECTIONS: readonly WizardSection[] = [
  {
    key: "seccion_1_info_general",
    number: 1,
    title: "Información general",
    carries_over: true,
    shape: "object",
    fields: [
      { key: "nombre", label: "Nombre de la iniciativa", kind: "text" },
      { key: "dimension_plataforma", label: "Dimensión / Plataforma", kind: "text" },
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
    carries_over: true,
    shape: "string",
    kind: "textarea",
    rows: 10,
  },
  {
    key: "seccion_3_necesidad_oportunidad",
    number: 3,
    title: "Necesidad y/o oportunidad",
    description:
      "Describir las principales necesidades, dolores o oportunidades de nuestros principales usuarios, interesados y/o sponsor para visibilizar el impacto de la iniciativa. Indicar con qué indicador se podría medir, valor de inicio, valor target y la prioridad entre ellos.",
    carries_over: true,
    shape: "object_with_table",
    fields: [
      {
        key: "sintesis",
        label: "Síntesis de la necesidad / oportunidad",
        hint: "Escribir una síntesis de la necesidad / oportunidad incluyendo tangible e intangible.",
        kind: "textarea",
        rows: 5,
      },
    ],
    table: {
      key: "detalle",
      title: "Detalle",
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
  },
  {
    key: "seccion_4_prioridades_estrategicas",
    number: 4,
    title: "Prioridades estratégicas del negocio y objetivos del año próximo",
    description:
      "Detallar los desafíos estratégicos y las prioridades de negocio que esta iniciativa planifica abordar el próximo año.",
    shape: "string",
    kind: "textarea",
    rows: 8,
  },
  {
    key: "seccion_5_descripcion_solucion",
    number: 5,
    title: "Descripción de la transformación / solución a desarrollar",
    description:
      "Describir cómo se transforma el proceso con la solución y cuáles son los beneficios / impacto en la operación para el año próximo. Listar las funcionalidades o entregables principales a entregar. Describir con el detalle necesario para entender la nueva solución, la nueva experiencia al usuario y el diferencial con la situación actual. Detallar qué otros procesos, sectores o assets podrían beneficiarse a partir de esta solución.",
    shape: "string",
    kind: "textarea",
    rows: 10,
  },
  {
    key: "seccion_6_planificacion_implementacion",
    number: 6,
    title: "Planificación de la implementación",
    shape: "multi_block",
    blocks: [
      {
        type: "table",
        key: "equipo_trabajo",
        title: "Equipo de trabajo",
        columns: [
          { key: "rol", label: "Rol", kind: "text", width: "w-40" },
          { key: "conocimiento", label: "Conocimiento necesario", kind: "text" },
          { key: "nombre", label: "Nombre y apellido", kind: "text" },
          { key: "asignacion", label: "Porcentaje de asignación", kind: "text", width: "w-40" },
          { key: "vp", label: "Vicepresidencia", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar miembro",
        row_default: { rol: "", conocimiento: "", nombre: "", asignacion: "", vp: "" },
      },
      {
        type: "table",
        key: "equipo_alineacion_estrategica",
        title: "Equipo de alineación estratégica",
        columns: [
          { key: "rol", label: "Rol", kind: "text", width: "w-48" },
          { key: "nombre", label: "Nombre y apellido", kind: "text" },
          { key: "vp", label: "Vicepresidencia", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar miembro",
        row_default: { rol: "", nombre: "", vp: "" },
      },
      {
        type: "table",
        key: "interesados_consultados",
        title: "Equipo interesados y consultados",
        columns: [
          { key: "nombre", label: "Nombre y apellido", kind: "text" },
          { key: "posicion", label: "Posición", kind: "text" },
          { key: "vp", label: "Vicepresidencia", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar interesado",
        row_default: { nombre: "", posicion: "", vp: "" },
      },
      {
        type: "text",
        key: "consideraciones_digitales",
        label: "Consideraciones digitales",
        hint:
          "Indicar qué tipo de solución, los desafíos digitales (madurez digital, disponibilidad y calidad de los datos, arquitectura, seguridad, ciencia de datos) y su integración y escalabilidad a los sistemas actuales.",
        rows: 6,
      },
      {
        type: "table",
        key: "interdependencias",
        title: "Interdependencias con la iniciativa",
        description: "Detallar las interdependencias que hay con otras iniciativas y sus referentes.",
        columns: [
          {
            key: "nombre",
            label: "Nombre iniciativa, proceso, proyectos, productos",
            kind: "text",
          },
          { key: "referente", label: "Referente", kind: "text", width: "w-56" },
        ],
        add_row_label: "+ Agregar fila",
        row_default: { nombre: "", referente: "" },
      },
      {
        type: "text",
        key: "desafios_riesgos",
        label: "Desafíos / Riesgos",
        hint:
          "Indicar qué desafíos técnicos, operativos, de gestión, culturales podrían surgir en el desarrollo y/o implementación de esta iniciativa.",
        rows: 6,
      },
      {
        type: "table",
        key: "plan_accion_riesgos",
        title: "Plan de acción para desafíos / riesgos",
        description: "Detallar un plan de acción para abordar los riesgos y/o desafíos detectados.",
        columns: [
          { key: "riesgo", label: "Riesgo", kind: "textarea" },
          { key: "accion", label: "Acción", kind: "textarea" },
          { key: "resultado_esperado", label: "Resultado esperado", kind: "textarea" },
          { key: "fecha", label: "Fecha", kind: "text", width: "w-32" },
          { key: "responsable", label: "Responsable", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar riesgo",
        row_default: {
          riesgo: "",
          accion: "",
          resultado_esperado: "",
          fecha: "",
          responsable: "",
        },
      },
      {
        type: "table",
        key: "journey_hitos",
        title: "Journey / hitos",
        description:
          "Realizar un roadmap preliminar con los grandes hitos de desarrollo de la iniciativa, como el desarrollo e implementación del MVP / piloto y sus posteriores lanzamientos. Estas fechas son preliminares y se pueden ver afectadas por cambios en los alcances, detección de bloqueantes y nuevas necesidades más prioritarias que puedan surgir.",
        columns: [
          { key: "hito", label: "Hito", kind: "text" },
          { key: "fecha", label: "Fecha", kind: "text", width: "w-40" },
        ],
        add_row_label: "+ Agregar hito",
        row_default: { hito: "", fecha: "" },
      },
    ],
  },
  {
    key: "seccion_7_costos",
    number: 7,
    title: "Costo de desarrollo y operación del nuevo proceso",
    description:
      "Describir a grandes rasgos tanto las erogaciones como los beneficios esperados para el próximo año.",
    shape: "multi_table",
    tables: [
      {
        key: "erogaciones_opex",
        title: "Erogaciones de operación (OPEX)",
        description:
          "Indicar qué equipo va a operar, mantener y dar soporte a la solución. Indicar los costos de licencia, nube, y los nuevos roles de ser necesario. Estimar recursos para el piloto y para el caso escalado.",
        columns: [
          { key: "subcategoria", label: "Subcategoría", kind: "text", width: "w-56" },
          { key: "erogacion_usd", label: "Erogación [USD]", kind: "text", width: "w-36" },
          { key: "detalle", label: "Detalle del cálculo de la erogación", kind: "textarea" },
        ],
        add_row_label: "+ Agregar fila",
        row_default: { subcategoria: "", erogacion_usd: "", detalle: "" },
      },
      {
        key: "erogaciones_capex",
        title: "Erogaciones de desarrollo (CAPEX)",
        columns: [
          { key: "subcategoria", label: "Subcategoría", kind: "text", width: "w-56" },
          { key: "erogacion_usd", label: "Erogación [USD]", kind: "text", width: "w-36" },
          { key: "detalle", label: "Detalle del cálculo de la erogación", kind: "textarea" },
        ],
        add_row_label: "+ Agregar fila",
        row_default: { subcategoria: "", erogacion_usd: "", detalle: "" },
      },
    ],
  },
  {
    key: "seccion_8_impacto_economico",
    number: 8,
    title: "Impacto económico",
    shape: "multi_table",
    tables: [
      {
        key: "beneficio_bruto_anio",
        title: "Beneficio bruto del año",
        columns: [
          {
            key: "subcategoria",
            label: "Subcategoría de corriente de valor",
            kind: "text",
            width: "w-60",
          },
          { key: "beneficio_esperado", label: "Beneficio esperado", kind: "text", width: "w-40" },
          { key: "detalle", label: "Detalle del cálculo del beneficio", kind: "textarea" },
        ],
        add_row_label: "+ Agregar fila",
        row_default: { subcategoria: "", beneficio_esperado: "", detalle: "" },
      },
      {
        key: "beneficio_bruto_5_anios",
        title: "Beneficio bruto 5 años",
        description:
          "Indicar cómo se estima que se van a impactar las palancas de valor.",
        columns: [
          {
            key: "corriente",
            label: "Corriente de valor",
            kind: "text",
            width: "w-56",
          },
          { key: "ano_1", label: "Año 1", kind: "text", width: "w-24" },
          { key: "ano_2", label: "Año 2", kind: "text", width: "w-24" },
          { key: "ano_3", label: "Año 3", kind: "text", width: "w-24" },
          { key: "ano_4", label: "Año 4", kind: "text", width: "w-24" },
          { key: "ano_5", label: "Año 5", kind: "text", width: "w-24" },
        ],
        add_row_label: "+ Agregar fila",
        row_default: {
          corriente: "",
          ano_1: "",
          ano_2: "",
          ano_3: "",
          ano_4: "",
          ano_5: "",
        },
      },
    ],
  },
];

export function computeF4Completeness(
  responses: Readonly<Record<string, unknown>>,
) {
  return computeCompleteness(F4_SECTIONS, responses);
}
