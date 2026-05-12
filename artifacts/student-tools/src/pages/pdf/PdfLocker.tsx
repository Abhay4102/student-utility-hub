import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Lock, Download, RotateCcw, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

export default function PdfLocker() {
  const [file, setFile] = useState<File | null>(null);
  const [userPass, setUserPass] = useState("");
  const [ownerPass, setOwnerPass] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  function handleFile(f: File) { setFile(f); setPdfUrl(null); }
  function reset() { setFile(null); setPdfUrl(null); setUserPass(""); setOwnerPass(""); }

  async function lockPdf() {
    if (!file) return;
    if (!userPass) { toast.error("Please enter a user password"); return; }
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes);
      const pdfBytes = await pdfDoc.save({
        userPassword: userPass,
        ownerPassword: ownerPass || userPass,
      });
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
      toast.success("PDF locked with password!");
    } catch {
      toast.error("Failed to lock PDF. Make sure it's a valid PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PDF Locker"
      description="Add password protection to your PDF files"
      category="PDF Tools"
      categoryHref="/"
      icon={<Lock className="w-6 h-6 text-red-700 dark:text-red-400" />}
      iconBg="bg-red-100 dark:bg-red-900/40"
    >
      <div className="space-y-4">
        {!file ? (
          <FileDropZone onFile={handleFile} accept=".pdf" label="Drop a PDF file here" description="or click to browse" />
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-sm">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="user-pass">User Password (required to open)</Label>
                <div className="relative mt-1">
                  <Input id="user-pass" data-testid="input-user-pass" type={showUser ? "text" : "password"} value={userPass} onChange={(e) => setUserPass(e.target.value)} placeholder="Enter password" className="pr-10" />
                  <button onClick={() => setShowUser(!showUser)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" type="button">
                    {showUser ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="owner-pass">Owner Password (optional, for full access)</Label>
                <div className="relative mt-1">
                  <Input id="owner-pass" data-testid="input-owner-pass" type={showOwner ? "text" : "password"} value={ownerPass} onChange={(e) => setOwnerPass(e.target.value)} placeholder="Leave blank to use user password" className="pr-10" />
                  <button onClick={() => setShowOwner(!showOwner)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" type="button">
                    {showOwner ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {!pdfUrl ? (
              <Button onClick={lockPdf} disabled={loading || !userPass} className="w-full" data-testid="lock-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Locking PDF...</> : <><Lock className="w-4 h-4 mr-2" />Lock PDF</>}
              </Button>
            ) : (
              <div className="space-y-2">
                <a href={pdfUrl} download={`locked-${file.name}`} data-testid="download-btn">
                  <Button className="w-full"><Download className="w-4 h-4 mr-2" />Download Locked PDF</Button>
                </a>
                <Button variant="outline" onClick={reset} className="w-full">Lock another file</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
