import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Archive, Download, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);

  function handleFile(f: File) { setFile(f); setResult(null); }
  function reset() { setFile(null); setResult(null); }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  async function compress() {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes);
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResult({ url: URL.createObjectURL(blob), size: blob.size });
      const savings = Math.round((1 - blob.size / file.size) * 100);
      toast.success(`Compressed! ${savings > 0 ? `Saved ${savings}%` : "File already optimized"}`);
    } catch {
      toast.error("Failed to compress PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PDF Compressor"
      description="Reduce PDF file size by optimizing the document structure"
      category="PDF Tools"
      categoryHref="/"
      icon={<Archive className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".pdf" label="Drop a PDF file here" description="or click to browse" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-sm">{file.name}</p><p className="text-xs text-muted-foreground">Original: {formatSize(file.size)}</p></div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            {result && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Original</p>
                  <p className="text-lg font-bold text-foreground mt-1">{formatSize(file.size)}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Compressed</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{formatSize(result.size)}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{Math.round((1 - result.size / file.size) * 100)}% smaller</p>
                </div>
              </div>
            )}

            {!result ? (
              <Button onClick={compress} disabled={loading} className="w-full" data-testid="compress-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Compressing...</> : <><Archive className="w-4 h-4 mr-2" />Compress PDF</>}
              </Button>
            ) : (
              <div className="space-y-2">
                <a href={result.url} download={`compressed-${file.name}`} data-testid="download-btn">
                  <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download Compressed PDF</Button>
                </a>
                <Button variant="outline" onClick={reset} className="w-full">Compress another file</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
