import type { InitiativeSummary } from "@/types";

const ini001: InitiativeSummary = {
  initiative_id: "ini-001",
  purpose:
    "Para los ingenieros de producción del área Norte quienes necesitan anticipar la declinación de pozos maduros y optimizar el timing de intervenciones. Plataforma de monitoreo y predicción basada en modelos de ML que predice el comportamiento de producción con 30 días de anticipación y recomienda intervenciones óptimas, reduciendo el tiempo de decisión de 5 días a 4 horas.",
  value_streams_5y: [
    { stream: "Producción (m3)", year_1: "+2,400", year_3: "+8,000", year_5: "+45,000" },
    { stream: "OPEX (USD)", year_1: "-120K", year_3: "-450K", year_5: "-900K" },
    { stream: "CAPEX (USD)", year_1: "N/A", year_3: "N/A", year_5: "N/A" },
    { stream: "HH", year_1: "800", year_3: "2,400", year_5: "6,000" },
  ],
  impact_indicators: [
    {
      indicator: "Tiempo de análisis por pozo",
      baseline: "5 días",
      target: "4 horas",
      actual: null,
      priority: "Alta",
    },
    {
      indicator: "Intervenciones no planif.",
      baseline: "12/mes",
      target: "4/mes",
      actual: null,
      priority: "Media",
    },
    {
      indicator: "Producción incremental área Norte",
      baseline: "Base",
      target: "+8,000 m3/año",
      actual: null,
      priority: "Alta",
    },
    {
      indicator: "ROI por intervención",
      baseline: "2.1x",
      target: ">5x",
      actual: null,
      priority: "Alta",
    },
  ],
  challenges: [
    "Resistencia ingenieros senior → validación 6 meses en paralelo",
    "Calidad datos históricos pre-2018 → limpieza y validación",
    "Conectividad en campo → instalación antenas satelitales en 3 pozos",
    "Integración con flujo actual de planificación de intervenciones",
  ],
  interdependencies: [
    {
      initiative_id: "ini-002",
      label: "Monitoreo remoto",
      ref_note: "Provee datos IoT en tiempo real para modelos ML",
    },
    {
      initiative_id: "ini-005",
      label: "Plataforma de datos",
      ref_note: "Data lake con datos históricos estandarizados",
    },
    {
      initiative_id: null,
      label: "ERP SAP",
      ref_note: "Costos de intervención para cálculo de ROI",
    },
  ],
  deliverables: [],
  adoption_indicators: [],
  budget_opex: [],
  budget_capex: [],
};

const ini002: InitiativeSummary = {
  initiative_id: "ini-002",
  purpose:
    "Para operadores de campo y supervisores del área Norte que necesitan monitorear variables críticas sin desplazarse. Red de sensores IoT con plataforma centralizada que visualiza en tiempo real presión, temperatura, caudal y nivel en +50 instalaciones, con detección de anomalías en menos de 15 minutos vs 4-8 horas de las rondas manuales.",
  value_streams_5y: [
    { stream: "Producción (m3)", year_1: "+4,000", year_3: "+12,000", year_5: "+15,000" },
    { stream: "OPEX (USD)", year_1: "-300K", year_3: "-800K", year_5: "-900K" },
    { stream: "CAPEX (USD)", year_1: "-420K", year_3: "N/A", year_5: "N/A" },
    { stream: "HH", year_1: "1,200", year_3: "3,500", year_5: "4,000" },
  ],
  impact_indicators: [
    {
      indicator: "Cobertura de monitoreo",
      baseline: "30%",
      target: "100%",
      actual: "65%",
      priority: "Alta",
    },
    {
      indicator: "Tiempo detección falla",
      baseline: "4-8 horas",
      target: "<15 min",
      actual: "12 min",
      priority: "Alta",
    },
    {
      indicator: "Horas parada no programada",
      baseline: "480 hrs/año",
      target: "<120 hrs/año",
      actual: "240 hrs/año",
      priority: "Alta",
    },
    {
      indicator: "Costo correctivo por falla",
      baseline: "USD 45K",
      target: "USD 12K",
      actual: "USD 28K",
      priority: "Media",
    },
  ],
  challenges: [
    "Percepción operadores como amenaza a puestos → comunicación que libera tiempo",
    "Conectividad en zonas remotas → mix celular/satelital (Starlink)",
    "Confiabilidad sensores a -15°C y +100 km/h → equipos IP67+",
    "Fatiga de alertas → capacitación en interpretación",
  ],
  interdependencies: [
    {
      initiative_id: "ini-001",
      label: "Optimización predictiva",
      ref_note: "Consume datos de sensores para modelos ML",
    },
    {
      initiative_id: "ini-005",
      label: "Plataforma de datos",
      ref_note: "Data lake corporativo almacena datos de sensores",
    },
    {
      initiative_id: null,
      label: "Proveedor conectividad",
      ref_note: "Contrato red celular/satelital en zona de operación",
    },
  ],
  deliverables: [],
  adoption_indicators: [],
  budget_opex: [],
  budget_capex: [],
};

