# SPEC_PPTX_FORMULARIO.md

## Generador de PPTX de Formulario Individual — Plataforma PAE

**Versión:** 1.0  
**Última actualización:** Abril 2026  
**Propósito:** Especificación técnica para que Claude Code implemente el generador de PPTX que se activa desde el botón "Generar PPTX" en el wizard de formulario y en la pantalla del gateway.

---

## 1. Contexto y Objetivo

Este PPTX resume los datos de **UN formulario individual** de **UNA iniciativa** para presentar en la reunión de aprobación del gateway. Es diferente al PPTX del dashboard (que resume el portfolio completo).

### Dónde aparece el botón

| Ubicación | Botón | Acción |
|-----------|-------|--------|
| Wizard de formulario — barra inferior | "Generar PPTX" | Genera PPTX con datos del formulario actual (incluso en borrador) |
| Pantalla Gateway — acciones | "Generar PPTX" | Genera PPTX con datos del formulario enviado a aprobación |
| Detalle iniciativa — tab Documentos | "Regenerar" | Re-genera PPTX con datos actualizados |

### Endpoint (backend)

```
POST /api/forms/:formId/generate
Body: { type: 'pptx' }
Response: { url: string, fileName: string, documentId: string }
```

### Frontend-phase (localStorage)

En la fase frontend, el PPTX se genera en el browser con `pptxgenjs`. La función lee los datos del formulario desde localStorage y genera el archivo para descarga local.

```typescript
// Ubicación del archivo
src/lib/generators/pptx-formulario.ts

// Función principal
export async function generateFormularioPPTX(formData: FormularioData): Promise<Blob>
```

---

## 2. Arquitectura de Archivos

```
src/
  lib/
    generators/
      pptx-formulario.ts          ← Generador principal
      pptx-formulario-slides.ts   ← Funciones de cada slide
      pptx-formulario-helpers.ts  ← Helpers reutilizables (footer, headers, tablas)
      pptx-formulario-data.ts     ← Mapeo formData → slideData por tipo de form
      pptx-constants.ts           ← Colores PAE, dimensiones, tipografía (compartido con dashboard PPTX)
    types/
      pptx-formulario.types.ts    ← Interfaces TypeScript
```

---

## 3. Interfaz TypeScript de Datos de Entrada

