import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Archive, Download, RotateCcw, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { pdfBytesToBlob } from "@/lib/pdfHelpers";
import { formatBytes, downloadBlob } from "@/lib/convertHelpers";

type Preset = "light" | "balanced" | "max";

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState<Preset>("balanced");
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);

  const reset = () => { setFile(null); setResult(null); };
  const handleFile = (f: File) => { setFile(f); setResult(null); };

  async function compress() {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false });

      if (preset === "max") {
        // Strip optional metadata for extra savings
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
      }

      const objStreams = preset !== "light";
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: objStreams,
        addDefaultPage: false,
      });
      const blob = pdfBytesToBlob(pdfBytes);
      setResult({ blob, size: blob.size });
      const savings = Math.round((1 - blob.size / file.size) * 100);
      toast.success(savings > 0 ? `Compressed — saved ${savings}%` : "File already well-optimized");
    } catch {
      toast.error("Failed to compress PDF.");
    } finally {
      setLoading(false);
    }
  }

  const savings = result ? Math.round((1 - result.size / file!.size) * 100) : 0;

  return (
    <ToolLayout
      title="PDF Compressor"
      description="Shrink PDF size with three presets — light, balanced, or maximum optimisation"
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
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">Original: {formatBytes(file.size)}</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            <div>
              <Label className="text-xs font-medium">Compression preset</Label>
              <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
                <SelectTrigger className="mt-1" data-testid="preset-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light — preserve all metadata</SelectItem>
                  <SelectItem value="balanced">Balanced — object streams (recommended)</SelectItem>
                  <SelectItem value="max">Maximum — strip metadata + object streams</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Note: this is structural compression. Visual content (images, fonts) is preserved as-is.
              </p>
            </div>

            {result && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Original</p>
                  <p className="text-base font-bold mt-1">{formatBytes(file.size)}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Compressed</p>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-1">{formatBytes(result.size)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${savings > 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/50"}`}>
                  <p className="text-xs text-muted-foreground">Savings</p>
                  <p className={`text-base font-bold mt-1 ${savings > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {savings > 0 ? `-${savings}%` : "0%"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={compress} disabled={loading} className="flex-1" data-testid="compress-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Compressing…</> : <><Zap className="w-4 h-4 mr-2" />{result ? "Re-compress" : "Compress PDF"}</>}
              </Button>
              {result && (
                <Button onClick={() => downloadBlob(result.blob, `compressed-${file.name}`)} className="flex-1" data-testid="download-btn">
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
