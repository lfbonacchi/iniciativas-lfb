/**
 * PAE — Generador de PPTX de Formulario Individual
 * Referencia visual para la Plataforma de Gestión de Portfolio
 * 
 * Este script genera un PPTX de ejemplo con datos dummy de un F1 (Propuesta)
 * para la iniciativa "Optimización Predictiva de Pozos Maduros".
 * 
 * Uso: node generate_pptx_formulario.js
 * Output: PAE_F1_Propuesta_Optimizacion_Predictiva.pptx
 */

const pptxgen = require("pptxgenjs");

// ═══════════════════════════════════════════════════════════════
// BRANDBOOK PAE — Constantes de diseño
// ═══════════════════════════════════════════════════════════════
const PAE = {
  RED: "C8102E",
  BLUE: "003DA5",
  GREEN: "00843D",
  DARK: "1A1A2E",
  WHITE: "FFFFFF",
  LIGHT_GRAY: "F5F5F5",
  MID_GRAY: "E8E8E8",
  TEXT_PRIMARY: "2D2D2D",
  TEXT_SECONDARY: "666666",
  TEXT_MUTED: "999999",
  FONT: "Inter",
  FONT_FALLBACK: "Calibri",
};

// Layouts reutilizables
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.6;
const CONTENT_W = SLIDE_W - MARGIN * 2;

