// Genera un archivo XLSX a partir de la estructura serializada del formulario.
// Es genérico: funciona para F1..F5 (y cualquier F4/F5 de cualquier año).

import * as XLSX from "xlsx";

import type { DocCell, DocRow, DocStructure } from "./form_serializer";

const MAX_COLS = 8; // capacidad máxima de columnas visibles por tabla

function cellStyle(kind: DocCell["kind"]): XLSX.CellObject["s"] {
  // Nota: xlsx@0.18 soporta estilos básicos vía la propiedad `s` de cada celda
  // cuando se escribe con bookType "xlsx". La comunidad "xlsx-style" no es
  // necesaria; SheetJS respeta los formatos básicos.
  const base = {
    font: { name: "Calibri", sz: 11 },
    alignment: { wrapText: true, vertical: "top" as const },
  };
  if (kind === "title") {
    return {
      ...base,
      font: { name: "Calibri", sz: 16, bold: true, color: { rgb: "003DA5" } },
    };
  }
  if (kind === "subtitle") {
    return {
      ...base,
      font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "666666" } },
    };
  }
  if (kind === "section") {
    return {
      ...base,
      font: { name: "Calibri", sz: 13, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "003DA5" } },
    };
  }
  if (kind === "question") {
    return {
      ...base,
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "333333" } },
      fill: { fgColor: { rgb: "EBF0F7" } },
    };
  }
  if (kind === "table-header") {
    return {
      ...base,
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "003DA5" } },
    };
  }
  if (kind === "table-cell") {
    return {
      ...base,
      font: { name: "Calibri", sz: 10, color: { rgb: "333333" } },
    };
  }
  return base;
}

function buildWorksheet(doc: DocStructure): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  const rowHeights: Array<{ hpt: number }> = [];
  let maxCol = 0;

  doc.rows.forEach((row: DocRow, r) => {
    let c = 0;
    let rowHeight = 18;
    for (const cell of row) {
      const colspan = cell.colspan ?? 1;
      const addr = XLSX.utils.encode_cell({ r, c });
      const cellObj: XLSX.CellObject = {
        t: "s",
        v: cell.value,
        s: cellStyle(cell.kind),
      };
      ws[addr] = cellObj;
      if (colspan > 1) {
        merges.push({
          s: { r, c },
          e: { r, c: c + colspan - 1 },
        });
      }
      // heurística de altura: si el texto es largo, alto > estándar
      const lines = Math.max(1, Math.ceil(cell.value.length / 80));
      rowHeight = Math.max(rowHeight, Math.min(200, 18 * lines));
      c += colspan;
    }
    maxCol = Math.max(maxCol, c);
    rowHeights.push({ hpt: rowHeight });
  });

  const colCount = Math.max(maxCol, 2);
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: doc.rows.length - 1, c: colCount - 1 },
  });
  ws["!merges"] = merges;
  ws["!rows"] = rowHeights;

  // Ancho de columnas: primera más angosta (preguntas), resto más ancha.
  const cols: Array<{ wch: number }> = [];
  for (let i = 0; i < Math.min(colCount, MAX_COLS); i++) {
    cols.push({ wch: i === 0 ? 36 : 48 });
  }
  ws["!cols"] = cols;

  return ws;
}

export function buildXlsxBlob(doc: DocStructure): Blob {
  const wb = XLSX.utils.book_new();
  const ws = buildWorksheet(doc);
  // El nombre del sheet tiene límite de 31 caracteres; usamos una etiqueta corta.
  XLSX.utils.book_append_sheet(wb, ws, "Formulario");

  const wbout = XLSX.write(wb, {
    type: "array",
    bookType: "xlsx",
    cellStyles: true,
  }) as ArrayBuffer;

  return new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
