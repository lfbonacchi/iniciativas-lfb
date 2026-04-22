import type {
  AuditLog,
  Document,
  FileUpload,
  Form,
  FormChangeLog,
  FormDefinition,
  FormFieldValue,
  FormResponse,
  FormSnapshot,
  FormStatus,
  FormType,
  Gateway,
  GatewayStatus,
  GatewayVote,
  GatewayVoteValue,
  Id,
  Initiative,
  InitiativeFolder,
  InitiativeMember,
  InitiativeMemberRole,
  InitiativeStage,
  InitiativeStatus,
  LtpPeriod,
  Notification,
  User,
} from "@/types";

export interface SeedData {
  users: User[];
  initiatives: Initiative[];
  initiative_members: InitiativeMember[];
  initiative_folders: InitiativeFolder[];
  form_definitions: FormDefinition[];
  forms: Form[];
  form_responses: FormResponse[];
  form_change_log: FormChangeLog[];
  form_snapshots: FormSnapshot[];
  gateways: Gateway[];
  gateway_votes: GatewayVote[];
  notifications: Notification[];
  documents: Document[];
  file_uploads: FileUpload[];
  audit_log: AuditLog[];
  default_user_id: Id;
}

// Fecha de referencia del seed (per documento): abril 2026
const NOW = "2026-04-21T10:00:00.000Z";

// ============================================================================
// HELPERS
// ============================================================================

function mkMember(
  user_id: Id,
  initiative_id: Id,
  role: InitiativeMemberRole,
  can_edit = true,
): InitiativeMember {
  return { user_id, initiative_id, role, can_edit };
}

function mkForm(opts: {
  id: Id;
  initiative_id: Id;
  form_type: FormType;
  status: FormStatus;
  created_by: Id;
  created_at: string;
  updated_at?: string;
  submitted_at?: string | null;
  approved_at?: string | null;
  ltp_period?: LtpPeriod | null;
  version?: number;
}): Form {
  return {
    id: opts.id,
    initiative_id: opts.initiative_id,
    form_type: opts.form_type,
    version: opts.version ?? 1,
    status: opts.status,
    ltp_period: opts.ltp_period ?? null,
    created_by: opts.created_by,
    created_at: opts.created_at,
    updated_at: opts.updated_at ?? opts.created_at,
    submitted_at: opts.submitted_at ?? null,
    approved_at: opts.approved_at ?? null,
  };
}

function mkResp(
  form_id: Id,
  field_key: string,
  value: FormFieldValue,
): FormResponse {
  return {
    id: `resp_${form_id}_${field_key}`,
    form_id,
    field_key,
    value,
  };
}

function mkGateway(opts: {
  initiative_id: Id;
  form_id: Id;
  gateway_number: 1 | 2 | 3;
  status: GatewayStatus;
}): Gateway {
  return {
    id: `gw_${opts.initiative_id}_${opts.gateway_number}`,
    form_id: opts.form_id,
    initiative_id: opts.initiative_id,
    gateway_number: opts.gateway_number,
    status: opts.status,
    requires_unanimity: true,
  };
}

function mkVote(
  gateway_id: Id,
  user_id: Id,
  vote: GatewayVoteValue,
  feedback_text: string | null,
): GatewayVote {
  return {
    id: `vote_${gateway_id}_${user_id}`,
    gateway_id,
    user_id,
    vote,
    feedback_text,
  };
}

function mkNotif(opts: {
  id: Id;
  user_id: Id;
  type: Notification["type"];
  title: string;
  message: string;
  initiative_id: Id;
  read: boolean;
  created_at: string;
}): Notification {
  return { ...opts };
}

// ============================================================================
// USUARIOS (10 mock per documento)
// ============================================================================

const users: User[] = [
  {
    id: "u1",
    azure_oid: null,
    email: "roberto.mendez@pae.com",
    display_name: "Roberto Méndez",
    job_title: "VP Upstream",
    department: "Dirección Upstream",
    vicepresidencia: "VP Upstream",
    global_role: "user",
    is_vp: true,
  },
  {
    id: "u2",
    azure_oid: null,
    email: "maria.lopez@pae.com",
    display_name: "María López",
    job_title: "Coordinadora Transformación Digital",
    department: "Transformación Digital",
    vicepresidencia: "VP Transformación",
    global_role: "area_transformacion",
    is_vp: false,
  },
  {
    id: "u3",
    azure_oid: null,
    email: "juan.garcia@pae.com",
    display_name: "Juan García",
    job_title: "Ingeniero Senior de Producción",
    department: "Ingeniería de Producción",
    vicepresidencia: "VP Upstream",
    global_role: "user",
    is_vp: false,
  },
  {
    id: "u4",
    azure_oid: null,
    email: "ana.torres@pae.com",
    display_name: "Ana Torres",
    job_title: "Supervisora Operaciones Norte",
    department: "Operaciones Norte",
    vicepresidencia: "VP Operaciones",
    global_role: "user",
    is_vp: false,
  },
  {
    id: "u5",
    azure_oid: null,
    email: "fernando.alvarez@pae.com",
    display_name: "Fernando Álvarez",
    job_title: "Ingeniero de Procesos",
    department: "Transformación Digital",
    vicepresidencia: "VP Transformación",
    global_role: "user",
    is_vp: false,
  },
  {
    id: "u6",
    azure_oid: null,
    email: "lucia.martinez@pae.com",
    display_name: "Lucía Martínez",
    job_title: "Jefa de Mantenimiento",
    department: "Mantenimiento",
    vicepresidencia: "VP Operaciones",
    global_role: "user",
    is_vp: false,
  },
  {
    id: "u7",
    azure_oid: null,
    email: "diego.gonzalez@pae.com",
    display_name: "Diego González",
    job_title: "VP Perforación",
    department: "Dirección Perforación",
    vicepresidencia: "VP Perforación",
    global_role: "user",
    is_vp: true,
  },
  {
    id: "u8",
    azure_oid: null,
    email: "sofia.romero@pae.com",
    display_name: "Sofía Romero",
    job_title: "Analista Supply Chain",
    department: "Supply Chain",
    vicepresidencia: "VP Transformación",
    global_role: "user",
    is_vp: false,
  },
  {
    id: "u9",
    azure_oid: null,
    email: "pablo.diaz@pae.com",
    display_name: "Pablo Díaz",
    job_title: "Científico de Datos",
    department: "Transformación Digital",
    vicepresidencia: "VP Transformación",
    global_role: "area_transformacion",
    is_vp: false,
  },
  {
    id: "u10",
    azure_oid: null,
    email: "carolina.vega@pae.com",
    display_name: "Carolina Vega",
    job_title: "Analista Geociencias",
    department: "Geociencias",
    vicepresidencia: "VP Perforación",
    global_role: "user",
    is_vp: false,
  },
];

// ============================================================================
// INICIATIVA 1: Optimización predictiva de pozos maduros
// Etapa 2, F2 en borrador (45%). G1 aprobado.
// ============================================================================

const ini001: Initiative = {
  id: "ini-001",
  name: "Optimización predictiva de pozos maduros",
  current_stage: "dimensioning",
  status: "in_progress",
  created_at: "2025-11-15T10:00:00.000Z",
  has_etapa1: true,
  has_etapa2: true,
  has_etapa3: false,
};

const ini001_members: InitiativeMember[] = [
  mkMember("u3", "ini-001", "promotor"),
  mkMember("u3", "ini-001", "po"),
  mkMember("u2", "ini-001", "ld"),
  mkMember("u4", "ini-001", "bo"),
  mkMember("u1", "ini-001", "sponsor"),
  mkMember("u9", "ini-001", "equipo"),
  mkMember("u10", "ini-001", "equipo"),
];

const ini001_F1 = mkForm({
  id: "form_ini-001_F1",
  initiative_id: "ini-001",
  form_type: "F1",
  status: "final",
  created_by: "u3",
  created_at: "2025-11-15T10:00:00.000Z",
  submitted_at: "2026-01-10T14:00:00.000Z",
  approved_at: "2026-01-20T16:00:00.000Z",
});

const ini001_F1_responses: FormResponse[] = [
  mkResp(ini001_F1.id, "seccion_1_info_general", {
    nombre: "Optimización predictiva de pozos maduros",
    unidad_gestion: "Upstream Norte",
    areas_involucradas:
      "Ingeniería de Producción, Operaciones Norte, Mantenimiento",
    tipo: "Resultado",
  }),
  mkResp(
    ini001_F1.id,
    "seccion_2_proposito",
    "Para los ingenieros de producción del área Norte quienes necesitan anticipar la declinación de pozos maduros y optimizar el timing de intervenciones.\n\nEl sistema de optimización predictiva es una plataforma de monitoreo y predicción basada en modelos de machine learning.\n\nQue permite predecir el comportamiento de producción de pozos maduros con 30 días de anticipación y recomendar intervenciones óptimas basadas en el análisis automatizado de más de 200 variables por pozo.\n\nA diferencia del proceso actual basado en análisis manual de curvas de declinación que demora 5 días por pozo y depende de la experiencia individual de cada ingeniero, nuestro producto automatiza el análisis, estandariza las recomendaciones y reduce el tiempo de decisión de 5 días a 4 horas.",
  ),
  mkResp(ini001_F1.id, "seccion_3_necesidad_oportunidad", [
    {
      stakeholder: "Usuario (Ing. Producción)",
      dolor:
        "Análisis manual de curvas de declinación demora 5 días por pozo, limitando la cantidad de pozos que se pueden evaluar por mes",
      metrica: "Tiempo de análisis por pozo",
      dato_inicio: "5 días",
      target: "4 horas",
      prioridad: "Alta",
    },
    {
      stakeholder: "Usuario (Operador de campo)",
      dolor:
        "Las intervenciones tardías causan pérdida de producción irrecuperable en pozos maduros que ya están en declinación natural",
      metrica: "Producción perdida por intervención tardía (m3/mes)",
      dato_inicio: "850 m3/mes",
      target: "<200 m3/mes",
      prioridad: "Alta",
    },
    {
      stakeholder: "Interesado (Mantenimiento)",
      dolor:
        "Se realizan pulling de bombas innecesarios por falta de diagnóstico preciso, generando costos evitables y tiempo improductivo",
      metrica: "Intervenciones no planificadas por mes",
      dato_inicio: "12/mes",
      target: "4/mes",
      prioridad: "Media",
    },
    {
      stakeholder: "Interesado (Geociencias)",
      dolor:
        "Los modelos de reservorio no incorporan datos de operación en tiempo real, limitando la precisión de las proyecciones de recuperación",
      metrica: "Desviación de pronóstico de producción vs real",
      dato_inicio: "±25%",
      target: "±10%",
      prioridad: "Media",
    },
    {
      stakeholder: "Sponsor (VP Upstream)",
      dolor:
        "La declinación acelerada en yacimientos maduros del área Norte amenaza los targets de producción anuales",
      metrica: "Producción incremental área Norte (m3/año)",
      dato_inicio: "Base actual",
      target: "+8,000 m3/año",
      prioridad: "Alta",
    },
    {
      stakeholder: "Sponsor (VP Upstream)",
      dolor:
        "El costo de intervención por pozo es alto y no siempre se justifica con la producción recuperada",
      metrica: "ROI por intervención de pozo",
      dato_inicio: "2.1x promedio",
      target: ">5x promedio",
      prioridad: "Alta",
    },
    {
      stakeholder: "Usuario (Operador campo)",
      dolor:
        "Tiempo de respuesta ante fallas detectadas — agregado en VF tras feedback de Ana Torres",
      metrica: "Tiempo de respuesta ante fallas",
      dato_inicio: "4-8 horas",
      target: "<1 hora",
      prioridad: "Alta",
    },
  ]),
  mkResp(
    ini001_F1.id,
    "seccion_4_alineacion_estrategica",
    'Esta iniciativa se alinea directamente con el Desafío 1 del Vision House de PAE: "Maximizar la recuperación de reservas en yacimientos maduros". El proyecto contribuye al objetivo de incrementar la producción del área Norte en un 5% anual sin nuevas perforaciones, optimizando la operación de los +500 pozos existentes.\n\nLa iniciativa está relacionada con la dimensión Producción y complementa directamente la iniciativa de Monitoreo Remoto de Instalaciones (ini-002) que provee los datos en tiempo real necesarios para alimentar los modelos predictivos. También se vincula con la Plataforma de Datos de Producción (ini-005) que provee el data lake donde se centralizan los datos históricos.',
  ),
  mkResp(ini001_F1.id, "seccion_5_descripcion", {
    estrategia_y_beneficios:
      "Implementar modelos de machine learning entrenados con datos históricos de +500 pozos del área Norte (10 años de producción, workover, presión, temperatura, caudal). El sistema ingesta datos de sensores IoT (presión de boca de pozo, temperatura de fondo, caudal instantáneo), datos de workover históricos del sistema de mantenimiento, y parámetros de reservorio de Geociencias para generar predicciones a 30, 60 y 90 días. Beneficios: reducción 75% en tiempo de análisis por pozo, identificación temprana de pozos en riesgo, recomendaciones priorizadas por impacto económico, estandarización del proceso.",
    alcance:
      "Fase 1 (MVP): 20 pozos piloto en Cerro Dragón Norte. Incluye dashboard, alertas y módulo de recomendaciones. Período de shadow mode de 3 meses (agregado en VF).\nFase 2: Expansión a 150 pozos del área Norte completa.\nFase 3 (post-MVP): Integración con sistema de órdenes de trabajo.",
    interdependencias:
      "Monitoreo remoto de instalaciones (ini-002), Plataforma de datos de producción (ini-005), ERP SAP",
    escalabilidad:
      "Replicable a +2,000 pozos de todas las áreas (Norte, Central, Sur, Golfo). Adaptable a pozos de gas e inyección. Potencial USD 15M+/año si se escala completo.",
  }),
  mkResp(ini001_F1.id, "seccion_6_impacto_economico_corrientes", [
    {
      corriente: "PRODUCCIÓN (m3)",
      con_impacto: "S",
      detalle:
        "+8,000 m3/año estimados (20 pozos piloto). Escalado: +45,000 m3/año (150 pozos)",
    },
    {
      corriente: "OPEX (M USD)",
      con_impacto: "S",
      detalle:
        "Reducción USD 450K/año en intervenciones innecesarias y optimización",
    },
    {
      corriente: "CAPEX (M USD)",
      con_impacto: "N",
      detalle: "No aplica — software sobre infraestructura existente",
    },
    {
      corriente: "PRODUCTIVIDAD (HH)",
      con_impacto: "S",
      detalle: "2,400 HH/año ahorro en análisis manual",
    },
    { corriente: "EXP AL RIESGO (%)", con_impacto: "N", detalle: "" },
    { corriente: "EMISIONES (MTnCO2 Eq)", con_impacto: "N", detalle: "" },
    { corriente: "CONS ENERGÍA (MW)", con_impacto: "N", detalle: "" },
  ]),
  mkResp(ini001_F1.id, "seccion_7_gestion_cambio", {
    desafios:
      "1. Resistencia de ingenieros senior al cambio de proceso (15+ años de análisis manual). Plan: validación de 6 meses en paralelo.\n2. Calidad de datos históricos pre-2018 con gaps. Plan: limpieza y validación previo al entrenamiento.\n3. Conectividad en campo: algunos pozos requieren antenas adicionales.\n4. Integración con flujo actual de planificación de intervenciones sin duplicar esfuerzos.",
    participacion: [
      {
        area: "Ingeniería de Producción",
        tipo: "Involucrada — usuarios principales, validadores",
      },
      {
        area: "Operaciones Norte",
        tipo: "Involucrada — operadores ejecutan intervenciones",
      },
      {
        area: "Mantenimiento",
        tipo: "Interesada — recibe órdenes de pulling optimizadas",
      },
      {
        area: "Geociencias",
        tipo: "Interesada — modelos de reservorio se complementan con ML",
      },
      {
        area: "IT / Datos",
        tipo: "Involucrada — infraestructura, conectividad, seguridad",
      },
      {
        area: "Transformación Digital",
        tipo: "Involucrada — metodología, seguimiento",
      },
    ],
  }),
  mkResp(ini001_F1.id, "seccion_8_journey_hitos", [
    { hito: "Kickoff y relevamiento de datos", fecha: "Ene 2026" },
    {
      hito: "Limpieza datos históricos (500 pozos, 10 años)",
      fecha: "Mar 2026",
    },
    { hito: "Modelo predictivo v1 entrenado y validado", fecha: "Jun 2026" },
    { hito: "Instalación de sensores en 20 pozos piloto", fecha: "Jul 2026" },
    {
      hito: "Deploy de dashboard y módulo de alertas en pruebas",
      fecha: "Ago 2026",
    },
    {
      hito: "Shadow mode de 3 meses (modelo en paralelo a análisis manual)",
      fecha: "Sep-Nov 2026",
    },
    { hito: "Inicio piloto real con 20 pozos", fecha: "Dic 2026" },
    { hito: "Evaluación de resultados del piloto", fecha: "Mar 2027" },
    { hito: "Ajuste de modelo y preparación para rollout", fecha: "Abr 2027" },
    { hito: "Rollout a 150 pozos del área Norte", fecha: "Jun 2027" },
  ]),
  mkResp(ini001_F1.id, "seccion_9_equipo", {
    propuesta: [
      {
        rol: "Promotor",
        nombre: "Juan García",
        posicion: "Ingeniero Senior de Producción",
        vp: "VP Upstream",
      },
      {
        rol: "Líder de Dimensión",
        nombre: "María López",
        posicion: "Coordinadora Transformación Digital",
        vp: "VP Upstream",
      },
      {
        rol: "Data Scientist",
        nombre: "Pablo Díaz",
        posicion: "Científico de Datos",
        vp: "VP Upstream",
      },
      {
        rol: "Referente Operaciones",
        nombre: "Ana Torres",
        posicion: "Supervisora Operaciones Norte",
        vp: "VP Upstream",
      },
    ],
    gate_1: [
      {
        rol: "Sponsor",
        nombre: "Roberto Méndez",
        posicion: "VP Upstream",
        area: "Dirección Upstream",
      },
      {
        rol: "Business Owner",
        nombre: "Ana Torres",
        posicion: "Supervisora Operaciones Norte",
        area: "Operaciones",
      },
      {
        rol: "Área Transformación",
        nombre: "María López",
        posicion: "Coordinadora Transf. Digital",
        area: "Transformación Digital",
      },
      {
        rol: "Adicional",
        nombre: "Diego González",
        posicion: "VP Transformación",
        area: "Dirección Transformación",
      },
    ],
    metodologia: [
      {
        rol: "Scrum Master",
        nombre: "María López",
        posicion: "Coord. Transf. Digital",
        vp: "VP Upstream",
      },
      {
        rol: "Soporte técnico",
        nombre: "Pablo Díaz",
        posicion: "Científico de Datos",
        vp: "VP Upstream",
      },
      {
        rol: "QA / Testing",
        nombre: "Carolina Vega",
        posicion: "Analista Geociencias",
        vp: "VP Upstream",
      },
    ],
  }),
];

