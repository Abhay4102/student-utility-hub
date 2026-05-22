import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { pdfjsLib } from "./pdfjs";

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

export async function zipAndDownload(
  items: Array<{ name: string; blob: Blob }>,
  zipName: string,
) {
  const zip = new JSZip();
  for (const it of items) zip.file(it.name, it.blob);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  downloadBlob(blob, zipName);
}

export interface ImageConvertOptions {
  /** Output mime: "image/jpeg" | "image/png" | "image/webp" */
  mime: "image/jpeg" | "image/png" | "image/webp";
  /** 0..1 — only for jpeg/webp */
  quality?: number;
  /** Optional max edge resize (longest side). 0 = no resize. */
  maxEdge?: number;
  /** Background fill when converting from transparency-capable to opaque. */
  background?: string;
}

/** Convert any image File into another raster format Blob. */
export async function convertImageFile(file: File, opts: ImageConvertOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (opts.maxEdge && opts.maxEdge > 0 && Math.max(width, height) > opts.maxEdge) {
    const scale = opts.maxEdge / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image encoding failed"))),
      opts.mime,
      opts.quality,
    ),
  );
}

export interface ImagesToPdfOptions {
  /** "fit" - fit on A4-portrait; "actual" - one page per image at actual size */
  pageMode: "fit" | "actual";
  /** Page size in points for "fit" mode. Default A4 (595x842). */
  pageSize?: [number, number];
  margin?: number;
}

/** Combine N image files into a single PDF (one image per page). */
export async function imagesToPdf(files: File[], opts: ImagesToPdfOptions): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  for (const file of files) {
    const buf = new Uint8Array(await file.arrayBuffer());
    const isPng = file.type.includes("png") || /\.png$/i.test(file.name);
    const img = isPng ? await pdfDoc.embedPng(buf) : await pdfDoc.embedJpg(buf);

    if (opts.pageMode === "actual") {
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    } else {
      const [pw, ph] = opts.pageSize ?? [595, 842];
      const m = opts.margin ?? 24;
      const aw = pw - m * 2;
      const ah = ph - m * 2;
      const scale = Math.min(aw / img.width, ah / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const page = pdfDoc.addPage([pw, ph]);
      page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
  }
  const bytes = await pdfDoc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export interface PdfPageRenderOptions {
  /** Render scale, e.g. 1.0 (low) to 3.0 (high) */
  scale: number;
  /** Output format */
  mime: "image/png" | "image/jpeg";
  /** Quality for jpeg */
  quality?: number;
  /** Pages to render. Empty/undefined = all pages. */
  pages?: number[];
  /** Progress callback (current, total) */
  onProgress?: (done: number, total: number) => void;
}

export interface RenderedPage { pageNum: number; blob: Blob; width: number; height: number }

/** Render PDF pages as images. */
export async function renderPdfPages(
  file: File,
  opts: PdfPageRenderOptions,
): Promise<RenderedPage[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  const all = opts.pages === undefined
    ? Array.from({ length: pdf.numPages }, (_, i) => i + 1)
    : opts.pages;
  if (!all.length) throw new Error("No valid pages selected. Check your page range.");
  const out: RenderedPage[] = [];
  for (let i = 0; i < all.length; i++) {
    const n = all[i];
    if (n < 1 || n > pdf.numPages) continue;
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: opts.scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    await page.render({ canvas, canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), opts.mime, opts.quality),
    );
    out.push({ pageNum: n, blob, width: canvas.width, height: canvas.height });
    opts.onProgress?.(i + 1, all.length);
  }
  return out;
}

/** Parse "1-3, 5, 8-10" into [1,2,3,5,8,9,10]. Returns undefined if empty. */
export function parsePageRange(input: string, max: number): number[] | undefined {
  const s = input.trim();
  if (!s) return undefined;
  const out = new Set<number>();
  for (const part of s.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = Math.max(1, parseInt(m[1], 10));
      const b = Math.min(max, parseInt(m[2], 10));
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.add(i);
    } else {
      const n = parseInt(p, 10);
      if (!isNaN(n) && n >= 1 && n <= max) out.add(n);
    }
  }
  return Array.from(out).sort((a, b) => a - b);
}