```typescript
// ═══════════════════════════════════════════════════════
// TIPOS BASE
// ═══════════════════════════════════════════════════════

type FormType = 'F1' | 'F2' | 'F3' | 'LTP_PLAN' | 'LTP_REVIEW';

type FormLabel = 'Propuesta' | 'Dimensionamiento' | 'MVP' | 'Plan Anual' | 'Revisión Anual';

interface FormularioMetadata {
  formId: string;
  formType: FormType;
  formLabel: FormLabel;
  gatewayNumber: 1 | 2 | 3 | null; // null para LTP
  initiativeId: string;
  initiativeName: string;
  dimension: string;
  unidadGestion: string;
  areasInvolucradas: string;
  tipoIniciativa: 'Habilitadora' | 'Resultado';
  stage: string;
  status: string;
  date: string;          // "Abril 2026"
  version: string;       // "v1.0", "v2.3"
  ltpPeriod?: string;    // "06-2026" (solo LTP)
}

// ═══════════════════════════════════════════════════════
// SECCIONES COMPARTIDAS (F1 + F2 + F3 + LTP)
// ═══════════════════════════════════════════════════════

interface Proposito {
  texto: string; // Texto completo con template "Para [Cliente]..."
}

interface DolorOportunidad {
  stakeholder: string;        // "Usuario", "Interesado", "Sponsor"
  dolor: string;
  metrica: string;
  datoInicio: string;
  metricaTarget: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
}

interface AlineacionEstrategica {
  texto: string;
  desafio?: string;         // Nombre del desafío estratégico
  proyecto?: string;        // Nombre del proyecto vinculado
  dimensionExistente?: string;
}

interface DescripcionIniciativa {
  estrategia: string;
  alcance: string;
  interdependencias?: string;  // F1 tiene, F2/F3 tienen tabla
  escalabilidad: string;
}

// F1: S/N simple
interface CorrienteValorF1 {
  corriente: string;    // "PRODUCCIÓN (m³)", "OPEX (M USD)", etc.
  impacto: 'S' | 'N';
}

// F2 y F3: tabla a 5 años
interface CorrienteValorDetallada {
  corriente: string;
  valores: { anio1: number; anio2: number; anio3: number; anio4: number; anio5: number };
}

interface PalancaValor {
  corriente: string;
  palanca: string;
  valores: { anio1: number; anio2: number; anio3: number; anio4: number; anio5: number };
}

interface AreaParticipacion {
  area: string;
  tipo: 'Involucrada' | 'Interesada';
}

interface Hito {
  hito: string;
  fecha: string;
  estado?: 'Completado' | 'En curso' | 'Planificado' | 'Atrasado'; // Para F3/LTP
}

interface MiembroEquipo {
  rol: string;
  nombre: string;
  posicion: string;
  vicepresidencia?: string;
  area?: string;
  porcentajeAsignacion?: string;   // Solo LTP y F3
  conocimientoNecesario?: string;  // Solo LTP
}

interface ResponsableGateway {
  rol: string;           // "Sponsor", "Business Owner", "Área Transf.", "Portfolio"
  nombre: string;
  posicion: string;
  area: string;
  decision?: string;     // Solo G2 y G3: "Si", "No", "Más información"
}

interface GestionCambio {
  desafios: string;
  areasParticipacion: AreaParticipacion[];
}

// ═══════════════════════════════════════════════════════
// SECCIONES ESPECÍFICAS POR FORMULARIO
// ═══════════════════════════════════════════════════════

// F2 agrega:
interface SintesisNecesidad {
  texto: string; // Síntesis ampliada con factibilidad
}

interface ProcesoAsIsToBeF2 {
  procesoAsIs: string;
  procesoToBe: string;
}

interface AlternativasF2 {
  texto: string;
}

interface ConsideracionesDigitales {
  tipoSolucion: string;
  desafiosDigitales: string;
  integracion: string;
}

interface CostosDesarrolloOperacion {
  costosDesarrollo: string;  // Texto descriptivo
  costosOperacion: string;
}

interface InterdependenciaTabla {
  nombre: string;
  referente: string;
}

interface RiesgoAccion {
  riesgo: string;
  accion: string;
  resultadoEsperado: string;
  fecha: string;
  responsable: string;
}

// F3 agrega:
interface DescripcionMVP {
  descripcion: string;
  indicadoresMedicion: string;
  resultadosEsperados: string;
}

interface ResultadosMVP {
  resultadosObtenidos: string;
  aprendizajesBloqueantes: string;
  conclusiones: string;
  journeyPostMVP: string;
}

interface MiembroEquipoExecute {
  rol: string;
  nombre: string;
  porcentajeAsignacion: string;
  posicion: string;
  area: string;
}

interface PlanGestionCambioF3 {
  riesgos: string;
  interdependencias: InterdependenciaTabla[];
  planAccion: string;
}

// LTP Plan agrega:
interface PrioridadesEstrategicasAnuales {
  texto: string;
}

interface EntregableAnual {
  entregable: string;
  responsable: string;
  fechaPlan: string;
  estado: 'Completado' | 'En curso' | 'Planificado' | 'Atrasado';
  avance?: string;  // "60%"
}

interface IndicadorSeguimiento {
  indicador: string;
  tipo: 'Resultado' | 'Adopción' | 'Asertividad' | 'Impacto';
  baseline: string;
  target: string;
  actual?: string;    // Solo LTP Review
  trend?: '↑' | '→' | '↓';  // Solo LTP Review
}

// LTP Review agrega:
interface EntregableReview extends EntregableAnual {
  comentario: string;
}

interface IndicadorReview extends IndicadorSeguimiento {
  planificado: string;
  real: string;
}

interface HitoReview extends Hito {
  cumplido: 'Sí' | 'Parcial' | 'No';
  fechaReal?: string;
}

interface CostosReview {
  planificado: string;
  real: string;
  desvio: string;
}

interface LeccionesAprendidas {
  texto: string;
  ajustesProximoAnio?: string;
}

// ═══════════════════════════════════════════════════════
// TIPOS COMPUESTOS POR FORMULARIO
// ═══════════════════════════════════════════════════════

interface FormularioF1Data {
  metadata: FormularioMetadata;
  proposito: Proposito;
  dolores: DolorOportunidad[];
  alineacionEstrategica: AlineacionEstrategica;
  descripcion: DescripcionIniciativa;
  corrientesDeValor: CorrienteValorF1[];
  gestionCambio: GestionCambio;
  hitos: Hito[];
  equipoPropuesta: MiembroEquipo[];
  responsablesGate: ResponsableGateway[];
  equipoMetodologia: MiembroEquipo[];
}

interface FormularioF2Data extends Omit<FormularioF1Data, 'corrientesDeValor'> {
  sintesisNecesidad: SintesisNecesidad;
  procesosAsIsToBe: ProcesoAsIsToBeF2;
  alternativas: AlternativasF2;
  consideracionesDigitales: ConsideracionesDigitales;
  costos: CostosDesarrolloOperacion;
  corrientesDeValor5Anios: CorrienteValorDetallada[];
  palancasDeValor: PalancaValor[];
  interdependenciasTabla: InterdependenciaTabla[];
  riesgosAcciones: RiesgoAccion[];
  equipoDimensionamiento: MiembroEquipo[];
}

interface FormularioF3Data extends FormularioF2Data {
  descripcionMVP: DescripcionMVP;
  resultadosMVP: ResultadosMVP;
  equipoExecuteOperate: MiembroEquipoExecute[];
  planGestionCambio: PlanGestionCambioF3;
}

interface FormularioLTPPlanData {
  metadata: FormularioMetadata;
  proposito: Proposito;
  dolores: DolorOportunidad[];
  prioridadesEstrategicas: PrioridadesEstrategicasAnuales;
  entregablesAnuales: EntregableAnual[];
  indicadoresSeguimiento: IndicadorSeguimiento[];
  equipoTrabajo: MiembroEquipo[];
  equipoAlineacion: ResponsableGateway[];
  interesadosConsultados: MiembroEquipo[];
  consideracionesDigitales: ConsideracionesDigitales;
  interdependencias: InterdependenciaTabla[];
  riesgosAcciones: RiesgoAccion[];
  hitos: Hito[];
  costos: CostosDesarrolloOperacion;
  corrientesDeValor5Anios: CorrienteValorDetallada[];
}

interface FormularioLTPReviewData extends FormularioLTPPlanData {
  entregablesReview: EntregableReview[];
  indicadoresReview: IndicadorReview[];
  hitosReview: HitoReview[];
  costosReview: CostosReview;
  leccionesAprendidas: LeccionesAprendidas;
}

// Unión discriminada
type FormularioData =
  | FormularioF1Data
  | FormularioF2Data
  | FormularioF3Data
  | FormularioLTPPlanData
  | FormularioLTPReviewData;
```

