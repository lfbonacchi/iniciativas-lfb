declare module "html2pdf.js" {
  const html2pdf: () => {
    set: (opts: unknown) => {
      from: (el: HTMLElement) => {
        save: () => Promise<void>;
        outputPdf: (type?: string) => Promise<unknown>;
      };
    };
  };
  export default html2pdf;
}
