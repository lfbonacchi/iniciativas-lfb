// Generador de Nota de Prensa (Working Backwards) — DOCX browser-side.
// Usa la librería `docx` (import dinámico) siguiendo el patrón de
// src/lib/documents/docx_form.ts. Referencia visual: docs/specs/generate_nota_prensa.js
// Spec: docs/specs/SPEC_NOTA_PRENSA.md

import type { FormType } from "@/types";

import { safeFileSegment, downloadBlob } from "./pptx-constants";

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
} as const;

export interface NotaPrensaHito {
  hito: string;
  fecha: string;
}

export interface NotaPrensaPersona {
  nombre: string;
  posicion: string;
}

export interface NotaPrensaInput {
  form_type: FormType;
  form_label: string;
  initiative_name: string;
  dimension: string;
  unidad_gestion: string;
  fecha_label: string;
  version_label: string;

  proposito: string;
  lead: string;
  bajada: string;
  problema: string;
  solucion_descripcion: string;
  impacto_esperado: string[];
  alcance: string;
  corrientes_impactadas: string[];
  cita_sponsor: string;
  sponsor: NotaPrensaPersona | null;
  promotor: NotaPrensaPersona | null;
  proximos_hitos: NotaPrensaHito[];
}

export async function downloadNotaPrensaDocx(input: NotaPrensaInput): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("La nota de prensa solo se puede generar en el browser");
  }
  const blob = await buildNotaPrensaBlob(input);
  downloadBlob(blob, getNotaPrensaFileName(input));
}

export function getNotaPrensaFileName(input: NotaPrensaInput): string {
  const safe = safeFileSegment(input.initiative_name, 40);
  return `PAE_${input.form_type}_NotaDePrensa_${safe}.docx`;
}