const ini003: InitiativeSummary = {
  initiative_id: "ini-003",
  purpose:
    "Para ingenieros de integridad y equipo de mantenimiento que necesitan gestionar +800 km de ductos de manera centralizada y trazable. Plataforma web que centraliza datos de inspección, corrosión y anomalías, permitiendo visualizar el estado de cada tramo, priorizar intervenciones por riesgo y mantener trazabilidad completa vs las planillas Excel dispersas actuales.",
  value_streams_5y: [
    { stream: "Producción (m3)", year_1: "+500", year_3: "+950", year_5: "+1,200" },
    { stream: "OPEX (USD)", year_1: "-180K", year_3: "-350K", year_5: "-420K" },
    { stream: "CAPEX (USD)", year_1: "-600K", year_3: "-1.2M", year_5: "-1.5M" },
    { stream: "HH", year_1: "900", year_3: "1,800", year_5: "2,200" },
  ],
  impact_indicators: [
    {
      indicator: "Tiempo consolidación trimestral",
      baseline: "2 semanas",
      target: "1 día",
      actual: "2 horas",
      priority: "Alta",
    },
    {
      indicator: "Fugas por corrosión no anticipada",
      baseline: "2/año",
      target: "0",
      actual: "0",
      priority: "Alta",
    },
    {
      indicator: "Inspecciones vencidas",
      baseline: "8%",
      target: "0%",
      actual: "0%",
      priority: "Alta",
    },
    {
      indicator: "Reemplazos de emergencia",
      baseline: "4 tramos/año",
      target: "1 tramo/año",
      actual: "1 tramo/año",
      priority: "Alta",
    },
  ],
  challenges: [
    "Migración datos históricos con gaps → data entry temporal 2 meses",
    "Integración ArcGIS Server requiere licencia (USD 25K/año)",
    "Variabilidad de criterios de inspección entre áreas",
  ],
  interdependencies: [
    {
      initiative_id: "ini-001",
      label: "Optim. predictiva",
      ref_note: "Reutilización de framework ML para modelo predictivo de corrosión",
    },
    {
      initiative_id: null,
      label: "Sistema GIS corporativo",
      ref_note: "Geolocalización de ductos",
    },
    {
      initiative_id: null,
      label: "SAP PM",
      ref_note: "Órdenes de mantenimiento",
    },
  ],
  deliverables: [
    {
      name: "Migración datos 350 km restantes área Norte",
      responsible: "Lucía Martínez",
      quarter: "Q1",
      status: "En curso",
      progress: "70%",
    },
    {
      name: "Modelo predictivo de corrosión v1",
      responsible: "Pablo Díaz",
      quarter: "Q2",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Integración GIS",
      responsible: "Lucía Martínez",
      quarter: "Q3",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "App mobile para inspectores",
      responsible: "Por definir",
      quarter: "Q4",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Migración datos áreas Central y Sur",
      responsible: "Lucía Martínez",
      quarter: "Q4",
      status: "Planificado",
      progress: "—",
    },
  ],
  adoption_indicators: [
    {
      indicator: "Km de ductos digitalizados",
      type: "Avance",
      baseline: "100",
      target: "800",
      actual: "350",
      trend: "up",
    },
    {
      indicator: "Inspectores con app mobile",
      type: "Adopción",
      baseline: "0",
      target: "45",
      actual: "—",
      trend: "flat",
    },
    {
      indicator: "Fugas no anticipadas",
      type: "Impacto",
      baseline: "2/año",
      target: "0",
      actual: "0",
      trend: "done",
    },
    {
      indicator: "Precisión modelo corrosión",
      type: "Asertividad",
      baseline: "—",
      target: "85%",
      actual: "—",
      trend: "flat",
    },
  ],
  budget_opex: [
    { subcategory: "Licencias ArcGIS", amount: "USD 25K/año", detail: "GIS Server" },
    { subcategory: "Hosting y mantenimiento", amount: "USD 40K/año", detail: "Infra + soporte" },
  ],
  budget_capex: [
    { subcategory: "Desarrollo 2026", amount: "USD 180K", detail: "Modelo corrosión + GIS + mobile" },
    { subcategory: "Data entry temporal", amount: "USD 35K", detail: "Migración 700 km" },
  ],
};