---

## 4. Especificación de Slides por Tipo de Formulario

### 4.1 Slides F1 — Propuesta (11 slides)

| # | Título | Layout | Campo fuente |
|---|--------|--------|--------------|
| 1 | Portada | `title_slide` — Fondo oscuro PAE.DARK, barra roja superior, badge "ETAPA 1 — PROPUESTA", nombre iniciativa grande, metadata (dimensión, UG, tipo, fecha, versión), logo PAE, "Gateway 1" | `metadata.*` |
| 2 | Propósito | `text_full_page` — Número de sección en círculo azul, texto con borde izquierdo azul | `proposito.texto` |
| 3 | Indicadores de Impacto | `table` — Tabla 6 columnas: Stakeholder, KPI (Indicador de Impacto), Métrica, Inicio, Target, Prioridad. Headers azul PAE, filas alternadas, prioridad Alta en rojo, targets en verde bold | `dolores[]` |
| 4 | Alineación Estratégica | `text_two_columns` — Texto principal + 2 callout cards (Desafío con borde rojo, Proyecto con borde azul) | `alineacionEstrategica.*` |
| 5 | Descripción de la Iniciativa | `text_two_columns` — Col izq: Estrategia y beneficios. Col der: Alcance. Separador. Interdependencias (rojo) y Escalabilidad (verde) abajo | `descripcion.*` |
| 6 | Impacto Económico — Corrientes de Valor | `kpi_cards` — Grid 3x3 de cards. Dot verde S / gris N. Nombre corriente bold si S. Nota: "En Etapa 2 se detallan valores a 5 años" | `corrientesDeValor[]` |
| 7 | Gestión del Cambio | `text_full_page` + `table` — Desafíos (texto) + tabla 2 col: Área, Tipo involucramiento. "Involucrada" en azul, "Interesada" en verde | `gestionCambio.*` |
| 8 | Journey / Hitos Preliminares | `timeline` — Línea horizontal azul con dots. Hitos alternando arriba/abajo. Fechas en azul bold, descripciones debajo. Nota de fechas preliminares | `hitos[]` |
| 9 | Equipo de Trabajo | `table` x2 — Tabla azul (Equipo Propuesta: Rol, Nombre, Posición, VP) + tabla verde (Equipo Metodología) | `equipoPropuesta[]`, `equipoMetodologia[]` |
| 10 | Responsables Gateway | `table` — Tabla roja (Responsables G1: Rol, Nombre, Posición, Área). Callout rojo: "Resolución por unanimidad" con descripción de estados | `responsablesGate[]` |
| 11 | Próximos Pasos | `title_slide` — Fondo oscuro, lista numerada con circles (1 rojo, 2-5 azul), pasos específicos de cierre de gateway, logo PAE | Generado automáticamente según formType |

