/**
 * PAE — Generador de Nota de Prensa (Working Backwards)
 * 
 * Genera un documento Word tipo "nota de prensa" con formato Working Backwards
 * (estilo Amazon): se redacta como si la iniciativa ya se hubiera implementado
 * exitosamente. El contenido se extrae automáticamente del formulario completado.
 * 
 * Uso: node generate_nota_prensa.js
 * Output: PAE_F1_NotaDePrensa_Optimizacion_Predictiva.docx
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, TabStopType, LevelFormat, PageBreak,
} = require("docx");
const fs = require("fs");

// ═══════════════════════════════════════════════════════════════
// BRANDBOOK PAE — Constantes de diseño
// ═══════════════════════════════════════════════════════════════
const PAE = {
  RED: "C8102E",
  BLUE: "003DA5",
  GREEN: "00843D",
  DARK: "1A1A2E",
  TEXT_PRIMARY: "2D2D2D",
  TEXT_SECONDARY: "666666",
  LIGHT_GRAY: "F2F2F2",
  MID_GRAY: "CCCCCC",
  FONT: "Inter",
};

// ═══════════════════════════════════════════════════════════════
// DATOS DUMMY — Misma iniciativa que el PPTX
// ═══════════════════════════════════════════════════════════════
const formData = {
  formType: "F1",
  formLabel: "Propuesta",
  initiativeName: "Optimización Predictiva de Pozos Maduros",
  dimension: "Producción",
  unidadGestion: "Upstream — Área Norte",
  tipoIniciativa: "Resultado",
  date: "Abril 2026",
  version: "v1.0",

  proposito:
    "Para los ingenieros de producción y supervisores de campo quienes necesitan anticipar fallas y optimizar la extracción en pozos maduros del Área Norte, el Sistema de Optimización Predictiva es una plataforma de monitoreo inteligente que permite reducir intervenciones no planificadas y maximizar la producción mediante modelos de machine learning aplicados a datos de sensores de fondo de pozo.",

  // Para la nota de prensa, estos datos se transforman en narrativa
  beneficioClave: "Reducción del 60% en intervenciones no planificadas y aumento de producción de +8.000 m³/año en pozos maduros del Área Norte.",
  problemaResuelto: "Los pozos maduros del Área Norte venían sufriendo una pérdida progresiva de producción por falta de monitoreo predictivo, con un 62% de intervenciones de mantenimiento no planificadas que generaban costos operativos elevados y tiempos de inactividad evitables.",
  solucionDescripcion: "El sistema ingesta datos de sensores ESP (presión, temperatura, vibración, amperaje) cada 15 minutos, aplica modelos de ML entrenados con datos históricos de 3 años, y genera alertas tempranas con 72hs de anticipación junto con recomendaciones de ajuste de parámetros operativos.",
  
  impactoEsperado: [
    "Aumento del MTBF de 145 a 220 días en bombeo electrosumergible",
    "Reducción de intervenciones no planificadas del 62% al 25%",
    "Producción incremental de +8.000 m³/año",
    "Reducción de OPEX de mantenimiento de USD 85K a USD 55K por pozo/año",
    "Reducción del consumo energético por optimización de frecuencia de variadores",
  ],

  alcanceInicial: "50 pozos maduros con ESP del Área Norte (Cerro Dragón). Con potencial de expansión a 300+ pozos en Área Norte y Sur, y replicable a otros métodos de extracción.",

  sponsor: { nombre: "Ricardo Méndez", posicion: "VP Upstream" },
  promotor: { nombre: "Alejandro Torres", posicion: "Gte. Producción Norte" },

  // Cita del sponsor (generada automáticamente con template)
  citaSponsor: "Esta iniciativa representa un paso fundamental en nuestra estrategia de eficiencia operativa. Al pasar de un modelo de mantenimiento reactivo a uno predictivo, no solo reducimos costos sino que maximizamos el valor de nuestros activos maduros.",

  proximosHitos: [
    { hito: "Kick-off y relevamiento de datos", fecha: "Jun 2026" },
    { hito: "MVP — Modelo predictivo para 10 pozos piloto", fecha: "Sep 2026" },
    { hito: "Rollout a 50 pozos Área Norte", fecha: "Feb 2027" },
  ],

  corrientesImpactadas: ["PRODUCCIÓN (m³)", "OPEX (M USD)", "PRODUCTIVIDAD (HH)", "EXP. AL RIESGO (%)", "CONS. ENERGÍA (MW)"],
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: PAE.MID_GRAY };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function emptyParagraph(spacing = 120) {
  return new Paragraph({ spacing: { after: spacing }, children: [] });
}

function makeHeaderText(text, color = PAE.RED, size = 14) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: PAE.FONT,
        size: size * 2,
        bold: true,
        color: color,
      }),
    ],
  });
}

// ═══════════════════════════════════════════════════════════════
// GENERACIÓN DEL DOCUMENTO
// ═══════════════════════════════════════════════════════════════

async function generateNotaPrensaDocx() {
  const children = [];

  // ─── ENCABEZADO: Barra de marca ────────────────────────────
  // Badge "NOTA DE PRENSA — WORKING BACKWARDS"
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "NOTA DE PRENSA — WORKING BACKWARDS",
          font: PAE.FONT,
          size: 16,
          bold: true,
          color: PAE.RED,
        }),
      ],
    })
  );

  // Línea roja decorativa (borde inferior del párrafo)
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PAE.RED, space: 1 } },
      spacing: { after: 200 },
      children: [],
    })
  );

  // ─── METADATA ──────────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `Pan American Energy — Transformación Digital`,
          font: PAE.FONT,
          size: 18,
          color: PAE.BLUE,
          bold: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `Dimensión: ${formData.dimension}  |  UG: ${formData.unidadGestion}  |  ${formData.date}`,
          font: PAE.FONT,
          size: 18,
          color: PAE.TEXT_SECONDARY,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Formulario ${formData.formType} — ${formData.formLabel}  |  ${formData.version}`,
          font: PAE.FONT,
          size: 16,
          color: PAE.TEXT_SECONDARY,
          italics: true,
        }),
      ],
    })
  );

  // ─── TITULAR ───────────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: formData.initiativeName,
          font: PAE.FONT,
          size: 48,
          bold: true,
          color: PAE.DARK,
        }),
      ],
    })
  );

  // ─── SUBTÍTULO / BAJADA ────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: PAE.BLUE, space: 8 } },
      indent: { left: 200 },
      children: [
        new TextRun({
          text: formData.beneficioClave,
          font: PAE.FONT,
          size: 24,
          color: PAE.TEXT_PRIMARY,
          italics: true,
        }),
      ],
    })
  );

  // ─── SECCIÓN 1: EL PROBLEMA ────────────────────────────────
  children.push(makeHeaderText("El desafío", PAE.RED));

  children.push(
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: formData.problemaResuelto,
          font: PAE.FONT,
          size: 22,
          color: PAE.TEXT_PRIMARY,
        }),
      ],
    })
  );

  // ─── SECCIÓN 2: LA SOLUCIÓN ────────────────────────────────
  children.push(makeHeaderText("La solución", PAE.BLUE));

  children.push(
    new Paragraph({
      spacing: { after: 120, line: 360 },
      children: [
        new TextRun({
          text: formData.proposito,
          font: PAE.FONT,
          size: 22,
          color: PAE.TEXT_PRIMARY,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: formData.solucionDescripcion,
          font: PAE.FONT,
          size: 22,
          color: PAE.TEXT_PRIMARY,
        }),
      ],
    })
  );

  // ─── SECCIÓN 3: IMPACTO ESPERADO ──────────────────────────
  children.push(makeHeaderText("Impacto esperado", PAE.GREEN));

  for (const item of formData.impactoEsperado) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        numbering: { reference: "bullets", level: 0 },
        children: [
          new TextRun({
            text: item,
            font: PAE.FONT,
            size: 22,
            color: PAE.TEXT_PRIMARY,
          }),
        ],
      })
    );
  }

  children.push(emptyParagraph(120));

  // ─── SECCIÓN 4: ALCANCE ───────────────────────────────────
  children.push(makeHeaderText("Alcance", PAE.BLUE));

  children.push(
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: formData.alcanceInicial,
          font: PAE.FONT,
          size: 22,
          color: PAE.TEXT_PRIMARY,
        }),
      ],
    })
  );

  // ─── SECCIÓN 5: CORRIENTES DE VALOR IMPACTADAS ────────────
  children.push(makeHeaderText("Corrientes de valor impactadas", PAE.GREEN));

  // Tabla simple de corrientes
  const cvBorder = { style: BorderStyle.SINGLE, size: 1, color: PAE.MID_GRAY };
  const cvBorders = { top: cvBorder, bottom: cvBorder, left: cvBorder, right: cvBorder };

  const headerRow = new TableRow({
    children: [
      new TableCell({
        borders: cvBorders,
        width: { size: 6000, type: WidthType.DXA },
        shading: { fill: PAE.BLUE, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Corriente de valor", font: PAE.FONT, size: 20, bold: true, color: "FFFFFF" })],
          }),
        ],
      }),
      new TableCell({
        borders: cvBorders,
        width: { size: 3360, type: WidthType.DXA },
        shading: { fill: PAE.BLUE, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Impacto esperado", font: PAE.FONT, size: 20, bold: true, color: "FFFFFF" })],
          }),
        ],
      }),
    ],
  });

  const dataRows = formData.corrientesImpactadas.map(
    (cv, i) =>
      new TableRow({
        children: [
          new TableCell({
            borders: cvBorders,
            width: { size: 6000, type: WidthType.DXA },
            shading: { fill: i % 2 === 0 ? PAE.LIGHT_GRAY : "FFFFFF", type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: cv, font: PAE.FONT, size: 20, color: PAE.TEXT_PRIMARY })],
              }),
            ],
          }),
          new TableCell({
            borders: cvBorders,
            width: { size: 3360, type: WidthType.DXA },
            shading: { fill: i % 2 === 0 ? PAE.LIGHT_GRAY : "FFFFFF", type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Con impacto",
                    font: PAE.FONT,
                    size: 20,
                    bold: true,
                    color: PAE.GREEN,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
  );

  children.push(
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [6000, 3360],
      rows: [headerRow, ...dataRows],
    })
  );

  children.push(emptyParagraph(200));

  // ─── SECCIÓN 6: CITA DEL SPONSOR ──────────────────────────
  children.push(makeHeaderText("Palabras del sponsor", PAE.RED));

  children.push(
    new Paragraph({
      spacing: { after: 80, line: 360 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: PAE.RED, space: 8 } },
      indent: { left: 200 },
      children: [
        new TextRun({
          text: `"${formData.citaSponsor}"`,
          font: PAE.FONT,
          size: 22,
          color: PAE.TEXT_PRIMARY,
          italics: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      indent: { left: 200 },
      children: [
        new TextRun({
          text: `— ${formData.sponsor.nombre}, ${formData.sponsor.posicion}`,
          font: PAE.FONT,
          size: 20,
          bold: true,
          color: PAE.TEXT_SECONDARY,
        }),
      ],
    })
  );

  // ─── SECCIÓN 7: PRÓXIMOS HITOS ────────────────────────────
  children.push(makeHeaderText("Próximos hitos", PAE.BLUE));

  for (const h of formData.proximosHitos) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        numbering: { reference: "bullets", level: 0 },
        children: [
          new TextRun({ text: `${h.fecha}: `, font: PAE.FONT, size: 22, bold: true, color: PAE.BLUE }),
          new TextRun({ text: h.hito, font: PAE.FONT, size: 22, color: PAE.TEXT_PRIMARY }),
        ],
      })
    );
  }

  children.push(emptyParagraph(200));

  // ─── SECCIÓN 8: CONTACTO ──────────────────────────────────
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: PAE.MID_GRAY, space: 4 } },
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: "CONTACTO",
          font: PAE.FONT,
          size: 16,
          bold: true,
          color: PAE.TEXT_SECONDARY,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "Promotor: ", font: PAE.FONT, size: 20, bold: true, color: PAE.TEXT_PRIMARY }),
        new TextRun({ text: `${formData.promotor.nombre} — ${formData.promotor.posicion}`, font: PAE.FONT, size: 20, color: PAE.TEXT_SECONDARY }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "Sponsor: ", font: PAE.FONT, size: 20, bold: true, color: PAE.TEXT_PRIMARY }),
        new TextRun({ text: `${formData.sponsor.nombre} — ${formData.sponsor.posicion}`, font: PAE.FONT, size: 20, color: PAE.TEXT_SECONDARY }),
      ],
    })
  );

  children.push(emptyParagraph(100));

  // ─── PIE: DISCLAIMER ──────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "Este documento es un ejercicio de Working Backwards: describe el resultado esperado de la iniciativa como si ya se hubiera implementado. No constituye un compromiso de ejecución ni un comunicado oficial. Su propósito es alinear la visión del equipo y facilitar la toma de decisiones en el proceso de aprobación.",
          font: PAE.FONT,
          size: 16,
          color: PAE.TEXT_SECONDARY,
          italics: true,
        }),
      ],
    })
  );

  // ─── CONSTRUIR DOCUMENTO ──────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: PAE.FONT, size: 22 },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Pan American Energy — Confidencial",
                    font: PAE.FONT,
                    size: 14,
                    color: PAE.TEXT_SECONDARY,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: PAE.MID_GRAY, space: 4 } },
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopType.MAX }],
                children: [
                  new TextRun({
                    text: "Plataforma de Gestión de Portfolio — Transformación Digital",
                    font: PAE.FONT,
                    size: 14,
                    color: PAE.TEXT_SECONDARY,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = "PAE_F1_NotaDePrensa_Optimizacion_Predictiva.docx";
  fs.writeFileSync(`/home/claude/${fileName}`, buffer);
  console.log(`✅ Nota de prensa generada: ${fileName}`);
  console.log(`   Formulario: ${formData.formType} — ${formData.formLabel}`);
  console.log(`   Iniciativa: ${formData.initiativeName}`);
}

generateNotaPrensaDocx().catch((err) => {
  console.error("❌ Error generando nota de prensa:", err);
  process.exit(1);
});