const ini004: InitiativeSummary = {
  initiative_id: "ini-004",
  purpose:
    "Para operadores de bombeo y supervisores que necesitan optimizar +300 bombas de extracción que hoy se ajustan manualmente cada 2-4 semanas. Plataforma de control basada en PLCs inteligentes y algoritmos de optimización que ajusta parámetros (velocidad, presión, ciclos) en tiempo real minimizando consumo energético y maximizando producción 24/7.",
  value_streams_5y: [
    { stream: "Producción (m3)", year_1: "+2,800", year_3: "+5,200", year_5: "+5,500" },
    { stream: "OPEX (USD)", year_1: "-1.5M", year_3: "-3.1M", year_5: "-3.3M" },
    { stream: "CAPEX (USD)", year_1: "-280K", year_3: "N/A", year_5: "N/A" },
    { stream: "HH", year_1: "3,200", year_3: "4,200", year_5: "4,500" },
  ],
  impact_indicators: [
    {
      indicator: "Bombas automatizadas",
      baseline: "30",
      target: "200",
      actual: "100",
      priority: "Alta",
    },
    {
      indicator: "Consumo energético vs manual",
      baseline: "Base",
      target: "-20%",
      actual: "-23%",
      priority: "Alta",
    },
    {
      indicator: "Producción incremental",
      baseline: "+1,800 m3",
      target: "+3,200 m3",
      actual: "+3,400 m3",
      priority: "Alta",
    },
    {
      indicator: "Intervenciones mantenimiento",
      baseline: "18/mes",
      target: "10/mes",
      actual: "9/mes",
      priority: "Media",
    },
  ],
  challenges: [
    "Coordinación con IT para actualización SCADA central",
    "Variabilidad de condiciones entre áreas Norte/Central/Sur",
    "Dependencia de proveedor Siemens para PLCs",
    "Capacitación operadores en supervisión de sistema automatizado",
  ],
  interdependencies: [
    {
      initiative_id: "ini-002",
      label: "Monitoreo remoto",
      ref_note: "Datos en tiempo real de instalaciones relacionadas",
    },
    {
      initiative_id: null,
      label: "SCADA central",
      ref_note: "Actualización requerida para integración",
    },
  ],
  deliverables: [
    {
      name: "Rollout lote 4 (25 bombas área Central)",
      responsible: "Juan García",
      quarter: "Q1",
      status: "En curso",
      progress: "60%",
    },
    {
      name: "Integración SCADA central",
      responsible: "Por definir",
      quarter: "Q2",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Rollout lote 5 (25 bombas)",
      responsible: "Juan García",
      quarter: "Q3",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Módulo optimización multi-pozo v1",
      responsible: "Pablo Díaz",
      quarter: "Q3",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Rollout lote 6 (25 bombas área Sur)",
      responsible: "Juan García",
      quarter: "Q4",
      status: "Planificado",
      progress: "—",
    },
  ],
  adoption_indicators: [
    {
      indicator: "Bombas automatizadas",
      type: "Avance",
      baseline: "100",
      target: "200",
      actual: "125",
      trend: "up",
    },
    {
      indicator: "Producción incr. (m3)",
      type: "Resultado",
      baseline: "+1,800",
      target: "+3,200",
      actual: "+3,400",
      trend: "up",
    },
    {
      indicator: "Consumo energético",
      type: "Impacto",
      baseline: "Base",
      target: "-20%",
      actual: "-23%",
      trend: "up",
    },
    {
      indicator: "Uptime sistema automatizado",
      type: "Adopción",
      baseline: "—",
      target: ">98%",
      actual: "99.2%",
      trend: "flat",
    },
  ],
  budget_opex: [
    {
      subcategory: "Licencias Siemens",
      amount: "USD 55K/año",
      detail: "Software de control de PLCs",
    },
    { subcategory: "Soporte", amount: "USD 25K/año", detail: "Soporte Siemens" },
    {
      subcategory: "Conectividad áreas nuevas",
      amount: "USD 15K/año",
      detail: "Central + Sur",
    },
  ],
  budget_capex: [
    {
      subcategory: "PLCs e instalación",
      amount: "USD 280K",
      detail: "100 PLCs áreas Central/Sur",
    },
  ],
};