export async function buildNotaPrensaBlob(input: NotaPrensaInput): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    Header,
    Footer,
    AlignmentType,
    BorderStyle,
    WidthType,
    ShadingType,
    TabStopType,
    LevelFormat,
  } = await import("docx");

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];

  const makeSectionHeader = (text: string, color: string) =>
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          font: PAE.FONT,
          size: 28,
          bold: true,
          color,
        }),
      ],
    });

  const emptyP = (after = 120) =>
    new Paragraph({ spacing: { after }, children: [] });

  // ─── Encabezado ─────────────────────────────────────────────
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
    }),
  );
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PAE.RED, space: 1 } },
      spacing: { after: 200 },
      children: [],
    }),
  );

  // ─── Metadata ───────────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "Pan American Energy — Transformación Digital",
          font: PAE.FONT,
          size: 18,
          color: PAE.BLUE,
          bold: true,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `Dimensión: ${input.dimension || "—"}  |  UG: ${input.unidad_gestion || "—"}  |  ${input.fecha_label}`,
          font: PAE.FONT,
          size: 18,
          color: PAE.TEXT_SECONDARY,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Formulario ${input.form_type} — ${input.form_label}  |  ${input.version_label}`,
          font: PAE.FONT,
          size: 16,
          color: PAE.TEXT_SECONDARY,
          italics: true,
        }),
      ],
    }),
  );

  // ─── Titular ────────────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: input.initiative_name,
          font: PAE.FONT,
          size: 48,
          bold: true,
          color: PAE.DARK,
        }),
      ],
    }),
  );

  // ─── Bajada ─────────────────────────────────────────────────
  if (input.bajada) {
    children.push(
      new Paragraph({
        spacing: { after: 300 },
        border: { left: { style: BorderStyle.SINGLE, size: 8, color: PAE.BLUE, space: 8 } },
        indent: { left: 200 },
        children: [
          new TextRun({
            text: input.bajada,
            font: PAE.FONT,
            size: 24,
            color: PAE.TEXT_PRIMARY,
            italics: true,
          }),
        ],
      }),
    );
  }

  // ─── Lead (dateline + anuncio) ──────────────────────────────
  if (input.lead) {
    children.push(
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: [
          new TextRun({
            text: input.lead,
            font: PAE.FONT,
            size: 22,
            color: PAE.TEXT_PRIMARY,
          }),
        ],
      }),
    );
  }

  // ─── El desafío que resolvimos ──────────────────────────────
  if (input.problema) {
    children.push(makeSectionHeader("El desafío que resolvimos", PAE.RED));
    children.push(
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: [
          new TextRun({
            text: input.problema,
            font: PAE.FONT,
            size: 22,
            color: PAE.TEXT_PRIMARY,
          }),
        ],
      }),
    );
  }

  // ─── La solución en producción ──────────────────────────────
  if (input.solucion_descripcion) {
    children.push(makeSectionHeader("La solución en producción", PAE.BLUE));
    children.push(
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: [
          new TextRun({
            text: input.solucion_descripcion,
            font: PAE.FONT,
            size: 22,
            color: PAE.TEXT_PRIMARY,
          }),
        ],
      }),
    );
  }

  // ─── Impacto alcanzado ──────────────────────────────────────
  if (input.impacto_esperado.length > 0) {
    children.push(makeSectionHeader("Impacto alcanzado", PAE.GREEN));
    for (const item of input.impacto_esperado) {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          numbering: { reference: "np-bullets", level: 0 },
          children: [
            new TextRun({
              text: item,
              font: PAE.FONT,
              size: 22,
              color: PAE.TEXT_PRIMARY,
            }),
          ],
        }),
      );
    }
    children.push(emptyP(120));
  }

  // ─── Alcance y próximos pasos ───────────────────────────────
  if (input.alcance) {
    children.push(makeSectionHeader("Alcance y próximos pasos", PAE.BLUE));
    children.push(
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: [
          new TextRun({
            text: input.alcance,
            font: PAE.FONT,
            size: 22,
            color: PAE.TEXT_PRIMARY,
          }),
        ],
      }),
    );
  }

  // ─── Corrientes impactadas ──────────────────────────────────
  if (input.corrientes_impactadas.length > 0) {
    children.push(makeSectionHeader("Corrientes de valor impactadas", PAE.GREEN));

    const cvBorder = { style: BorderStyle.SINGLE, size: 1, color: PAE.MID_GRAY };
    const cvBorders = { top: cvBorder, bottom: cvBorder, left: cvBorder, right: cvBorder };

    const headerRow = new TableRow({
      children: [
        new TableCell({
          borders: cvBorders,
          width: { size: 6000, type: WidthType.DXA },
          shading: { fill: PAE.BLUE, type: ShadingType.CLEAR, color: "auto" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Corriente de valor",
                  font: PAE.FONT,
                  size: 20,
                  bold: true,
                  color: "FFFFFF",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: cvBorders,
          width: { size: 3360, type: WidthType.DXA },
          shading: { fill: PAE.BLUE, type: ShadingType.CLEAR, color: "auto" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Impacto esperado",
                  font: PAE.FONT,
                  size: 20,
                  bold: true,
                  color: "FFFFFF",
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const dataRows = input.corrientes_impactadas.map(
      (cv, i) =>
        new TableRow({
          children: [
            new TableCell({
              borders: cvBorders,
              width: { size: 6000, type: WidthType.DXA },
              shading: {
                fill: i % 2 === 0 ? PAE.LIGHT_GRAY : "FFFFFF",
                type: ShadingType.CLEAR,
                color: "auto",
              },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cv,
                      font: PAE.FONT,
                      size: 20,
                      color: PAE.TEXT_PRIMARY,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: cvBorders,
              width: { size: 3360, type: WidthType.DXA },
              shading: {
                fill: i % 2 === 0 ? PAE.LIGHT_GRAY : "FFFFFF",
                type: ShadingType.CLEAR,
                color: "auto",
              },
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
        }),
    );

    children.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [6000, 3360],
        rows: [headerRow, ...dataRows],
      }),
    );
    children.push(emptyP(200));
  }

  // ─── Palabras del sponsor ───────────────────────────────────
  if (input.cita_sponsor && input.sponsor) {
    children.push(makeSectionHeader("Palabras del sponsor", PAE.RED));
    children.push(
      new Paragraph({
        spacing: { after: 80, line: 360 },
        border: { left: { style: BorderStyle.SINGLE, size: 8, color: PAE.RED, space: 8 } },
        indent: { left: 200 },
        children: [
          new TextRun({
            text: `"${input.cita_sponsor}"`,
            font: PAE.FONT,
            size: 22,
            color: PAE.TEXT_PRIMARY,
            italics: true,
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 200 },
        children: [
          new TextRun({
            text: `— ${input.sponsor.nombre}${input.sponsor.posicion ? `, ${input.sponsor.posicion}` : ""}`,
            font: PAE.FONT,
            size: 20,
            bold: true,
            color: PAE.TEXT_SECONDARY,
          }),
        ],
      }),
    );
  }

  // ─── Hitos del recorrido ────────────────────────────────────
  if (input.proximos_hitos.length > 0) {
    children.push(makeSectionHeader("Hitos del recorrido", PAE.BLUE));
    for (const h of input.proximos_hitos) {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          numbering: { reference: "np-bullets", level: 0 },
          children: [
            new TextRun({
              text: `${h.fecha || "—"}: `,
              font: PAE.FONT,
              size: 22,
              bold: true,
              color: PAE.BLUE,
            }),
            new TextRun({
              text: h.hito,
              font: PAE.FONT,
              size: 22,
              color: PAE.TEXT_PRIMARY,
            }),
          ],
        }),
      );
    }
    children.push(emptyP(200));
  }

  // ─── Contacto ───────────────────────────────────────────────
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
    }),
  );
  if (input.promotor) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: "Promotor: ", font: PAE.FONT, size: 20, bold: true, color: PAE.TEXT_PRIMARY }),
          new TextRun({
            text: `${input.promotor.nombre}${input.promotor.posicion ? ` — ${input.promotor.posicion}` : ""}`,
            font: PAE.FONT,
            size: 20,
            color: PAE.TEXT_SECONDARY,
          }),
        ],
      }),
    );
  }
  if (input.sponsor) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: "Sponsor: ", font: PAE.FONT, size: 20, bold: true, color: PAE.TEXT_PRIMARY }),
          new TextRun({
            text: `${input.sponsor.nombre}${input.sponsor.posicion ? ` — ${input.sponsor.posicion}` : ""}`,
            font: PAE.FONT,
            size: 20,
            color: PAE.TEXT_SECONDARY,
          }),
        ],
      }),
    );
  }
  children.push(emptyP(100));

  // ─── Disclaimer ─────────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text:
            "Working Backwards (Amazon): esta nota está escrita como si la iniciativa ya hubiera sido lanzada y estuviera generando los resultados descritos. Es un ejercicio de visión, no un comunicado oficial ni un compromiso de ejecución. Sirve para alinear al equipo sobre qué éxito esperamos antes de construir.",
          font: PAE.FONT,
          size: 16,
          color: PAE.TEXT_SECONDARY,
          italics: true,
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: "PAE Portfolio",
    title: `${input.initiative_name} — Nota de Prensa`,
    styles: {
      default: {
        document: { run: { font: PAE.FONT, size: 22 } },
      },
    },
    numbering: {
      config: [
        {
          reference: "np-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
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
                border: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: PAE.MID_GRAY, space: 4 },
                },
                tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
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

  return Packer.toBlob(doc);
}