### 4.2 Slides adicionales F2 — Dimensionamiento (~16 slides)

Todo lo de F1 más las siguientes slides insertadas:

| # | Título | Layout | Posición |
|---|--------|--------|----------|
| 3b | Síntesis de la Necesidad | `text_full_page` — Texto de síntesis ampliada con factibilidad técnica | Después de slide 3 (dolores) |
| 5b | Procesos As-Is / To-Be | `text_two_columns` — Col izq: "Proceso actual (As-Is)" con borde rojo. Col der: "Proceso futuro (To-Be)" con borde verde | Después de slide 5 |
| 5c | Alternativas Evaluadas | `text_full_page` — Descripción de alternativas consideradas | Después de 5b |
| 7b | Consideraciones Digitales | `text_two_columns` + card — Tipo de solución, Desafíos digitales (izq), Integración (der) | Después de gestión del cambio |
| 7c | Costos de Desarrollo y Operación | `text_two_columns` — Col izq: CAPEX/desarrollo. Col der: OPEX/operación | Después de 7b |
| 6 | Corrientes de Valor a 5 Años | `table` — Tabla 6 col: Corriente, Año 1-5. Headers azul. Valores numéricos. Reemplaza las cards S/N del F1 | Reemplaza slide 6 del F1 |
| 6b | Palancas de Valor | `table` — Tabla 7 col: Corriente, Palanca, Año 1-5. Detalle por palanca | Después de slide 6 |
| 7d | Riesgos y Plan de Acción | `table` — Tabla 5 col: Riesgo, Acción, Resultado, Fecha, Responsable | Después de costos |

### 4.3 Slides adicionales F3 — MVP (~19 slides)

Todo lo de F2 más:

| # | Título | Layout | Posición |
|---|--------|--------|----------|
| 12 | Descripción del MVP | `text_full_page` — Descripción del MVP, propósito, beneficios, impacto | Después de equipo |
| 13 | Indicadores de Medición | `table` o `kpi_cards` — Indicadores con los que se valida el MVP | Después del MVP |
| 14 | Resultados: Esperados vs Obtenidos | `text_two_columns` — Col izq: Esperados. Col der: Obtenidos. Comparación visual | Después de indicadores |
| 15 | Aprendizajes y Conclusiones | `text_full_page` — Bloqueantes + aprendizajes + conclusiones del MVP. Borde izquierdo bicolor (rojo bloqueantes, verde aprendizajes) | Después de resultados |
| 16 | Journey Post-MVP / Próximos Entregables | `timeline` — Si MVP exitoso: journey con releases. Si no: decisión (otro MVP, hold, cancelar) | Antes de próximos pasos |
| 9b | Equipo Execute & Operate | `table` — Tabla con Rol, Nombre, % Asignación, Posición, Área | Junto con equipo |
| 7e | Plan de Gestión del Cambio | `text_full_page` + `table` — Stakeholder analysis + plan detallado | Reemplaza/extiende slide 7 |

### 4.4 Slides LTP Planificación (~14 slides)