const ini005: InitiativeSummary = {
  initiative_id: "ini-005",
  purpose:
    "Para todos los equipos técnicos de Upstream que necesitan acceder a datos de producción confiables, estandarizados y actualizados. Data lake con capa de gobernanza, APIs estandarizadas y catálogo de datos que unifica todas las fuentes (SCADA, PI, SAP, mediciones manuales) en un único punto de acceso con calidad garantizada, eliminando las +40 planillas Excel intermedias.",
  value_streams_5y: [
    { stream: "Producción (m3)", year_1: "Indirecto", year_3: "Indirecto", year_5: "Indirecto" },
    { stream: "OPEX (USD)", year_1: "-150K", year_3: "-200K", year_5: "-250K" },
    { stream: "CAPEX (USD)", year_1: "-180K", year_3: "N/A", year_5: "N/A" },
    { stream: "HH", year_1: "1,800", year_3: "3,000", year_5: "3,500" },
  ],
  impact_indicators: [
    {
      indicator: "Tiempo preparación datos",
      baseline: "2-3 días",
      target: "<2 hs",
      actual: "45 min",
      priority: "Alta",
    },
    {
      indicator: "Discrepancia entre fuentes",
      baseline: "15-20%",
      target: "<1%",
      actual: "2%",
      priority: "Alta",
    },
    {
      indicator: "Datasets catalogados",
      baseline: "0",
      target: "250",
      actual: "210",
      priority: "Media",
    },
    {
      indicator: "Iniciativas analytics bloqueadas",
      baseline: "4",
      target: "0",
      actual: "0",
      priority: "Alta",
    },
  ],
  challenges: [
    "Integrar datos downstream (refinería) con formatos distintos",
    "Onboarding nuevas fuentes: reducir de 15 a 3 días",
    "Data quality automático con ML requiere entrenamiento",
    "Gobernanza y ownership de datos en áreas dispersas",
  ],
  interdependencies: [
    {
      initiative_id: "ini-001",
      label: "Optim. predictiva",
      ref_note: "Consume datos históricos del data lake",
    },
    {
      initiative_id: "ini-002",
      label: "Monitoreo remoto",
      ref_note: "Datos de sensores se almacenan acá",
    },
    {
      initiative_id: "ini-008",
      label: "Dashboard ejecutivo",
      ref_note: "Fuente primaria de datos operativos",
    },
  ],
  deliverables: [
    {
      name: "SDK Python en repo interno",
      responsible: "Pablo Díaz",
      quarter: "Q1",
      status: "Completado",
      progress: "100%",
    },
    {
      name: "Data quality ML v2",
      responsible: "Pablo Díaz",
      quarter: "Q2",
      status: "En curso",
      progress: "70%",
    },
    {
      name: "Integración datos refinería",
      responsible: "Pablo Díaz",
      quarter: "Q3",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Catálogo v2 búsqueda inteligente",
      responsible: "Pablo Díaz",
      quarter: "Q4",
      status: "Planificado",
      progress: "—",
    },
  ],
  adoption_indicators: [
    {
      indicator: "Datasets disponibles",
      type: "Avance",
      baseline: "185",
      target: "250",
      actual: "210",
      trend: "up",
    },
    {
      indicator: "Tiempo onboarding fuente",
      type: "Resultado",
      baseline: "15 días",
      target: "3 días",
      actual: "5 días",
      trend: "up",
    },
    {
      indicator: "Usuarios activos API",
      type: "Adopción",
      baseline: "42",
      target: "120",
      actual: "78",
      trend: "up",
    },
    {
      indicator: "Anomalías detectadas ML/mes",
      type: "Impacto",
      baseline: "0",
      target: "20+",
      actual: "15",
      trend: "up",
    },
  ],
  budget_opex: [
    {
      subcategory: "Hosting data lake",
      amount: "USD 60K/año",
      detail: "Infraestructura on-prem/cloud",
    },
    {
      subcategory: "Licencias catálogo",
      amount: "USD 30K/año",
      detail: "Collibra / equivalente",
    },
    { subcategory: "Soporte", amount: "USD 20K/año", detail: "2x data engineers" },
  ],
  budget_capex: [
    { subcategory: "Desarrollo 2026", amount: "USD 150K", detail: "SDK + ML v2 + catálogo v2" },
    { subcategory: "Infraestructura", amount: "USD 30K", detail: "Expansión storage" },
  ],
};