const ini001_G1 = mkGateway({
  initiative_id: "ini-001",
  form_id: ini001_F1.id,
  gateway_number: 1,
  status: "approved",
});

const ini001_G1_votes: GatewayVote[] = [
  mkVote(
    ini001_G1.id,
    "u1",
    "approved",
    "Excelente alineación con los objetivos de producción del área Norte. Asegurar que el piloto incluya pozos con distintos perfiles de declinación para validar la generalización del modelo.",
  ),
  mkVote(
    ini001_G1.id,
    "u4",
    "approved",
    "Agregar métrica de tiempo de respuesta ante fallas como indicador adicional. El equipo de operaciones necesita que las recomendaciones lleguen en horario operativo (6-18hs).",
  ),
  mkVote(
    ini001_G1.id,
    "u2",
    "approved",
    "El approach de ML es correcto. Sugiero incluir un período de shadow mode de 3 meses antes de tomar decisiones operativas basadas solo en el modelo.",
  ),
  mkVote(
    ini001_G1.id,
    "u7",
    "approved",
    "Interesante potencial de replicación en downstream. Mantener documentación de la arquitectura para facilitar escalado futuro.",
  ),
];

const ini001_F2 = mkForm({
  id: "form_ini-001_F2",
  initiative_id: "ini-001",
  form_type: "F2",
  status: "draft",
  created_by: "u3",
  created_at: "2026-02-01T10:00:00.000Z",
  updated_at: "2026-04-15T16:00:00.000Z",
});

const ini001_F2_responses: FormResponse[] = [
  mkResp(
    ini001_F2.id,
    "seccion_3_sintesis_ampliada",
    "El análisis de factibilidad técnica confirma la viabilidad del approach de ML. Se evaluaron 3 proveedores de plataforma de ML (Azure ML, AWS SageMaker, solución custom con Python/scikit-learn) y se seleccionó solución custom por menor dependencia de proveedor y mayor control sobre los modelos. Los datos históricos de 500 pozos están disponibles en el historiador PI y en SAP, con gaps manejables en el período 2015-2018 que se pueden interpolar. La infraestructura de conectividad en los 20 pozos piloto cubre el 85% — los 3 pozos restantes requieren instalación de antena satelital (USD 8K c/u).",
  ),
  mkResp(
    ini001_F2.id,
    "seccion_4_prioridades_estrategicas",
    'La iniciativa contribuye al target de producción 2026 del área Norte (+3% vs 2025). El VP Upstream priorizó este proyecto como "Impacto Rápido" en la planificación Q1 2026, por encima de otras 4 propuestas de la dimensión Producción.',
  ),
  mkResp(ini001_F2.id, "seccion_5_procesos_as_is_to_be", {
    as_is:
      "El ingeniero de producción revisa manualmente las curvas de declinación de cada pozo en Excel, compara con pozos similares, consulta al equipo de reservorio, y genera una recomendación de intervención en un documento Word. El proceso demora 5 días por pozo y permite evaluar ~6 pozos/mes por ingeniero.",
    to_be:
      "El sistema ingesta datos automáticamente del historiador PI y sensores IoT, ejecuta el modelo predictivo cada 24 horas, y publica predicciones y recomendaciones en un dashboard. El ingeniero revisa las recomendaciones priorizadas por impacto económico y aprueba o ajusta. El proceso demora 4 horas por pozo y permite evaluar ~40 pozos/mes por ingeniero.",
  }),
  mkResp(ini001_F2.id, "seccion_5_alternativas", [
    {
      alternativa: "Azure ML managed",
      pros: "Rápido de implementar, soporte Microsoft",
      contras: "USD 180K/año licencia, vendor lock-in, datos salen de la red PAE",
      decision: "Descartada",
    },
    {
      alternativa: "AWS SageMaker",
      pros: "Flexible, buen ecosistema",
      contras: "USD 150K/año, equipo no tiene experiencia AWS",
      decision: "Descartada",
    },
    {
      alternativa: "Solución custom (Python)",
      pros: "Control total, sin licencias, datos on-prem",
      contras: "Requiere más desarrollo inicial",
      decision: "Seleccionada",
    },
  ]),
  mkResp(ini001_F2.id, "seccion_6_equipo_trabajo", [
    {
      rol: "Product Owner",
      conocimiento: "Ingeniería de producción, análisis de pozos",
      nombre: "Juan García",
      asignacion: "50%",
      vp: "VP Upstream",
    },
    {
      rol: "Data Scientist Senior",
      conocimiento: "ML, Python, series temporales",
      nombre: "Pablo Díaz",
      asignacion: "80%",
      vp: "VP Upstream",
    },
    {
      rol: "Data Engineer",
      conocimiento: "ETL, APIs, historiador PI",
      nombre: "Por definir",
      asignacion: "100%",
      vp: "VP Upstream",
    },
    {
      rol: "Desarrollador Frontend",
      conocimiento: "React, dashboards, visualización",
      nombre: "Por definir",
      asignacion: "80%",
      vp: "VP Upstream",
    },
    {
      rol: "Referente Operaciones",
      conocimiento: "Conocimiento de campo, validación",
      nombre: "Ana Torres",
      asignacion: "20%",
      vp: "VP Upstream",
    },
  ]),
  mkResp(ini001_F2.id, "seccion_7_consideraciones_digitales", {
    tipo_solucion:
      "Aplicación web con backend de modelos ML (Python/FastAPI), frontend dashboard (React), pipeline de datos (Apache Airflow), almacenamiento en PostgreSQL + data lake.",
    desafios_digitales:
      "Madurez digital media-alta. Datos en PI/SAP no integrados. Datos post-2018 confiables; pre-2018 requieren limpieza (gaps ~15%). Arquitectura modular, integración con ini-005. Seguridad: SSO + red interna. Modelos XGBoost/LightGBM.",
    integracion:
      "Modular — cada modelo de pozo es independiente y escala horizontalmente. API de predicciones consumible por sistemas futuros (órdenes de trabajo, planificación).",
  }),
  mkResp(ini001_F2.id, "seccion_10_journey_actualizado", [
    { hito: "Kickoff y relevamiento", fecha: "Ene 2026", estado: "Completado" },
    {
      hito: "Limpieza datos históricos",
      fecha: "Mar 2026",
      estado: "En curso",
    },
    {
      hito: "Modelo v1 entrenado",
      fecha: "Jun 2026",
      estado: "Planificado",
    },
    {
      hito: "Sensores en 20 pozos",
      fecha: "Jul 2026",
      estado: "Planificado",
    },
    {
      hito: "Dashboard en pruebas",
      fecha: "Ago 2026",
      estado: "Planificado",
    },
    {
      hito: "Shadow mode (3 meses)",
      fecha: "Sep-Nov 2026",
      estado: "Planificado",
    },
    {
      hito: "Piloto real 20 pozos",
      fecha: "Dic 2026",
      estado: "Planificado",
    },
    {
      hito: "Evaluación piloto",
      fecha: "Mar 2027",
      estado: "Planificado",
    },
    {
      hito: "Rollout 150 pozos",
      fecha: "Jun 2027",
      estado: "Planificado",
    },
  ]),
];

// ============================================================================
// INICIATIVA 2: Monitoreo remoto de instalaciones
// Etapa 3, F3 en borrador (60%). G1 y G2 aprobados.
// ============================================================================

const ini002: Initiative = {
  id: "ini-002",
  name: "Monitoreo remoto de instalaciones",
  current_stage: "mvp",
  status: "in_progress",
  created_at: "2025-08-10T10:00:00.000Z",
  has_etapa1: true,
  has_etapa2: true,
  has_etapa3: true,
};

const ini002_members: InitiativeMember[] = [
  mkMember("u5", "ini-002", "promotor"),
  mkMember("u5", "ini-002", "po"),
  mkMember("u2", "ini-002", "ld"),
  mkMember("u4", "ini-002", "bo"),
  mkMember("u1", "ini-002", "sponsor"),
  mkMember("u9", "ini-002", "equipo"),
  mkMember("u6", "ini-002", "equipo"),
];

const ini002_F1 = mkForm({
  id: "form_ini-002_F1",
  initiative_id: "ini-002",
  form_type: "F1",
  status: "final",
  created_by: "u5",
  created_at: "2025-08-10T10:00:00.000Z",
  submitted_at: "2025-10-01T10:00:00.000Z",
  approved_at: "2025-10-15T16:00:00.000Z",
});