| # | Título | Layout |
|---|--------|--------|
| 1 | Portada | Similar a F1 pero badge verde "LTP — PLAN ANUAL 2027", sin número de gateway |
| 2 | Propósito | Igual que F1 (heredado de F3 VF) |
| 3 | Indicadores de Impacto | `table` — Similar a F1 con columna "KPI (Indicador de Impacto)" |
| 4 | Prioridades Estratégicas del Año | `text_full_page` — Texto con prioridades del negocio para el año |
| 5 | Entregables del Año | `table` — Tabla 5 col: Entregable, Responsable, Fecha plan, Estado, Avance. Estado con color coding |
| 6 | Indicadores de Seguimiento | `table` — Tabla 5 col: Indicador, Tipo, Baseline, Target, Actual. Tipo con badge de color |
| 7 | Equipo de Trabajo | `table` — Tabla 5 col con % asignación y conocimiento necesario |
| 8 | Equipo de Alineación Estratégica | `table` — Sponsor, BO, Portfolio, LD |
| 9 | Consideraciones Digitales | `text_two_columns` |
| 10 | Costos del Año | `text_two_columns` |
| 11 | Corrientes de Valor — Proyección | `table` a 5 años |
| 12 | Journey / Hitos del Año | `timeline` |
| 13 | Riesgos y Plan de Acción | `table` |
| 14 | Próximos Pasos | Fondo oscuro |

### 4.5 Slides adicionales LTP Review (~18 slides)

Todo lo del LTP Plan más:

| # | Título | Layout |
|---|--------|--------|
| 5b | Entregables: Planificado vs Real | `table` — Agrega columnas Estado final + Comentario |
| 6b | Indicadores: Planificado vs Real | `table` — Agrega columnas Valor real + Trend (↑ → ↓) |
| 12b | Hitos: Cumplimiento | `table` — Cumplido/Parcial/No + Fecha real vs planificada |
| 10b | Costos: Planificado vs Real | `text_two_columns` o `kpi_cards` — Desvío con indicadores visuales |
| 17 | Lecciones Aprendidas | `text_full_page` — Texto con aprendizajes + ajustes para próximo año |

---

## 5. Diseño Visual — Brandbook PAE

### Colores

```typescript
const PAE_COLORS = {
  RED: 'C8102E',        // Primario — portadas, badges etapa, alertas, prioridad alta
  BLUE: '003DA5',       // Secundario — headers tabla, sección headers, alineación
  GREEN: '00843D',      // Terciario — targets, impacto positivo, metodología
  DARK: '1A1A2E',       // Fondo portadas y cierre
  WHITE: 'FFFFFF',
  LIGHT_GRAY: 'F5F5F5', // Filas alternadas
  MID_GRAY: 'E8E8E8',   // Bordes, separadores
  TEXT_PRIMARY: '2D2D2D',
  TEXT_SECONDARY: '666666',
  TEXT_MUTED: '999999',
};
```

### Tipografía

- Font principal: `Inter` (fallback: `Calibri`)
- Títulos de slide: 22pt bold
- Headers de sección: 12pt bold
- Body text: 10-13pt
- Tablas header: 8-9pt bold, blanco sobre color
- Tablas body: 8-9pt
- Captions/notas: 7-8pt italic
- Footer: 7pt

### Formato

- Layout: 16:9 (10" x 5.625")
- Márgenes: 0.6" a cada lado
- Ancho contenido: 8.8"
- Footer en todas las slides excepto portada y cierre: línea gris + "Pan American Energy — Transformación Digital" + "N / Total"

### Layouts de Slide (pptx_slide_template)

| Template | Descripción | Uso |
|----------|-------------|-----|
| `title_slide` | Fondo oscuro, badge etapa, título grande, metadata, logo | Portada y cierre |
| `text_full_page` | Header sección con número en círculo + texto completo | Propósito, alineación, desafíos |
| `text_two_columns` | Header + 2 columnas con subtítulos | Estrategia/alcance, as-is/to-be, costos |
| `table` | Header + tabla con headers color PAE | Dolores, equipo, corrientes, entregables |
| `timeline` | Header + línea horizontal con dots y hitos alternados | Journey/hitos |
| `kpi_cards` | Header + grid de cards con indicadores | Corrientes S/N (F1), indicadores |

---

## 6. Lógica de Variación por formType

### Función selectora de slides

