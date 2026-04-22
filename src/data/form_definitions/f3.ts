// Definición del F3 — MVP para el wizard.
// Refleja textualmente los campos del Word original
// docs/formularios-referencia/F3_MVP.docx.
//
// Carry-over: hereda de F2 VF (Dimensionamiento). Las secciones marcadas con
// `carry_over` se pre-cargan con el valor del formulario F2 aprobado de la
// misma iniciativa.

import type { WizardSection } from "./_shared";
import { computeCompleteness } from "./_shared";

const TIPO_INICIATIVA = ["Resultado", "Habilitador", "Plataforma"] as const;
const PRIORIDAD = ["Alta", "Media", "Baja"] as const;
const STAKEHOLDER = ["Usuario", "Interesado", "Sponsor"] as const;

const CORRIENTES_FIJAS = [
  "PRODUCCIÓN (m3)",
  "OPEX (M $ USD)",
  "CAPEX (M $ USD)",
  "PRODUCTIVIDAD (HH)",
  "EXP AL RIESGO (%)",
  "EMISIONES (MTnCO2 Eq)",
  "CONS ENERGIA (MW)",
] as const;

export const F3_SECTIONS: readonly WizardSection[] = [
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
    title: "Necesidad, oportunidad y prioridad",
    description:
      "Describir las principales necesidades, dolores o oportunidades de nuestros principales usuarios, interesados y/o sponsor para visibilizar el impacto de la iniciativa. Indicar con qué indicador se podría medir, valor de inicio, valor target y la prioridad entre ellos.",
    carries_over: true,
    shape: "object_with_table",
    fields: [
      {
        key: "sintesis",
        label: "Síntesis de la necesidad",
        hint: "Escribir una síntesis de la necesidad / oportunidad incluyendo tangible e intangible.",
        kind: "textarea",
        rows: 5,
      },
    ],
    table: {
      key: "detalle",
      title: "Detalle de la necesidad",
      description:
        "Dolor / oportunidad, métrica, valor de inicio, valor target y prioridad por stakeholder.",
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
    key: "seccion_4_alineacion_estrategica",
    number: 4,
    title: "Alineación estratégica",
    description:
      "Describir cómo esta iniciativa se alinea con la estrategia de la compañía. Indicar si esta iniciativa está relacionada a una dimensión o producto existente.",
    carries_over: true,
    shape: "string",
    kind: "textarea",
    rows: 8,
  },
  {
    key: "seccion_5_descripcion_solucion",
    number: 5,
    title: "Descripción de la solución",
    carries_over: true,
    shape: "object_with_table",
    fields: [
      {
        key: "estrategia_y_beneficios",
        label: "Estrategia de la iniciativa y sus principales beneficios",
        hint:
          "Describir la solución, sus principales beneficios, cómo impacta en la operación y los procesos. Describir con el detalle necesario para entender la nueva solución, la nueva experiencia al usuario y el diferencial con la situación actual.",
        kind: "textarea",
        rows: 6,
      },
      {
        key: "procesos",
        label: "Procesos",
        hint:
          'Mapear proceso "as is" y "to be" (proceso concreto y si aplicara, el proceso macro donde impacta). Contemplar el grado de detalle necesario ya que el nuevo proceso va a iterar a medida que se entregue.',
        kind: "textarea",
        rows: 6,
      },
      {
        key: "escalabilidad",
        label: "Escalabilidad",
        hint:
          "Describir en caso de ser exitosa esta iniciativa, cuál sería la potencialidad de escalado, qué otros procesos, sectores o assets podría alcanzar.",
        kind: "textarea",
        rows: 4,
      },
    ],
    table: {
      key: "areas_usuarias",
      title: "Áreas usuarias",
      description:
        "Indicar qué áreas van a ser usuarias o interesadas (áreas que van a ser beneficiadas por la iniciativa).",
      columns: [
        { key: "area", label: "Área", kind: "text", width: "w-56" },
        { key: "tipo", label: "Tipo de involucramiento", kind: "text" },
      ],
      add_row_label: "+ Agregar fila",
      row_default: { area: "", tipo: "" },
    },
  },
  {
    key: "seccion_6_mvp",
    number: 6,
    title: "Descripción del MVP (mínimo producto viable)",
    shape: "object",
    fields: [
      {
        key: "descripcion",
        label: "Descripción del MVP",
        hint:
          "Describir el MVP, su propósito, principales beneficios, cómo impacta en la operación y los procesos. Describir con el detalle necesario para entender el MVP, la nueva experiencia al usuario y el diferencial con la situación actual.",
        kind: "textarea",
        rows: 6,
      },
      {
        key: "indicadores_medicion",
        label: "Indicadores de medición",
        hint:
          "Detallar cuáles son los indicadores con los que se va a validar el funcionamiento e impacto del MVP.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "resultados_esperados",
        label: "Resultados esperados",
        hint:
          "Describir cuáles son los resultados esperados en base a los indicadores planteados.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "resultados_obtenidos",
        label: "Resultados obtenidos",
        hint:
          "Comparar los resultados esperados vs los resultados obtenidos en base a los indicadores planteados.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "aprendizajes_bloqueantes",
        label: "Aprendizajes y bloqueantes",
        hint:
          "Describir claramente los aprendizajes y bloqueantes resultantes de esta experiencia.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "conclusiones",
        label: "Conclusiones del MVP",
        hint:
          "Detallar cuáles son las conclusiones y recomendaciones del equipo MVP.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "journey_proximos_pasos",
        label: "Journey de la iniciativa o próximos pasos",
        hint:
          "En caso de que el MVP haya sido exitoso, describir el journey de la iniciativa, próximos entregables y fechas esperadas de lanzamiento. En caso de que el MVP no haya resultado como se esperaba, definir los próximos pasos (otro MVP, on-hold, cancelar).",
        kind: "textarea",
        rows: 5,
      },
    ],
  },
  {
    key: "seccion_7_equipo_desarrollo",
    number: 7,
    title: "Conformación del equipo de desarrollo",
    shape: "object_with_table",
    fields: [
      {
        key: "eficiencia_estructuracion",
        label: "Eficiencia y estructuración del producto",
        hint:
          "En el caso que esté alineado a una dimensión o producto existente, analizar junto al líder de dimensión y product owner si es factible incorporarlo al backlog. En caso de que se decida desarrollarlo en paralelo, indicar la razón y cómo se lo va a integrar a corto / mediano plazo.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "roles_conocimientos",
        label: "Roles y conocimientos necesarios dentro del equipo",
        hint:
          "Indicar los roles y habilidades digitales y de negocio necesarios para desarrollar esta iniciativa. Validar su disponibilidad. En caso de no contar con la disponibilidad necesaria, definir un plan de mitigación.",
        kind: "textarea",
        rows: 5,
      },
    ],
    table: {
      key: "equipo_execute_operate",
      title: "Equipo etapa Execute & Operate",
      columns: [
        { key: "rol", label: "Rol", kind: "text", width: "w-40" },
        { key: "nombre", label: "Nombre y apellido", kind: "text" },
        { key: "asignacion", label: "Porcentaje de asignación", kind: "text", width: "w-40" },
        { key: "posicion", label: "Posición", kind: "text" },
        { key: "area", label: "Área", kind: "text", width: "w-40" },
      ],
      add_row_label: "+ Agregar miembro",
      row_default: {
        rol: "",
        nombre: "",
        asignacion: "",
        posicion: "",
        area: "",
      },
    },
  },
  {
    key: "seccion_8_consideraciones_digitales",
    number: 8,
    title: "Consideraciones digitales",
    shape: "object",
    fields: [
      {
        key: "tipo_solucion",
        label: "Tipo de solución",
        hint:
          "Indicar qué tipo de estrategia se eligió para el desarrollo en base al MVP realizado y qué tipo de solución se propone para el delivery en base a lo aprendido durante esta etapa (enlatado, SaaS, desarrollo interno).",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "desafios_digitales",
        label: "Desafíos digitales",
        hint:
          "Detallar los desafíos digitales que podemos prever en el desarrollo de esta iniciativa (madurez digital, disponibilidad y calidad de los datos, arquitectura, seguridad, ciencia de datos) en base al MVP realizado y al journey planteado.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "integracion",
        label: "Integración",
        hint:
          "Indicar cómo se va a integrar esta iniciativa a los sistemas y procesos actuales, su alineación a la estrategia del negocio y digital.",
        kind: "textarea",
        rows: 4,
      },
    ],
  },
  {
    key: "seccion_9_gestion_cambio",
    number: 9,
    title: "Gestión del cambio",
    shape: "object_with_table",
    fields: [
      {
        key: "desafios_riesgos",
        label: "Desafíos / Riesgos",
        hint:
          "Indicar qué desafíos técnicos, operativos, de gestión, culturales podrían surgir en el desarrollo y/o implementación de esta iniciativa. Indicar áreas, usuarios, teniendo en cuenta lo aprendido con el desarrollo del MVP. Detallar acciones para abordarlas.",
        kind: "textarea",
        rows: 6,
      },
      {
        key: "plan_gestion_cambio",
        label: "Plan de gestión del cambio y Stakeholder Análisis",
        hint:
          "Listar los riesgos posibles y armar un plan para abordarlos. En base a las áreas y usuarios que afectará este desarrollo, indicar el soporte necesario de otros equipos. Indicar si hubo un cambio similar en el pasado y los aprendizajes que podemos aprovechar.",
        kind: "textarea",
        rows: 6,
      },
    ],
    table: {
      key: "interdependencias",
      title: "Interdependencias",
      description:
        "Detallar las interdependencias que hay con otras iniciativas y sus referentes, procesos y/o áreas.",
      columns: [
        {
          key: "nombre",
          label: "Nombre iniciativa, proceso, área",
          kind: "text",
        },
        { key: "referente", label: "Referente", kind: "text", width: "w-56" },
      ],
      add_row_label: "+ Agregar fila",
      row_default: { nombre: "", referente: "" },
    },
  },
  {
    key: "seccion_10_costos",
    number: 10,
    title: "Costo de desarrollo y operación del nuevo proceso",
    description:
      "Describir a grandes rasgos tanto los costos de desarrollo como los costos de operación (licencias, nuevo personal operativo si es necesario, mantenimiento, etc.).",
    shape: "object",
    fields: [
      {
        key: "costos_desarrollo",
        label: "Costos de desarrollo",
        hint:
          "Actualizar los costos asociados al desarrollo y lanzamiento. Necesidad de nuevas licencias, equipos, etc.",
        kind: "textarea",
        rows: 5,
      },
      {
        key: "costos_operacion",
        label: "Costos de operación",
        hint:
          "Indicar qué equipo va a operar, mantener y dar soporte a la solución. Indicar los costos de licencia, nube, y los nuevos roles de ser necesario. Estimar recursos para el piloto y para el caso escalado.",
        kind: "textarea",
        rows: 5,
      },
    ],
  },
  {
    key: "seccion_11_impacto_economico",
    number: 11,
    title: "Impacto económico / estratégico",
    description:
      "Actualizar las palancas de valor en base al MVP realizado y cuál es su proyección si se decide continuar con el desarrollo de la solución.",
    shape: "multi_table",
    tables: [
      {
        key: "corrientes_valor",
        title: "Corrientes de valor",
        columns: [
          { key: "corriente", label: "Corriente de valor", kind: "text", width: "w-56" },
          { key: "ano_1", label: "Año 1", kind: "text", width: "w-24" },
          { key: "ano_2", label: "Año 2", kind: "text", width: "w-24" },
          { key: "ano_3", label: "Año 3", kind: "text", width: "w-24" },
          { key: "ano_4", label: "Año 4", kind: "text", width: "w-24" },
          { key: "ano_5", label: "Año 5", kind: "text", width: "w-24" },
        ],
        row_default: {
          corriente: "",
          ano_1: "",
          ano_2: "",
          ano_3: "",
          ano_4: "",
          ano_5: "",
        },
      },
      {
        key: "palancas_valor",
        title: "Palancas de Valor",
        description:
          "Detallar indicadores de palancas de cada corriente de valor a impactar.",
        columns: [
          { key: "corriente", label: "Corriente de valor", kind: "text", width: "w-48" },
          { key: "palanca", label: "Palanca de valor", kind: "text" },
          { key: "ano_1", label: "Año 1", kind: "text", width: "w-24" },
          { key: "ano_2", label: "Año 2", kind: "text", width: "w-24" },
          { key: "ano_3", label: "Año 3", kind: "text", width: "w-24" },
          { key: "ano_4", label: "Año 4", kind: "text", width: "w-24" },
          { key: "ano_5", label: "Año 5", kind: "text", width: "w-24" },
        ],
        add_row_label: "+ Agregar palanca",
        row_default: {
          corriente: "",
          palanca: "",
          ano_1: "",
          ano_2: "",
          ano_3: "",
          ano_4: "",
          ano_5: "",
        },
      },
    ],
  },
  {
    key: "seccion_12_equipo",
    number: 12,
    title: "Equipo",
    shape: "multi_table",
    tables: [
      {
        key: "equipo_mvp",
        title: "Equipo etapa MVP",
        description:
          "Equipo responsable de hacer los análisis y los entregables necesarios de la etapa de MVP.",
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
        key: "sponsors_gate_3",
        title: "Sponsors gate 3",
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
        key: "equipo_metodologia",
        title: "Equipo metodología",
        description:
          "Equipo responsable de garantizar y salvaguardar el encuadre de la iniciativa con foco en el valor.",
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

export function computeF3Completeness(
  responses: Readonly<Record<string, unknown>>,
) {
  return computeCompleteness(F3_SECTIONS, responses);
}

// Filas iniciales sugeridas para la tabla de corrientes de valor (opcional:
// se muestra sin prefill automático; aquí la dejamos exportada por si se
// quiere usar al crear un F3 desde cero).
export const F3_CORRIENTES_DEFAULT_ROWS = CORRIENTES_FIJAS.map((c) => ({
  corriente: c,
  ano_1: "",
  ano_2: "",
  ano_3: "",
  ano_4: "",
  ano_5: "",
}));
