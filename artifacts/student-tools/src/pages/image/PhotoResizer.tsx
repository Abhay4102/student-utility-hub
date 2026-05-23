import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Minimize2, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdfjs";
import { toast } from "sonner";

type Mode = "dimensions" | "size";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function encodeJpeg(bitmap: ImageBitmap, scale: number, quality: number): Promise<Blob> {
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", quality)
  );
}

// Pad a blob with trailing bytes to reach exact target size.
// JPEG/PNG decoders ignore bytes after the end-of-image marker; PDFs ignore data after %%EOF.
function padBlobToExactSize(blob: Blob, targetBytes: number): Blob {
  if (blob.size >= targetBytes) return blob;
  const padLen = targetBytes - blob.size;
  const padding = new Uint8Array(padLen);
  return new Blob([blob, padding], { type: blob.type });
}

async function compressImageToExactSize(file: File, targetBytes: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    let scale = 1.0;
    let bestUnder: Blob | null = null;

    for (let scaleAttempt = 0; scaleAttempt < 6; scaleAttempt++) {
      const maxQ = await encodeJpeg(bitmap, scale, 0.95);
      if (maxQ.size <= targetBytes) {
        bestUnder = maxQ;
        let lo = 0.95;
        let hi = 1.0;
        for (let i = 0; i < 6; i++) {
          const mid = (lo + hi) / 2;
          const b = await encodeJpeg(bitmap, scale, mid);
          if (b.size <= targetBytes) { bestUnder = b; lo = mid; } else { hi = mid; }
        }
        break;
      }
      let lo = 0.05;
      let hi = 0.95;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        const b = await encodeJpeg(bitmap, scale, mid);
        if (b.size <= targetBytes) {
          bestUnder = b;
          lo = mid;
          if (b.size >= targetBytes * 0.985) break;
        } else {
          hi = mid;
        }
      }
      if (bestUnder && bestUnder.size >= targetBytes * 0.9) break;
      scale *= 0.75;
    }

    if (!bestUnder) {
      bestUnder = await encodeJpeg(bitmap, 0.1, 0.05);
    }
    return padBlobToExactSize(bestUnder, targetBytes);
  } finally {
    bitmap.close();
  }
}

async function compressPdfToExactSize(file: File, targetBytes: number): Promise<Blob> {
  let bestUnder: Blob | null = null;
  const attempts: Array<{ scale: number; quality: number }> = [
    { scale: 1.0, quality: 0.9 },
    { scale: 1.0, quality: 0.75 },
    { scale: 1.0, quality: 0.6 },
    { scale: 0.85, quality: 0.7 },
    { scale: 0.7, quality: 0.6 },
    { scale: 0.55, quality: 0.5 },
    { scale: 0.4, quality: 0.4 },
    { scale: 0.3, quality: 0.3 },
  ];
  for (const { scale, quality } of attempts) {
    const blobs = await renderPdfPagesToBlobs(file, scale, quality);
    const pdf = await buildPdfFromPageBlobs(blobs);
    if (pdf.size <= targetBytes) {
      bestUnder = pdf;
      break;
    }
    bestUnder = pdf;
  }
  if (!bestUnder) throw new Error("Could not compress PDF");
  if (bestUnder.size > targetBytes) return bestUnder;
  return padBlobToExactSize(bestUnder, targetBytes);
}

async function renderPdfPagesToBlobs(file: File, scale: number, quality: number): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const blobs: Blob[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvas, canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", quality)
    );
    blobs.push(blob);
  }
  return blobs;
}

