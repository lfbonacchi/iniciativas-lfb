// Genera un PDF a partir del HTML del formulario usando html2pdf.js.
// Se importa dinámico porque html2pdf toca `window` y solo corre en browser.

import type { DocStructure } from "./form_serializer";
import { renderDocAsHtml } from "./html_form";

export async function downloadPdf(doc: DocStructure, filename: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("El PDF solo se puede generar en el browser");
  }
  const mod = await import("html2pdf.js");
  const html2pdf = (mod as { default: (...args: unknown[]) => unknown }).default ?? mod;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "980px";
  container.innerHTML = renderDocAsHtml(doc);
  document.body.appendChild(container);

  try {
    await (html2pdf as (...args: unknown[]) => {
      set: (opts: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } };
    })()
      .set({
        margin: [12, 12, 12, 12],
        filename,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
