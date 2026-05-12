import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Merge, Download, RotateCcw, Loader2, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

export default function PdfMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  function addFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles.filter((f) => f.type === "application/pdf")]);
    setPdfUrl(null);
  }

  function removeFile(i: number) { setFiles((prev) => prev.filter((_, idx) => idx !== i)); setPdfUrl(null); }
  function reset() { setFiles([]); setPdfUrl(null); }

  async function merge() {
    if (files.length < 2) { toast.error("Please add at least 2 PDF files"); return; }
    setLoading(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const pdfBytes = await merged.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
      toast.success(`Merged ${files.length} PDFs successfully!`);
    } catch {
      toast.error("Failed to merge PDFs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PDF Merger"
      description="Combine multiple PDF files into a single document"
      category="PDF Tools"
      categoryHref="/"
      icon={<Merge className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="space-y-4">
        <FileDropZone onFiles={addFiles} multiple accept=".pdf" label="Drop PDF files here" description="or click to browse — add multiple files" />

        {files.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{files.length} PDF{files.length > 1 ? "s" : ""} added</p>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Clear all
              </button>
            </div>

            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} data-testid={`pdf-file-${i}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`remove-file-${i}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {!pdfUrl ? (
              <Button onClick={merge} disabled={loading || files.length < 2} className="w-full" data-testid="merge-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Merging...</> : <><Merge className="w-4 h-4 mr-2" />Merge PDFs</>}
              </Button>
            ) : (
              <div className="space-y-2">
                <a href={pdfUrl} download="merged.pdf" data-testid="download-btn">
                  <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download Merged PDF</Button>
                </a>
                <Button variant="outline" onClick={reset} className="w-full">Start over</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
