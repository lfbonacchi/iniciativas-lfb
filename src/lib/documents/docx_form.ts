// Genera un DOCX real a partir de un DocStructure usando la librería `docx`.
// Se importa dinámico porque el bundler resuelve sus deps (jszip, etc.) solo
// en browser.

import type { DocStructure, DocRow, DocCell } from "./form_serializer";

export async function downloadDocx(
  doc: DocStructure,
  filename: string,
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("El DOCX solo se puede generar en el browser");
  }
  const blob = await buildDocxBlob(doc);
  triggerDownload(blob, filename);
}

export async function buildDocxBlob(doc: DocStructure): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
  } = await import("docx");

  const body: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];

  for (const row of doc.rows) {
    const node = renderRow(row, {
      Paragraph,
      TextRun,
      HeadingLevel,
      Table,
      TableRow,
      TableCell,
      WidthType,
      BorderStyle,
      AlignmentType,
    });
    if (node) body.push(node);
  }

  const document = new Document({
    creator: "PAE Portfolio",
    title: doc.meta.initiative_name,
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: body,
      },
    ],
  });

  return Packer.toBlob(document);
}

interface DocxModules {
  Paragraph: typeof import("docx").Paragraph;
  TextRun: typeof import("docx").TextRun;
  HeadingLevel: typeof import("docx").HeadingLevel;
  Table: typeof import("docx").Table;
  TableRow: typeof import("docx").TableRow;
  TableCell: typeof import("docx").TableCell;
  WidthType: typeof import("docx").WidthType;
  BorderStyle: typeof import("docx").BorderStyle;
  AlignmentType: typeof import("docx").AlignmentType;
}

function renderRow(
  row: DocRow,
  mods: DocxModules,
):
  | InstanceType<typeof import("docx").Paragraph>
  | InstanceType<typeof import("docx").Table>
  | null {
  if (row.length === 0) return null;
  const firstKind = row[0]?.kind;

  if (firstKind === "title") {
    return new mods.Paragraph({
      heading: mods.HeadingLevel.HEADING_1,
      spacing: { before: 120, after: 120 },
      children: [
        new mods.TextRun({
          text: row[0]!.value,
          bold: true,
          size: 40,
          color: "003DA5",
        }),
      ],
    });
  }

  if (firstKind === "subtitle") {
    return new mods.Paragraph({
      spacing: { after: 80 },
      children: [
        new mods.TextRun({
          text: row[0]!.value,
          bold: true,
          size: 28,
          color: "333333",
        }),
      ],
    });
  }

  if (firstKind === "section") {
    return new mods.Paragraph({
      heading: mods.HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      children: [
        new mods.TextRun({
          text: row[0]!.value,
          bold: true,
          size: 26,
          color: "C8102E",
        }),
      ],
    });
  }

  if (firstKind === "empty") {
    return new mods.Paragraph({ children: [new mods.TextRun("")] });
  }

  // Fila con 2 celdas (question/answer) → párrafo con label bold + texto
  if (
    row.length === 2 &&
    row[0]?.kind === "question" &&
    row[1]?.kind === "answer"
  ) {
    return new mods.Paragraph({
      spacing: { after: 80 },
      children: [
        new mods.TextRun({
          text: row[0].value + ": ",
          bold: true,
          color: "666666",
        }),
        new mods.TextRun({ text: row[1].value, color: "333333" }),
      ],
    });
  }

  // Fila de headers de tabla → primera fila de una tabla nueva. Pero como no
  // sabemos las filas body acá, la renderizamos como párrafo de contexto.
  if (firstKind === "table-header") {
    return new mods.Paragraph({
      spacing: { before: 80, after: 40 },
      children: row.map(
        (c) =>
          new mods.TextRun({
            text: c.value + "  ",
            bold: true,
            color: "003DA5",
            size: 20,
          }),
      ),
    });
  }

  if (firstKind === "table-cell") {
    return new mods.Paragraph({
      spacing: { after: 40 },
      children: row.map(
        (c, i) =>
          new mods.TextRun({
            text: (i > 0 ? " · " : "") + (c.value || "—"),
            color: "333333",
            size: 20,
          }),
      ),
    });
  }

  // Fallback: concatenar todo
  return new mods.Paragraph({
    children: row.map(
      (c: DocCell) =>
        new mods.TextRun({ text: c.value + " ", color: "333333" }),
    ),
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
