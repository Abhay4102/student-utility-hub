import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Unlock, Download, RotateCcw, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

export default function PdfUnlocker() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  function handleFile(f: File) { setFile(f); setPdfUrl(null); }
  function reset() { setFile(null); setPdfUrl(null); setPassword(""); }

  async function unlock() {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { password });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
      toast.success("PDF unlocked successfully!");
    } catch {
      toast.error("Failed to unlock. Check your password and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PDF Unlocker"
      description="Remove password protection from your PDF files"
      category="PDF Tools"
      categoryHref="/"
      icon={<Unlock className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".pdf" label="Drop a password-protected PDF here" description="or click to browse" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-sm">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            <div>
              <Label htmlFor="pdf-pass">PDF Password</Label>
              <div className="relative mt-1">
                <Input id="pdf-pass" data-testid="input-password" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter PDF password" className="pr-10" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" type="button">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave blank if the PDF is not password-protected but still locked</p>
            </div>

            {!pdfUrl ? (
              <Button onClick={unlock} disabled={loading} className="w-full" data-testid="unlock-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Unlocking...</> : <><Unlock className="w-4 h-4 mr-2" />Unlock PDF</>}
              </Button>
            ) : (
              <div className="space-y-2">
                <a href={pdfUrl} download={`unlocked-${file.name}`} data-testid="download-btn">
                  <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download Unlocked PDF</Button>
                </a>
                <Button variant="outline" onClick={reset} className="w-full">Unlock another file</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
