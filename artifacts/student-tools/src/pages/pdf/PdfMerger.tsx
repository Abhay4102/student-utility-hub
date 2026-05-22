import { useCallback, useEffect, useRef, useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Merge, Download, RotateCcw, Loader2, X, ArrowUp, ArrowDown, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { pdfBytesToBlob, loadPdfJs } from "@/lib/pdfHelpers";
import { formatBytes, downloadBlob } from "@/lib/convertHelpers";

interface PdfItem { id: string; file: File; pages?: number }
let idSeq = 0;

export default function PdfMerger() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Probe page counts for new items
  useEffect(() => {
    const pending = items.filter((i) => i.pages === undefined);
    if (!pending.length) return;
    (async () => {
      for (const it of pending) {
        try {
          const pdf = await loadPdfJs(it.file);
          setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, pages: pdf.numPages } : p)));
        } catch {
          setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, pages: 0 } : p)));
        }
      }
    })();
  }, [items]);

  const addFiles = useCallback((newFiles: File[]) => {
    const additions: PdfItem[] = newFiles
      .filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name))
      .map((f) => ({ id: `p${++idSeq}`, file: f }));
    if (!additions.length) {
      toast.error("Please add valid PDF files.");
      return;
    }
    setItems((prev) => [...prev, ...additions]);
    setResultBlob(null);
  }, []);

  const removeAt = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setResultBlob(null);
  };
  const move = (id: string, dir: -1 | 1) => setItems((prev) => {
    const i = prev.findIndex((x) => x.id === id);
    if (i < 0) return prev;
    const j = i + dir;
    if (j < 0 || j >= prev.length) return prev;
    const copy = [...prev];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });
  const reset = () => { setItems([]); setResultBlob(null); };

  async function merge() {
    if (items.length < 2) { toast.error("Add at least 2 PDFs."); return; }
    setLoading(true);
    setResultBlob(null);
    try {
      const merged = await PDFDocument.create();
      for (const it of items) {
        const bytes = new Uint8Array(await it.file.arrayBuffer());
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const pdfBytes = await merged.save();
      setResultBlob(pdfBytesToBlob(pdfBytes));
      toast.success(`Merged ${items.length} PDFs`);
    } catch {
      toast.error("Failed to merge PDFs.");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = items.reduce((s, i) => s + (i.pages ?? 0), 0);
  const totalSize = items.reduce((s, i) => s + i.file.size, 0);

  return (
    <ToolLayout
      title="PDF Merger"
      description="Combine multiple PDFs into one — reorder before merging, see page counts"
      category="PDF Tools"
      categoryHref="/"
      icon={<Merge className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="space-y-4">
        {items.length === 0 ? (
          <FileDropZone
            multiple
            onFile={(f) => addFiles([f])}
            onFiles={addFiles}
            accept=".pdf"
            label="Drop PDF files here"
            description="Add at least 2 — they merge in the order shown"
          />
        ) : (
          <>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div>
                  <h3 className="font-semibold">{items.length} PDF{items.length === 1 ? "" : "s"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {totalPages} page{totalPages === 1 ? "" : "s"} total · {formatBytes(totalSize)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add more
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length) addFiles(files);
                      e.target.value = "";
                    }}
                  />
                  <Button size="sm" variant="ghost" onClick={reset}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
                  </Button>
                </div>
              </div>

              <ul className="divide-y divide-border">
                {items.map((it, i) => (
                  <li key={it.id} className="py-2.5 flex items-center gap-3" data-testid={`pdf-${it.id}`}>
                    <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">{i + 1}</span>
                    <div className="w-10 h-10 rounded-md bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-rose-700 dark:text-rose-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{it.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(it.file.size)}
                        {it.pages !== undefined && it.pages > 0 && ` · ${it.pages} page${it.pages === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => move(it.id, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => move(it.id, 1)} disabled={i === items.length - 1} aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></Button>
                    <button onClick={() => removeAt(it.id)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Remove" data-testid={`remove-${it.id}`}><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={merge} disabled={loading || items.length < 2} className="flex-1" data-testid="merge-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Merging…</> : <><Merge className="w-4 h-4 mr-2" />Merge {items.length} PDF{items.length === 1 ? "" : "s"}</>}
              </Button>
              {resultBlob && (
                <Button onClick={() => downloadBlob(resultBlob, `merged-${Date.now()}.pdf`)} className="flex-1" data-testid="download-btn">
                  <Download className="w-4 h-4 mr-2" />Download
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
