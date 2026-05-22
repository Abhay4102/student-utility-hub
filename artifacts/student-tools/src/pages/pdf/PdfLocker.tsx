import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ToolLayout } from "@/components/ToolLayout";
import { Lock, Download, RotateCcw, Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PDFDocument } from "@cantoo/pdf-lib";
import { toast } from "sonner";
import { pdfBytesToBlob } from "@/lib/pdfHelpers";
import { formatBytes, downloadBlob } from "@/lib/convertHelpers";

interface Permissions {
  printing: "highResolution" | "lowResolution" | false;
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
}

export default function PdfLocker() {
  const [file, setFile] = useState<File | null>(null);
  const [userPass, setUserPass] = useState("");
  const [ownerPass, setOwnerPass] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [perms, setPerms] = useState<Permissions>({
    printing: "highResolution",
    modifying: false,
    copying: true,
    annotating: false,
  });

  const handleFile = (f: File) => { setFile(f); setResultBlob(null); };
  const reset = () => { setFile(null); setResultBlob(null); setUserPass(""); setOwnerPass(""); };

  async function lockPdf() {
    if (!file) return;
    if (!userPass) { toast.error("Enter a user password to lock the PDF."); return; }
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes);
      pdfDoc.encrypt({
        userPassword: userPass,
        ownerPassword: ownerPass || userPass,
        permissions: {
          printing: perms.printing,
          modifying: perms.modifying,
          copying: perms.copying,
          annotating: perms.annotating,
        },
      });
      const pdfBytes = await pdfDoc.save();
      setResultBlob(pdfBytesToBlob(pdfBytes));
      toast.success("PDF locked with password");
    } catch (err) {
      console.error(err);
      toast.error("Failed to lock PDF. Make sure it's a valid PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="PDF Locker"
      description="Add password protection with optional permission controls (print, copy, edit, annotate)"
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
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground" data-testid="reset-btn"><RotateCcw className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="user-pass">User password <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">(required to open)</span></Label>
                <div className="relative mt-1">
                  <Input id="user-pass" data-testid="input-user-pass" type={showUser ? "text" : "password"} value={userPass} onChange={(e) => setUserPass(e.target.value)} placeholder="Enter password" className="pr-10" />
                  <button onClick={() => setShowUser(!showUser)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" type="button" aria-label="Toggle visibility">
                    {showUser ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="owner-pass">Owner password <span className="text-xs text-muted-foreground font-normal">(optional — for full permissions)</span></Label>
                <div className="relative mt-1">
                  <Input id="owner-pass" data-testid="input-owner-pass" type={showOwner ? "text" : "password"} value={ownerPass} onChange={(e) => setOwnerPass(e.target.value)} placeholder="Leave blank to mirror user password" className="pr-10" />
                  <button onClick={() => setShowOwner(!showOwner)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" type="button" aria-label="Toggle visibility">
                    {showOwner ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <Label className="text-xs font-semibold">Restrict (without owner password)</Label>
              <div className="grid grid-cols-2 gap-2">
                <PermCheckbox label="Allow printing" checked={!!perms.printing} onChange={(v) => setPerms((p) => ({ ...p, printing: v ? "highResolution" : false }))} testid="perm-print" />
                <PermCheckbox label="Allow copying text" checked={perms.copying} onChange={(v) => setPerms((p) => ({ ...p, copying: v }))} testid="perm-copy" />
                <PermCheckbox label="Allow editing" checked={perms.modifying} onChange={(v) => setPerms((p) => ({ ...p, modifying: v }))} testid="perm-modify" />
                <PermCheckbox label="Allow annotating" checked={perms.annotating} onChange={(v) => setPerms((p) => ({ ...p, annotating: v }))} testid="perm-annotate" />
              </div>
            </div>

            <div className="flex gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 rounded-lg p-3">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Standard PDF encryption (40/128-bit RC4 / AES-128). Strong enough to deter casual access; very strong passwords still recommended.</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={lockPdf} disabled={loading || !userPass} className="flex-1" data-testid="lock-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Locking…</> : <><Lock className="w-4 h-4 mr-2" />Lock PDF</>}
              </Button>
              {resultBlob && (
                <Button onClick={() => downloadBlob(resultBlob, `locked-${file.name}`)} className="flex-1" data-testid="download-btn">
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

function PermCheckbox({ label, checked, onChange, testid }: { label: string; checked: boolean; onChange: (v: boolean) => void; testid: string }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none p-2 rounded-md hover:bg-muted/40 transition-colors">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} data-testid={testid} />
      <span>{label}</span>
    </label>
  );
}
