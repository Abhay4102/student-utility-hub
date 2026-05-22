import { useEffect, useRef, useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { FileEdit, Download, RotateCcw, Loader2, ChevronLeft, ChevronRight, Trash2, Type, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { pdfjsLib } from "@/lib/pdfjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";
import { pdfBytesToBlob, renderPdfPageToCanvas } from "@/lib/pdfHelpers";
import { downloadBlob } from "@/lib/convertHelpers";

type Tool = "text" | "highlight";
type ColorKey = "red" | "blue" | "green" | "black" | "yellow";
const COLORS: Record<ColorKey, { hex: string; rgb: [number, number, number] }> = {
  red: { hex: "#e63946", rgb: [0.9, 0.22, 0.27] },
  blue: { hex: "#1d4ed8", rgb: [0.11, 0.31, 0.85] },
  green: { hex: "#15803d", rgb: [0.08, 0.5, 0.24] },
  black: { hex: "#111827", rgb: [0.07, 0.09, 0.15] },
  yellow: { hex: "#facc15", rgb: [0.98, 0.8, 0.08] },
};

interface TextAnno { kind: "text"; x: number; y: number; text: string; page: number; size: number; color: ColorKey }
interface HighlightAnno { kind: "highlight"; x: number; y: number; w: number; h: number; page: number; color: ColorKey }
type Anno = TextAnno | HighlightAnno;

const RENDER_SCALE = 1.4;

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [annotations, setAnnotations] = useState<Anno[]>([]);
  const [tool, setTool] = useState<Tool>("text");
  const [textInput, setTextInput] = useState("");
  const [size, setSize] = useState("14");
  const [color, setColor] = useState<ColorKey>("red");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  async function handleFile(f: File) {
    setFile(f); setAnnotations([]); setResultBlob(null); setCurrentPage(1);
    try {
      const ab = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: ab }).promise;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
    } catch {
      toast.error("Could not load PDF.");
    }
  }

  // Render current page + overlays
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDoc.getPage(currentPage);
      if (cancelled || !canvasRef.current) return;
      await renderPdfPageToCanvas(page, canvasRef.current, RENDER_SCALE);
      if (cancelled || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      for (const a of annotations.filter((x) => x.page === currentPage)) {
        if (a.kind === "text") {
          ctx.font = `${a.size}px Helvetica, Arial, sans-serif`;
          ctx.fillStyle = COLORS[a.color].hex;
          ctx.fillText(a.text, a.x, a.y);
        } else {
          ctx.fillStyle = COLORS[a.color].hex + "66";
          ctx.fillRect(a.x, a.y, a.w, a.h);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, annotations]);

  function canvasPoint(e: React.MouseEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function onCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool === "highlight") dragRef.current = canvasPoint(e);
  }
  function onCanvasMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool === "text") {
      if (!textInput.trim()) { toast.error("Type some annotation text first."); return; }
      const { x, y } = canvasPoint(e);
      setAnnotations((p) => [...p, { kind: "text", x, y, text: textInput, page: currentPage, size: parseInt(size) || 14, color }]);
      setTextInput("");
    } else if (tool === "highlight" && dragRef.current) {
      const end = canvasPoint(e);
      const start = dragRef.current;
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      dragRef.current = null;
      if (w < 5 || h < 5) return;
      setAnnotations((p) => [...p, { kind: "highlight", x, y, w, h, page: currentPage, color }]);
    }
  }

  const removePageAnnos = () => {
    setAnnotations((p) => p.filter((a) => a.page !== currentPage));
    toast.success("Cleared annotations on this page");
  };
  const undoLast = () => setAnnotations((p) => p.slice(0, -1));

  async function exportPdf() {
    if (!file) return;
    setLoading(true);
    setResultBlob(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      for (const a of annotations) {
        const page = pages[a.page - 1];
        if (!page) continue;
        const ph = page.getHeight();
        if (a.kind === "text") {
          page.drawText(a.text, {
            x: a.x / RENDER_SCALE,
            y: ph - a.y / RENDER_SCALE,
            font,
            size: a.size,
            color: rgb(...COLORS[a.color].rgb),
          });
        } else {
          page.drawRectangle({
            x: a.x / RENDER_SCALE,
            y: ph - (a.y + a.h) / RENDER_SCALE,
            width: a.w / RENDER_SCALE,
            height: a.h / RENDER_SCALE,
            color: rgb(...COLORS[a.color].rgb),
            opacity: 0.35,
          });
        }
      }
      const pdfBytes = await doc.save();
      setResultBlob(pdfBytesToBlob(pdfBytes));
      toast.success("Exported with annotations");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
    } finally {
      setLoading(false);
    }
  }

  const reset = () => { setFile(null); setPdfDoc(null); setAnnotations([]); setResultBlob(null); };
  const onPage = annotations.filter((a) => a.page === currentPage).length;

  return (
    <ToolLayout
      title="PDF Editor"
      description="View, annotate (text + highlight), pick colors and sizes, export the edited PDF"
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
                <p className="text-sm font-medium truncate">{file.name}</p>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
              </div>

              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                <button onClick={() => setTool("text")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md ${tool === "text" ? "bg-card shadow-sm" : "text-muted-foreground"}`} data-testid="tool-text">
                  <Type className="w-3.5 h-3.5" /> Text
                </button>
                <button onClick={() => setTool("highlight")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md ${tool === "highlight" ? "bg-card shadow-sm" : "text-muted-foreground"}`} data-testid="tool-highlight">
                  <Highlighter className="w-3.5 h-3.5" /> Highlight
                </button>
              </div>

              {tool === "text" ? (
                <div className="flex items-end gap-2 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs">Text</Label>
                    <Input data-testid="annotation-text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type then click on the PDF" className="mt-1" />
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">Size</Label>
                    <Input type="number" value={size} onChange={(e) => setSize(e.target.value)} min="8" max="48" className="mt-1" data-testid="text-size" />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">Color</Label>
                    <Select value={color} onValueChange={(v) => setColor(v as ColorKey)}>
                      <SelectTrigger className="mt-1" data-testid="color"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(COLORS) as ColorKey[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            <span className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded" style={{ background: COLORS[k].hex }} />
                              {k.charAt(0).toUpperCase() + k.slice(1)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-2 flex-wrap">
                  <div className="w-32">
                    <Label className="text-xs">Color</Label>
                    <Select value={color} onValueChange={(v) => setColor(v as ColorKey)}>
                      <SelectTrigger className="mt-1" data-testid="hl-color"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(COLORS) as ColorKey[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            <span className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded" style={{ background: COLORS[k].hex }} />
                              {k.charAt(0).toUpperCase() + k.slice(1)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground pb-2">Drag on the PDF to highlight an area.</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{onPage} on this page · {annotations.length} total</span>
                <span className="flex-1" />
                <Button size="sm" variant="ghost" onClick={undoLast} disabled={!annotations.length}>Undo last</Button>
                <Button size="sm" variant="ghost" onClick={removePageAnnos} disabled={!onPage} data-testid="clear-page">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear page
                </Button>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="overflow-auto max-h-[600px] flex justify-center bg-muted/20">
                <canvas
                  ref={canvasRef}
                  onMouseDown={onCanvasMouseDown}
                  onMouseUp={onCanvasMouseUp}
                  className={tool === "text" ? "cursor-text" : "cursor-crosshair"}
                  data-testid="pdf-canvas"
                  style={{ display: "block", maxWidth: "100%" }}
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

            <div className="flex gap-2">
              <Button onClick={exportPdf} disabled={loading || annotations.length === 0} className="flex-1" data-testid="export-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting…</> : "Export Annotated PDF"}
              </Button>
              {resultBlob && (
                <Button onClick={() => downloadBlob(resultBlob, `annotated-${file.name}`)} className="flex-1" data-testid="download-btn">
                  <Download className="w-4 h-4 mr-2" />Download
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
