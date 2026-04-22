// Brandbook PAE compartido entre pptx-formulario y pptx-dashboard.

export const PAE = {
  RED: "C8102E",
  BLUE: "003DA5",
  GREEN: "00843D",
  DARK: "1A1A2E",
  WHITE: "FFFFFF",
  LIGHT_GRAY: "F5F5F5",
  MID_GRAY: "E8E8E8",
  BG_LIGHT: "EBF0F7",
  TEXT_PRIMARY: "2D2D2D",
  TEXT_SECONDARY: "666666",
  TEXT_MUTED: "999999",
  AMBER: "F59E0B",
  FONT: "Inter",
} as const;

// Geometría de slides (16:9).
export const SLIDE_W = 10;
export const SLIDE_H = 5.625;
export const MARGIN = 0.6;
export const CONTENT_W = SLIDE_W - MARGIN * 2;

export function sanitizeText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

export function safeFileSegment(s: string, maxLen = 40): string {
  // NFD + rango U+0300..U+036F remueve acentos combinantes.
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, maxLen);
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