const ini006: InitiativeSummary = {
  initiative_id: "ini-006",
  purpose:
    "Para el equipo de medio ambiente y responsables de instalaciones que necesitan gestionar +400 permisos ambientales activos sin riesgo de vencimientos no detectados. Plataforma web de tracking y gestión documental que registra cada permiso con vigencia, requisitos y documentación, con alertas automáticas 90/60/30 días antes del vencimiento.",
  value_streams_5y: [
    { stream: "Producción (m3)", year_1: "Indirecto", year_3: "Indirecto", year_5: "Indirecto" },
    { stream: "OPEX (USD)", year_1: "-200K", year_3: "-250K", year_5: "-300K" },
    { stream: "CAPEX (USD)", year_1: "-95K", year_3: "N/A", year_5: "N/A" },
    { stream: "HH", year_1: "1,200", year_3: "1,500", year_5: "1,800" },
  ],
  impact_indicators: [
    {
      indicator: "Permisos digitalizados",
      baseline: "0",
      target: "420+",
      actual: "415",
      priority: "Alta",
    },
    {
      indicator: "Multas por vencimiento",
      baseline: "USD 200K",
      target: "0",
      actual: "0",
      priority: "Alta",
    },
    {
      indicator: "Vencimientos detectados a tiempo",
      baseline: "60%",
      target: "98%",
      actual: "99%",
      priority: "Alta",
    },
    {
      indicator: "Tiempo renovación (días)",
      baseline: "45",
      target: "12",
      actual: "18",
      priority: "Media",
    },
  ],
  challenges: [
    "Adopción inspectores mobile (80% target)",
    "Integración con sistema de gestión documental corporativo",
    "Coordinación con legal para workflow de aprobaciones",
  ],
  interdependencies: [
    {
      initiative_id: "ini-008",
      label: "Dashboard ejecutivo",
      ref_note: "Indicadores de sustentabilidad se publican acá",
    },
    {
      initiative_id: null,
      label: "Gestión documental corporativa",
      ref_note: "Integración para documentos adjuntos",
    },
  ],
  deliverables: [
    {
      name: "Migración permisos downstream",
      responsible: "Carolina Vega",
      quarter: "Q1",
      status: "Completado",
      progress: "100%",
    },
    {
      name: "Workflow aprobación renovaciones",
      responsible: "Carolina Vega",
      quarter: "Q2",
      status: "En curso",
      progress: "65%",
    },
    {
      name: "Integración gestión documental",
      responsible: "Carolina Vega",
      quarter: "Q3",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "App mobile inspectores",
      responsible: "Carolina Vega",
      quarter: "Q4",
      status: "Planificado",
      progress: "—",
    },
  ],
  adoption_indicators: [
    {
      indicator: "Permisos digitalizados",
      type: "Avance",
      baseline: "400",
      target: "420+",
      actual: "415",
      trend: "up",
    },
    {
      indicator: "Tiempo renovación (días)",
      type: "Resultado",
      baseline: "45",
      target: "12",
      actual: "18",
      trend: "up",
    },
    {
      indicator: "Adopción inspectores mobile",
      type: "Adopción",
      baseline: "0%",
      target: "80%",
      actual: "—",
      trend: "flat",
    },
    {
      indicator: "Workflows activos",
      type: "Avance",
      baseline: "0",
      target: "50+",
      actual: "22",
      trend: "up",
    },
  ],
  budget_opex: [
    {
      subcategory: "Hosting y licencias",
      amount: "USD 30K/año",
      detail: "Plataforma web",
    },
    { subcategory: "Soporte", amount: "USD 15K/año", detail: "Bug fixes + mejoras" },
  ],
  budget_capex: [
    {
      subcategory: "Desarrollo 2026",
      amount: "USD 80K",
      detail: "Workflow + mobile + integración",
    },
    { subcategory: "App mobile", amount: "USD 15K", detail: "Desarrollo iOS/Android" },
  ],
};

