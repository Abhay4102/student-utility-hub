import { pdfjsLib } from "./pdfjs";

/** Wrap PDF bytes from pdf-lib (Uint8Array<ArrayBufferLike>) in a Blob.
 *  Centralizes the type cast required by lib.dom.d.ts BlobPart. */
export function pdfBytesToBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/** Render a pdfjs page onto a canvas at the given scale. Handles the
 *  type-level differences between pdfjs and lib.dom canvas types. */
export async function renderPdfPageToCanvas(
  page: { getViewport: (p: { scale: number }) => { width: number; height: number };
          render: (p: unknown) => { promise: Promise<void> } },
  canvas: HTMLCanvasElement,
  scale: number,
): Promise<{ width: number; height: number }> {
  const viewport = page.getViewport({ scale });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");
  await page.render({ canvas, canvasContext: ctx, viewport } as unknown).promise;
  return { width: canvas.width, height: canvas.height };
}

/** Quick helper to load a PDF via pdfjs from a File. */
export async function loadPdfJs(file: File) {
  const buf = await file.arrayBuffer();
  return await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
}

/** Parse "1-3, 5, 8-10" into a sorted unique number array. */
export function parsePageList(input: string, max: number): { pages: number[]; invalid: boolean } {
  const s = input.trim();
  if (!s) return { pages: [], invalid: false };
  let invalid = false;
  const out = new Set<number>();
  for (const part of s.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      if (isNaN(a) || isNaN(b)) { invalid = true; continue; }
      const lo = Math.max(1, Math.min(a, b));
      const hi = Math.min(max, Math.max(a, b));
      if (lo > max || hi < 1) { invalid = true; continue; }
      for (let i = lo; i <= hi; i++) out.add(i);
    } else {
      const n = parseInt(p, 10);
      if (isNaN(n) || n < 1 || n > max) { invalid = true; continue; }
      out.add(n);
    }
  }
  return { pages: Array.from(out).sort((a, b) => a - b), invalid };
}
