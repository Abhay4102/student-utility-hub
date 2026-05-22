import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Scissors, Download, RotateCcw, Loader2, FileText, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { pdfBytesToBlob, loadPdfJs, parsePageList } from "@/lib/pdfHelpers";
import { stripExt, formatBytes, downloadBlob, zipAndDownload } from "@/lib/convertHelpers";

type Mode = "each" | "range" | "every" | "custom";

interface OutFile { name: string; blob: Blob }

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OutFile[]>([]);
  const [mode, setMode] = useState<Mode>("each");
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("1");
  const [chunk, setChunk] = useState("2");
  const [custom, setCustom] = useState("");

  async function handleFile(f: File) {
    setFile(f);
    setResults([]);
    try {
      const pdf = await loadPdfJs(f);
      setPageCount(pdf.numPages);
      setTo(String(pdf.numPages));
    } catch {
      toast.error("Could not read the PDF.");
    }
  }
  const reset = () => { setFile(null); setPageCount(0); setResults([]); };

  async function makePdfFromPages(src: PDFDocument, indices: number[]): Promise<Blob> {
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(src, indices);
    pages.forEach((p) => newDoc.addPage(p));
    const b = await newDoc.save();
    return pdfBytesToBlob(b);
  }

  async function split() {
    if (!file) return;
    setLoading(true);
    setResults([]);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const src = await PDFDocument.load(bytes);
      const total = src.getPageCount();
      const base = stripExt(file.name);
      const out: OutFile[] = [];

      if (mode === "each") {
        for (let i = 0; i < total; i++) {
          out.push({ name: `${base}-page-${i + 1}.pdf`, blob: await makePdfFromPages(src, [i]) });
        }
      } else if (mode === "range") {
        const f2 = Math.max(1, parseInt(from) || 1);
        const t = Math.min(total, parseInt(to) || total);
        if (f2 > t) throw new Error("Invalid range — 'from' is after 'to'.");
        const indices = Array.from({ length: t - f2 + 1 }, (_, i) => f2 - 1 + i);
        out.push({ name: `${base}-pages-${f2}-to-${t}.pdf`, blob: await makePdfFromPages(src, indices) });
      } else if (mode === "every") {
        const n = Math.max(1, parseInt(chunk) || 1);
        for (let start = 0; start < total; start += n) {
          const end = Math.min(start + n, total);
          const indices = Array.from({ length: end - start }, (_, i) => start + i);
          out.push({ name: `${base}-pages-${start + 1}-to-${end}.pdf`, blob: await makePdfFromPages(src, indices) });
        }
      } else if (mode === "custom") {
        const { pages, invalid } = parsePageList(custom, total);
        if (invalid) toast.warning("Some entries were ignored as out-of-range.");
        if (!pages.length) throw new Error("No valid pages selected.");
        // Each listed page becomes its own PDF
        for (const p of pages) {
          out.push({ name: `${base}-page-${p}.pdf`, blob: await makePdfFromPages(src, [p - 1]) });
        }
      }

      setResults(out);
      toast.success(`Created ${out.length} PDF${out.length === 1 ? "" : "s"}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to split PDF.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const downloadAll = async () => {
    if (!results.length) return;
    if (results.length === 1) {
      downloadBlob(results[0].blob, results[0].name);
      return;
    }
    await zipAndDownload(results, `${stripExt(file!.name)}-split.zip`);
    toast.success(`Zipped ${results.length} files`);
  };

  const modeTabs: Array<{ id: Mode; label: string }> = [
    { id: "each", label: "Every page" },
    { id: "range", label: "Page range" },
    { id: "every", label: "Every N pages" },
    { id: "custom", label: "Custom pages" },
  ];

  return (
    <ToolLayout
      title="PDF Splitter"
      description="Split a PDF every page, by range, in chunks, or by a custom list like 1-3, 5, 8-10"
      category="PDF Tools"
      categoryHref="/"
      icon={<Scissors className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".pdf" label="Drop a PDF file here" description="or click to browse" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{pageCount} page{pageCount === 1 ? "" : "s"} · {formatBytes(file.size)}</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-xl">
              {modeTabs.map((t) => (
                <button
                  key={t.id}
                  data-testid={`mode-${t.id}`}
                  onClick={() => { setMode(t.id); setResults([]); }}
                  className={`flex-1 min-w-[6rem] py-1.5 px-2 text-xs font-semibold rounded-lg transition-all ${mode === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >{t.label}</button>
              ))}
            </div>

            {mode === "range" && (
              <div className="flex gap-3 items-end">
                <div><Label htmlFor="page-from" className="text-xs">From</Label><Input id="page-from" data-testid="input-from" type="number" value={from} onChange={(e) => setFrom(e.target.value)} min="1" max={pageCount} className="mt-1 w-24" /></div>
                <div><Label htmlFor="page-to" className="text-xs">To</Label><Input id="page-to" data-testid="input-to" type="number" value={to} onChange={(e) => setTo(e.target.value)} min="1" max={pageCount} className="mt-1 w-24" /></div>
                <p className="text-xs text-muted-foreground pb-2">of {pageCount}</p>
              </div>
            )}
            {mode === "every" && (
              <div className="flex gap-3 items-end">
                <div><Label htmlFor="chunk" className="text-xs">Pages per file</Label><Input id="chunk" data-testid="input-chunk" type="number" value={chunk} onChange={(e) => setChunk(e.target.value)} min="1" max={pageCount} className="mt-1 w-24" /></div>
                <p className="text-xs text-muted-foreground pb-2">
                  → {Math.ceil(pageCount / Math.max(1, parseInt(chunk) || 1))} PDF{Math.ceil(pageCount / Math.max(1, parseInt(chunk) || 1)) === 1 ? "" : "s"}
                </p>
              </div>
            )}
            {mode === "custom" && (
              <div>
                <Label htmlFor="custom" className="text-xs">Page list (e.g. <span className="font-mono">1-3, 5, 8-10</span>)</Label>
                <Input id="custom" data-testid="input-custom" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={`Any of 1–${pageCount}`} className="mt-1" />
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-2.5 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      <p className="text-sm font-medium truncate">{r.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatBytes(r.blob.size)}</span>
                      <Button size="sm" variant="outline" onClick={() => downloadBlob(r.blob, r.name)} data-testid={`download-${i}`}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={split} disabled={loading} className="flex-1" data-testid="split-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Splitting…</> : <><Scissors className="w-4 h-4 mr-2" />{results.length ? "Re-split" : "Split PDF"}</>}
              </Button>
              {results.length > 0 && (
                <Button onClick={downloadAll} className="flex-1" data-testid="download-all-btn">
                  {results.length > 1 ? <FileArchive className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  {results.length > 1 ? `Download ZIP (${results.length})` : "Download"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