```typescript
function getSlidesForFormType(formType: FormType): SlideConfig[] {
  const baseSlides = [
    { id: 'portada',       builder: buildPortada },
    { id: 'proposito',     builder: buildProposito },
    { id: 'indicadores_impacto', builder: buildIndicadoresImpacto },
  ];

  switch (formType) {
    case 'F1':
      return [
        ...baseSlides,
        { id: 'alineacion',        builder: buildAlineacion },
        { id: 'descripcion',       builder: buildDescripcion },
        { id: 'corrientes_sn',     builder: buildCorrientesSN },
        { id: 'gestion_cambio',    builder: buildGestionCambio },
        { id: 'journey',           builder: buildJourney },
        { id: 'equipo',            builder: buildEquipo },
        { id: 'responsables_gate', builder: buildResponsablesGateway },
        { id: 'proximos_pasos',    builder: buildProximosPasos },
      ];

    case 'F2':
      return [
        ...baseSlides,
        { id: 'sintesis',          builder: buildSintesis },
        { id: 'alineacion',        builder: buildAlineacion },
        { id: 'descripcion',       builder: buildDescripcion },
        { id: 'procesos',          builder: buildProcesosAsIsToBe },
        { id: 'alternativas',      builder: buildAlternativas },
        { id: 'consideraciones',   builder: buildConsideracionesDigitales },
        { id: 'costos',            builder: buildCostos },
        { id: 'corrientes_5anios', builder: buildCorrientes5Anios },
        { id: 'palancas',          builder: buildPalancas },
        { id: 'gestion_cambio',    builder: buildGestionCambioF2 },
        { id: 'riesgos',           builder: buildRiesgosAcciones },
        { id: 'journey',           builder: buildJourney },
        { id: 'equipo',            builder: buildEquipoF2 },
        { id: 'responsables_gate', builder: buildResponsablesGateway },
        { id: 'proximos_pasos',    builder: buildProximosPasos },
      ];

    case 'F3':
      return [
        ...baseSlides,
        { id: 'sintesis',          builder: buildSintesis },
        { id: 'alineacion',        builder: buildAlineacion },
        { id: 'descripcion',       builder: buildDescripcion },
        { id: 'procesos',          builder: buildProcesosAsIsToBe },
        { id: 'mvp_descripcion',   builder: buildDescripcionMVP },
        { id: 'mvp_indicadores',   builder: buildIndicadoresMVP },
        { id: 'mvp_resultados',    builder: buildResultadosMVP },
        { id: 'mvp_aprendizajes',  builder: buildAprendizajes },
        { id: 'consideraciones',   builder: buildConsideracionesDigitales },
        { id: 'costos',            builder: buildCostos },
        { id: 'corrientes_5anios', builder: buildCorrientes5Anios },
        { id: 'palancas',          builder: buildPalancas },
        { id: 'gestion_cambio_f3', builder: buildGestionCambioF3 },
        { id: 'riesgos',           builder: buildRiesgosAcciones },
        { id: 'journey',           builder: buildJourneyPostMVP },
        { id: 'equipo_f3',         builder: buildEquipoF3 },
        { id: 'responsables_gate', builder: buildResponsablesGateway },
        { id: 'proximos_pasos',    builder: buildProximosPasos },
      ];

    case 'LTP_PLAN':
      return [
        ...baseSlides,
        { id: 'prioridades',       builder: buildPrioridades },
        { id: 'entregables',       builder: buildEntregablesAnuales },
        { id: 'indicadores',       builder: buildIndicadoresSeguimiento },
        { id: 'equipo_ltp',        builder: buildEquipoLTP },
        { id: 'consideraciones',   builder: buildConsideracionesDigitales },
        { id: 'costos',            builder: buildCostos },
        { id: 'corrientes_5anios', builder: buildCorrientes5Anios },
        { id: 'riesgos',           builder: buildRiesgosAcciones },
        { id: 'journey',           builder: buildJourney },
        { id: 'proximos_pasos',    builder: buildProximosPasosLTP },
      ];

    case 'LTP_REVIEW':
      return [
        ...baseSlides,
        { id: 'prioridades',         builder: buildPrioridades },
        { id: 'entregables_review',  builder: buildEntregablesReview },
        { id: 'indicadores_review',  builder: buildIndicadoresReview },
        { id: 'hitos_review',        builder: buildHitosReview },
        { id: 'costos_review',       builder: buildCostosReview },
        { id: 'lecciones',           builder: buildLeccionesAprendidas },
        { id: 'equipo_ltp',          builder: buildEquipoLTP },
        { id: 'corrientes_5anios',   builder: buildCorrientes5Anios },
        { id: 'proximos_pasos',      builder: buildProximosPasosLTP },
      ];
  }
}
```