// ═══════════════════════════════════════════════════════════════
// DATOS DUMMY — Formulario 1 (Propuesta)
// ═══════════════════════════════════════════════════════════════
const formData = {
  // Metadata
  formType: "F1",
  formLabel: "Propuesta",
  gatewayNumber: 1,
  initiativeName: "Optimización Predictiva de Pozos Maduros",
  dimension: "Producción",
  unidadGestion: "Upstream — Área Norte",
  areasInvolucradas: "Producción, Ingeniería de Reservorios, IT, Mantenimiento",
  tipoIniciativa: "Resultado",
  stage: "Propuesta",
  status: "Enviado a aprobación",
  date: "Abril 2026",
  version: "v1.0",

  // Sección 2 — Propósito
  proposito:
    "Para los ingenieros de producción y supervisores de campo quienes necesitan anticipar fallas y optimizar la extracción en pozos maduros del Área Norte.\n\nEl Sistema de Optimización Predictiva es una plataforma de monitoreo inteligente que permite reducir intervenciones no planificadas y maximizar la producción mediante modelos de machine learning aplicados a datos de sensores de fondo de pozo.\n\nA diferencia del monitoreo manual actual basado en inspecciones periódicas, nuestro sistema entrega alertas tempranas con 72hs de anticipación y recomendaciones de ajuste automáticas.",

  // Sección 3 — Indicadores de Impacto
  dolores: [
    {
      stakeholder: "Ingeniero de producción",
      dolor: "Incrementar MTBF en bombeo electrosumergible mediante anticipación de fallas",
      metrica: "MTBF (Mean Time Between Failures)",
      datoInicio: "145 días",
      target: "220 días",
      prioridad: "Alta",
    },
    {
      stakeholder: "Supervisor de campo",
      dolor: "Reducir intervenciones correctivas no planificadas en pozos maduros",
      metrica: "% intervenciones no planificadas",
      datoInicio: "62%",
      target: "25%",
      prioridad: "Alta",
    },
    {
      stakeholder: "Gerente de producción",
      dolor: "Recuperar producción incremental en pozos maduros con visibilidad predictiva",
      metrica: "Producción incremental (m³/año)",
      datoInicio: "0",
      target: "+8.000 m³/año",
      prioridad: "Media",
    },
    {
      stakeholder: "VP Upstream",
      dolor: "Reducir OPEX de mantenimiento por pozo migrando de reactivo a predictivo",
      metrica: "OPEX mantenimiento (USD/pozo/año)",
      datoInicio: "USD 85K",
      target: "USD 55K",
      prioridad: "Media",
    },
  ],

  // Sección 4 — Alineación estratégica
  alineacionEstrategica:
    "Esta iniciativa se alinea directamente con el Desafío Estratégico de Eficiencia Operativa del Upstream y el Proyecto de Digitalización de Operaciones de Campo. Contribuye al objetivo corporativo de reducción de OPEX en un 15% a 2028.\n\nEstá vinculada a la Dimensión de Producción existente, donde se integraría como un nuevo producto dentro del portfolio de herramientas digitales de campo.",

  // Sección 5 — Descripción
  estrategia:
    "Implementar un sistema de monitoreo predictivo que ingeste datos de sensores ESP (presión, temperatura, vibración, amperaje) cada 15 minutos, aplique modelos de ML entrenados con datos históricos de 3 años, y genere alertas tempranas + recomendaciones de ajuste de parámetros operativos.",
  alcance:
    "Fase inicial: 50 pozos maduros con ESP del Área Norte (Cerro Dragón). Procesos alcanzados: monitoreo de bombeo, planificación de intervenciones, ajuste de frecuencia de variador.",
  interdependencias:
    "Depende de la disponibilidad de datos del sistema SCADA existente y de la infraestructura de conectividad de campo (proyecto de fibra óptica en curso). Coordinación con el equipo de Integridad de Pozos para validación de modelos.",
  escalabilidad:
    "Potencial de expansión a 300+ pozos en Área Norte y Sur. Replicable a otros métodos de extracción (bombeo mecánico, plunger lift). Posibilidad de integración con optimización de redes de recolección.",

  // Sección 6 — Impacto económico (corrientes de valor S/N)
  corrientesDeValor: [
    { corriente: "PRODUCCIÓN (m³)", impacto: "S" },
    { corriente: "OPEX (M USD)", impacto: "S" },
    { corriente: "CAPEX (M USD)", impacto: "N" },
    { corriente: "PRODUCTIVIDAD (HH)", impacto: "S" },
    { corriente: "EXP. AL RIESGO (%)", impacto: "S" },
    { corriente: "EMISIONES (MTnCO2 Eq)", impacto: "N" },
    { corriente: "CONS. ENERGÍA (MW)", impacto: "S" },
  ],

  // Sección 7 — Gestión del cambio
  desafiosGestionCambio:
    "Adopción por parte de supervisores de campo con baja madurez digital. Resistencia al cambio en procesos de decisión que hoy son manuales y basados en experiencia. Necesidad de capacitación en interpretación de dashboards predictivos. Integración cultural del dato como insumo para la toma de decisiones operativas.",
  areasParticipacion: [
    { area: "Producción — Área Norte", tipo: "Involucrada" },
    { area: "Ingeniería de Reservorios", tipo: "Involucrada" },
    { area: "IT — Infraestructura", tipo: "Involucrada" },
    { area: "Mantenimiento de Pozos", tipo: "Interesada" },
    { area: "Planificación Upstream", tipo: "Interesada" },
    { area: "HSE", tipo: "Interesada" },
  ],

  // Sección 8 — Journey/hitos
  hitos: [
    { hito: "Kick-off y relevamiento de datos", fecha: "Jun 2026" },
    { hito: "MVP — Modelo predictivo para 10 pozos piloto", fecha: "Sep 2026" },
    { hito: "Validación en campo + ajuste de modelos", fecha: "Nov 2026" },
    { hito: "Rollout a 50 pozos Área Norte", fecha: "Feb 2027" },
    { hito: "Integración con SCADA + alertas automáticas", fecha: "May 2027" },
  ],

  // Sección 9 — Equipo
  equipoPropuesta: [
    { rol: "Promotor", nombre: "Alejandro Torres", posicion: "Gte. Producción Norte", vp: "VP Upstream" },
    { rol: "Líder Técnico", nombre: "María López", posicion: "Ing. Senior Reservorios", vp: "VP Upstream" },
    { rol: "Data Scientist", nombre: "Pablo Fernández", posicion: "Analista de Datos", vp: "VP Tecnología" },
    { rol: "Referente IT", nombre: "Carolina Ruiz", posicion: "Arq. de Soluciones", vp: "VP Tecnología" },
  ],
  responsablesGate: [
    { rol: "Sponsor", nombre: "Ricardo Méndez", posicion: "VP Upstream", area: "Upstream" },
    { rol: "Business Owner", nombre: "Julián García", posicion: "Dir. Producción", area: "Producción" },
    { rol: "Área Transf.", nombre: "Martina Delgado", posicion: "Coord. Transf. Digital", area: "Transformación" },
    { rol: "Portfolio", nombre: "Sebastián Ortiz", posicion: "Líder Portfolio", area: "Transformación" },
  ],
  equipoMetodologia: [
    { rol: "Scrum Master", nombre: "Laura Vázquez", posicion: "SM Senior", vp: "VP Tecnología" },
    { rol: "Facilitador", nombre: "Diego Romero", posicion: "Consultor IVD", vp: "VP Tecnología" },
  ],
};

// ═══════════════════════════════════════════════════════════════
// HELPERS — Funciones de slide reutilizables
// ═══════════════════════════════════════════════════════════════

function addFooter(slide, slideNum, totalSlides) {
  // Línea separadora sutil
  slide.addShape("line", {
    x: MARGIN,
    y: SLIDE_H - 0.45,
    w: CONTENT_W,
    h: 0,
    line: { color: PAE.MID_GRAY, width: 0.5 },
  });
  // Texto izquierdo
  slide.addText("Pan American Energy — Transformación Digital", {
    x: MARGIN,
    y: SLIDE_H - 0.4,
    w: 5,
    h: 0.3,
    fontSize: 7,
    fontFace: PAE.FONT,
    color: PAE.TEXT_MUTED,
    margin: 0,
  });
  // Número de slide
  slide.addText(`${slideNum} / ${totalSlides}`, {
    x: SLIDE_W - MARGIN - 1.5,
    y: SLIDE_H - 0.4,
    w: 1.5,
    h: 0.3,
    fontSize: 7,
    fontFace: PAE.FONT,
    color: PAE.TEXT_MUTED,
    align: "right",
    margin: 0,
  });
}