async function buildPdfFromPageBlobs(blobs: Blob[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  for (const blob of blobs) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const img = await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

export default function PhotoResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("dimensions");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [targetSize, setTargetSize] = useState("500");
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB" | "GB">("KB");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);

  async function handleFile(f: File) {
    setFile(f);
    setResult(null);
    if (isPdf(f)) {
      setPreview(null);
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      setOrigW(Math.round(vp.width));
      setOrigH(Math.round(vp.height));
      setWidth(String(Math.round(vp.width)));
      setHeight(String(Math.round(vp.height)));
    } else {
      const bitmap = await createImageBitmap(f);
      setOrigW(bitmap.width);
      setOrigH(bitmap.height);
      setWidth(String(bitmap.width));
      setHeight(String(bitmap.height));
      bitmap.close();
      setPreview(URL.createObjectURL(f));
    }
  }

  function reset() { setFile(null); setPreview(null); setResult(null); setOrigW(0); setOrigH(0); }

  function onWidthChange(v: string) {
    setWidth(v);
    if (keepRatio && origW && origH) {
      const w = parseInt(v);
      if (!isNaN(w) && w > 0) setHeight(String(Math.round(w * origH / origW)));
    }
  }

  function onHeightChange(v: string) {
    setHeight(v);
    if (keepRatio && origW && origH) {
      const h = parseInt(v);
      if (!isNaN(h) && h > 0) setWidth(String(Math.round(h * origW / origH)));
    }
  }

  async function resize() {
    if (!file) return;
    setLoading(true);
    try {
      const fileIsPdf = isPdf(file);

      if (mode === "size") {
        const sizeNum = parseFloat(targetSize);
        if (!sizeNum || sizeNum <= 0) { toast.error("Enter a valid target size"); setLoading(false); return; }
        const unitBytes = targetUnit === "KB" ? 1024 : targetUnit === "MB" ? 1024 * 1024 : 1024 * 1024 * 1024;
        const targetBytes = Math.round(sizeNum * unitBytes);

        if (targetBytes < 1024) { toast.error("Target size too small (min 1 KB)"); setLoading(false); return; }
        if (targetBytes > 500 * 1024 * 1024) { toast.error("Target size too large (max 500 MB)"); setLoading(false); return; }

        if (fileIsPdf) {
          const blob = await compressPdfToExactSize(file, targetBytes);
          const url = URL.createObjectURL(blob);
          setResult({ url, size: blob.size, name: file.name.replace(/\.pdf$/i, "-resized.pdf") });
          if (blob.size === targetBytes) toast.success(`PDF set to exactly ${sizeNum} ${targetUnit}!`);
          else toast.warning(`Couldn't hit exact size — output is ${formatSize(blob.size)}`);
        } else {
          const blob = await compressImageToExactSize(file, targetBytes);
          const ext = ".jpg";
          const baseName = file.name.replace(/\.[^.]+$/, "");
          setResult({ url: URL.createObjectURL(blob), size: blob.size, name: `${baseName}-${sizeNum}${targetUnit}${ext}` });
          if (blob.size === targetBytes) toast.success(`Image set to exactly ${sizeNum} ${targetUnit}!`);
          else toast.warning(`Couldn't hit exact size — output is ${formatSize(blob.size)}`);
        }

      } else {
        const w = parseInt(width);
        const h = parseInt(height);
        if (!w || !h || w <= 0 || h <= 0) { toast.error("Enter valid dimensions"); setLoading(false); return; }

        if (fileIsPdf) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
          const firstPage = await pdf.getPage(1);
          const origVp = firstPage.getViewport({ scale: 1 });
          const scale = Math.min(w / origVp.width, h / origVp.height);
          const blobs = await renderPdfPagesToBlobs(file, scale, 0.9);
          const blob = await buildPdfFromPageBlobs(blobs);
          setResult({ url: URL.createObjectURL(blob), size: blob.size, name: file.name.replace(/\.pdf$/i, `-${w}x${h}.pdf`) });
          toast.success("PDF resized!");
        } else {
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bitmap, 0, 0, w, h);
          bitmap.close();
          const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const blob = await new Promise<Blob>((res, rej) =>
            canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), mimeType, 0.92)
          );
          const ext = mimeType === "image/png" ? ".png" : ".jpg";
          const name = file.name.replace(/\.[^.]+$/, "") + `-${w}x${h}${ext}`;
          setResult({ url: URL.createObjectURL(blob), size: blob.size, name });
          toast.success("Image resized!");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const fileIsPdf = file ? isPdf(file) : false;

  return (
    <ToolLayout
      title="Photo & PDF Resizer"
      description="Resize JPG, PNG, or PDF files by pixel dimensions or compress to a target file size"
      category="Image Tools"
      categoryHref="/"
      icon={<Minimize2 className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone
            onFile={handleFile}
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            label="Drop a JPG, PNG, or PDF here"
            description="or click to browse — JPG, PNG, WebP, PDF accepted"
          />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  Original: {formatSize(file.size)}
                  {origW > 0 && !fileIsPdf && ` · ${origW}×${origH}px`}
                  {origW > 0 && fileIsPdf && ` · page size ~${origW}×${origH}pt`}
                </p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {preview && !result && !fileIsPdf && (
              <div className="flex justify-center">
                <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
              </div>
            )}

            {fileIsPdf && !result && (
              <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-sm text-muted-foreground text-center">
                PDF — {origW}×{origH} pt per page
              </div>
            )}

            {result && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">Ready to download</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} → <span className="text-green-400 font-medium">{formatSize(result.size)}</span>
                  {result.size < file.size && (
                    <span className="ml-1 text-green-400">({Math.round((1 - result.size / file.size) * 100)}% smaller)</span>
                  )}
                </p>
              </div>
            )}

            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["dimensions", "size"] as Mode[]).map((m) => (
                <button
                  key={m}
                  data-testid={`mode-${m}`}
                  onClick={() => { setMode(m); setResult(null); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {m === "dimensions" ? "By Dimensions (px)" : "By File Size"}
                </button>
              ))}
            </div>

            {mode === "dimensions" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="width">Width (px)</Label>
                    <Input id="width" data-testid="input-width" type="number" min={1} value={width} onChange={(e) => onWidthChange(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (px)</Label>
                    <Input id="height" data-testid="input-height" type="number" min={1} value={height} onChange={(e) => onHeightChange(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepRatio}
                    onChange={(e) => setKeepRatio(e.target.checked)}
                    className="rounded"
                  />
                  Maintain aspect ratio
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="target-size">Target Size (exact)</Label>
                    <Input id="target-size" data-testid="input-target-size" type="number" min={1} value={targetSize} onChange={(e) => setTargetSize(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <div className="flex gap-1 mt-1">
                      {(["KB", "MB", "GB"] as const).map((u) => (
                        <button key={u} data-testid={`unit-${u}`} onClick={() => setTargetUnit(u)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${targetUnit === u ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>{u}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Output file will be <span className="font-medium text-foreground">exactly</span> the size you enter. Images convert to JPG.
                </p>
              </div>
            )}

            {!result ? (
              <Button onClick={resize} disabled={loading} className="w-full" data-testid="resize-btn">
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing{fileIsPdf ? " PDF..." : " image..."}</>
                  : `Resize ${fileIsPdf ? "PDF" : "Image"}`}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={download} className="w-full" data-testid="download-btn">
                  <Download className="w-4 h-4 mr-2" />Download Result
                </Button>
                <Button variant="outline" onClick={() => setResult(null)} className="w-full">Try different settings</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