### Badge de etapa por formType

| formType | Badge color | Badge text | Gateway |
|----------|------------|------------|---------|
| F1 | RED | "ETAPA 1 — PROPUESTA" | Gateway 1 |
| F2 | BLUE | "ETAPA 2 — DIMENSIONAMIENTO" | Gateway 2 |
| F3 | GREEN | "ETAPA 3 — MVP" | Gateway 3 |
| LTP_PLAN | GREEN | "LTP — PLAN ANUAL {año}" | Sin gateway |
| LTP_REVIEW | BLUE | "LTP — REVISIÓN ANUAL {año}" | Sin gateway |

### Slide de "Próximos Pasos" — contenido dinámico

```typescript
function getProximosPasos(formType: FormType): string[] {
  switch (formType) {
    case 'F1':
      return [
        'Presentación en reunión de Gateway 1 con sponsors y stakeholders',
        'Obtener aprobación unánime para avanzar a Etapa 2 — Dimensionamiento',
        'Definir líder de siguiente etapa (Promotor, LD o PO)',
        'Asignar equipo de dimensionamiento y aprobadores para Gateway 2',
        'Iniciar relevamiento técnico detallado y estudio de factibilidad',
      ];
    case 'F2':
      return [
        'Presentación en reunión de Gateway 2 con sponsors',
        'Obtener aprobación para avanzar a Etapa 3 — MVP',
        'Confirmar Product Owner para la etapa MVP',
        'Definir alcance y métricas del piloto/MVP',
        'Iniciar desarrollo del Mínimo Producto Viable',
      ];
    case 'F3':
      return [
        'Presentación de resultados del MVP en Gateway 3',
        'Decisión: escalar, iterar, pausar o cancelar',
        'Si aprobado: iniciar Delivery y plan de rollout',
        'Activar ciclo LTP para planificación anual',
        'Configurar indicadores de seguimiento continuo',
      ];
    case 'LTP_PLAN':
      return [
        'Validar plan anual con sponsors y stakeholders',
        'Asignar recursos y confirmar % de dedicación',
        'Iniciar ejecución del primer entregable del año',
        'Configurar seguimiento mensual de indicadores',
        'Programar revisión de medio año (LTP Review)',
      ];
    case 'LTP_REVIEW':
      return [
        'Documentar lecciones aprendidas del ciclo',
        'Ajustar plan para el próximo ciclo anual',
        'Actualizar proyección de corrientes de valor',
        'Iniciar planificación del nuevo ciclo LTP',
        'Comunicar resultados a stakeholders',
      ];
  }
}
```

---

## 7. Notas Técnicas para Claude Code

### 7.1 Seguridad

- **Sanitización de datos**: Todos los campos de texto deben sanitizarse antes de insertarse en el PPTX. Escapar caracteres que puedan romper XML (`<`, `>`, `&`, `"`, `'`). pptxgenjs maneja esto internamente para `addText()`, pero verificar en tablas.
- **Tamaño de datos**: Validar que los arrays (dolores, hitos, equipo) no excedan límites razonables. Si hay >8 filas en una tabla, considerar paginación (2 slides) o reducir fontSize.
- **Archivos generados**: El PPTX se genera en memoria y se descarga al browser. NO guardar en servidor sin autenticación verificada.
- **No inyectar HTML/scripts**: pptxgenjs no ejecuta HTML, pero validar que no se incluyan tags en los textos.

### 7.2 Rendimiento

- El PPTX se genera en el browser (~1-3 segundos para 11-19 slides).
- No bloquear el UI thread: usar `async/await` con el `writeFile` de pptxgenjs.
- Mostrar loading indicator durante la generación.

### 7.3 Carry-over visual

- En F2 y F3, las secciones heredadas de formularios anteriores NO necesitan distinción visual en el PPTX (a diferencia del wizard donde se muestran en gris). El PPTX presenta todo como contenido unificado.
- Si un campo heredado fue editado en el formulario actual, usar el valor editado.

### 7.4 Campos vacíos

