import { useState, useRef, useEffect } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { FileEdit, Download, RotateCcw, Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pdfjsLib } from "@/lib/pdfjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";

interface Annotation { x: number; y: number; text: string; page: number; }

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newText, setNewText] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  async function handleFile(f: File) {
    setFile(f); setAnnotations([]); setPdfUrl(null); setCurrentPage(1);
    try {
      const ab = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: ab }).promise;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
    } catch {
      toast.error("Could not load PDF.");
    }
  }

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = canvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (!cancelled) {
        annotations.filter((a) => a.page === currentPage).forEach((a) => {
          ctx.font = "16px Arial";
          ctx.fillStyle = "#e74c3c";
          ctx.fillText(a.text, a.x, a.y);
        });
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, annotations]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!newText.trim()) { toast.error("Enter annotation text first"); return; }
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setAnnotations((prev) => [...prev, { x, y, text: newText, page: currentPage }]);
    setNewText("");
  }

  async function exportPdf() {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      for (const ann of annotations) {
        const page = pages[ann.page - 1];
        if (!page) continue;
        const pdfHeight = page.getHeight();
        page.drawText(ann.text, { x: ann.x / 1.2, y: pdfHeight - ann.y / 1.2, font, size: 14, color: rgb(0.9, 0.2, 0.2) });
      }
      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
      toast.success("PDF exported with annotations!");
    } catch {
      toast.error("Failed to export PDF.");
    } finally {
      setLoading(false);
    }
  }

  function reset() { setFile(null); setPdfDoc(null); setAnnotations([]); setPdfUrl(null); }

  return (
    <ToolLayout
      title="PDF Editor"
      description="View PDF pages and add text annotations"
      category="PDF Tools"
      categoryHref="/"
      icon={<FileEdit className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".pdf" label="Drop a PDF to edit" description="or click to browse" />
        ) : (
          <div className="space-y-4">
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{file.name}</p>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="shrink-0 text-sm">Add annotation:</Label>
                <Input data-testid="annotation-text" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Type text, then click on the PDF" className="flex-1" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Plus className="w-3 h-3" /> click PDF
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{annotations.filter((a) => a.page === currentPage).length} annotation{annotations.filter((a) => a.page === currentPage).length !== 1 ? "s" : ""} on this page · {annotations.length} total</p>
            </div>

            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="overflow-auto max-h-[500px]">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="cursor-crosshair w-full"
                  data-testid="pdf-canvas"
                  style={{ display: "block" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} data-testid="prev-page">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {pageCount}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount} data-testid="next-page">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {!pdfUrl ? (
              <Button onClick={exportPdf} disabled={loading} className="w-full" data-testid="export-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting...</> : "Export Annotated PDF"}
              </Button>
            ) : (
              <div className="space-y-2">
                <a href={pdfUrl} download={`annotated-${file.name}`} data-testid="download-btn">
                  <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download Annotated PDF</Button>
                </a>
                <Button variant="outline" onClick={() => setPdfUrl(null)} className="w-full">Continue editing</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