const ini007: InitiativeSummary = {
  initiative_id: "ini-007",
  purpose:
    "Para supervisores de calidad y operadores de la línea de despacho de refinería que necesitan detectar defectos con precisión superior a la inspección manual. Solución de cámaras industriales con algoritmos de detección que inspecciona el 100% de los productos en tiempo real, detectando defectos de envase, etiquetado y sellado con precisión >99% vs 8% de error en inspección manual con muestreo del 20%.",
  value_streams_5y: [
    { stream: "Producción (m3)", year_1: "Indirecto", year_3: "Indirecto", year_5: "Indirecto" },
    { stream: "OPEX (USD)", year_1: "-195K", year_3: "-650K", year_5: "-700K" },
    { stream: "CAPEX (USD)", year_1: "-172K", year_3: "-450K", year_5: "N/A" },
    { stream: "HH", year_1: "800", year_3: "2,500", year_5: "2,800" },
  ],
  impact_indicators: [
    {
      indicator: "Tasa detección de defectos",
      baseline: "92%",
      target: "99%+",
      actual: "98.7%",
      priority: "Alta",
    },
    {
      indicator: "Falsos positivos",
      baseline: "N/A",
      target: "<2%",
      actual: "1.8%",
      priority: "Alta",
    },
    {
      indicator: "Cobertura inspección",
      baseline: "20%",
      target: "100%",
      actual: "100%",
      priority: "Alta",
    },
    {
      indicator: "Reclamos clientes por defecto",
      baseline: "45/mes",
      target: "<20/mes",
      actual: "18/mes",
      priority: "Media",
    },
  ],
  challenges: [
    "Recalibración mensual del modelo por cambios de iluminación → pipeline de reentrenamiento incremental",
    "Integración con PLC legacy de línea de despacho → adaptador custom (+3 semanas)",
    "Desconfianza de operadores inicialmente → operación en modo sugerencia 2 semanas",
    "Demora proveedor de cámaras por faltante de stock",
  ],
  interdependencies: [
    {
      initiative_id: null,
      label: "PLC línea despacho",
      ref_note: "Integración para rechazo automático",
    },
    {
      initiative_id: null,
      label: "Sistema de calidad corporativo",
      ref_note: "Registro de eventos de detección",
    },
  ],
  deliverables: [],
  adoption_indicators: [],
  budget_opex: [],
  budget_capex: [],
};

