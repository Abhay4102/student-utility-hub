import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Scissors, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdfjs";
import { toast } from "sonner";

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [splitFiles, setSplitFiles] = useState<{ name: string; url: string }[]>([]);
  const [mode, setMode] = useState<"all" | "range">("all");
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("1");

  async function handleFile(f: File) {
    setFile(f);
    setSplitFiles([]);
    try {
      const ab = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      setPageCount(pdf.numPages);
      setTo(String(pdf.numPages));
    } catch {
      toast.error("Could not read PDF page count.");
    }
  }

  function reset() { setFile(null); setPageCount(0); setSplitFiles([]); }

  async function split() {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const srcDoc = await PDFDocument.load(bytes);
      const results: { name: string; url: string }[] = [];

      if (mode === "all") {
        for (let i = 0; i < srcDoc.getPageCount(); i++) {
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(page);
          const b = await newDoc.save();
          const blob = new Blob([b], { type: "application/pdf" });
          results.push({ name: `page-${i + 1}.pdf`, url: URL.createObjectURL(blob) });
        }
      } else {
        const f2 = Math.max(1, parseInt(from));
        const t = Math.min(srcDoc.getPageCount(), parseInt(to));
        if (f2 > t) { toast.error("Invalid page range"); setLoading(false); return; }
        const newDoc = await PDFDocument.create();
        const indices = Array.from({ length: t - f2 + 1 }, (_, i) => f2 - 1 + i);
        const pages = await newDoc.copyPages(srcDoc, indices);
        pages.forEach((p) => newDoc.addPage(p));
        const b = await newDoc.save();
        const blob = new Blob([b], { type: "application/pdf" });
        results.push({ name: `pages-${f2}-to-${t}.pdf`, url: URL.createObjectURL(blob) });
      }

      setSplitFiles(results);
      toast.success(`Split into ${results.length} file${results.length > 1 ? "s" : ""}!`);
    } catch {
      toast.error("Failed to split PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PDF Splitter"
      description="Split a PDF into individual pages or extract a page range"
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
                <p className="text-xs text-muted-foreground">{pageCount} pages · {(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["all", "range"] as const).map((m) => (
                <button key={m} data-testid={`mode-${m}`} onClick={() => { setMode(m); setSplitFiles([]); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {m === "all" ? "Split All Pages" : "Extract Page Range"}
                </button>
              ))}
            </div>

            {mode === "range" && (
              <div className="flex gap-3 items-end">
                <div><Label htmlFor="page-from">From Page</Label><Input id="page-from" data-testid="input-from" type="number" value={from} onChange={(e) => setFrom(e.target.value)} min="1" max={pageCount} className="mt-1 w-24" /></div>
                <div><Label htmlFor="page-to">To Page</Label><Input id="page-to" data-testid="input-to" type="number" value={to} onChange={(e) => setTo(e.target.value)} min="1" max={pageCount} className="mt-1 w-24" /></div>
                <p className="text-xs text-muted-foreground pb-2">of {pageCount}</p>
              </div>
            )}

            {splitFiles.length === 0 ? (
              <Button onClick={split} disabled={loading} className="w-full" data-testid="split-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Splitting...</> : <><Scissors className="w-4 h-4 mr-2" />Split PDF</>}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {splitFiles.map((sf, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">{sf.name}</p>
                      <a href={sf.url} download={sf.name} data-testid={`download-${i}`}>
                        <Button size="sm" variant="outline"><Download className="w-3.5 h-3.5 mr-1" />Download</Button>
                      </a>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={reset} className="w-full">Try another file</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