const ini002_F1_responses: FormResponse[] = [
  mkResp(ini002_F1.id, "seccion_1_info_general", {
    nombre: "Monitoreo remoto de instalaciones",
    unidad_gestion: "Upstream Norte",
    areas_involucradas:
      "Operaciones Norte, Mantenimiento, Seguridad Industrial, IT",
    tipo: "Resultado",
  }),
  mkResp(
    ini002_F1.id,
    "seccion_2_proposito",
    "Para los operadores de campo y supervisores de instalaciones del área Norte quienes necesitan monitorear variables críticas de operación sin desplazarse físicamente a cada punto.\n\nEl sistema de monitoreo remoto es una red de sensores IoT con plataforma de visualización centralizada.\n\nQue permite visualizar en tiempo real presión, temperatura, caudal y nivel en +50 instalaciones de superficie, generando alertas automáticas ante valores fuera de rango.\n\nA diferencia de las rondas manuales diarias que cubren solo el 30% de los puntos de medición y dependen del horario del operador, nuestro producto ofrece cobertura 24/7 del 100% de las variables críticas con detección de anomalías en menos de 15 minutos.",
  ),
  mkResp(ini002_F1.id, "seccion_3_necesidad_oportunidad", [
    {
      stakeholder: "Usuario (Operador campo)",
      dolor:
        "Rondas manuales de 6 horas diarias cubren solo 30% de los puntos de medición",
      metrica: "Cobertura de monitoreo de variables críticas",
      dato_inicio: "30%",
      target: "100%",
      prioridad: "Alta",
    },
    {
      stakeholder: "Usuario (Supervisor)",
      dolor:
        "Se entera de fallas con retraso de 4-8 horas, cuando el operador detecta en la ronda siguiente",
      metrica: "Tiempo desde ocurrencia de falla hasta detección",
      dato_inicio: "4-8 horas",
      target: "<15 minutos",
      prioridad: "Alta",
    },
    {
      stakeholder: "Interesado (Seguridad Ind.)",
      dolor: "Riesgo de exposición del personal en zonas remotas",
      metrica: "Incidentes de seguridad vinculados a rondas manuales",
      dato_inicio: "3/año",
      target: "0",
      prioridad: "Alta",
    },
    {
      stakeholder: "Interesado (Mantenimiento)",
      dolor:
        "Fallas no detectadas escalan a correctivos costosos prevenibles",
      metrica: "Costo promedio de correctivo por falla tardía (USD)",
      dato_inicio: "USD 45K",
      target: "USD 12K",
      prioridad: "Media",
    },
    {
      stakeholder: "Sponsor (VP Upstream)",
      dolor: "Paradas no programadas por fallas no detectadas impactan producción",
      metrica: "Horas de parada no programada por año",
      dato_inicio: "480 hrs/año",
      target: "<120 hrs/año",
      prioridad: "Alta",
    },
    {
      stakeholder: "Sponsor (VP Upstream)",
      dolor: "El costo operativo de rondas manuales es alto y no escala",
      metrica: "Costo anual de rondas manuales (USD)",
      dato_inicio: "USD 850K/año",
      target: "USD 200K/año",
      prioridad: "Media",
    },
  ]),
  mkResp(
    ini002_F1.id,
    "seccion_4_alineacion_estrategica",
    'La iniciativa se alinea con el Desafío 2 del Vision House: "Operación segura y eficiente de instalaciones de superficie". Contribuye a reducir incidentes de seguridad a cero y reducción de costos operativos del área Norte en 10%. Está relacionada con la dimensión Producción y es complementaria a ini-001 — el monitoreo remoto provee los datos en tiempo real que alimentan los modelos predictivos.',
  ),
  mkResp(ini002_F1.id, "seccion_5_descripcion", {
    estrategia_y_beneficios:
      "Desplegar sensores IoT industriales (presión, temperatura, caudal, nivel) en 50 instalaciones del área Norte, conectados vía red celular/satelital a plataforma centralizada. Beneficios: eliminación de rondas de rutina, detección inmediata de anomalías, historial continuo, reducción de riesgo del personal.",
    alcance:
      "Fase 1 (MVP): 10 instalaciones críticas, 4 variables c/u, dashboard, alertas email/SMS.\nFase 2: 50 instalaciones, integración con órdenes de trabajo.\nFase 3: cámaras de video en 15 instalaciones clave.",
    interdependencias:
      "Optimización predictiva (ini-001) consume estos datos. Plataforma de datos (ini-005) almacena en data lake. Proveedor conectividad celular/satelital.",
    escalabilidad:
      "Replicable a +200 instalaciones de PAE. Potencial integración con drones para inspección visual.",
  }),
  mkResp(ini002_F1.id, "seccion_6_impacto_economico_corrientes", [
    {
      corriente: "PRODUCCIÓN (m3)",
      con_impacto: "S",
      detalle: "+12,000 m3/año por reducción de paradas",
    },
    {
      corriente: "OPEX (M USD)",
      con_impacto: "S",
      detalle: "Reducción USD 800K/año en correctivo y rondas",
    },
    {
      corriente: "CAPEX (M USD)",
      con_impacto: "S",
      detalle: "USD 420K inversión en sensores, conectividad e instalación",
    },
    {
      corriente: "PRODUCTIVIDAD (HH)",
      con_impacto: "S",
      detalle: "3,500 HH/año ahorro en rondas",
    },
    {
      corriente: "EXP AL RIESGO (%)",
      con_impacto: "S",
      detalle: "-70% exposición personal en campo",
    },
    {
      corriente: "EMISIONES (MTnCO2 Eq)",
      con_impacto: "S",
      detalle: "~15 TnCO2/año por menor uso de vehículos",
    },
    { corriente: "CONS ENERGÍA (MW)", con_impacto: "N", detalle: "" },
  ]),
  mkResp(ini002_F1.id, "seccion_7_gestion_cambio", {
    desafios:
      "1. Operadores pueden percibir el sistema como amenaza laboral. Plan: comunicar que libera tiempo, no elimina puestos.\n2. Conectividad celular parcial — antenas satelitales para zonas aisladas.\n3. Confiabilidad sensores en condiciones extremas (Patagonia: -15°C, vientos +100 km/h, polvo). Equipos IP67+.\n4. Capacitación en dashboard e interpretación de alertas — evitar fatiga.",
    participacion: [
      {
        area: "Operaciones Norte",
        tipo: "Involucrada — usuarios principales",
      },
      {
        area: "Mantenimiento",
        tipo: "Involucrada — instalación y mantenimiento",
      },
      {
        area: "Seguridad Industrial",
        tipo: "Interesada — beneficiaria de reducción de riesgo",
      },
      {
        area: "IT / Telecomunicaciones",
        tipo: "Involucrada — red, servidores, seguridad",
      },
      {
        area: "Transformación Digital",
        tipo: "Involucrada — metodología, integración con ini-005",
      },
    ],
  }),
  mkResp(ini002_F1.id, "seccion_8_journey_hitos", [
    {
      hito: "Selección de proveedor sensores y plataforma IoT",
      fecha: "Oct 2025",
    },
    {
      hito: "Instalación sensores en 10 instalaciones piloto",
      fecha: "Dic 2025",
    },
    {
      hito: "Dashboard v1 con alertas básicas",
      fecha: "Feb 2026",
    },
    {
      hito: "Piloto operativo (3 meses)",
      fecha: "Mar-May 2026",
    },
    { hito: "Evaluación piloto y ajustes", fecha: "Jun 2026" },
    { hito: "Licitación expansión 50 instalaciones", fecha: "Jul 2026" },
    { hito: "Rollout completo 50 instalaciones", fecha: "Nov 2026" },
    {
      hito: "Integración con sistema de órdenes de trabajo",
      fecha: "Feb 2027",
    },
  ]),
];

const ini002_G1 = mkGateway({
  initiative_id: "ini-002",
  form_id: ini002_F1.id,
  gateway_number: 1,
  status: "approved",
});

const ini002_G1_votes: GatewayVote[] = [
  mkVote(
    ini002_G1.id,
    "u1",
    "approved",
    "Incluir análisis de ROI por instalación para priorizar el rollout. Se incorporó en F2.",
  ),
  mkVote(ini002_G1.id, "u4", "approved", null),
  mkVote(ini002_G1.id, "u2", "approved", null),
];

const ini002_F2 = mkForm({
  id: "form_ini-002_F2",
  initiative_id: "ini-002",
  form_type: "F2",
  status: "final",
  created_by: "u5",
  created_at: "2025-11-01T10:00:00.000Z",
  submitted_at: "2025-12-15T10:00:00.000Z",
  approved_at: "2026-01-10T16:00:00.000Z",
});

const ini002_F2_responses: FormResponse[] = [
  mkResp(
    ini002_F2.id,
    "seccion_3_sintesis_ampliada",
    "Se evaluaron 4 proveedores de plataforma IoT industrial. Se seleccionó Siemens MindSphere por compatibilidad con instrumentación existente y soporte local. Costo licencia: USD 4.5K/mes para 50 instalaciones. Conectividad: 35 instalaciones con 4G existente, 10 con repetidores celulares (USD 3K c/u), 5 con Starlink (USD 1.5K setup + USD 100/mes c/u).",
  ),
  mkResp(ini002_F2.id, "seccion_6_equipo_trabajo", [
    {
      rol: "Product Owner",
      conocimiento: "Procesos industriales, IoT",
      nombre: "Fernando Álvarez",
      asignacion: "60%",
      vp: "VP Transformación",
    },
    {
      rol: "Ingeniero IoT",
      conocimiento: "Sensores, protocolos industriales",
      nombre: "Por definir (contratación)",
      asignacion: "100%",
      vp: "VP Upstream",
    },
    {
      rol: "Desarrollador Backend",
      conocimiento: "APIs, integración MindSphere",
      nombre: "Por definir (contratación)",
      asignacion: "100%",
      vp: "VP Upstream",
    },
    {
      rol: "Desarrollador Frontend",
      conocimiento: "Dashboard, visualización",
      nombre: "Por definir",
      asignacion: "80%",
      vp: "VP Upstream",
    },
    {
      rol: "Técnico de campo",
      conocimiento: "Instalación, cableado, puesta en marcha",
      nombre: "Lucía Martínez (coordina)",
      asignacion: "30%",
      vp: "VP Upstream",
    },
  ]),
  mkResp(ini002_F2.id, "seccion_7_consideraciones_digitales", {
    tipo_solucion:
      "Plataforma IoT industrial (Siemens MindSphere) con sensores de campo, gateway de comunicaciones, y dashboard customizado en React.",
    desafios:
      "Conectividad zonas remotas (mix celular/satelital), latencia <30 seg para alertas, volumen ~500 MB/día.",
    integracion:
      "API REST al data lake (ini-005). Alertas integradas con email corporativo y SMS.",
  }),
  mkResp(
    ini002_F2.id,
    "seccion_8_gestion_cambio",
    "Plan en 3 fases: (1) Presentación a operadores aclarando que no hay impacto laboral, (2) Capacitación hands-on con dashboard durante piloto, (3) Feedback mensual y ajustes. Embajadores: 2 operadores senior participan desde el piloto como referentes.",
  ),
  mkResp(ini002_F2.id, "seccion_9_costos", {
    opex: [
      {
        subcategoria: "Licencias",
        erogacion_usd: "54,000/año",
        detalle: "MindSphere: USD 4,500/mes x 12",
      },
      {
        subcategoria: "Conectividad",
        erogacion_usd: "36,000/año",
        detalle: "Celular + satelital para 50 instalaciones",
      },
      {
        subcategoria: "Soporte y mantenimiento",
        erogacion_usd: "30,000/año",
        detalle: "Reemplazo de sensores, calibración",
      },
      { subcategoria: "Total OPEX", erogacion_usd: "120,000/año", detalle: "" },
    ],
    capex: [
      {
        subcategoria: "Sensores e instrumentación",
        erogacion_usd: "220,000",
        detalle: "200 sensores x USD 1,100 promedio",
      },
      {
        subcategoria: "Instalación y cableado",
        erogacion_usd: "95,000",
        detalle: "Mano de obra + materiales",
      },
      {
        subcategoria: "Gateways y comunicaciones",
        erogacion_usd: "65,000",
        detalle: "50 gateways + 10 repetidores + 5 Starlink",
      },
      {
        subcategoria: "Desarrollo software",
        erogacion_usd: "40,000",
        detalle: "Customización dashboard y alertas",
      },
      { subcategoria: "Total CAPEX", erogacion_usd: "420,000", detalle: "" },
    ],
  }),
  mkResp(ini002_F2.id, "seccion_11_corrientes_5_anios", [
    {
      corriente: "PRODUCCIÓN (m3)",
      anio_1: "+4,000",
      anio_2: "+12,000",
      anio_3: "+12,000",
      anio_4: "+15,000",
      anio_5: "+15,000",
    },
    {
      corriente: "OPEX (USD)",
      anio_1: "-300K",
      anio_2: "-800K",
      anio_3: "-800K",
      anio_4: "-900K",
      anio_5: "-900K",
    },
    {
      corriente: "PRODUCTIVIDAD (HH)",
      anio_1: "-1,200",
      anio_2: "-3,500",
      anio_3: "-3,500",
      anio_4: "-4,000",
      anio_5: "-4,000",
    },
  ]),
];

const ini002_G2 = mkGateway({
  initiative_id: "ini-002",
  form_id: ini002_F2.id,
  gateway_number: 2,
  status: "approved",
});

const ini002_G2_votes: GatewayVote[] = [
  mkVote(
    ini002_G2.id,
    "u1",
    "approved",
    "Incorporar dashboard mobile para supervisores en campo (agregado como requisito de F3).",
  ),
  mkVote(ini002_G2.id, "u4", "approved", null),
  mkVote(ini002_G2.id, "u2", "approved", null),
];

const ini002_F3 = mkForm({
  id: "form_ini-002_F3",
  initiative_id: "ini-002",
  form_type: "F3",
  status: "draft",
  created_by: "u5",
  created_at: "2026-02-01T10:00:00.000Z",
  updated_at: "2026-04-15T16:00:00.000Z",
});

const ini002_F3_responses: FormResponse[] = [
  mkResp(
    ini002_F3.id,
    "seccion_descripcion_mvp",
    "Piloto con 10 instalaciones del sector Norte-3 (las de mayor frecuencia de fallas históricas). Se instalan 4 sensores por instalación (presión de entrada, presión de salida, temperatura, caudal). Dashboard web con mapa de instalaciones, gráficos de tendencia en tiempo real, y alertas configurables por umbral. Alertas se envían por email al supervisor y por SMS al operador de guardia.",
  ),
];

// ============================================================================
// INICIATIVA 3: Gestión digital de integridad de ductos
// LTP, F4 Visión 2026 en borrador (63%). Etapas 1-3 completas.
// ============================================================================

const ini003: Initiative = {
  id: "ini-003",
  name: "Gestión digital de integridad de ductos",
  current_stage: "ltp_tracking",
  status: "in_progress",
  created_at: "2024-06-20T10:00:00.000Z",
  has_etapa1: true,
  has_etapa2: true,
  has_etapa3: true,
};

const ini003_members: InitiativeMember[] = [
  mkMember("u6", "ini-003", "promotor"),
  mkMember("u6", "ini-003", "po"),
  mkMember("u7", "ini-003", "bo"),
  mkMember("u1", "ini-003", "sponsor"),
  mkMember("u9", "ini-003", "equipo"),
  mkMember("u10", "ini-003", "equipo"),
];

const ini003_F1 = mkForm({
  id: "form_ini-003_F1",
  initiative_id: "ini-003",
  form_type: "F1",
  status: "final",
  created_by: "u6",
  created_at: "2024-06-20T10:00:00.000Z",
  submitted_at: "2024-08-15T10:00:00.000Z",
  approved_at: "2024-09-15T16:00:00.000Z",
});

