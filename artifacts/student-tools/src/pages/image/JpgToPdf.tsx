import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { FileOutput, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

export default function JpgToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setPdfUrl(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setPdfUrl(null);
  }

  async function convert() {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      const img = await pdfDoc.embedJpg(new Uint8Array(bytes));
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
      toast.success("Conversion complete!");
    } catch (err) {
      toast.error("Failed to convert. Make sure it's a valid JPG file.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!pdfUrl || !file) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = file.name.replace(/\.[^.]+$/, "") + ".pdf";
    a.click();
  }

  return (
    <ToolLayout
      title="JPG to PDF"
      description="Convert your JPG images into PDF documents instantly"
      category="Image Tools"
      categoryHref="/"
      icon={<FileOutput className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
      iconBg="bg-blue-100 dark:bg-blue-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".jpg,.jpeg" label="Drop a JPG image here" description="or click to browse — JPG, JPEG accepted" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            {preview && (
              <div className="flex justify-center">
                <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain shadow-sm" />
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="reset-btn">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {!pdfUrl ? (
              <Button onClick={convert} disabled={loading} className="w-full" data-testid="convert-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Converting...</> : "Convert to PDF"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={download} className="w-full" data-testid="download-btn">
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
                <Button variant="outline" onClick={reset} className="w-full">Try another file</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
