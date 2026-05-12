import * as pdfjsLib from "pdfjs-dist";

// Use unpkg CDN for the worker — most reliable approach across all Vite setups
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export { pdfjsLib };