const ini003_F1_responses: FormResponse[] = [
  mkResp(ini003_F1.id, "seccion_1_info_general", {
    nombre: "Gestión digital de integridad de ductos",
    unidad_gestion: "Upstream",
    areas_involucradas:
      "Mantenimiento, Integridad, Operaciones, Seguridad Industrial",
    tipo: "Resultado",
  }),
  mkResp(
    ini003_F1.id,
    "seccion_2_proposito",
    "Para los ingenieros de integridad y el equipo de mantenimiento quienes necesitan gestionar la integridad de +800 km de ductos de manera centralizada y trazable.\n\nEl sistema de gestión digital de integridad es una plataforma web que centraliza datos de inspección, corrosión, espesor de pared y anomalías.\n\nQue permite visualizar el estado de cada tramo de ducto, priorizar intervenciones por riesgo, y mantener trazabilidad completa de inspecciones y reparaciones.\n\nA diferencia del sistema actual basado en planillas Excel dispersas y reportes PDF de inspecciones que se pierden en carpetas compartidas, nuestro producto centraliza toda la información en una base de datos única con dashboards de riesgo y alertas de vencimiento.",
  ),
  mkResp(ini003_F1.id, "seccion_3_necesidad_oportunidad", [
    {
      stakeholder: "Usuario (Ing. Integridad)",
      dolor: "Consolidar datos de inspección de 800 km requiere 2 semanas/trimestre",
      metrica: "Tiempo de consolidación trimestral",
      dato_inicio: "2 semanas",
      target: "1 día",
      prioridad: "Alta",
    },
    {
      stakeholder: "Usuario (Técnico campo)",
      dolor: "Reportes en papel se pierden o llegan tarde",
      metrica: "Reportes perdidos o con retraso >1 semana",
      dato_inicio: "15%",
      target: "0%",
      prioridad: "Alta",
    },
    {
      stakeholder: "Interesado (Seguridad)",
      dolor: "Riesgo de fuga por corrosión no detectada",
      metrica: "Fugas por corrosión no anticipada/año",
      dato_inicio: "2/año",
      target: "0",
      prioridad: "Alta",
    },
    {
      stakeholder: "Interesado (Regulatorio)",
      dolor: "Incumplimiento de frecuencia de inspección regulatoria",
      metrica: "Inspecciones vencidas",
      dato_inicio: "8%",
      target: "0%",
      prioridad: "Alta",
    },
    {
      stakeholder: "Sponsor",
      dolor: "Costo de reemplazo de tramos por falta de mantenimiento preventivo",
      metrica: "Reemplazos de emergencia/año",
      dato_inicio: "4 tramos",
      target: "1 tramo",
      prioridad: "Alta",
    },
    {
      stakeholder: "Sponsor",
      dolor: "Exposición regulatoria por falta de trazabilidad",
      metrica: "Multas ambientales vinculadas a ductos (USD/año)",
      dato_inicio: "USD 180K",
      target: "USD 0",
      prioridad: "Media",
    },
  ]),
  mkResp(
    ini003_F1.id,
    "seccion_4_alineacion_estrategica",
    'Alineada con Desafío 3 del Vision House: "Operación confiable y cumplimiento regulatorio". Contribuye al objetivo de cero fugas por corrosión y al cumplimiento del 100% de inspecciones regulatorias. Relacionada con la dimensión Seguridad.',
  ),
  mkResp(ini003_F1.id, "seccion_5_descripcion", {
    estrategia:
      "Plataforma web que digitaliza el ciclo completo: registro de anomalías, seguimiento de corrosión, planificación de inspecciones, gestión de reparaciones, reportes regulatorios automáticos.",
    alcance:
      "Fase 1: ductos de producción del área Norte (350 km). Fase 2: todos los ductos de PAE (800+ km).",
    interdependencias: "Sistema GIS para geolocalización. SAP PM para órdenes de mantenimiento.",
    escalabilidad:
      "Extensible a flowlines, cañerías de planta, tanques de almacenamiento.",
  }),
  mkResp(ini003_F1.id, "seccion_6_impacto_economico_corrientes", [
    {
      corriente: "PRODUCCIÓN (m3)",
      con_impacto: "S",
      detalle: "+950 m3/año por reducción de paradas",
    },
    {
      corriente: "OPEX (M USD)",
      con_impacto: "S",
      detalle: "-350K/año en inspecciones redundantes y gestión manual",
    },
    {
      corriente: "CAPEX (M USD)",
      con_impacto: "S",
      detalle:
        "-1.2M en reemplazo anticipado (preventivo vs correctivo)",
    },
    {
      corriente: "PRODUCTIVIDAD (HH)",
      con_impacto: "S",
      detalle: "-1,800 HH/año en consolidación manual",
    },
    {
      corriente: "EXP AL RIESGO",
      con_impacto: "S",
      detalle: "Reducción significativa de riesgo de fuga y multas",
    },
    {
      corriente: "EMISIONES",
      con_impacto: "S",
      detalle: "Reducción de emisiones fugitivas por detección temprana",
    },
  ]),
];

const ini003_G1 = mkGateway({
  initiative_id: "ini-003",
  form_id: ini003_F1.id,
  gateway_number: 1,
  status: "approved",
});

const ini003_G1_votes: GatewayVote[] = [
  mkVote(ini003_G1.id, "u1", "approved", null),
  mkVote(ini003_G1.id, "u7", "approved", null),
  mkVote(ini003_G1.id, "u2", "approved", null),
];

const ini003_F2 = mkForm({
  id: "form_ini-003_F2",
  initiative_id: "ini-003",
  form_type: "F2",
  status: "final",
  created_by: "u6",
  created_at: "2024-09-20T10:00:00.000Z",
  submitted_at: "2024-12-10T10:00:00.000Z",
  approved_at: "2025-01-15T16:00:00.000Z",
});

const ini003_F2_responses: FormResponse[] = [
  mkResp(ini003_F2.id, "seccion_9_costos", {
    capex: "USD 280K (desarrollo)",
    opex: "USD 65K/año (licencias, hosting)",
  }),
  mkResp(
    ini003_F2.id,
    "seccion_11_impacto_economico",
    "Corrientes a 5 años documentadas. Beneficio principal: reducción de fugas y multas regulatorias.",
  ),
];

const ini003_G2 = mkGateway({
  initiative_id: "ini-003",
  form_id: ini003_F2.id,
  gateway_number: 2,
  status: "approved",
});

const ini003_G2_votes: GatewayVote[] = [
  mkVote(ini003_G2.id, "u1", "approved", null),
  mkVote(ini003_G2.id, "u7", "approved", null),
  mkVote(ini003_G2.id, "u2", "approved", null),
];

const ini003_F3 = mkForm({
  id: "form_ini-003_F3",
  initiative_id: "ini-003",
  form_type: "F3",
  status: "final",
  created_by: "u6",
  created_at: "2025-02-01T10:00:00.000Z",
  submitted_at: "2025-05-15T10:00:00.000Z",
  approved_at: "2025-06-15T16:00:00.000Z",
});

const ini003_F3_responses: FormResponse[] = [
  mkResp(
    ini003_F3.id,
    "seccion_descripcion_mvp",
    "100 km de ductos críticos digitalizados. Resultados: 0 fugas en tramos monitoreados (vs 1 fuga/semestre histórico). Inspecciones al día: 100%. Tiempo de consolidación: de 2 semanas a 2 horas.",
  ),
];

const ini003_G3 = mkGateway({
  initiative_id: "ini-003",
  form_id: ini003_F3.id,
  gateway_number: 3,
  status: "approved",
});

const ini003_G3_votes: GatewayVote[] = [
  mkVote(ini003_G3.id, "u1", "approved", null),
  mkVote(ini003_G3.id, "u7", "approved", null),
  mkVote(ini003_G3.id, "u2", "approved", null),
];

const ini003_F4_2026 = mkForm({
  id: "form_ini-003_F4_2026",
  initiative_id: "ini-003",
  form_type: "F4",
  status: "draft",
  ltp_period: "06-2026",
  created_by: "u6",
  created_at: "2026-03-01T10:00:00.000Z",
  updated_at: "2026-04-15T10:00:00.000Z",
});

const ini003_F4_2026_responses: FormResponse[] = [
  mkResp(
    ini003_F4_2026.id,
    "seccion_3_sintesis_2026",
    "Con el éxito del MVP en 100 km, la prioridad 2026 es escalar a 800 km completos e incorporar funcionalidades avanzadas: modelo predictivo de corrosión basado en datos históricos de espesor, integración con sistema GIS para visualización georreferenciada, y generación automática de reportes para entes reguladores.",
  ),
  mkResp(ini003_F4_2026.id, "seccion_4_prioridades_estrategicas_2026", [
    "Escalar de 100 km a 800 km de ductos digitalizados",
    "Integrar modelo predictivo de corrosión (colab con ini-001 para reutilizar framework de ML)",
    "Automatizar generación de reportes regulatorios trimestrales",
    "Implementar app mobile para inspectores de campo",
  ]),
  mkResp(ini003_F4_2026.id, "seccion_6_equipo_2026", [
    {
      rol: "Product Owner",
      nombre: "Lucía Martínez",
      asignacion: "50%",
      vp: "VP Upstream",
    },
    {
      rol: "Desarrollador Senior",
      nombre: "Por definir",
      asignacion: "100%",
      vp: "VP Upstream",
    },
    {
      rol: "Data Scientist",
      nombre: "Pablo Díaz",
      asignacion: "30%",
      vp: "VP Upstream",
    },
    {
      rol: "Inspector referente",
      nombre: "Por definir",
      asignacion: "40%",
      vp: "VP Upstream",
    },
  ]),
  mkResp(
    ini003_F4_2026.id,
    "seccion_6_consideraciones_digitales_2026",
    "Integración con GIS requiere licencia ArcGIS Server (USD 25K/año). Modelo predictivo usa framework de ini-001 (costo marginal bajo). Migración de datos históricos de 700 km adicionales puede tener gaps — plan: contratar data entry temporal (2 meses).",
  ),
  mkResp(ini003_F4_2026.id, "seccion_6_journey_2026", [
    { hito: "Migración datos 350 km restantes área Norte", fecha: "Mar 2026" },
    { hito: "Modelo predictivo de corrosión v1", fecha: "Jun 2026" },
    { hito: "Integración GIS", fecha: "Ago 2026" },
    { hito: "App mobile para inspectores", fecha: "Oct 2026" },
    {
      hito: "Migración datos área Central y Sur (350 km)",
      fecha: "Dic 2026",
    },
    { hito: "Reportes regulatorios automáticos", fecha: "Feb 2027" },
  ]),
];

// ============================================================================
// INICIATIVA 4: Automatización de sistemas de bombeo
// LTP. F4 2026 reviewed. F5 2026 borrador (30%). Etapas 1-3 completas.
// ============================================================================

const ini004: Initiative = {
  id: "ini-004",
  name: "Automatización de sistemas de bombeo",
  current_stage: "ltp_tracking",
  status: "in_progress",
  created_at: "2024-03-10T10:00:00.000Z",
  has_etapa1: true,
  has_etapa2: true,
  has_etapa3: true,
};

const ini004_members: InitiativeMember[] = [
  mkMember("u3", "ini-004", "po"),
  mkMember("u4", "ini-004", "bo"),
  mkMember("u1", "ini-004", "sponsor"),
  mkMember("u9", "ini-004", "equipo"),
  mkMember("u6", "ini-004", "equipo"),
];

const ini004_F1 = mkForm({
  id: "form_ini-004_F1",
  initiative_id: "ini-004",
  form_type: "F1",
  status: "final",
  created_by: "u3",
  created_at: "2024-03-10T10:00:00.000Z",
  submitted_at: "2024-06-15T10:00:00.000Z",
  approved_at: "2024-07-15T16:00:00.000Z",
});

const ini004_F1_responses: FormResponse[] = [
  mkResp(ini004_F1.id, "seccion_1_info_general", {
    nombre: "Automatización de sistemas de bombeo",
    unidad_gestion: "Upstream Norte",
    areas_involucradas: "Operaciones, Mantenimiento, Ingeniería",
    tipo: "Resultado",
  }),
  mkResp(
    ini004_F1.id,
    "seccion_2_proposito",
    "Para los operadores de bombeo y supervisores de producción quienes necesitan optimizar la operación de +300 bombas de extracción que hoy se ajustan manualmente cada 2-4 semanas.\n\nEl sistema de automatización de bombeo es una plataforma de control basada en PLCs inteligentes y algoritmos de optimización.\n\nQue ajusta parámetros de operación (velocidad de bombeo, presión de inyección, ciclos) en tiempo real basándose en condiciones de pozo, minimizando consumo energético y maximizando producción.\n\nA diferencia del ajuste manual periódico que depende de la disponibilidad y experiencia del operador, nuestro producto optimiza continuamente las 24 horas y reacciona en minutos a cambios de condición del pozo.",
  ),
];

const ini004_G1 = mkGateway({
  initiative_id: "ini-004",
  form_id: ini004_F1.id,
  gateway_number: 1,
  status: "approved",
});

const ini004_G1_votes: GatewayVote[] = [
  mkVote(ini004_G1.id, "u1", "approved", null),
  mkVote(ini004_G1.id, "u4", "approved", null),
  mkVote(ini004_G1.id, "u2", "approved", null),
];

const ini004_F2 = mkForm({
  id: "form_ini-004_F2",
  initiative_id: "ini-004",
  form_type: "F2",
  status: "final",
  created_by: "u3",
  created_at: "2024-08-01T10:00:00.000Z",
  submitted_at: "2024-10-15T10:00:00.000Z",
  approved_at: "2024-11-20T16:00:00.000Z",
});

const ini004_G2 = mkGateway({
  initiative_id: "ini-004",
  form_id: ini004_F2.id,
  gateway_number: 2,
  status: "approved",
});

const ini004_G2_votes: GatewayVote[] = [
  mkVote(ini004_G2.id, "u1", "approved", null),
  mkVote(ini004_G2.id, "u4", "approved", null),
  mkVote(ini004_G2.id, "u2", "approved", null),
];

const ini004_F3 = mkForm({
  id: "form_ini-004_F3",
  initiative_id: "ini-004",
  form_type: "F3",
  status: "final",
  created_by: "u3",
  created_at: "2025-01-15T10:00:00.000Z",
  submitted_at: "2025-03-10T10:00:00.000Z",
  approved_at: "2025-04-10T16:00:00.000Z",
});

