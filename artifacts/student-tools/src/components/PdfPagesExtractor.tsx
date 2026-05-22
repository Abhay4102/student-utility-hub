import { useCallback, useEffect, useRef, useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Loader2, Download, RotateCcw, FileArchive, FileText } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "./ui/progress";
import {
  renderPdfPages, parsePageRange, stripExt, downloadBlob, zipAndDownload, formatBytes,
} from "@/lib/convertHelpers";

interface RenderedItem { pageNum: number; blob: Blob; url: string; width: number; height: number }

export interface PdfPagesExtractorProps {
  outputExt: "png" | "jpg";
  outputMime: "image/png" | "image/jpeg";
  /** Default JPG quality */
  defaultQuality?: number;
  showQuality?: boolean;
}

export function PdfPagesExtractor({ outputExt, outputMime, defaultQuality = 0.92, showQuality }: PdfPagesExtractorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState("");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(Math.round(defaultQuality * 100));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [items, setItems] = useState<RenderedItem[]>([]);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const reset = useCallback(() => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setFile(null);
    setPageCount(0);
    setItems([]);
    setRange("");
    setProgress(null);
  }, []);

  const onFile = useCallback(async (f: File) => {
    reset();
    setFile(f);
    try {
      const { pdfjsLib } = await import("@/lib/pdfjs");
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      setPageCount(pdf.numPages);
    } catch {
      toast.error("Could not read the PDF.");
      setFile(null);
    }
  }, [reset]);

  const convert = async () => {
    if (!file) return;
    // Revoke prior render URLs before starting a new render to avoid leaks on re-render.
    items.forEach((i) => URL.revokeObjectURL(i.url));
    urlsRef.current = [];
    setItems([]);
    setBusy(true);
    setProgress({ done: 0, total: pageCount });
    try {
      const pages = parsePageRange(range, pageCount);
      const rendered = await renderPdfPages(file, {
        scale,
        mime: outputMime,
        quality: outputMime === "image/jpeg" ? quality / 100 : undefined,
        pages,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      const out: RenderedItem[] = rendered.map((r) => {
        const url = URL.createObjectURL(r.blob);
        urlsRef.current.push(url);
        return { ...r, url };
      });
      setItems(out);
      toast.success(`Rendered ${out.length} page${out.length === 1 ? "" : "s"}`);
    } catch (err) {
      console.error(err);
      toast.error("Conversion failed. Make sure the PDF is valid.");
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    if (!items.length || !file) return;
    if (items.length === 1) {
      downloadBlob(items[0].blob, `${stripExt(file.name)}-page-${items[0].pageNum}.${outputExt}`);
      return;
    }
    await zipAndDownload(
      items.map((i) => ({ name: `${stripExt(file.name)}-page-${i.pageNum}.${outputExt}`, blob: i.blob })),
      `${stripExt(file.name)}-${outputExt}.zip`,
    );
    toast.success(`Zipped ${items.length} pages`);
  };

  if (!file) {
    return <FileDropZone onFile={onFile} accept=".pdf" label="Drop a PDF here" description="One PDF — every page becomes an image" />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-rose-700 dark:text-rose-300" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {pageCount} page{pageCount === 1 ? "" : "s"}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Pages (e.g. <span className="font-mono">1-3, 5, 8-10</span>)
            </label>
            <Input
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder={`All ${pageCount} pages`}
              data-testid="range-input"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
              <span>Quality / DPI</span>
              <span className="text-foreground">{scale.toFixed(1)}× ({Math.round(72 * scale)} dpi)</span>
            </div>
            <Slider min={1} max={4} step={0.5} value={[scale]} onValueChange={(v) => setScale(v[0])} data-testid="scale-slider" />
          </div>
          {showQuality && (
            <div className="sm:col-span-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
                <span>JPG compression</span>
                <span className="text-foreground">{quality}%</span>
              </div>
              <Slider min={50} max={100} step={1} value={[quality]} onValueChange={(v) => setQuality(v[0])} />
            </div>
          )}
        </div>
      </div>

      {busy && progress && (
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Rendering pages…</span>
            <span className="text-muted-foreground">{progress.done} / {progress.total}</span>
          </div>
          <Progress value={(progress.done / Math.max(progress.total, 1)) * 100} />
        </div>
      )}

      {items.length > 0 && !busy && (
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((it) => (
              <div key={it.pageNum} className="group relative">
                <img src={it.url} alt={`Page ${it.pageNum}`} className="w-full rounded-lg border border-border shadow-xs" />
                <button
                  onClick={() => downloadBlob(it.blob, `${stripExt(file.name)}-page-${it.pageNum}.${outputExt}`)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Download page"
                  data-testid={`download-page-${it.pageNum}`}
                ><Download className="w-6 h-6 text-white" /></button>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-0.5">
                  <span>Page {it.pageNum}</span>
                  <span>{formatBytes(it.blob.size)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={convert} disabled={busy} className="flex-1" data-testid="convert-btn">
          {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting…</> : items.length ? "Re-render with current settings" : `Convert to ${outputExt.toUpperCase()}`}
        </Button>
        {items.length > 0 && (
          <Button onClick={downloadAll} variant={busy ? "outline" : "default"} className="flex-1" data-testid="download-all-btn">
            {items.length > 1 ? <FileArchive className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {items.length > 1 ? `Download ZIP (${items.length})` : "Download"}
          </Button>
        )}
      </div>
    </div>
  );
}