- Si un campo está vacío o es null, omitir la sección completa del PPTX en vez de mostrar "—" o espacios en blanco.
- Si todo un bloque está vacío (ej: todos los dolores vacíos), omitir esa slide.
- Recalcular `TOTAL_SLIDES` dinámicamente según las slides efectivamente generadas.

### 7.5 Nombre del archivo

```typescript
function getFileName(metadata: FormularioMetadata): string {
  const safeName = metadata.initiativeName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-zA-Z0-9\s]/g, '')                   // Solo alfanuméricos
    .replace(/\s+/g, '_')                              // Espacios → underscores
    .substring(0, 40);                                  // Limitar longitud

  const period = metadata.ltpPeriod ? `_${metadata.ltpPeriod}` : '';
  return `PAE_${metadata.formType}_${metadata.formLabel}_${safeName}${period}.pptx`;
}
// Ejemplo: "PAE_F1_Propuesta_Optimizacion_Predictiva_de_Pozos_Maduros.pptx"
```

### 7.6 Compartir constantes con PPTX Dashboard

Los colores, fuentes y helpers (footer, sección header) se definen en `pptx-constants.ts` y se comparten entre el generador de formulario individual y el de dashboard de portfolio.

### 7.7 Testing

- Generar un PPTX de ejemplo con cada formType (F1, F2, F3, LTP_PLAN, LTP_REVIEW) usando datos dummy.
- Verificar visualmente que no haya overlaps, texto cortado o tablas desbordadas.
- Verificar que los acentos y caracteres especiales del español se renderizan correctamente.
- Verificar que el archivo se abra correctamente en Microsoft PowerPoint, Google Slides y LibreOffice Impress.

---

## 8. Referencia Cruzada con Documentos Fuente

| Sección PPTX | Documento IVD fuente | Campo en schema JSON |
|--------------|---------------------|---------------------|
| Info General | IVD E1 §1 / E2 §1 / E3 §1 / LTP §1 | `metadata.*` |
| Propósito | IVD E1 §2 | `proposito.texto` |
| Indicadores de impacto | IVD E1 §3 | `dolores[]` |
| Síntesis necesidad | IVD E2 §3.1 | `sintesisNecesidad.texto` |
| Alineación | IVD E1 §4 | `alineacionEstrategica.*` |
| Estrategia/beneficios | IVD E1 §5.1 | `descripcion.estrategia` |
| Alcance | IVD E1 §5.2 | `descripcion.alcance` |
| Procesos as-is/to-be | IVD E2 §5.2 | `procesosAsIsToBe.*` |
| Alternativas | IVD E2 §5.5 | `alternativas.texto` |
| Corrientes S/N | IVD E1 §6 | `corrientesDeValor[]` |
| Corrientes 5 años | IVD E2 §8.1 / E3 §11 | `corrientesDeValor5Anios[]` |
| Palancas | IVD E2 §8.2 / E3 §11 | `palancasDeValor[]` |
| Desafíos cambio | IVD E1 §7.1 | `gestionCambio.desafios` |
| Áreas participación | IVD E1 §7.2 | `gestionCambio.areasParticipacion[]` |
| Costos CAPEX/OPEX | IVD E2 §6 / E3 §10 | `costos.*` |
| Consideraciones dig. | IVD E2 §4 / E3 §8 | `consideracionesDigitales.*` |
| Descripción MVP | IVD E3 §6.1 | `descripcionMVP.*` |
| Indicadores medición | IVD E3 §6.2 | `descripcionMVP.indicadoresMedicion` |
| Resultados obtenidos | IVD E3 §7.1 | `resultadosMVP.resultadosObtenidos` |
| Aprendizajes | IVD E3 §7.2 | `resultadosMVP.aprendizajesBloqueantes` |
| Conclusiones | IVD E3 §7.3 | `resultadosMVP.conclusiones` |
| Journey/hitos | IVD E1 §8 / E2 §7 / E3 §6.6 | `hitos[]` |
| Equipo | IVD E1 §9 / E2 §9 / E3 §12 | `equipo*[]` |
| Prioridades anuales | LTP Plan §4 | `prioridadesEstrategicas.texto` |
| Entregables año | LTP Plan §5.1 | `entregablesAnuales[]` |
| Indicadores seguim. | LTP Plan §5.2 | `indicadoresSeguimiento[]` |
| Riesgos/acciones | IVD E2 §5.4 / E3 §9 | `riesgosAcciones[]` |