const ini004_F3_responses: FormResponse[] = [
  mkResp(ini004_F3.id, "seccion_descripcion_mvp", {
    descripcion:
      "MVP en 30 bombas del sector Norte-2. Resultados en 6 meses: producción +4.8% vs bombas sin automatizar, consumo energético -22%, intervenciones de mantenimiento -35%.",
    aprendizajes:
      "Los PLCs Siemens S7-1500 funcionan bien pero la integración con SCADA legacy requirió desarrollo custom. Para el rollout se recomienda actualizar el SCADA en paralelo.",
  }),
  mkResp(ini004_F3.id, "seccion_impacto_economico_consolidado", [
    {
      corriente: "PRODUCCIÓN",
      impacto: "+5,200 m3/año por operación continuamente optimizada",
    },
    {
      corriente: "OPEX",
      impacto: "-3,100,000 USD/año en energía y mantenimiento de bombas",
    },
    {
      corriente: "CAPEX",
      impacto: "USD 620K inversión total (PLCs, cableado, software)",
    },
    {
      corriente: "HH",
      impacto: "-4,200 HH/año en ajustes manuales y monitoreo",
    },
  ]),
];

const ini004_G3 = mkGateway({
  initiative_id: "ini-004",
  form_id: ini004_F3.id,
  gateway_number: 3,
  status: "approved",
});

const ini004_G3_votes: GatewayVote[] = [
  mkVote(ini004_G3.id, "u1", "approved", null),
  mkVote(ini004_G3.id, "u4", "approved", null),
  mkVote(ini004_G3.id, "u2", "approved", null),
];

const ini004_F4_2025 = mkForm({
  id: "form_ini-004_F4_2025",
  initiative_id: "ini-004",
  form_type: "F4",
  status: "reviewed",
  ltp_period: "06-2025",
  created_by: "u3",
  created_at: "2025-05-01T10:00:00.000Z",
  submitted_at: "2025-06-15T10:00:00.000Z",
  updated_at: "2025-06-20T10:00:00.000Z",
});

const ini004_F4_2025_responses: FormResponse[] = [
  mkResp(ini004_F4_2025.id, "seccion_4_prioridades_2025", [
    "Escalar de 30 bombas a 100 bombas automatizadas",
    "Optimizar algoritmos de control con datos de 6 meses de operación del piloto",
    "Preparar integración con SCADA central para monitoreo unificado",
  ]),
  mkResp(
    ini004_F4_2025.id,
    "seccion_5_transformacion_2025",
    "Rollout en 3 lotes de ~23 bombas cada uno (Abr, Jul, Oct 2025). Cada lote incluye: instalación de PLC, configuración de algoritmo base, período de tuning de 2 semanas, y handover a operaciones.",
  ),
  mkResp(ini004_F4_2025.id, "seccion_6_planificacion_2025", [
    {
      rol: "Product Owner",
      nombre: "Juan García",
      asignacion: "40%",
    },
    {
      rol: "Ingeniero de automatización",
      nombre: "Externo (Siemens)",
      asignacion: "100%",
    },
    {
      rol: "Desarrollador SCADA",
      nombre: "Por definir",
      asignacion: "80%",
    },
    {
      rol: "Técnico de campo",
      nombre: "Equipo Mantenimiento (3 personas)",
      asignacion: "50%",
    },
  ]),
  mkResp(ini004_F4_2025.id, "seccion_7_costos_2025", {
    capex: "USD 340K (70 PLCs + instalación + cableado)",
    opex: "USD 75K (licencias software de control + soporte Siemens)",
  }),
  mkResp(ini004_F4_2025.id, "seccion_8_impacto_2025", {
    produccion: "+3,200 m3",
    opex_ahorro: "USD 1.8M",
    hh_ahorro: "2,800 HH",
  }),
];

const ini004_F5_2025 = mkForm({
  id: "form_ini-004_F5_2025",
  initiative_id: "ini-004",
  form_type: "F5",
  status: "reviewed",
  ltp_period: "12-2025",
  created_by: "u3",
  created_at: "2025-11-15T10:00:00.000Z",
  submitted_at: "2025-12-10T10:00:00.000Z",
  updated_at: "2025-12-20T10:00:00.000Z",
});

const ini004_F5_2025_responses: FormResponse[] = [
  mkResp(ini004_F5_2025.id, "entregables_2025", [
    {
      entregable: "Rollout lote 1 (23 bombas sector Norte-1)",
      responsable: "Juan García",
      fecha_plan: "Abr 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Rollout lote 2 (23 bombas sector Norte-3)",
      responsable: "Juan García",
      fecha_plan: "Jul 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Rollout lote 3 (24 bombas sector Norte-4)",
      responsable: "Juan García",
      fecha_plan: "Oct 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Actualización algoritmo con datos 6 meses",
      responsable: "Pablo Díaz",
      fecha_plan: "Dic 2025",
      estado: "Completado",
      avance: "100%",
    },
  ]),
  mkResp(ini004_F5_2025.id, "indicadores_2025", [
    {
      indicador: "Bombas automatizadas",
      tipo: "Avance",
      baseline: "30",
      target: "100",
      actual: "100",
      trend: "✓",
    },
    {
      indicador: "Producción incremental (m3)",
      tipo: "Resultado",
      baseline: "+1,800",
      target: "+3,200",
      actual: "+3,400",
      trend: "↑",
    },
    {
      indicador: "Consumo energético vs manual",
      tipo: "Impacto",
      baseline: "Base",
      target: "-20%",
      actual: "-23%",
      trend: "↑",
    },
    {
      indicador: "Intervenciones mantenimiento/mes",
      tipo: "Impacto",
      baseline: "18/mes",
      target: "10/mes",
      actual: "9/mes",
      trend: "↑",
    },
    {
      indicador: "Uptime de sistema automatizado",
      tipo: "Adopción",
      baseline: "N/A",
      target: ">98%",
      actual: "99.2%",
      trend: "→",
    },
  ]),
];

const ini004_F4_2026 = mkForm({
  id: "form_ini-004_F4_2026",
  initiative_id: "ini-004",
  form_type: "F4",
  status: "reviewed",
  ltp_period: "06-2026",
  created_by: "u3",
  created_at: "2026-02-01T10:00:00.000Z",
  submitted_at: "2026-03-15T10:00:00.000Z",
  updated_at: "2026-03-20T10:00:00.000Z",
});

const ini004_F4_2026_responses: FormResponse[] = [
  mkResp(ini004_F4_2026.id, "seccion_4_prioridades_2026", [
    "Escalar de 100 a 200 bombas automatizadas (incluir áreas Central y Sur)",
    "Integrar con sistema SCADA central para monitoreo unificado desde sala de control",
    "Implementar optimización multi-pozo (conjuntos interconectados, no individuales)",
  ]),
  mkResp(
    ini004_F4_2026.id,
    "seccion_5_transformacion_2026",
    "Rollout de 100 bombas adicionales en 4 lotes trimestrales. Nuevo módulo de optimización multi-pozo que considera restricciones de infraestructura compartida (líneas de flowline, estaciones de medición). Integración SCADA permite control remoto desde sala central, reduciendo necesidad de presencia en campo.",
  ),
  mkResp(ini004_F4_2026.id, "seccion_6_planificacion_2026", [
    { rol: "Product Owner", nombre: "Juan García", asignacion: "40%" },
    { rol: "Ing. Automatización", nombre: "Externo (Siemens)", asignacion: "80%" },
    { rol: "Desarrollador SCADA", nombre: "Por definir", asignacion: "100%" },
    { rol: "Data Scientist (multi-pozo)", nombre: "Pablo Díaz", asignacion: "40%" },
  ]),
  mkResp(ini004_F4_2026.id, "seccion_6_journey_2026", [
    { hito: "Rollout lote 4 (25 bombas área Central)", fecha: "Mar 2026" },
    { hito: "Integración SCADA central", fecha: "Jun 2026" },
    { hito: "Rollout lote 5 (25 bombas área Central)", fecha: "Jul 2026" },
    { hito: "Módulo optimización multi-pozo v1", fecha: "Sep 2026" },
    { hito: "Rollout lote 6 (25 bombas área Sur)", fecha: "Oct 2026" },
    { hito: "Rollout lote 7 (25 bombas área Sur)", fecha: "Dic 2026" },
  ]),
  mkResp(ini004_F4_2026.id, "seccion_7_costos_2026", {
    capex: "USD 280,000 (100 PLCs + instalación en áreas Central/Sur)",
    opex:
      "USD 95,000 (licencias expandidas + soporte + conectividad áreas nuevas)",
  }),
  mkResp(ini004_F4_2026.id, "seccion_8_corrientes_5_anios", [
    {
      corriente: "PRODUCCIÓN (m3)",
      anio_2026: "+2,800",
      anio_2027: "+5,200",
      anio_2028: "+5,500",
      anio_2029: "+5,500",
      anio_2030: "+5,500",
    },
    {
      corriente: "OPEX (USD)",
      anio_2026: "-1.5M",
      anio_2027: "-3.1M",
      anio_2028: "-3.3M",
      anio_2029: "-3.3M",
      anio_2030: "-3.3M",
    },
    {
      corriente: "HH",
      anio_2026: "-3,200",
      anio_2027: "-4,200",
      anio_2028: "-4,500",
      anio_2029: "-4,500",
      anio_2030: "-4,500",
    },
  ]),
];

const ini004_F5_2026 = mkForm({
  id: "form_ini-004_F5_2026",
  initiative_id: "ini-004",
  form_type: "F5",
  status: "draft",
  ltp_period: "12-2026",
  created_by: "u3",
  created_at: "2026-03-20T10:00:00.000Z",
  updated_at: "2026-04-10T10:00:00.000Z",
});

const ini004_F5_2026_responses: FormResponse[] = [
  mkResp(ini004_F5_2026.id, "entregables_2026", [
    {
      entregable: "Rollout lote 4 (25 bombas área Central)",
      responsable: "Juan García",
      fecha_plan: "Mar 2026",
      estado: "En curso",
      avance: "60%",
    },
    {
      entregable: "Integración SCADA central",
      responsable: "Por definir",
      fecha_plan: "Jun 2026",
      estado: "Planificado",
      avance: "—",
    },
    {
      entregable: "Rollout lote 5 (25 bombas)",
      responsable: "Juan García",
      fecha_plan: "Jul 2026",
      estado: "Planificado",
      avance: "—",
    },
  ]),
];

// ============================================================================
// INICIATIVA 5: Plataforma de datos de producción
// LTP completo en 2025 y 2026. Etapas 1-3 completas.
// ============================================================================

const ini005: Initiative = {
  id: "ini-005",
  name: "Plataforma de datos de producción",
  current_stage: "ltp_tracking",
  status: "in_progress",
  created_at: "2023-09-15T10:00:00.000Z",
  has_etapa1: true,
  has_etapa2: true,
  has_etapa3: true,
};

const ini005_members: InitiativeMember[] = [
  mkMember("u9", "ini-005", "po"),
  mkMember("u1", "ini-005", "bo"),
  mkMember("u1", "ini-005", "sponsor"),
  mkMember("u2", "ini-005", "equipo"),
];

const ini005_F1 = mkForm({
  id: "form_ini-005_F1",
  initiative_id: "ini-005",
  form_type: "F1",
  status: "final",
  created_by: "u9",
  created_at: "2023-09-15T10:00:00.000Z",
  submitted_at: "2024-01-15T10:00:00.000Z",
  approved_at: "2024-02-20T16:00:00.000Z",
});

const ini005_F1_responses: FormResponse[] = [
  mkResp(ini005_F1.id, "seccion_1_info_general", {
    nombre: "Plataforma de datos de producción",
    unidad_gestion: "Upstream",
    areas_involucradas:
      "Transformación Digital, IT, Ingeniería de Producción, Geociencias, Mantenimiento",
    tipo: "Habilitadora",
  }),
  mkResp(
    ini005_F1.id,
    "seccion_2_proposito",
    "Para todos los equipos técnicos de Upstream quienes necesitan acceder a datos de producción confiables, estandarizados y actualizados para tomar decisiones basadas en evidencia.\n\nLa plataforma de datos de producción es un data lake con capa de gobernanza, APIs estandarizadas y catálogo de datos.\n\nQue unifica todas las fuentes de datos de producción (SCADA, historiador PI, SAP, mediciones manuales) en un único punto de acceso con calidad garantizada, eliminando las +40 planillas Excel que hoy se usan como fuente intermedia.\n\nA diferencia del esquema actual donde cada área mantiene sus propias copias de datos con definiciones distintas de las mismas métricas, nuestro producto establece una fuente única de verdad con definiciones estándar y trazabilidad completa.",
  ),
  mkResp(
    ini005_F1.id,
    "seccion_4_alineacion_estrategica",
    'Alineada con la estrategia transversal de "Datos como activo estratégico". Iniciativa habilitadora que no genera valor directo pero habilita el valor de todas las iniciativas de analytics, ML y dashboards. Sin esta plataforma, ini-001, ini-002, ini-004 e ini-008 no pueden funcionar correctamente.',
  ),
  mkResp(ini005_F1.id, "seccion_6_impacto_economico_corrientes", [
    {
      corriente: "PRODUCCIÓN",
      impacto: "Indirecto — habilita +USD 15M en valor de otras iniciativas",
    },
    {
      corriente: "OPEX",
      impacto: "-200K/año en mantenimiento de planillas y procesos manuales",
    },
    { corriente: "HH", impacto: "-3,000 HH/año en preparación manual" },
    { corriente: "INTANGIBLE", impacto: "Decisiones basadas en datos confiables" },
  ]),
];

const ini005_G1 = mkGateway({
  initiative_id: "ini-005",
  form_id: ini005_F1.id,
  gateway_number: 1,
  status: "approved",
});

const ini005_G1_votes: GatewayVote[] = [
  mkVote(ini005_G1.id, "u1", "approved", null),
  mkVote(ini005_G1.id, "u2", "approved", null),
];

const ini005_F2 = mkForm({
  id: "form_ini-005_F2",
  initiative_id: "ini-005",
  form_type: "F2",
  status: "final",
  created_by: "u9",
  created_at: "2024-03-01T10:00:00.000Z",
  submitted_at: "2024-05-15T10:00:00.000Z",
  approved_at: "2024-06-20T16:00:00.000Z",
});

const ini005_G2 = mkGateway({
  initiative_id: "ini-005",
  form_id: ini005_F2.id,
  gateway_number: 2,
  status: "approved",
});

const ini005_G2_votes: GatewayVote[] = [
  mkVote(ini005_G2.id, "u1", "approved", null),
  mkVote(ini005_G2.id, "u2", "approved", null),
];

const ini005_F3 = mkForm({
  id: "form_ini-005_F3",
  initiative_id: "ini-005",
  form_type: "F3",
  status: "final",
  created_by: "u9",
  created_at: "2024-07-15T10:00:00.000Z",
  submitted_at: "2024-10-15T10:00:00.000Z",
  approved_at: "2024-11-20T16:00:00.000Z",
});

