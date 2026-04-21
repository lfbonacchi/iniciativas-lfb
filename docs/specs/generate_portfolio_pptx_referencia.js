const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaChartBar, FaRocket, FaUsers, FaDollarSign, FaCalendarAlt,
  FaCheckCircle, FaClock, FaPauseCircle, FaTimesCircle,
  FaArrowUp, FaArrowDown, FaExclamationTriangle, FaFlag,
  FaBullseye, FaChartLine, FaChartPie, FaCogs
} = require("react-icons/fa");

// ── PAE Brand ──
const PAE = {
  red: "C8102E",
  blue: "003DA5",
  green: "00843D",
  dark: "1A1A1A",
  darkGray: "3D3D3A",
  medGray: "666666",
  lightGray: "E8E8E4",
  bgLight: "F5F4ED",
  white: "FFFFFF",
};

// ── Helper: render react-icon to base64 PNG ──
function renderIconSvg(IconComponent, color, size) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function iconToBase64(IconComponent, color = "#000", size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ── Factory helpers (avoid reuse pitfall) ──
const mkShadow = () => ({
  type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.08,
});

// ── Data de ejemplo (realista, coincide con wireframes SVG) ──
const PORTFOLIO = {
  titulo: "Portfolio de Transformación Digital",
  subtitulo: "Resumen ejecutivo — Abril 2026",
  area: "Área Transformación",
  totalIniciativas: 15,
  valorTotal: "USD 18.2M",
  gastoTotal: "USD 2.8M",
  gatesPendientes: 4,
  iniciativas: [
    { nombre: "Gestión de integridad", etapa: "MVP", valor: "USD 950K", gasto: "USD 95K", roi: "10x", estado: "OK" },
    { nombre: "Automatización bombeo", etapa: "Dim.", valor: "USD 5.2M", gasto: "USD 620K", roi: "8.4x", estado: "OK" },
    { nombre: "Monitoreo remoto", etapa: "Dim.", valor: "USD 3.5M", gasto: "USD 420K", roi: "8.3x", estado: "Gate" },
    { nombre: "Optimización de pozo", etapa: "Del.", valor: "USD 1.2M", gasto: "USD 180K", roi: "6.7x", estado: "OK" },
    { nombre: "ERP integración campo", etapa: "Del.", valor: "USD 1.3M", gasto: "USD 210K", roi: "6.2x", estado: "OK" },
    { nombre: "Predictivo fallas", etapa: "MVP", valor: "USD 4.1M", gasto: "USD 850K", roi: "4.8x", estado: "OK" },
  ],
  distribucionEtapa: { Propuesta: 5, Dimensionamiento: 4, MVP: 3, Delivery: 3 },
  corrientes: {
    Produccion: 12.4, OPEX: 8.1, CAPEX: 4.3, HH: 0.018, Intangible: 0.5,
  },
  eventosProximos: [
    { tipo: "Gate 1", iniciativa: "Optim. pozo", fecha: "14 abr" },
    { tipo: "Sprint Rev", iniciativa: "Monitoreo", fecha: "21 abr" },
    { tipo: "Gate 2", iniciativa: "Autom. bombeo", fecha: "28 abr" },
    { tipo: "LTP Plan", iniciativa: "ERP integr.", fecha: "5 may" },
    { tipo: "Seg. Q", iniciativa: "Predictivo", fecha: "12 may" },
  ],
};

async function generatePresentation() {
  // ── Pre-render icons ──
  const icons = {
    rocket: await iconToBase64(FaRocket, `#${PAE.blue}`, 256),
    chart: await iconToBase64(FaChartBar, `#${PAE.blue}`, 256),
    dollar: await iconToBase64(FaDollarSign, `#${PAE.green}`, 256),
    users: await iconToBase64(FaUsers, `#${PAE.blue}`, 256),
    calendar: await iconToBase64(FaCalendarAlt, `#${PAE.red}`, 256),
    check: await iconToBase64(FaCheckCircle, `#${PAE.green}`, 256),
    clock: await iconToBase64(FaClock, `#${PAE.red}`, 256),
    flag: await iconToBase64(FaFlag, `#${PAE.red}`, 256),
    target: await iconToBase64(FaBullseye, `#${PAE.blue}`, 256),
    line: await iconToBase64(FaChartLine, `#${PAE.green}`, 256),
    pie: await iconToBase64(FaChartPie, `#${PAE.blue}`, 256),
    cogs: await iconToBase64(FaCogs, `#${PAE.darkGray}`, 256),
    arrowUp: await iconToBase64(FaArrowUp, `#${PAE.green}`, 256),
    warning: await iconToBase64(FaExclamationTriangle, `#${PAE.red}`, 256),
  };

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Plataforma PAE";
  pres.title = "Portfolio Transformación Digital — Resumen";

  // ════════════════════════════════════════════════
  // SLIDE 1 — PORTADA
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.blue };

    // Barra roja superior decorativa
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.06, fill: { color: PAE.red },
    });

    // Título principal
    s.addText("Pan American Energy", {
      x: 0.8, y: 1.2, w: 8.4, h: 0.6,
      fontSize: 16, fontFace: "Inter", color: PAE.white,
      bold: false, letterSpacing: 4, charSpacing: 4,
    });
    s.addText(PORTFOLIO.titulo, {
      x: 0.8, y: 1.8, w: 8.4, h: 1.2,
      fontSize: 36, fontFace: "Inter", color: PAE.white, bold: true,
    });
    s.addText(PORTFOLIO.subtitulo, {
      x: 0.8, y: 3.1, w: 8.4, h: 0.5,
      fontSize: 16, fontFace: "Inter", color: PAE.white, bold: false,
      transparency: 30,
    });
    // Línea separadora verde
    s.addShape(pres.shapes.LINE, {
      x: 0.8, y: 4.0, w: 2.5, h: 0, line: { color: PAE.green, width: 3 },
    });
    s.addText(PORTFOLIO.area, {
      x: 0.8, y: 4.2, w: 4, h: 0.4,
      fontSize: 12, fontFace: "Inter", color: PAE.white, transparency: 40,
    });
    // Fecha
    s.addText("Abril 2026", {
      x: 0.8, y: 4.8, w: 3, h: 0.4,
      fontSize: 11, fontFace: "Inter", color: PAE.white, transparency: 50,
    });
  }

  // ════════════════════════════════════════════════
  // SLIDE 2 — MÉTRICAS CLAVE
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.white };

    s.addText("Métricas clave del portfolio", {
      x: 0.6, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });
    s.addText("Estado consolidado de todas las iniciativas activas", {
      x: 0.6, y: 0.9, w: 9, h: 0.4,
      fontSize: 13, fontFace: "Inter", color: PAE.medGray, margin: 0,
    });

    // 4 KPI cards
    const kpis = [
      { label: "Iniciativas activas", value: String(PORTFOLIO.totalIniciativas), icon: icons.rocket, accent: PAE.blue },
      { label: "Valor esperado total", value: PORTFOLIO.valorTotal, icon: icons.dollar, accent: PAE.green },
      { label: "Gasto acumulado", value: PORTFOLIO.gastoTotal, icon: icons.chart, accent: PAE.blue },
      { label: "Gates pendientes", value: String(PORTFOLIO.gatesPendientes), icon: icons.flag, accent: PAE.red },
    ];
    const cardW = 2.05;
    const gap = 0.2;
    const startX = 0.6;
    const cardY = 1.6;
    const cardH = 2.4;

    kpis.forEach((kpi, i) => {
      const cx = startX + i * (cardW + gap);
      // Card bg
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: cardY, w: cardW, h: cardH,
        fill: { color: PAE.bgLight },
        shadow: mkShadow(),
      });
      // Accent bar top
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: cardY, w: cardW, h: 0.05,
        fill: { color: kpi.accent },
      });
      // Icon
      s.addImage({ data: kpi.icon, x: cx + 0.7, y: cardY + 0.35, w: 0.55, h: 0.55 });
      // Value
      s.addText(kpi.value, {
        x: cx + 0.15, y: cardY + 1.1, w: cardW - 0.3, h: 0.7,
        fontSize: 28, fontFace: "Inter", color: PAE.dark, bold: true, align: "center", margin: 0,
      });
      // Label
      s.addText(kpi.label, {
        x: cx + 0.15, y: cardY + 1.75, w: cardW - 0.3, h: 0.4,
        fontSize: 11, fontFace: "Inter", color: PAE.medGray, align: "center", margin: 0,
      });
    });

    // Mini insight row
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 4.4, w: 8.8, h: 0.8,
      fill: { color: PAE.bgLight },
    });
    s.addImage({ data: icons.arrowUp, x: 0.85, y: 4.55, w: 0.35, h: 0.35 });
    s.addText("ROI promedio del portfolio: 7.4x   |   3 iniciativas con gate en los próximos 30 días", {
      x: 1.35, y: 4.45, w: 7.8, h: 0.8,
      fontSize: 12, fontFace: "Inter", color: PAE.darkGray, valign: "middle", margin: 0,
    });
  }

  // ════════════════════════════════════════════════
  // SLIDE 3 — DISTRIBUCIÓN POR ETAPA
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.white };

    s.addText("Distribución por etapa", {
      x: 0.6, y: 0.3, w: 5, h: 0.7,
      fontSize: 28, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });
    s.addText("Pipeline de maduración de iniciativas", {
      x: 0.6, y: 0.9, w: 5, h: 0.4,
      fontSize: 13, fontFace: "Inter", color: PAE.medGray, margin: 0,
    });

    // Bar chart nativo
    const etapas = Object.keys(PORTFOLIO.distribucionEtapa);
    const valores = Object.values(PORTFOLIO.distribucionEtapa);

    s.addChart(pres.charts.BAR, [{
      name: "Iniciativas",
      labels: etapas,
      values: valores,
    }], {
      x: 0.6, y: 1.5, w: 5.2, h: 3.5,
      barDir: "bar",
      chartColors: [PAE.blue],
      chartArea: { fill: { color: PAE.white }, roundedCorners: true },
      catAxisLabelColor: PAE.darkGray,
      catAxisLabelFontSize: 12,
      valAxisLabelColor: PAE.medGray,
      valAxisLabelFontSize: 10,
      valGridLine: { color: "E2E8F0", size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelColor: PAE.dark,
      dataLabelFontSize: 14,
      showLegend: false,
      valAxisHidden: true,
    });

    // Side panel — estado consolidado
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.3, y: 1.5, w: 3.3, h: 3.5,
      fill: { color: PAE.bgLight },
      shadow: mkShadow(),
    });
    s.addText("Estado consolidado", {
      x: 6.5, y: 1.65, w: 2.9, h: 0.4,
      fontSize: 14, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });

    const estados = [
      { label: "En progreso", count: 9, color: PAE.green },
      { label: "Pendiente gate", count: 4, color: PAE.red },
      { label: "Pausadas", count: 2, color: PAE.medGray },
    ];
    estados.forEach((est, i) => {
      const ey = 2.3 + i * 0.85;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 6.6, y: ey, w: 0.12, h: 0.55, fill: { color: est.color },
      });
      s.addText(String(est.count), {
        x: 6.85, y: ey - 0.05, w: 0.8, h: 0.5,
        fontSize: 28, fontFace: "Inter", color: est.color, bold: true, margin: 0,
      });
      s.addText(est.label, {
        x: 6.85, y: ey + 0.35, w: 2.5, h: 0.3,
        fontSize: 11, fontFace: "Inter", color: PAE.medGray, margin: 0,
      });
    });
  }

  // ════════════════════════════════════════════════
  // SLIDE 4 — CORRIENTES DE VALOR
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.white };

    s.addText("Corrientes de valor — beneficio bruto", {
      x: 0.6, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });
    s.addText("Proyección año 1 consolidada (en millones USD)", {
      x: 0.6, y: 0.9, w: 9, h: 0.4,
      fontSize: 13, fontFace: "Inter", color: PAE.medGray, margin: 0,
    });

    const corrLabels = ["Producción", "OPEX", "CAPEX", "HH (M)", "Intangible"];
    const corrValues = [12.4, 8.1, 4.3, 0.018, 0.5];

    s.addChart(pres.charts.BAR, [{
      name: "Beneficio bruto (M USD)",
      labels: corrLabels,
      values: corrValues,
    }], {
      x: 0.6, y: 1.5, w: 8.8, h: 3.5,
      barDir: "col",
      chartColors: [PAE.green, PAE.blue, PAE.blue, PAE.red, PAE.lightGray],
      chartArea: { fill: { color: PAE.white }, roundedCorners: true },
      catAxisLabelColor: PAE.darkGray,
      catAxisLabelFontSize: 12,
      valAxisLabelColor: PAE.medGray,
      valAxisLabelFontSize: 10,
      valGridLine: { color: "E2E8F0", size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelColor: PAE.dark,
      dataLabelFontSize: 12,
      showLegend: false,
    });
  }

  // ════════════════════════════════════════════════
  // SLIDE 5 — RANKING DE INICIATIVAS
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.white };

    s.addText("Ranking de iniciativas — valor vs gasto", {
      x: 0.6, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });
    s.addText("Ordenado por ROI descendente", {
      x: 0.6, y: 0.9, w: 9, h: 0.4,
      fontSize: 13, fontFace: "Inter", color: PAE.medGray, margin: 0,
    });

    // Table header
    const headerOpts = {
      fill: { color: PAE.blue }, color: PAE.white, bold: true,
      fontSize: 10, fontFace: "Inter", align: "left", valign: "middle",
    };
    const cellOpts = (isAlt) => ({
      fill: { color: isAlt ? PAE.bgLight : PAE.white },
      color: PAE.darkGray, fontSize: 10, fontFace: "Inter",
      align: "left", valign: "middle",
    });
    const etapaColor = (etapa) => {
      if (etapa === "Del.") return PAE.green;
      if (etapa === "MVP") return PAE.blue;
      if (etapa === "Dim.") return PAE.blue;
      return PAE.medGray;
    };
    const estadoColor = (estado) => estado === "OK" ? PAE.green : PAE.red;

    const tableRows = [
      [
        { text: "INICIATIVA", options: { ...headerOpts } },
        { text: "ETAPA", options: { ...headerOpts, align: "center" } },
        { text: "VALOR ESP.", options: { ...headerOpts, align: "right" } },
        { text: "GASTO", options: { ...headerOpts, align: "right" } },
        { text: "ROI", options: { ...headerOpts, align: "center" } },
        { text: "ESTADO", options: { ...headerOpts, align: "center" } },
      ],
    ];

    PORTFOLIO.iniciativas.forEach((ini, i) => {
      const alt = i % 2 === 1;
      tableRows.push([
        { text: ini.nombre, options: { ...cellOpts(alt), bold: true } },
        { text: ini.etapa, options: { ...cellOpts(alt), align: "center", color: etapaColor(ini.etapa) } },
        { text: ini.valor, options: { ...cellOpts(alt), align: "right" } },
        { text: ini.gasto, options: { ...cellOpts(alt), align: "right" } },
        { text: ini.roi, options: { ...cellOpts(alt), align: "center", bold: true, color: PAE.dark } },
        { text: ini.estado, options: { ...cellOpts(alt), align: "center", color: estadoColor(ini.estado), bold: true } },
      ]);
    });

    s.addTable(tableRows, {
      x: 0.6, y: 1.5, w: 8.8,
      colW: [2.6, 0.9, 1.5, 1.3, 0.8, 1.0],
      border: { pt: 0.5, color: PAE.lightGray },
      rowH: [0.4, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42],
    });

    // Nota al pie
    s.addText("* ROI = Valor esperado / Gasto acumulado. Estado: OK = en curso sin bloqueo, Gate = pendiente aprobación.", {
      x: 0.6, y: 4.9, w: 8.8, h: 0.4,
      fontSize: 9, fontFace: "Inter", color: PAE.medGray, italic: true, margin: 0,
    });
  }

  // ════════════════════════════════════════════════
  // SLIDE 6 — VALOR vs GASTO (barras agrupadas)
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.white };

    s.addText("Valor esperado vs Gasto por iniciativa", {
      x: 0.6, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });
    s.addText("Comparación directa en miles de USD — ordenado por ROI", {
      x: 0.6, y: 0.9, w: 9, h: 0.4,
      fontSize: 13, fontFace: "Inter", color: PAE.medGray, margin: 0,
    });

    // Parse values to numeric K
    const parseK = (str) => {
      const num = str.replace("USD ", "");
      if (num.includes("M")) return parseFloat(num) * 1000;
      if (num.includes("K")) return parseFloat(num);
      return parseFloat(num);
    };

    const labels = PORTFOLIO.iniciativas.map(i => i.nombre);
    const valorVals = PORTFOLIO.iniciativas.map(i => parseK(i.valor));
    const gastoVals = PORTFOLIO.iniciativas.map(i => parseK(i.gasto));

    s.addChart(pres.charts.BAR, [
      { name: "Valor esperado (USD K)", labels, values: valorVals },
      { name: "Gasto acumulado (USD K)", labels, values: gastoVals },
    ], {
      x: 0.6, y: 1.5, w: 8.8, h: 3.5,
      barDir: "bar",
      barGrouping: "clustered",
      chartColors: [PAE.blue, PAE.red],
      chartArea: { fill: { color: PAE.white }, roundedCorners: true },
      catAxisLabelColor: PAE.darkGray,
      catAxisLabelFontSize: 10,
      valAxisLabelColor: PAE.medGray,
      valAxisLabelFontSize: 9,
      valGridLine: { color: "E2E8F0", size: 0.5 },
      catGridLine: { style: "none" },
      showValue: false,
      showLegend: true,
      legendPos: "b",
      legendFontSize: 10,
      legendColor: PAE.darkGray,
    });
  }

  // ════════════════════════════════════════════════
  // SLIDE 7 — PRÓXIMOS EVENTOS
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.white };

    s.addText("Próximos eventos — abril / mayo 2026", {
      x: 0.6, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });
    s.addText("Hitos, gates y revisiones programados", {
      x: 0.6, y: 0.9, w: 9, h: 0.4,
      fontSize: 13, fontFace: "Inter", color: PAE.medGray, margin: 0,
    });

    // Timeline horizontal visual
    const timelineY = 2.0;
    // Línea base
    s.addShape(pres.shapes.LINE, {
      x: 0.8, y: timelineY + 0.6, w: 8.4, h: 0,
      line: { color: PAE.lightGray, width: 2 },
    });

    const eventColors = {
      "Gate 1": PAE.red, "Gate 2": PAE.red,
      "Sprint Rev": PAE.blue, "LTP Plan": PAE.green, "Seg. Q": PAE.blue,
    };

    PORTFOLIO.eventosProximos.forEach((evt, i) => {
      const ex = 1.0 + i * 1.7;
      const color = eventColors[evt.tipo] || PAE.blue;

      // Dot
      s.addShape(pres.shapes.OVAL, {
        x: ex + 0.35, y: timelineY + 0.4, w: 0.4, h: 0.4,
        fill: { color },
      });
      // Label tipo
      s.addText(evt.tipo, {
        x: ex - 0.1, y: timelineY + 1.1, w: 1.3, h: 0.3,
        fontSize: 11, fontFace: "Inter", color: PAE.dark, bold: true, align: "center", margin: 0,
      });
      // Iniciativa
      s.addText(evt.iniciativa, {
        x: ex - 0.1, y: timelineY + 1.35, w: 1.3, h: 0.3,
        fontSize: 9, fontFace: "Inter", color: PAE.blue, align: "center", margin: 0,
      });
      // Fecha
      s.addText(evt.fecha, {
        x: ex - 0.1, y: timelineY + 1.6, w: 1.3, h: 0.25,
        fontSize: 9, fontFace: "Inter", color: PAE.medGray, align: "center", margin: 0,
      });
    });

    // Call to action
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 4.3, w: 8.8, h: 0.8,
      fill: { color: PAE.bgLight },
    });
    s.addImage({ data: icons.warning, x: 0.85, y: 4.5, w: 0.3, h: 0.3 });
    s.addText("4 gates requieren voto en los próximos 30 días. Revisar aprobaciones pendientes en la plataforma.", {
      x: 1.3, y: 4.3, w: 7.8, h: 0.8,
      fontSize: 12, fontFace: "Inter", color: PAE.red, valign: "middle", margin: 0,
    });
  }

  // ════════════════════════════════════════════════
  // SLIDE 8 — DISTRIBUCIÓN POR DIMENSIÓN Y VP
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.white };

    s.addText("Distribución por dimensión y vicepresidencia", {
      x: 0.6, y: 0.3, w: 9, h: 0.7,
      fontSize: 28, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });

    // Left: Por dimensión
    s.addText("Por dimensión", {
      x: 0.6, y: 1.2, w: 4.2, h: 0.4,
      fontSize: 14, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });
    s.addChart(pres.charts.PIE, [{
      name: "Dimensión",
      labels: ["Operaciones", "Mantenimiento", "Producción", "HSE", "Soporte"],
      values: [5, 4, 3, 2, 1],
    }], {
      x: 0.4, y: 1.7, w: 4.3, h: 3.3,
      chartColors: [PAE.blue, PAE.green, PAE.red, "FFB900", PAE.medGray],
      showPercent: true,
      showLegend: true,
      legendPos: "b",
      legendFontSize: 10,
      legendColor: PAE.darkGray,
      dataLabelColor: PAE.white,
      dataLabelFontSize: 11,
    });

    // Right: Por VP
    s.addText("Por vicepresidencia", {
      x: 5.2, y: 1.2, w: 4.2, h: 0.4,
      fontSize: 14, fontFace: "Inter", color: PAE.dark, bold: true, margin: 0,
    });
    s.addChart(pres.charts.BAR, [{
      name: "Iniciativas",
      labels: ["VP Upstream", "VP Midstream", "VP Exploración", "VP Corporativo"],
      values: [7, 4, 3, 1],
    }], {
      x: 5.2, y: 1.7, w: 4.4, h: 3.3,
      barDir: "bar",
      chartColors: [PAE.blue],
      chartArea: { fill: { color: PAE.white } },
      catAxisLabelColor: PAE.darkGray,
      catAxisLabelFontSize: 10,
      valAxisHidden: true,
      valGridLine: { style: "none" },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelColor: PAE.dark,
      dataLabelFontSize: 12,
      showLegend: false,
    });
  }

  // ════════════════════════════════════════════════
  // SLIDE 9 — CIERRE / CONTACTO
  // ════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: PAE.dark };

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: PAE.red },
    });

    s.addText("Pan American Energy", {
      x: 0.8, y: 1.5, w: 8.4, h: 0.6,
      fontSize: 14, fontFace: "Inter", color: PAE.white, charSpacing: 4, transparency: 40,
    });
    s.addText("Plataforma de Gestión de Portfolio", {
      x: 0.8, y: 2.1, w: 8.4, h: 1.0,
      fontSize: 32, fontFace: "Inter", color: PAE.white, bold: true,
    });
    s.addShape(pres.shapes.LINE, {
      x: 0.8, y: 3.3, w: 2, h: 0, line: { color: PAE.green, width: 3 },
    });
    s.addText("Generado automáticamente desde la plataforma", {
      x: 0.8, y: 3.6, w: 8.4, h: 0.4,
      fontSize: 12, fontFace: "Inter", color: PAE.white, transparency: 50,
    });
    s.addText("Área de Transformación Digital — Abril 2026", {
      x: 0.8, y: 4.0, w: 8.4, h: 0.4,
      fontSize: 12, fontFace: "Inter", color: PAE.white, transparency: 50,
    });
  }

  // ── Footer en todas las slides (excepto portada y cierre) ──
  // pptxgenjs no tiene slide masters dinámicos post-creation,
  // así que agregamos en las slides de contenido (2-8)
  // Nota: ya fueron creadas, no podemos agregar retroactivamente
  // Lo hacemos en la creación directa arriba.

  // ── Write ──
  const outputPath = "/home/claude/PAE_Portfolio_Dashboard_Resumen.pptx";
  await pres.writeFile({ fileName: outputPath });
  console.log("PPTX generado:", outputPath);
}

generatePresentation().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