function addSectionHeader(slide, sectionNumber, sectionTitle) {
  // Número de sección en círculo azul
  slide.addShape("oval", {
    x: MARGIN,
    y: 0.35,
    w: 0.35,
    h: 0.35,
    fill: { color: PAE.BLUE },
  });
  slide.addText(String(sectionNumber), {
    x: MARGIN,
    y: 0.35,
    w: 0.35,
    h: 0.35,
    fontSize: 12,
    fontFace: PAE.FONT,
    color: PAE.WHITE,
    align: "center",
    valign: "middle",
    bold: true,
    margin: 0,
  });
  // Título de sección
  slide.addText(sectionTitle, {
    x: MARGIN + 0.5,
    y: 0.3,
    w: CONTENT_W - 0.5,
    h: 0.45,
    fontSize: 22,
    fontFace: PAE.FONT,
    color: PAE.DARK,
    bold: true,
    margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════
// GENERACIÓN DE SLIDES
// ═══════════════════════════════════════════════════════════════

async function generatePPTX() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Plataforma PAE — Gestión de Portfolio";
  pres.title = `${formData.formLabel} — ${formData.initiativeName}`;
  pres.subject = `Formulario ${formData.formType} para Gateway ${formData.gatewayNumber}`;

  const TOTAL_SLIDES = 11;

  // ─── SLIDE 1: Portada ───────────────────────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.DARK };

    // Barra roja superior
    slide.addShape("rect", {
      x: 0, y: 0, w: SLIDE_W, h: 0.06,
      fill: { color: PAE.RED },
    });

    // Badge de etapa
    slide.addShape("roundedRectangle", {
      x: MARGIN, y: 1.0, w: 1.6, h: 0.35,
      fill: { color: PAE.RED },
      rectRadius: 0.05,
    });
    slide.addText(`ETAPA 1 — ${formData.formLabel.toUpperCase()}`, {
      x: MARGIN, y: 1.0, w: 1.6, h: 0.35,
      fontSize: 9, fontFace: PAE.FONT, color: PAE.WHITE,
      bold: true, align: "center", valign: "middle", margin: 0,
    });

    // Título de la iniciativa
    slide.addText(formData.initiativeName, {
      x: MARGIN, y: 1.6, w: 7, h: 1.2,
      fontSize: 32, fontFace: PAE.FONT, color: PAE.WHITE,
      bold: true, margin: 0,
    });

    // Metadata
    const metaLines = [
      { text: `Dimensión: ${formData.dimension}  |  UG: ${formData.unidadGestion}`, options: { fontSize: 12, color: PAE.MID_GRAY, breakLine: true } },
      { text: `Tipo: ${formData.tipoIniciativa}  |  ${formData.date}  |  ${formData.version}`, options: { fontSize: 11, color: PAE.TEXT_MUTED, breakLine: true } },
    ];
    slide.addText(metaLines, {
      x: MARGIN, y: 3.1, w: 7, h: 0.7,
      fontFace: PAE.FONT, margin: 0,
    });

    // Línea verde decorativa vertical derecha
    slide.addShape("rect", {
      x: SLIDE_W - 0.4, y: 0.8, w: 0.05, h: 3.5,
      fill: { color: PAE.GREEN },
    });

    // Logo text PAE
    slide.addText("Pan American Energy", {
      x: MARGIN, y: SLIDE_H - 0.7, w: 4, h: 0.4,
      fontSize: 14, fontFace: PAE.FONT, color: PAE.BLUE,
      bold: true, margin: 0,
    });
    slide.addText("Plataforma de Gestión de Portfolio — Transformación Digital", {
      x: MARGIN, y: SLIDE_H - 0.4, w: 5, h: 0.3,
      fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_MUTED, margin: 0,
    });

    // Gateway info
    slide.addText(`Gateway ${formData.gatewayNumber}`, {
      x: SLIDE_W - MARGIN - 2, y: SLIDE_H - 0.7, w: 2, h: 0.4,
      fontSize: 11, fontFace: PAE.FONT, color: PAE.TEXT_MUTED,
      align: "right", margin: 0,
    });
  }

  // ─── SLIDE 2: Propósito ─────────────────────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 1, "Propósito");

    // Texto del propósito en caja con borde izquierdo azul
    slide.addShape("rect", {
      x: MARGIN, y: 1.0, w: 0.05, h: 3.5,
      fill: { color: PAE.BLUE },
    });
    slide.addText(formData.proposito, {
      x: MARGIN + 0.25, y: 1.0, w: CONTENT_W - 0.25, h: 3.5,
      fontSize: 13, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY,
      lineSpacingMultiple: 1.4,
      valign: "top", margin: 0,
    });

    addFooter(slide, 2, TOTAL_SLIDES);
  }

  // ─── SLIDE 3: Necesidad / Dolores ───────────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 2, "Indicadores de Impacto");

    // Tabla de dolores
    const headerRow = [
      { text: "Stakeholder", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, align: "left", valign: "middle" } },
      { text: "KPI (Indicador de Impacto)", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, align: "left", valign: "middle" } },
      { text: "Métrica", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, align: "left", valign: "middle" } },
      { text: "Inicio", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, align: "center", valign: "middle" } },
      { text: "Target", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, align: "center", valign: "middle" } },
      { text: "Prior.", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, align: "center", valign: "middle" } },
    ];

    const dataRows = formData.dolores.map((d, i) => {
      const bgColor = i % 2 === 0 ? PAE.LIGHT_GRAY : PAE.WHITE;
      const prioColor = d.prioridad === "Alta" ? PAE.RED : PAE.BLUE;
      return [
        { text: d.stakeholder, options: { fill: { color: bgColor }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, valign: "middle" } },
        { text: d.dolor, options: { fill: { color: bgColor }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, valign: "middle" } },
        { text: d.metrica, options: { fill: { color: bgColor }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY, valign: "middle" } },
        { text: d.datoInicio, options: { fill: { color: bgColor }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, align: "center", valign: "middle" } },
        { text: d.target, options: { fill: { color: bgColor }, fontSize: 8, fontFace: PAE.FONT, color: PAE.GREEN, bold: true, align: "center", valign: "middle" } },
        { text: d.prioridad, options: { fill: { color: bgColor }, fontSize: 8, fontFace: PAE.FONT, color: prioColor, bold: true, align: "center", valign: "middle" } },
      ];
    });

    slide.addTable([headerRow, ...dataRows], {
      x: MARGIN, y: 1.0, w: CONTENT_W,
      colW: [1.4, 2.8, 1.6, 0.9, 1.0, 0.7],
      rowH: [0.35, 0.55, 0.55, 0.55, 0.55],
      border: { type: "solid", pt: 0.5, color: PAE.MID_GRAY },
      margin: [4, 6, 4, 6],
    });

    addFooter(slide, 3, TOTAL_SLIDES);
  }

  // ─── SLIDE 4: Alineación Estratégica ────────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 3, "Alineación Estratégica");

    slide.addText(formData.alineacionEstrategica, {
      x: MARGIN, y: 1.0, w: CONTENT_W, h: 2.5,
      fontSize: 13, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY,
      lineSpacingMultiple: 1.4,
      valign: "top", margin: 0,
    });

    // Callout cards — Desafío y Proyecto
    const cardW = (CONTENT_W - 0.3) / 2;
    const cardY = 3.7;

    // Card 1 - Desafío
    slide.addShape("rect", {
      x: MARGIN, y: cardY, w: cardW, h: 0.9,
      fill: { color: PAE.LIGHT_GRAY },
    });
    slide.addShape("rect", {
      x: MARGIN, y: cardY, w: 0.05, h: 0.9,
      fill: { color: PAE.RED },
    });
    slide.addText([
      { text: "DESAFÍO ESTRATÉGICO", options: { fontSize: 8, bold: true, color: PAE.RED, breakLine: true } },
      { text: "Eficiencia Operativa del Upstream", options: { fontSize: 11, color: PAE.TEXT_PRIMARY } },
    ], {
      x: MARGIN + 0.2, y: cardY, w: cardW - 0.3, h: 0.9,
      fontFace: PAE.FONT, valign: "middle", margin: 0,
    });

    // Card 2 - Proyecto
    slide.addShape("rect", {
      x: MARGIN + cardW + 0.3, y: cardY, w: cardW, h: 0.9,
      fill: { color: PAE.LIGHT_GRAY },
    });
    slide.addShape("rect", {
      x: MARGIN + cardW + 0.3, y: cardY, w: 0.05, h: 0.9,
      fill: { color: PAE.BLUE },
    });
    slide.addText([
      { text: "PROYECTO", options: { fontSize: 8, bold: true, color: PAE.BLUE, breakLine: true } },
      { text: "Digitalización de Operaciones de Campo", options: { fontSize: 11, color: PAE.TEXT_PRIMARY } },
    ], {
      x: MARGIN + cardW + 0.5, y: cardY, w: cardW - 0.3, h: 0.9,
      fontFace: PAE.FONT, valign: "middle", margin: 0,
    });

    addFooter(slide, 4, TOTAL_SLIDES);
  }

  // ─── SLIDE 5: Descripción — Estrategia y Beneficios ────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 4, "Descripción de la Iniciativa");

    // Dos columnas
    const colW = (CONTENT_W - 0.4) / 2;

    // Columna izquierda — Estrategia
    slide.addText("Estrategia y beneficios", {
      x: MARGIN, y: 1.0, w: colW, h: 0.3,
      fontSize: 12, fontFace: PAE.FONT, color: PAE.BLUE,
      bold: true, margin: 0,
    });
    slide.addText(formData.estrategia, {
      x: MARGIN, y: 1.4, w: colW, h: 2.0,
      fontSize: 10, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY,
      lineSpacingMultiple: 1.3, valign: "top", margin: 0,
    });

    // Columna derecha — Alcance
    slide.addText("Alcance inicial", {
      x: MARGIN + colW + 0.4, y: 1.0, w: colW, h: 0.3,
      fontSize: 12, fontFace: PAE.FONT, color: PAE.BLUE,
      bold: true, margin: 0,
    });
    slide.addText(formData.alcance, {
      x: MARGIN + colW + 0.4, y: 1.4, w: colW, h: 1.2,
      fontSize: 10, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY,
      lineSpacingMultiple: 1.3, valign: "top", margin: 0,
    });

    // Separator
    slide.addShape("line", {
      x: MARGIN, y: 3.6, w: CONTENT_W, h: 0,
      line: { color: PAE.MID_GRAY, width: 0.5 },
    });

    // Interdependencias y escalabilidad comprimidos
    slide.addText("Interdependencias", {
      x: MARGIN, y: 3.8, w: colW, h: 0.25,
      fontSize: 10, fontFace: PAE.FONT, color: PAE.RED,
      bold: true, margin: 0,
    });
    slide.addText(formData.interdependencias, {
      x: MARGIN, y: 4.1, w: colW, h: 0.9,
      fontSize: 9, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY,
      lineSpacingMultiple: 1.2, valign: "top", margin: 0,
    });

    slide.addText("Escalabilidad", {
      x: MARGIN + colW + 0.4, y: 3.8, w: colW, h: 0.25,
      fontSize: 10, fontFace: PAE.FONT, color: PAE.GREEN,
      bold: true, margin: 0,
    });
    slide.addText(formData.escalabilidad, {
      x: MARGIN + colW + 0.4, y: 4.1, w: colW, h: 0.9,
      fontSize: 9, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY,
      lineSpacingMultiple: 1.2, valign: "top", margin: 0,
    });

    addFooter(slide, 5, TOTAL_SLIDES);
  }

  // ─── SLIDE 6: Impacto Económico (Corrientes de Valor S/N) ──
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 5, "Impacto Económico — Corrientes de Valor");

    const cardW = (CONTENT_W - 0.6) / 3;
    const startY = 1.1;

    formData.corrientesDeValor.forEach((cv, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = MARGIN + col * (cardW + 0.3);
      const y = startY + row * 1.5;
      const hasImpact = cv.impacto === "S";

      // Card background
      slide.addShape("rect", {
        x, y, w: cardW, h: 1.2,
        fill: { color: hasImpact ? PAE.LIGHT_GRAY : PAE.WHITE },
        line: { color: PAE.MID_GRAY, width: 0.5 },
      });

      // Indicator dot
      slide.addShape("oval", {
        x: x + 0.15, y: y + 0.15, w: 0.2, h: 0.2,
        fill: { color: hasImpact ? PAE.GREEN : PAE.MID_GRAY },
      });
      slide.addText(hasImpact ? "S" : "N", {
        x: x + 0.15, y: y + 0.15, w: 0.2, h: 0.2,
        fontSize: 8, fontFace: PAE.FONT, color: PAE.WHITE,
        bold: true, align: "center", valign: "middle", margin: 0,
      });

      // Corriente name
      slide.addText(cv.corriente, {
        x: x + 0.45, y: y + 0.1, w: cardW - 0.6, h: 0.5,
        fontSize: 10, fontFace: PAE.FONT,
        color: hasImpact ? PAE.TEXT_PRIMARY : PAE.TEXT_MUTED,
        bold: hasImpact, valign: "middle", margin: 0,
      });

      if (hasImpact) {
        slide.addText("Con impacto esperado", {
          x: x + 0.45, y: y + 0.7, w: cardW - 0.6, h: 0.3,
          fontSize: 8, fontFace: PAE.FONT, color: PAE.GREEN, margin: 0,
        });
      }
    });

    // Nota al pie
    slide.addText("En Etapa 2 (Dimensionamiento) se detallan valores cuantificados a 5 años por corriente y palanca de valor.", {
      x: MARGIN, y: 4.6, w: CONTENT_W, h: 0.3,
      fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_MUTED,
      italic: true, margin: 0,
    });

    addFooter(slide, 6, TOTAL_SLIDES);
  }

  // ─── SLIDE 7: Gestión del Cambio ────────────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 6, "Gestión del Cambio");

    // Desafíos
    slide.addText("Desafíos identificados", {
      x: MARGIN, y: 1.0, w: CONTENT_W, h: 0.25,
      fontSize: 11, fontFace: PAE.FONT, color: PAE.RED,
      bold: true, margin: 0,
    });
    slide.addText(formData.desafiosGestionCambio, {
      x: MARGIN, y: 1.35, w: CONTENT_W, h: 1.0,
      fontSize: 10, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY,
      lineSpacingMultiple: 1.3, valign: "top", margin: 0,
    });

    // Tabla de áreas
    slide.addText("Áreas participantes", {
      x: MARGIN, y: 2.6, w: CONTENT_W, h: 0.25,
      fontSize: 11, fontFace: PAE.FONT, color: PAE.BLUE,
      bold: true, margin: 0,
    });

    const aHeaderRow = [
      { text: "Área", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, valign: "middle" } },
      { text: "Tipo de involucramiento", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, valign: "middle" } },
    ];
    const aDataRows = formData.areasParticipacion.map((a, i) => {
      const bg = i % 2 === 0 ? PAE.LIGHT_GRAY : PAE.WHITE;
      const tipoColor = a.tipo === "Involucrada" ? PAE.BLUE : PAE.GREEN;
      return [
        { text: a.area, options: { fill: { color: bg }, fontSize: 9, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, valign: "middle" } },
        { text: a.tipo, options: { fill: { color: bg }, fontSize: 9, fontFace: PAE.FONT, color: tipoColor, bold: true, valign: "middle" } },
      ];
    });

    slide.addTable([aHeaderRow, ...aDataRows], {
      x: MARGIN, y: 2.95, w: CONTENT_W,
      colW: [5.5, 3.3],
      rowH: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
      border: { type: "solid", pt: 0.5, color: PAE.MID_GRAY },
      margin: [3, 6, 3, 6],
    });

    addFooter(slide, 7, TOTAL_SLIDES);
  }

  // ─── SLIDE 8: Journey / Hitos ───────────────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 7, "Journey / Hitos Preliminares");

    // Timeline visual
    const timelineY = 2.0;
    const timelineW = CONTENT_W - 0.5;
    const stepW = timelineW / formData.hitos.length;

    // Línea horizontal
    slide.addShape("line", {
      x: MARGIN + 0.25, y: timelineY + 0.5,
      w: timelineW, h: 0,
      line: { color: PAE.BLUE, width: 2 },
    });

    formData.hitos.forEach((h, i) => {
      const x = MARGIN + 0.25 + i * stepW;
      const isFirst = i === 0;
      const isLast = i === formData.hitos.length - 1;
      const dotColor = i === 0 ? PAE.GREEN : i < 2 ? PAE.BLUE : PAE.TEXT_MUTED;

      // Dot on timeline
      slide.addShape("oval", {
        x: x - 0.12, y: timelineY + 0.38,
        w: 0.24, h: 0.24,
        fill: { color: dotColor },
        line: { color: PAE.WHITE, width: 2 },
      });

      // Hito text (alternating above/below)
      const isAbove = i % 2 === 0;
      const textY = isAbove ? timelineY - 0.8 : timelineY + 0.85;

      // Connector line
      slide.addShape("line", {
        x: x, y: isAbove ? timelineY + 0.38 : timelineY + 0.62,
        w: 0, h: 0.3,
        line: { color: PAE.MID_GRAY, width: 0.5 },
      });

      slide.addText([
        { text: h.fecha, options: { fontSize: 8, bold: true, color: PAE.BLUE, breakLine: true } },
        { text: h.hito, options: { fontSize: 8, color: PAE.TEXT_PRIMARY } },
      ], {
        x: x - stepW * 0.4, y: textY, w: stepW * 0.8, h: 0.7,
        fontFace: PAE.FONT, align: "center", valign: isAbove ? "bottom" : "top", margin: 0,
      });
    });

    // Nota
    slide.addText("Fechas preliminares sujetas a cambios por alcance, bloqueantes o prioridades.", {
      x: MARGIN, y: 4.6, w: CONTENT_W, h: 0.3,
      fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_MUTED,
      italic: true, margin: 0,
    });

    addFooter(slide, 8, TOTAL_SLIDES);
  }

  // ─── SLIDE 9: Equipo de Trabajo ─────────────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 8, "Equipo de Trabajo — Etapa Propuesta");

    // Equipo propuesta
    slide.addText("Equipo Propuesta", {
      x: MARGIN, y: 1.0, w: CONTENT_W / 2, h: 0.25,
      fontSize: 11, fontFace: PAE.FONT, color: PAE.BLUE,
      bold: true, margin: 0,
    });

    const eqHeader = [
      { text: "Rol", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 8, fontFace: PAE.FONT, valign: "middle" } },
      { text: "Nombre", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 8, fontFace: PAE.FONT, valign: "middle" } },
      { text: "Posición", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 8, fontFace: PAE.FONT, valign: "middle" } },
      { text: "VP", options: { fill: { color: PAE.BLUE }, color: PAE.WHITE, bold: true, fontSize: 8, fontFace: PAE.FONT, valign: "middle" } },
    ];
    const eqRows = formData.equipoPropuesta.map((m, i) => {
      const bg = i % 2 === 0 ? PAE.LIGHT_GRAY : PAE.WHITE;
      return [
        { text: m.rol, options: { fill: { color: bg }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, bold: true, valign: "middle" } },
        { text: m.nombre, options: { fill: { color: bg }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, valign: "middle" } },
        { text: m.posicion, options: { fill: { color: bg }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY, valign: "middle" } },
        { text: m.vp, options: { fill: { color: bg }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY, valign: "middle" } },
      ];
    });

    slide.addTable([eqHeader, ...eqRows], {
      x: MARGIN, y: 1.35, w: CONTENT_W,
      colW: [1.5, 2.2, 2.6, 2.5],
      rowH: [0.28, 0.28, 0.28, 0.28, 0.28],
      border: { type: "solid", pt: 0.5, color: PAE.MID_GRAY },
      margin: [3, 5, 3, 5],
    });

    // Equipo metodología
    slide.addText("Equipo Metodología", {
      x: MARGIN, y: 3.0, w: CONTENT_W / 2, h: 0.25,
      fontSize: 11, fontFace: PAE.FONT, color: PAE.GREEN,
      bold: true, margin: 0,
    });

    const metHeader = [
      { text: "Rol", options: { fill: { color: PAE.GREEN }, color: PAE.WHITE, bold: true, fontSize: 8, fontFace: PAE.FONT, valign: "middle" } },
      { text: "Nombre", options: { fill: { color: PAE.GREEN }, color: PAE.WHITE, bold: true, fontSize: 8, fontFace: PAE.FONT, valign: "middle" } },
      { text: "Posición", options: { fill: { color: PAE.GREEN }, color: PAE.WHITE, bold: true, fontSize: 8, fontFace: PAE.FONT, valign: "middle" } },
      { text: "VP", options: { fill: { color: PAE.GREEN }, color: PAE.WHITE, bold: true, fontSize: 8, fontFace: PAE.FONT, valign: "middle" } },
    ];
    const metRows = formData.equipoMetodologia.map((m, i) => {
      const bg = i % 2 === 0 ? PAE.LIGHT_GRAY : PAE.WHITE;
      return [
        { text: m.rol, options: { fill: { color: bg }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, bold: true, valign: "middle" } },
        { text: m.nombre, options: { fill: { color: bg }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, valign: "middle" } },
        { text: m.posicion, options: { fill: { color: bg }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY, valign: "middle" } },
        { text: m.vp, options: { fill: { color: bg }, fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY, valign: "middle" } },
      ];
    });

    slide.addTable([metHeader, ...metRows], {
      x: MARGIN, y: 3.35, w: CONTENT_W,
      colW: [1.5, 2.2, 2.6, 2.5],
      rowH: [0.28, 0.28, 0.28],
      border: { type: "solid", pt: 0.5, color: PAE.MID_GRAY },
      margin: [3, 5, 3, 5],
    });

    addFooter(slide, 9, TOTAL_SLIDES);
  }

  // ─── SLIDE 10: Responsables Gateway ─────────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.WHITE };
    addSectionHeader(slide, 9, `Responsables — Gateway ${formData.gatewayNumber}`);

    const gHeader = [
      { text: "Rol", options: { fill: { color: PAE.RED }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, valign: "middle" } },
      { text: "Nombre", options: { fill: { color: PAE.RED }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, valign: "middle" } },
      { text: "Posición", options: { fill: { color: PAE.RED }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, valign: "middle" } },
      { text: "Área", options: { fill: { color: PAE.RED }, color: PAE.WHITE, bold: true, fontSize: 9, fontFace: PAE.FONT, valign: "middle" } },
    ];
    const gRows = formData.responsablesGate.map((m, i) => {
      const bg = i % 2 === 0 ? PAE.LIGHT_GRAY : PAE.WHITE;
      return [
        { text: m.rol, options: { fill: { color: bg }, fontSize: 9, fontFace: PAE.FONT, color: PAE.RED, bold: true, valign: "middle" } },
        { text: m.nombre, options: { fill: { color: bg }, fontSize: 9, fontFace: PAE.FONT, color: PAE.TEXT_PRIMARY, valign: "middle" } },
        { text: m.posicion, options: { fill: { color: bg }, fontSize: 9, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY, valign: "middle" } },
        { text: m.area, options: { fill: { color: bg }, fontSize: 9, fontFace: PAE.FONT, color: PAE.TEXT_SECONDARY, valign: "middle" } },
      ];
    });

    slide.addTable([gHeader, ...gRows], {
      x: MARGIN, y: 1.2, w: CONTENT_W,
      colW: [1.5, 2.5, 2.5, 2.3],
      rowH: [0.35, 0.4, 0.4, 0.4, 0.4],
      border: { type: "solid", pt: 0.5, color: PAE.MID_GRAY },
      margin: [4, 6, 4, 6],
    });

    // Nota sobre unanimidad
    slide.addShape("rect", {
      x: MARGIN, y: 3.6, w: CONTENT_W, h: 0.8,
      fill: { color: PAE.LIGHT_GRAY },
    });
    slide.addShape("rect", {
      x: MARGIN, y: 3.6, w: 0.05, h: 0.8,
      fill: { color: PAE.RED },
    });
    slide.addText([
      { text: "Resolución por unanimidad", options: { fontSize: 10, bold: true, color: PAE.RED, breakLine: true } },
      { text: "Todos los aprobadores deben votar para resolver el gateway. Estados posibles: Aprobado, Feedback (vuelve al editor), Pausa, Rechazado, Cambio de área.", options: { fontSize: 9, color: PAE.TEXT_SECONDARY } },
    ], {
      x: MARGIN + 0.25, y: 3.6, w: CONTENT_W - 0.4, h: 0.8,
      fontFace: PAE.FONT, valign: "middle", margin: 0,
    });

    addFooter(slide, 10, TOTAL_SLIDES);
  }

  // ─── SLIDE 11: Próximos Pasos / Cierre ──────────────────────
  {
    const slide = pres.addSlide();
    slide.background = { color: PAE.DARK };

    // Barra roja superior
    slide.addShape("rect", {
      x: 0, y: 0, w: SLIDE_W, h: 0.06,
      fill: { color: PAE.RED },
    });

    slide.addText("Próximos Pasos", {
      x: MARGIN, y: 0.8, w: CONTENT_W, h: 0.5,
      fontSize: 28, fontFace: PAE.FONT, color: PAE.WHITE,
      bold: true, margin: 0,
    });

    const steps = [
      "Presentación en reunión de Gateway 1 con sponsors y stakeholders",
      "Obtener aprobación unánime para avanzar a Etapa 2 — Dimensionamiento",
      "Definir líder de siguiente etapa (Promotor, LD o PO)",
      "Asignar equipo de dimensionamiento y aprobadores para Gateway 2",
      "Iniciar relevamiento técnico detallado y estudio de factibilidad",
    ];

    steps.forEach((step, i) => {
      const y = 1.6 + i * 0.65;

      // Number circle
      slide.addShape("oval", {
        x: MARGIN, y: y, w: 0.3, h: 0.3,
        fill: { color: i === 0 ? PAE.RED : PAE.BLUE },
      });
      slide.addText(String(i + 1), {
        x: MARGIN, y: y, w: 0.3, h: 0.3,
        fontSize: 11, fontFace: PAE.FONT, color: PAE.WHITE,
        bold: true, align: "center", valign: "middle", margin: 0,
      });

      // Step text
      slide.addText(step, {
        x: MARGIN + 0.5, y: y, w: CONTENT_W - 0.5, h: 0.3,
        fontSize: 12, fontFace: PAE.FONT, color: PAE.WHITE,
        valign: "middle", margin: 0,
      });
    });

    // Línea verde decorativa
    slide.addShape("rect", {
      x: SLIDE_W - 0.4, y: 0.8, w: 0.05, h: 3.5,
      fill: { color: PAE.GREEN },
    });

    // Footer
    slide.addText("Pan American Energy", {
      x: MARGIN, y: SLIDE_H - 0.7, w: 4, h: 0.4,
      fontSize: 14, fontFace: PAE.FONT, color: PAE.BLUE,
      bold: true, margin: 0,
    });
    slide.addText(`${formData.initiativeName} — ${formData.formLabel} — ${formData.date}`, {
      x: MARGIN, y: SLIDE_H - 0.4, w: 6, h: 0.3,
      fontSize: 8, fontFace: PAE.FONT, color: PAE.TEXT_MUTED, margin: 0,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Guardar archivo
  // ═══════════════════════════════════════════════════════════════
  const fileName = "PAE_F1_Propuesta_Optimizacion_Predictiva.pptx";
  await pres.writeFile({ fileName: `/home/claude/${fileName}` });
  console.log(`✅ PPTX generado: ${fileName}`);
  console.log(`   Slides: ${TOTAL_SLIDES}`);
  console.log(`   Formulario: ${formData.formType} — ${formData.formLabel}`);
  console.log(`   Iniciativa: ${formData.initiativeName}`);
}

generatePPTX().catch((err) => {
  console.error("❌ Error generando PPTX:", err);
  process.exit(1);
});