const ini008: InitiativeSummary = {
  initiative_id: "ini-008",
  purpose:
    "Para la mesa de VPs y gerentes de área que necesitan una visión consolidada y en tiempo real del estado operativo de PAE para tomar decisiones estratégicas. Dashboard web que unifica KPIs de producción, costos, seguridad y sustentabilidad, consolidando +15 reportes Excel mensuales en una vista única actualizada D-1 con drill-down hasta nivel de instalación.",
  value_streams_5y: [
    { stream: "Producción (m3)", year_1: "Indirecto", year_3: "Indirecto", year_5: "Indirecto" },
    { stream: "OPEX (USD)", year_1: "N/A", year_3: "N/A", year_5: "N/A" },
    { stream: "CAPEX (USD)", year_1: "-150K", year_3: "N/A", year_5: "N/A" },
    { stream: "HH", year_1: "1,200", year_3: "2,400", year_5: "2,400" },
  ],
  impact_indicators: [
    {
      indicator: "Reportes manuales/mes (VP)",
      baseline: "8",
      target: "1 (dashboard)",
      actual: null,
      priority: "Alta",
    },
    {
      indicator: "Antigüedad datos en reportes",
      baseline: "3-4 semanas",
      target: "D-1",
      actual: null,
      priority: "Alta",
    },
    {
      indicator: "% tiempo consolidación vs análisis",
      baseline: "60/40",
      target: "20/80",
      actual: null,
      priority: "Alta",
    },
    {
      indicator: "Confianza datos (encuesta)",
      baseline: "3.2/5",
      target: "4.5/5",
      actual: null,
      priority: "Alta",
    },
  ],
  challenges: [
    "ini-005 no tiene datos downstream a tiempo → coordinar timeline",
    "VPs tienen expectativas distintas de KPIs → workshop de definición",
    "Conector SAP FI no existe → evaluar API SAP vs extracción batch",
    "Adopción baja si UX no es intuitiva → prototipo con usuarios antes de desarrollo",
  ],
  interdependencies: [
    {
      initiative_id: "ini-005",
      label: "Plataforma de datos",
      ref_note: "Fuente primaria de datos upstream (Pablo Díaz)",
    },
    {
      initiative_id: "ini-006",
      label: "Permisos ambientales",
      ref_note: "Indicadores de sustentabilidad (Carolina Vega)",
    },
    {
      initiative_id: null,
      label: "SAP FI",
      ref_note: "Datos financieros OPEX/CAPEX",
    },
    {
      initiative_id: null,
      label: "Sistema HSE",
      ref_note: "Indicadores de seguridad",
    },
  ],
  deliverables: [
    {
      name: "Workshop KPIs con VPs",
      responsible: "Sofía Romero",
      quarter: "Q1",
      status: "Completado",
      progress: "100%",
    },
    {
      name: "Prototipo UX validado con usuarios",
      responsible: "Externo UX",
      quarter: "Q2",
      status: "En curso",
      progress: "50%",
    },
    {
      name: "Módulo Producción v1",
      responsible: "Sofía Romero",
      quarter: "Q2",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Módulo Costos v1 (SAP FI)",
      responsible: "Pablo Díaz",
      quarter: "Q3",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Módulo Seguridad v1",
      responsible: "Sofía Romero",
      quarter: "Q4",
      status: "Planificado",
      progress: "—",
    },
    {
      name: "Dashboard completo en producción",
      responsible: "Sofía Romero",
      quarter: "Q4",
      status: "Planificado",
      progress: "—",
    },
  ],
  adoption_indicators: [
    {
      indicator: "Módulos liberados",
      type: "Avance",
      baseline: "0",
      target: "4",
      actual: "0",
      trend: "flat",
    },
    {
      indicator: "VPs usando dashboard",
      type: "Adopción",
      baseline: "0",
      target: "5",
      actual: "0",
      trend: "flat",
    },
    {
      indicator: "Reportes Excel eliminados",
      type: "Resultado",
      baseline: "15",
      target: "0",
      actual: "15",
      trend: "flat",
    },
    {
      indicator: "Confianza datos (encuesta)",
      type: "Impacto",
      baseline: "3.2",
      target: "4.5",
      actual: "—",
      trend: "flat",
    },
  ],
  budget_opex: [
    {
      subcategory: "Hosting y base de datos",
      amount: "USD 20K/año",
      detail: "Servidores internos PAE",
    },
    {
      subcategory: "Licencias visualización",
      amount: "USD 15K/año",
      detail: "Librería de gráficos premium",
    },
    {
      subcategory: "Soporte y mantenimiento",
      amount: "USD 10K/año",
      detail: "Bug fixes, actualizaciones",
    },
  ],
  budget_capex: [
    {
      subcategory: "Desarrollo",
      amount: "USD 110K",
      detail: "2 desarrolladores + PO + UX",
    },
    {
      subcategory: "Infraestructura",
      amount: "USD 25K",
      detail: "Servidores, DB cache",
    },
    {
      subcategory: "Consultoría UX",
      amount: "USD 15K",
      detail: "Diseño interface + validación",
    },
  ],
};

const ALL_SUMMARIES: InitiativeSummary[] = [
  ini001,
  ini002,
  ini003,
  ini004,
  ini005,
  ini006,
  ini007,
  ini008,
];

export function getInitiativeSummaries(): InitiativeSummary[] {
  return ALL_SUMMARIES;
}

export function getInitiativeSummary(
  initiativeId: string,
): InitiativeSummary | null {
  return (
    ALL_SUMMARIES.find((s) => s.initiative_id === initiativeId) ?? null
  );
}