const ini005_F3_responses: FormResponse[] = [
  mkResp(
    ini005_F3.id,
    "seccion_descripcion_mvp",
    "MVP: Data lake con 200 pozos, 5 fuentes integradas, catálogo con 120 datasets, 3 APIs. Resultados: preparación de datos de 2.5 días a 3 horas, discrepancia entre fuentes de 18% a 2%.",
  ),
];

const ini005_G3 = mkGateway({
  initiative_id: "ini-005",
  form_id: ini005_F3.id,
  gateway_number: 3,
  status: "approved",
});

const ini005_G3_votes: GatewayVote[] = [
  mkVote(ini005_G3.id, "u1", "approved", null),
  mkVote(ini005_G3.id, "u2", "approved", null),
];

const ini005_F4_2025 = mkForm({
  id: "form_ini-005_F4_2025",
  initiative_id: "ini-005",
  form_type: "F4",
  status: "reviewed",
  ltp_period: "06-2025",
  created_by: "u9",
  created_at: "2025-04-15T10:00:00.000Z",
  submitted_at: "2025-06-10T10:00:00.000Z",
  updated_at: "2025-06-15T10:00:00.000Z",
});

const ini005_F4_2025_responses: FormResponse[] = [
  mkResp(ini005_F4_2025.id, "prioridades_2025", [
    "Escalar de 200 a 500 pozos",
    "Data quality automático con alertas",
    "APIs self-service",
    "Dashboard de gobernanza",
  ]),
  mkResp(ini005_F4_2025.id, "costos_2025", {
    capex: "USD 220K",
    opex: "USD 95K",
  }),
  mkResp(ini005_F4_2025.id, "journey_2025", [
    { hito: "Ingesta áreas Central y Sur", fecha: "Mar 2025" },
    { hito: "Data quality automático v1", fecha: "Jun 2025" },
    { hito: "Portal APIs self-service", fecha: "Sep 2025" },
    { hito: "Dashboard de gobernanza", fecha: "Nov 2025" },
  ]),
];

const ini005_F5_2025 = mkForm({
  id: "form_ini-005_F5_2025",
  initiative_id: "ini-005",
  form_type: "F5",
  status: "reviewed",
  ltp_period: "12-2025",
  created_by: "u9",
  created_at: "2025-10-15T10:00:00.000Z",
  submitted_at: "2025-12-10T10:00:00.000Z",
  updated_at: "2025-12-15T10:00:00.000Z",
});

const ini005_F5_2025_responses: FormResponse[] = [
  mkResp(ini005_F5_2025.id, "entregables_2025", [
    {
      entregable: "Ingesta área Central (150 pozos)",
      responsable: "Pablo Díaz",
      fecha: "Mar 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Ingesta área Sur (150 pozos)",
      responsable: "Pablo Díaz",
      fecha: "May 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Data quality automático v1",
      responsable: "Pablo Díaz",
      fecha: "Jun 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Portal APIs self-service",
      responsable: "Pablo Díaz",
      fecha: "Sep 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Dashboard gobernanza",
      responsable: "Pablo Díaz",
      fecha: "Nov 2025",
      estado: "Completado",
      avance: "100%",
    },
  ]),
  mkResp(ini005_F5_2025.id, "indicadores_2025", [
    {
      indicador: "Datasets disponibles",
      tipo: "Avance",
      baseline: "120",
      target: "180",
      actual: "185",
      trend: "↑",
    },
    {
      indicador: "Pozos con datos integrados",
      tipo: "Avance",
      baseline: "200",
      target: "500",
      actual: "500",
      trend: "✓",
    },
    {
      indicador: "Usuarios activos API",
      tipo: "Adopción",
      baseline: "8",
      target: "35",
      actual: "42",
      trend: "↑",
    },
    {
      indicador: "Tiempo preparación datos",
      tipo: "Resultado",
      baseline: "3 horas",
      target: "<1 hora",
      actual: "45 min",
      trend: "↑",
    },
  ]),
];

const ini005_F4_2026 = mkForm({
  id: "form_ini-005_F4_2026",
  initiative_id: "ini-005",
  form_type: "F4",
  status: "reviewed",
  ltp_period: "06-2026",
  created_by: "u9",
  created_at: "2026-02-15T10:00:00.000Z",
  submitted_at: "2026-03-10T10:00:00.000Z",
  updated_at: "2026-03-15T10:00:00.000Z",
});

const ini005_F4_2026_responses: FormResponse[] = [
  mkResp(ini005_F4_2026.id, "prioridades_2026", [
    "Incorporar datos downstream (refinería)",
    "Data quality ML v2",
    "SDK Python para data scientists",
    "Catálogo v2 con búsqueda inteligente",
  ]),
  mkResp(ini005_F4_2026.id, "costos_2026", {
    capex: "USD 180K",
    opex: "USD 110K",
  }),
];

const ini005_F5_2026 = mkForm({
  id: "form_ini-005_F5_2026",
  initiative_id: "ini-005",
  form_type: "F5",
  status: "reviewed",
  ltp_period: "12-2026",
  created_by: "u9",
  created_at: "2026-03-20T10:00:00.000Z",
  submitted_at: "2026-04-10T10:00:00.000Z",
  updated_at: "2026-04-15T10:00:00.000Z",
});

const ini005_F5_2026_responses: FormResponse[] = [
  mkResp(ini005_F5_2026.id, "entregables_2026", [
    {
      entregable: "SDK Python en repo interno",
      responsable: "Pablo Díaz",
      fecha: "Mar 2026",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Data quality ML v2",
      responsable: "Pablo Díaz",
      fecha: "Jun 2026",
      estado: "En curso",
      avance: "70%",
    },
    {
      entregable: "Integración datos refinería",
      responsable: "Pablo Díaz",
      fecha: "Sep 2026",
      estado: "Planificado",
      avance: "—",
    },
    {
      entregable: "Catálogo v2 búsqueda inteligente",
      responsable: "Pablo Díaz",
      fecha: "Nov 2026",
      estado: "Planificado",
      avance: "—",
    },
  ]),
  mkResp(ini005_F5_2026.id, "indicadores_2026", [
    {
      indicador: "Datasets disponibles",
      tipo: "Avance",
      baseline: "185",
      target: "250",
      actual: "210",
      trend: "↑",
    },
    {
      indicador: "Tiempo onboarding nueva fuente",
      tipo: "Resultado",
      baseline: "15 días",
      target: "3 días",
      actual: "5 días",
      trend: "↑",
    },
    {
      indicador: "Usuarios activos API",
      tipo: "Adopción",
      baseline: "42",
      target: "120",
      actual: "78",
      trend: "↑",
    },
    {
      indicador: "Anomalías detectadas ML/mes",
      tipo: "Impacto",
      baseline: "0",
      target: "20+",
      actual: "15",
      trend: "↑",
    },
  ]),
];

// ============================================================================
// INICIATIVA 6: Digitalización de permisos ambientales
// IMPORTADA directo a LTP (sin F1/F2/F3). LTP 2025 y 2026 completos.
// ============================================================================

const ini006: Initiative = {
  id: "ini-006",
  name: "Digitalización de permisos ambientales",
  current_stage: "ltp_tracking",
  status: "in_progress",
  created_at: "2024-01-10T10:00:00.000Z",
  has_etapa1: false,
  has_etapa2: false,
  has_etapa3: false,
};

const ini006_members: InitiativeMember[] = [
  mkMember("u10", "ini-006", "po"),
  mkMember("u7", "ini-006", "bo"),
  mkMember("u7", "ini-006", "sponsor"),
];

const ini006_F4_2025 = mkForm({
  id: "form_ini-006_F4_2025",
  initiative_id: "ini-006",
  form_type: "F4",
  status: "reviewed",
  ltp_period: "06-2025",
  created_by: "u10",
  created_at: "2025-04-01T10:00:00.000Z",
  submitted_at: "2025-06-10T10:00:00.000Z",
  updated_at: "2025-06-15T10:00:00.000Z",
});

const ini006_F4_2025_responses: FormResponse[] = [
  mkResp(ini006_F4_2025.id, "info_general", {
    nombre: "Digitalización de permisos ambientales",
    dimension: "Sustentabilidad",
    areas_involucradas:
      "Medio Ambiente, Legal, Operaciones, Relaciones Institucionales",
    tipo: "Habilitadora",
  }),
  mkResp(
    ini006_F4_2025.id,
    "proposito",
    "Para el equipo de medio ambiente y responsables de instalaciones quienes necesitan gestionar +400 permisos ambientales activos sin riesgo de vencimientos no detectados.\n\nEl sistema de digitalización de permisos es una plataforma web de tracking y gestión documental.\n\nQue permite registrar cada permiso, su vigencia, requisitos de renovación, documentación y responsable, con alertas automáticas 90/60/30 días antes del vencimiento.\n\nA diferencia del sistema actual de planillas Excel con +15 hojas donde los vencimientos se detectan cuando alguien revisa manualmente, nuestro producto garantiza cero vencimientos no anticipados.",
  ),
  mkResp(ini006_F4_2025.id, "necesidad_oportunidad", [
    {
      stakeholder: "Usuario (Analista MA)",
      dolor: "Gestionar 400 permisos en Excel consume todo su tiempo",
      metrica: "Tiempo en gestión administrativa",
      dato_inicio: "80%",
      target: "30%",
      prioridad: "Alta",
    },
    {
      stakeholder: "Usuario (Resp. Instalación)",
      dolor: "No sabe qué permisos aplican ni cuándo vencen",
      metrica: "Permisos con responsable notificado",
      dato_inicio: "40%",
      target: "100%",
      prioridad: "Alta",
    },
    {
      stakeholder: "Interesado (Legal)",
      dolor: "Multas por operación con permisos vencidos",
      metrica: "Multas ambientales por vencimiento (USD/año)",
      dato_inicio: "USD 200K",
      target: "USD 0",
      prioridad: "Alta",
    },
    {
      stakeholder: "Sponsor (VP Transformación)",
      dolor: "Riesgo reputacional y regulatorio por incumplimientos",
      metrica: "Permisos vencidos sin gestión activa",
      dato_inicio: "12%",
      target: "0%",
      prioridad: "Alta",
    },
  ]),
  mkResp(ini006_F4_2025.id, "prioridades_2025", [
    "Relevar 100% de permisos existentes y cargarlos al sistema",
    "Digitalizar permisos críticos (operación de pozos, emisiones, efluentes)",
    "Implementar alertas automáticas de vencimiento",
  ]),
  mkResp(
    ini006_F4_2025.id,
    "transformacion_2025",
    "Plataforma web con módulos de: registro de permisos (datos, vigencia, documentos adjuntos, responsable), alertas por email (90/60/30 días), dashboard de estado (vigente/próximo a vencer/vencido), y reportes para entes reguladores.",
  ),
  mkResp(ini006_F4_2025.id, "planificacion_2025", [
    { rol: "Product Owner", nombre: "Carolina Vega", asignacion: "50%" },
    {
      rol: "Desarrollador Full-stack",
      nombre: "Externo",
      asignacion: "100%",
    },
    {
      rol: "Analista Medio Ambiente",
      nombre: "Por definir",
      asignacion: "40%",
    },
    { rol: "Referente Legal", nombre: "Por definir", asignacion: "20%" },
  ]),
  mkResp(ini006_F4_2025.id, "costos_2025", {
    capex: "USD 120K (desarrollo)",
    opex: "USD 35K (hosting, licencias)",
  }),
  mkResp(ini006_F4_2025.id, "impacto_2025", {
    multas_evitadas: "USD 200K/año",
    hh_ahorro: "1,200 HH/año",
    reduccion_riesgo: "De 12% permisos vencidos a <2%",
  }),
  mkResp(ini006_F4_2025.id, "journey_2025", [
    {
      hito: "Relevamiento y carga de 200 permisos críticos",
      fecha: "Mar 2025",
    },
    { hito: "Sistema web de tracking en producción", fecha: "Jun 2025" },
    { hito: "Migración de 200 permisos adicionales", fecha: "Sep 2025" },
    { hito: "Alertas automáticas activas", fecha: "Nov 2025" },
  ]),
];

const ini006_F5_2025 = mkForm({
  id: "form_ini-006_F5_2025",
  initiative_id: "ini-006",
  form_type: "F5",
  status: "reviewed",
  ltp_period: "12-2025",
  created_by: "u10",
  created_at: "2025-10-15T10:00:00.000Z",
  submitted_at: "2025-12-10T10:00:00.000Z",
  updated_at: "2025-12-20T10:00:00.000Z",
});

const ini006_F5_2025_responses: FormResponse[] = [
  mkResp(ini006_F5_2025.id, "entregables_2025", [
    {
      entregable: "Carga 200 permisos críticos",
      responsable: "Carolina Vega",
      fecha: "Mar 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Sistema web tracking v1",
      responsable: "Carolina Vega",
      fecha: "Jun 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Migración 200 permisos adicionales",
      responsable: "Carolina Vega",
      fecha: "Sep 2025",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Alertas automáticas configuradas",
      responsable: "Carolina Vega",
      fecha: "Nov 2025",
      estado: "Completado",
      avance: "100%",
    },
  ]),
  mkResp(ini006_F5_2025.id, "indicadores_2025", [
    {
      indicador: "Permisos digitalizados",
      tipo: "Avance",
      baseline: "0",
      target: "400",
      actual: "400",
      trend: "✓",
    },
    {
      indicador: "Vencimientos detectados a tiempo",
      tipo: "Impacto",
      baseline: "60%",
      target: "98%",
      actual: "99%",
      trend: "↑",
    },
    {
      indicador: "Multas por vencimiento (USD)",
      tipo: "Resultado",
      baseline: "200K",
      target: "0",
      actual: "0",
      trend: "✓",
    },
    {
      indicador: "Tiempo de gestión por permiso (hrs)",
      tipo: "Resultado",
      baseline: "4 hrs",
      target: "1 hr",
      actual: "0.8 hrs",
      trend: "↑",
    },
  ]),
];

const ini006_F4_2026 = mkForm({
  id: "form_ini-006_F4_2026",
  initiative_id: "ini-006",
  form_type: "F4",
  status: "reviewed",
  ltp_period: "06-2026",
  created_by: "u10",
  created_at: "2026-02-01T10:00:00.000Z",
  submitted_at: "2026-03-15T10:00:00.000Z",
  updated_at: "2026-03-20T10:00:00.000Z",
});

