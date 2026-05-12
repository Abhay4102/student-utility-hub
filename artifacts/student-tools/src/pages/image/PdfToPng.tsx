import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { FileInput, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pdfjsLib } from "@/lib/pdfjs";
import { toast } from "sonner";

export default function PdfToPng() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  function handleFile(f: File) { setFile(f); setImages([]); }
  function reset() { setFile(null); setImages([]); }

  async function convert() {
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const urls: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
        urls.push(canvas.toDataURL("image/png"));
      }
      setImages(urls);
      toast.success(`Converted ${urls.length} page${urls.length > 1 ? "s" : ""}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to convert PDF.");
    } finally {
      setLoading(false);
    }
  }

  function downloadOne(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <ToolLayout
      title="PDF to PNG"
      description="Extract PDF pages as high-quality PNG images"
      category="Image Tools"
      categoryHref="/"
      icon={<FileInput className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".pdf" label="Drop a PDF file here" description="or click to browse" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div><p className="font-medium">{file.name}</p><p className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>
            {images.length === 0 ? (
              <Button onClick={convert} disabled={loading} className="w-full" data-testid="convert-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting...</> : "Convert to PNG"}
              </Button>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Page ${i + 1}`} className="w-full rounded-lg border border-border shadow-xs" />
                      <button
                        onClick={() => downloadOne(url, `page-${i + 1}.png`)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-6 h-6 text-white" />
                      </button>
                      <p className="text-xs text-center text-muted-foreground mt-1">Page {i + 1}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => images.forEach((url, i) => downloadOne(url, `page-${i + 1}.png`))} className="flex-1" data-testid="download-all-btn">
                    <Download className="w-4 h-4 mr-2" />Download All
                  </Button>
                  <Button variant="outline" onClick={reset}>Try another</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