const ini006_F4_2026_responses: FormResponse[] = [
  mkResp(ini006_F4_2026.id, "prioridades_2026", [
    "Escalar a todos los permisos (incluir operación downstream)",
    "Integrar con sistema de gestión documental corporativo",
    "Workflow de aprobación interna para renovaciones",
    "App mobile para inspectores de campo",
  ]),
  mkResp(
    ini006_F4_2026.id,
    "transformacion_2026",
    "Extensión a permisos de downstream (refinería, despacho, logística). Workflow digital de renovación: cuando un permiso está próximo a vencer, el sistema crea automáticamente un proceso de renovación asignado al responsable, con checklist de documentos y aprobaciones internas requeridas. App mobile para que inspectores de campo registren condiciones de cumplimiento directamente desde el terreno.",
  ),
  mkResp(ini006_F4_2026.id, "costos_2026", {
    capex: "USD 95K",
    opex: "USD 45K",
  }),
  mkResp(ini006_F4_2026.id, "impacto_2026", {
    permisos_gestionados: "De 400 a 420+ (incluye downstream)",
    tiempo_renovacion: "De 45 días a 12 días",
    adopcion_inspectores_mobile: "Target 80%",
  }),
  mkResp(ini006_F4_2026.id, "journey_2026", [
    { hito: "Migración permisos downstream", fecha: "Mar 2026" },
    { hito: "Workflow aprobación interna", fecha: "Jun 2026" },
    { hito: "Integración gestión documental", fecha: "Sep 2026" },
    { hito: "App mobile inspectores", fecha: "Nov 2026" },
  ]),
];

const ini006_F5_2026 = mkForm({
  id: "form_ini-006_F5_2026",
  initiative_id: "ini-006",
  form_type: "F5",
  status: "reviewed",
  ltp_period: "12-2026",
  created_by: "u10",
  created_at: "2026-03-20T10:00:00.000Z",
  submitted_at: "2026-04-10T10:00:00.000Z",
  updated_at: "2026-04-15T10:00:00.000Z",
});

const ini006_F5_2026_responses: FormResponse[] = [
  mkResp(ini006_F5_2026.id, "entregables_2026", [
    {
      entregable: "Migración permisos downstream",
      responsable: "Carolina Vega",
      fecha: "Mar 2026",
      estado: "Completado",
      avance: "100%",
    },
    {
      entregable: "Workflow aprobación renovaciones",
      responsable: "Carolina Vega",
      fecha: "Jun 2026",
      estado: "En curso",
      avance: "65%",
    },
    {
      entregable: "Integración gestión documental",
      responsable: "Carolina Vega",
      fecha: "Sep 2026",
      estado: "Planificado",
      avance: "—",
    },
    {
      entregable: "App mobile inspectores",
      responsable: "Carolina Vega",
      fecha: "Nov 2026",
      estado: "Planificado",
      avance: "—",
    },
  ]),
  mkResp(ini006_F5_2026.id, "indicadores_2026", [
    {
      indicador: "Permisos digitalizados",
      tipo: "Avance",
      baseline: "400",
      target: "420+",
      actual: "415",
      trend: "↑",
    },
    {
      indicador: "Tiempo renovación (días)",
      tipo: "Resultado",
      baseline: "45",
      target: "12",
      actual: "18",
      trend: "↑",
    },
    {
      indicador: "Adopción inspectores mobile",
      tipo: "Adopción",
      baseline: "0%",
      target: "80%",
      actual: "—",
      trend: "—",
    },
    {
      indicador: "Workflows activos",
      tipo: "Avance",
      baseline: "0",
      target: "50+",
      actual: "22",
      trend: "↑",
    },
  ]),
];

// ============================================================================
// INICIATIVA 7: Control de calidad con visión artificial
// IMPORTADA en Etapa 3 (no tiene F1/F2). G3 PENDIENTE — votos parciales.
// ============================================================================

const ini007: Initiative = {
  id: "ini-007",
  name: "Control de calidad con visión artificial",
  current_stage: "mvp",
  status: "in_progress",
  created_at: "2025-03-01T10:00:00.000Z",
  has_etapa1: false,
  has_etapa2: false,
  has_etapa3: true,
};

const ini007_members: InitiativeMember[] = [
  mkMember("u5", "ini-007", "po"),
  mkMember("u7", "ini-007", "bo"),
  mkMember("u7", "ini-007", "sponsor"),
  mkMember("u2", "ini-007", "ld"),
  mkMember("u9", "ini-007", "equipo"),
];

const ini007_F3 = mkForm({
  id: "form_ini-007_F3",
  initiative_id: "ini-007",
  form_type: "F3",
  status: "in_review",
  created_by: "u5",
  created_at: "2025-03-01T10:00:00.000Z",
  submitted_at: "2026-03-15T10:00:00.000Z",
  updated_at: "2026-03-15T10:00:00.000Z",
});

const ini007_F3_responses: FormResponse[] = [
  mkResp(ini007_F3.id, "info_general", {
    nombre: "Control de calidad con visión artificial",
    dimension: "Transformación",
    areas_involucradas:
      "Refinación, Control de Calidad, IT, Logística",
    tipo: "Resultado",
  }),
  mkResp(
    ini007_F3.id,
    "proposito",
    "Para los supervisores de calidad y operadores de la línea de despacho de refinería quienes necesitan detectar defectos en envases, etiquetado y sellado con mayor precisión que la inspección visual manual.\n\nEl sistema de control de calidad con visión artificial es una solución de cámaras industriales con algoritmos de detección de defectos.\n\nQue inspecciona el 100% de los productos despachados en tiempo real, detectando defectos de envase, etiquetado incorrecto y sellado deficiente con precisión superior al 99%.\n\nA diferencia de la inspección visual manual que tiene 8% de tasa de error y solo puede cubrir muestreo del 20% de la producción, nuestro producto cubre el 100% con menos del 2% de falsos positivos.",
  ),
  mkResp(ini007_F3.id, "descripcion_mvp", {
    descripcion:
      "Piloto en línea de despacho #3 de refinería con 4 cámaras industriales de alta velocidad y modelo de detección entrenado con 50,000 imágenes clasificadas. Cobertura: defectos de envase (abolladuras, deformaciones), etiquetado incorrecto (posición, legibilidad, código de barras), y sellado deficiente (tapas sueltas, sellado incompleto).",
    arquitectura:
      "Cámaras GigE Vision conectadas a PC industrial con GPU (NVIDIA T4), modelo YOLOv8 fine-tuned, interfaz de operador en pantalla táctil junto a la línea, integración con PLC de línea para rechazo automático.",
  }),
  mkResp(ini007_F3.id, "indicadores_medicion", [
    {
      indicador: "Tasa de detección de defectos",
      tipo: "Asertividad",
      baseline: "92%",
      target: "99%+",
      resultado: "98.7%",
    },
    {
      indicador: "Falsos positivos",
      tipo: "Asertividad",
      baseline: "N/A",
      target: "<2%",
      resultado: "1.8%",
    },
    {
      indicador: "Cobertura de inspección",
      tipo: "Adopción",
      baseline: "20% (muestreo)",
      target: "100%",
      resultado: "100%",
    },
    {
      indicador: "Throughput de línea",
      tipo: "Impacto",
      baseline: "1,200 u/hora",
      target: "Sin reducción",
      resultado: "Sin impacto",
    },
    {
      indicador: "Reclamos de clientes por defecto",
      tipo: "Resultado",
      baseline: "45/mes",
      target: "<20/mes",
      resultado: "18/mes",
    },
    {
      indicador: "Productos rechazados en destino",
      tipo: "Resultado",
      baseline: "2.1%",
      target: "<0.5%",
      resultado: "0.4%",
    },
  ]),
  mkResp(ini007_F3.id, "resultados_esperados_vs_obtenidos", [
    {
      aspecto: "Detección de defectos",
      esperado: "99%+",
      obtenido: "98.7%",
      evaluacion: "Cercano al target, mejorable con más datos",
    },
    {
      aspecto: "Falsos positivos",
      esperado: "<2%",
      obtenido: "1.8%",
      evaluacion: "Dentro del target",
    },
    {
      aspecto: "Impacto en throughput",
      esperado: "Cero",
      obtenido: "Cero",
      evaluacion: "Logrado",
    },
    {
      aspecto: "Reducción reclamos",
      esperado: "-55%",
      obtenido: "-60%",
      evaluacion: "Superado",
    },
    {
      aspecto: "Ahorro en producto defectuoso",
      esperado: "USD 180K/año",
      obtenido: "USD 195K/año (proyectado)",
      evaluacion: "Superado",
    },
    {
      aspecto: "Tiempo de implementación",
      esperado: "4 meses",
      obtenido: "5.5 meses",
      evaluacion: "Demorado por integración PLC",
    },
    {
      aspecto: "Costo de implementación",
      esperado: "USD 150K",
      obtenido: "USD 172K",
      evaluacion: "Sobre-presupuesto por PLC",
    },
  ]),
  mkResp(ini007_F3.id, "aprendizajes_y_bloqueantes", [
    "El modelo requiere recalibración mensual por cambios estacionales en la iluminación de la planta. Se automatizó con pipeline de reentrenamiento incremental.",
    "La integración con el PLC de la línea fue más compleja de lo estimado (+3 semanas) porque era un modelo legacy sin protocolo estándar. Se desarrolló un adaptador custom.",
    'Los operadores inicialmente desconfiaban del sistema. Se resolvió con 2 semanas de operación en modo "sugerencia" (sin rechazo automático) para que vieran la precisión.',
    "El proveedor de cámaras tuvo demora de 3 semanas en la entrega por faltante de stock del modelo seleccionado.",
  ]),
  mkResp(
    ini007_F3.id,
    "conclusiones",
    "El MVP demostró viabilidad técnica y económica. La tasa de detección de 98.7% es aceptable para producción y se espera superar 99% con el siguiente ciclo de reentrenamiento. El ROI proyectado es de 1.13x en el primer año solo con ahorro en producto defectuoso, sin contar el valor de la reducción de reclamos de clientes y la mejora reputacional. Se recomienda avanzar a rollout en las 4 líneas de despacho restantes.",
  ),
  mkResp(ini007_F3.id, "equipo", [
    {
      rol: "Product Owner",
      nombre: "Fernando Álvarez",
      asignacion: "50%",
    },
    {
      rol: "ML Engineer",
      nombre: "Externo (consultoría)",
      asignacion: "100%",
    },
    {
      rol: "Ingeniero de Automatización",
      nombre: "Externo (Siemens)",
      asignacion: "60%",
    },
    {
      rol: "Supervisor Calidad",
      nombre: "Por definir",
      asignacion: "30%",
    },
  ]),
  mkResp(ini007_F3.id, "costos_mvp", {
    capex:
      "USD 172K (4 cámaras USD 48K, PC industrial + GPU USD 35K, instalación USD 40K, desarrollo software USD 49K)",
    opex: "USD 25K/año (mantenimiento, licencias, recalibración)",
  }),
  mkResp(ini007_F3.id, "impacto_economico", [
    {
      corriente: "OPEX",
      beneficio: "-195K/año en producto defectuoso rechazado en destino",
    },
    { corriente: "PRODUCTIVIDAD", beneficio: "-800 HH/año en inspección manual" },
    {
      corriente: "INTANGIBLE",
      beneficio: "Reducción reclamos de clientes, mejora reputacional",
    },
  ]),
  mkResp(ini007_F3.id, "corrientes_5_anios", [
    {
      corriente: "OPEX ahorro (USD)",
      anio_1: "-195K",
      anio_2: "-650K",
      anio_3: "-700K",
      anio_4: "-700K",
      anio_5: "-700K",
    },
    {
      corriente: "HH ahorro",
      anio_1: "-800",
      anio_2: "-2,500",
      anio_3: "-2,800",
      anio_4: "-2,800",
      anio_5: "-2,800",
    },
  ]),
];

const ini007_G3 = mkGateway({
  initiative_id: "ini-007",
  form_id: ini007_F3.id,
  gateway_number: 3,
  status: "pending",
});

// Solo Roberto Méndez votó (per doc) — restan 3 aprobadores
const ini007_G3_votes: GatewayVote[] = [
  mkVote(ini007_G3.id, "u1", "approved", "Avanzar a rollout. Buena ejecución del MVP."),
];

// ============================================================================
// INICIATIVA 8: Dashboard ejecutivo de operaciones
// IMPORTADA directo a LTP (sin F1/F2/F3). Solo F4 2026 reviewed. F5 PENDIENTE.
// ============================================================================

const ini008: Initiative = {
  id: "ini-008",
  name: "Dashboard ejecutivo de operaciones",
  current_stage: "ltp_tracking",
  status: "in_progress",
  created_at: "2025-10-01T10:00:00.000Z",
  has_etapa1: false,
  has_etapa2: false,
  has_etapa3: false,
};

const ini008_members: InitiativeMember[] = [
  mkMember("u8", "ini-008", "po"),
  mkMember("u1", "ini-008", "bo"),
  mkMember("u1", "ini-008", "sponsor"),
  mkMember("u7", "ini-008", "equipo"),
  mkMember("u2", "ini-008", "ld"),
  mkMember("u9", "ini-008", "equipo"),
];

const ini008_F4_2026 = mkForm({
  id: "form_ini-008_F4_2026",
  initiative_id: "ini-008",
  form_type: "F4",
  status: "reviewed",
  ltp_period: "06-2026",
  created_by: "u8",
  created_at: "2025-12-01T10:00:00.000Z",
  submitted_at: "2026-02-15T10:00:00.000Z",
  updated_at: "2026-02-20T10:00:00.000Z",
});

const ini008_F4_2026_responses: FormResponse[] = [
  mkResp(ini008_F4_2026.id, "info_general", {
    nombre: "Dashboard ejecutivo de operaciones",
    dimension: "Data & Analytics",
    areas_involucradas:
      "Dirección Upstream, Dirección Transformación, Supply Chain, Seguridad, Sustentabilidad",
    tipo: "Habilitadora",
  }),
  mkResp(
    ini008_F4_2026.id,
    "proposito",
    "Para la mesa de VPs y gerentes de área quienes necesitan una visión consolidada y en tiempo real del estado operativo de PAE para tomar decisiones estratégicas.\n\nEl dashboard ejecutivo es una plataforma web de visualización que unifica KPIs de producción, costos, seguridad y sustentabilidad.\n\nQue consolida en una vista única y actualizada diariamente la información que hoy se genera en +15 reportes Excel mensuales preparados manualmente por distintas áreas.\n\nA diferencia del proceso actual donde cada VP recibe reportes distintos en formatos distintos con datos de hace 2-4 semanas, nuestro producto ofrece datos frescos (D-1) en un formato unificado y navegable.",
  ),
  mkResp(ini008_F4_2026.id, "necesidad_oportunidad", [
    {
      stakeholder: "Usuario (VP Upstream)",
      dolor: "Recibe 8 reportes Excel mensuales que no son comparables",
      metrica: "Reportes manuales que recibe/mes",
      dato_inicio: "8",
      target: "1 (dashboard)",
      prioridad: "Alta",
    },
    {
      stakeholder: "Usuario (VP Transformación)",
      dolor: "Datos del reporte mensual con 3-4 semanas de antigüedad",
      metrica: "Antigüedad de datos en reportes",
      dato_inicio: "3-4 semanas",
      target: "D-1 (ayer)",
      prioridad: "Alta",
    },
    {
      stakeholder: "Interesado (Analistas)",
      dolor: "60% del tiempo en consolidación vs análisis",
      metrica: "% tiempo en consolidación vs análisis",
      dato_inicio: "60/40",
      target: "20/80",
      prioridad: "Alta",
    },
    {
      stakeholder: "Interesado (Supply Chain)",
      dolor: "No tiene visibilidad del impacto de producción en cadena",
      metrica: "Indicadores de producción visibles para Supply Chain",
      dato_inicio: "0",
      target: "10+",
      prioridad: "Media",
    },
    {
      stakeholder: "Sponsor (VP Upstream)",
      dolor: "Reuniones con datos que nadie confía al 100%",
      metrica: "Nivel de confianza en datos (encuesta)",
      dato_inicio: "3.2/5",
      target: "4.5/5",
      prioridad: "Alta",
    },
    {
      stakeholder: "Sponsor (VP Upstream)",
      dolor: "Imposible hacer drill-down cuando un número no cierra",
      metrica: "Capacidad de drill-down por área/VP",
      dato_inicio: "No existe",
      target: "Hasta nivel de instalación",
      prioridad: "Alta",
    },
  ]),
  mkResp(ini008_F4_2026.id, "prioridades_2026", [
    "Consolidar los KPIs más críticos de las 5 dimensiones en una vista única",
    "Datos actualizados D-1 (no mensual)",
    "Drill-down por VP, área, dimensión, instalación",
    "Exportable a PPT para reuniones de directorio",
  ]),
  mkResp(ini008_F4_2026.id, "transformacion_2026", {
    descripcion:
      "Dashboard web con 4 módulos: (1) Producción: producción diaria por área, acumulado vs target, split por pozo/instalación; (2) Costos: OPEX/CAPEX ejecutado vs presupuesto, desvíos, proyección año; (3) Seguridad: incidentes, días sin accidentes, indicadores líderes/rezagados; (4) Sustentabilidad: emisiones, permisos, consumo energético, residuos. Cada módulo permite drill-down desde nivel corporativo hasta nivel de instalación. Exportación a PPTX con un click para reuniones de dirección.",
    fuentes:
      "Plataforma de datos de producción (ini-005) como fuente principal. SAP FI para datos financieros. Sistema de gestión de seguridad para indicadores HSE. Sistema de permisos (ini-006) para sustentabilidad.",
  }),
  mkResp(ini008_F4_2026.id, "planificacion_2026_equipo", [
    { rol: "Product Owner", nombre: "Sofía Romero", asignacion: "60%" },
    { rol: "Data Engineer", nombre: "Pablo Díaz", asignacion: "30%" },
    {
      rol: "Desarrollador Frontend Senior",
      nombre: "Por definir (contratación)",
      asignacion: "100%",
    },
    {
      rol: "Desarrollador Frontend Junior",
      nombre: "Por definir (contratación)",
      asignacion: "100%",
    },
    { rol: "Diseñador UX", nombre: "Externo (consultoría)", asignacion: "40%" },
  ]),
  mkResp(ini008_F4_2026.id, "consideraciones_digitales", {
    tipo_solucion:
      "App web React con backend Node.js/Express, conectado al data lake de ini-005 vía APIs. Visualizaciones con D3.js/Recharts.",
    desafios:
      "La calidad de datos varía por fuente — el dashboard no puede ser mejor que sus datos de entrada. Dependencia crítica de ini-005 para datos de producción.",
    integracion: "APIs del data lake (ini-005) + SAP FI REST API + sistema HSE (por definir conector).",
    seguridad:
      "Solo accesible desde red interna, autenticación SSO, permisos por VP (cada uno ve solo sus datos + datos corporativos).",
  }),
  mkResp(ini008_F4_2026.id, "interdependencias", [
    {
      iniciativa_sistema: "Plataforma de datos (ini-005)",
      referente: "Pablo Díaz",
    },
    { iniciativa_sistema: "SAP FI", referente: "Área de Finanzas (por definir)" },
    {
      iniciativa_sistema: "Sistema HSE",
      referente: "Seguridad Industrial (por definir)",
    },
    {
      iniciativa_sistema: "Permisos ambientales (ini-006)",
      referente: "Carolina Vega",
    },
  ]),
  mkResp(ini008_F4_2026.id, "desafios_riesgos", [
    {
      riesgo: "ini-005 no tiene datos downstream a tiempo",
      accion: "Coordinar con Pablo Díaz timeline de integración",
      resultado_esperado: "Datos downstream disponibles Sep 2026",
      fecha: "Mar 2026",
      responsable: "Sofía Romero",
    },
    {
      riesgo: "VPs tienen expectativas distintas de KPIs",
      accion: "Workshop de definición de KPIs con cada VP",
      resultado_esperado: "Consenso en top 20 KPIs",
      fecha: "Feb 2026",
      responsable: "Sofía Romero",
    },
    {
      riesgo: "Conector SAP FI no existe",
      accion: "Evaluar opciones (API SAP, extracción batch)",
      resultado_esperado: "Decisión técnica documentada",
      fecha: "Mar 2026",
      responsable: "Pablo Díaz",
    },
    {
      riesgo: "Adopción baja si UX no es intuitiva",
      accion: "Prototipo con usuarios antes de desarrollo",
      resultado_esperado: "Validación UX con 5 usuarios",
      fecha: "Abr 2026",
      responsable: "Externo UX",
    },
  ]),
  mkResp(ini008_F4_2026.id, "journey_2026", [
    { hito: "Workshop KPIs con VPs", fecha: "Feb 2026" },
    { hito: "Prototipo UX validado con usuarios", fecha: "Abr 2026" },
    { hito: "Módulo Producción v1 (datos upstream)", fecha: "Jun 2026" },
    { hito: "Módulo Costos v1 (SAP FI integrado)", fecha: "Ago 2026" },
    { hito: "Módulo Seguridad v1", fecha: "Oct 2026" },
    { hito: "Módulo Sustentabilidad v1", fecha: "Nov 2026" },
    { hito: "Dashboard completo en producción", fecha: "Dic 2026" },
  ]),
  mkResp(ini008_F4_2026.id, "costos_2026", {
    capex: [
      {
        subcategoria: "Desarrollo",
        erogacion: "110,000",
        detalle: "2 desarrolladores + PO + diseño UX",
      },
      {
        subcategoria: "Infraestructura",
        erogacion: "25,000",
        detalle: "Servidores, base de datos cache",
      },
      {
        subcategoria: "Consultoría UX",
        erogacion: "15,000",
        detalle: "Diseño de interface y validación",
      },
      { subcategoria: "Total CAPEX", erogacion: "150,000", detalle: "" },
    ],
    opex: [
      {
        subcategoria: "Hosting y base de datos",
        erogacion: "20,000/año",
        detalle: "Servidores internos PAE",
      },
      {
        subcategoria: "Licencias visualización",
        erogacion: "15,000/año",
        detalle: "Librería de gráficos premium",
      },
      {
        subcategoria: "Soporte y mantenimiento",
        erogacion: "10,000/año",
        detalle: "Bug fixes, actualizaciones",
      },
      { subcategoria: "Total OPEX", erogacion: "45,000/año", detalle: "" },
    ],
  }),
  mkResp(ini008_F4_2026.id, "impacto_2026", [
    {
      corriente: "HH",
      beneficio: "-2,400 HH/año en consolidación manual de 15 reportes",
    },
    {
      corriente: "INTANGIBLE",
      beneficio: "Decisiones en tiempo real (de datos de hace 30 días a datos de ayer)",
    },
    {
      corriente: "INTANGIBLE",
      beneficio: "Confianza en datos (una fuente única vs múltiples Excel)",
    },
    {
      corriente: "INTANGIBLE",
      beneficio: 'Agilidad en reuniones (drill-down vs "lo chequeo y te confirmo")',
    },
  ]),
  mkResp(ini008_F4_2026.id, "corrientes_5_anios", [
    {
      corriente: "HH ahorro",
      anio_2026: "-1,200",
      anio_2027: "-2,400",
      anio_2028: "-2,400",
      anio_2029: "-2,400",
      anio_2030: "-2,400",
    },
  ]),
];

// ============================================================================
// NOTIFICACIONES (algunas pendientes para mostrar en UI)
// ============================================================================

const notifications: Notification[] = [
  mkNotif({
    id: "notif_001",
    user_id: "u7",
    type: "gateway_vote_pending",
    title: "Tu voto pendiente",
    message: "Hay un Gateway 3 esperando tu voto en 'Control de calidad con visión artificial'",
    initiative_id: "ini-007",
    read: false,
    created_at: "2026-03-15T10:00:00.000Z",
  }),
  mkNotif({
    id: "notif_002",
    user_id: "u5",
    type: "gateway_vote_pending",
    title: "Tu voto pendiente",
    message: "Hay un Gateway 3 esperando tu voto en 'Control de calidad con visión artificial'",
    initiative_id: "ini-007",
    read: false,
    created_at: "2026-03-15T10:00:00.000Z",
  }),
  mkNotif({
    id: "notif_003",
    user_id: "u2",
    type: "gateway_vote_pending",
    title: "Tu voto pendiente",
    message: "Hay un Gateway 3 esperando tu voto en 'Control de calidad con visión artificial'",
    initiative_id: "ini-007",
    read: false,
    created_at: "2026-03-15T10:00:00.000Z",
  }),
  mkNotif({
    id: "notif_004",
    user_id: "u9",
    type: "gateway_vote_pending",
    title: "Tu voto pendiente",
    message: "Hay un Gateway 3 esperando tu voto en 'Control de calidad con visión artificial'",
    initiative_id: "ini-007",
    read: false,
    created_at: "2026-03-15T10:00:00.000Z",
  }),
];

// ============================================================================
// DOCUMENTOS (referenciados en la estructura de carpetas del doc)
// ============================================================================

const documents: Document[] = [
  // ini-007 — archivos en /Etapa 3/
  {
    id: "doc_ini-007_etapa3_xlsx",
    initiative_id: "ini-007",
    document_type: "formulario_xlsx",
    file_path:
      "/Iniciativas/Control de calidad con vision artificial/Etapa 3/ETAPA_3_formulario.xlsx",
    stage: "mvp",
    ltp_period: null,
    generated_by: "u5",
    created_at: "2026-03-15T10:00:00.000Z",
  },
  {
    id: "doc_ini-007_etapa3_pdf",
    initiative_id: "ini-007",
    document_type: "formulario_pdf",
    file_path:
      "/Iniciativas/Control de calidad con vision artificial/Etapa 3/ETAPA_3_formulario.pdf",
    stage: "mvp",
    ltp_period: null,
    generated_by: "u5",
    created_at: "2026-03-15T10:00:00.000Z",
  },
];

// ============================================================================
// ASSEMBLER
// ============================================================================

export function getSeedData(): SeedData {
  return {
    users,
    initiatives: [
      ini001,
      ini002,
      ini003,
      ini004,
      ini005,
      ini006,
      ini007,
      ini008,
    ],
    initiative_members: [
      ...ini001_members,
      ...ini002_members,
      ...ini003_members,
      ...ini004_members,
      ...ini005_members,
      ...ini006_members,
      ...ini007_members,
      ...ini008_members,
    ],
    initiative_folders: [],
    form_definitions: [],
    forms: [
      ini001_F1,
      ini001_F2,
      ini002_F1,
      ini002_F2,
      ini002_F3,
      ini003_F1,
      ini003_F2,
      ini003_F3,
      ini003_F4_2026,
      ini004_F1,
      ini004_F2,
      ini004_F3,
      ini004_F4_2025,
      ini004_F5_2025,
      ini004_F4_2026,
      ini004_F5_2026,
      ini005_F1,
      ini005_F2,
      ini005_F3,
      ini005_F4_2025,
      ini005_F5_2025,
      ini005_F4_2026,
      ini005_F5_2026,
      ini006_F4_2025,
      ini006_F5_2025,
      ini006_F4_2026,
      ini006_F5_2026,
      ini007_F3,
      ini008_F4_2026,
    ],
    form_responses: [
      ...ini001_F1_responses,
      ...ini001_F2_responses,
      ...ini002_F1_responses,
      ...ini002_F2_responses,
      ...ini002_F3_responses,
      ...ini003_F1_responses,
      ...ini003_F2_responses,
      ...ini003_F3_responses,
      ...ini003_F4_2026_responses,
      ...ini004_F1_responses,
      ...ini004_F3_responses,
      ...ini004_F4_2025_responses,
      ...ini004_F5_2025_responses,
      ...ini004_F4_2026_responses,
      ...ini004_F5_2026_responses,
      ...ini005_F1_responses,
      ...ini005_F3_responses,
      ...ini005_F4_2025_responses,
      ...ini005_F5_2025_responses,
      ...ini005_F4_2026_responses,
      ...ini005_F5_2026_responses,
      ...ini006_F4_2025_responses,
      ...ini006_F5_2025_responses,
      ...ini006_F4_2026_responses,
      ...ini006_F5_2026_responses,
      ...ini007_F3_responses,
      ...ini008_F4_2026_responses,
    ],
    form_change_log: [],
    form_snapshots: [],
    gateways: [
      ini001_G1,
      ini002_G1,
      ini002_G2,
      ini003_G1,
      ini003_G2,
      ini003_G3,
      ini004_G1,
      ini004_G2,
      ini004_G3,
      ini005_G1,
      ini005_G2,
      ini005_G3,
      ini007_G3,
    ],
    gateway_votes: [
      ...ini001_G1_votes,
      ...ini002_G1_votes,
      ...ini002_G2_votes,
      ...ini003_G1_votes,
      ...ini003_G2_votes,
      ...ini003_G3_votes,
      ...ini004_G1_votes,
      ...ini004_G2_votes,
      ...ini004_G3_votes,
      ...ini005_G1_votes,
      ...ini005_G2_votes,
      ...ini005_G3_votes,
      ...ini007_G3_votes,
    ],
    notifications,
    documents,
    file_uploads: [],
    audit_log: [],
    default_user_id: "u3", // Juan García (PO en ini-001 y ini-004) — usuario por defecto al abrir
  };
}
